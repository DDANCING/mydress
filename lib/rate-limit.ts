import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

// Limite de tentativas por janela fixa, guardado no Postgres.
// Na Vercel cada requisição pode cair numa instância diferente, então o contador precisa ser compartilhado.

export type RateLimitRule = { limit: number; windowMs: number };

export type RateLimitResult = { success: boolean; remaining: number; retryAfterSeconds: number };

const MINUTE = 60 * 1000;

export const RATE_LIMITS = {
  // Login: por e-mail barra força bruta numa conta; por IP barra quem testa várias contas
  loginEmail: { limit: 5, windowMs: 15 * MINUTE },
  loginIp: { limit: 20, windowMs: 15 * MINUTE },
  twoFactorCode: { limit: 5, windowMs: 15 * MINUTE },
  // Ações que disparam e-mail
  sendEmail: { limit: 3, windowMs: 15 * MINUTE },
  register: { limit: 5, windowMs: 60 * MINUTE },
  resetIp: { limit: 10, windowMs: 60 * MINUTE },
  // Uso de token recebido por e-mail
  tokenIp: { limit: 20, windowMs: 15 * MINUTE },
  passwordChange: { limit: 5, windowMs: 15 * MINUTE },
  // Loja
  coupon: { limit: 15, windowMs: 15 * MINUTE },
  shippingQuote: { limit: 40, windowMs: 10 * MINUTE },
  storeOrder: { limit: 20, windowMs: 10 * MINUTE },
  checkout: { limit: 15, windowMs: 10 * MINUTE },
  availability: { limit: 120, windowMs: 10 * MINUTE },
  newsletter: { limit: 5, windowMs: 60 * MINUTE },
  testimonial: { limit: 10, windowMs: 60 * MINUTE },
} satisfies Record<string, RateLimitRule>;

// Reserva em memória caso o banco falhe: protege ao menos a instância atual em vez de liberar tudo
const memory = new Map<string, { count: number; resetAt: number }>();

const hitMemory = (key: string, windowMs: number) => {
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.resetAt <= now) {
    const fresh = { count: 1, resetAt: now + windowMs };
    memory.set(key, fresh);
    if (memory.size > 5000) {
      for (const [k, v] of memory) if (v.resetAt <= now) memory.delete(k);
    }
    return fresh;
  }
  entry.count += 1;
  return entry;
};

const hitDatabase = async (key: string, windowMs: number) => {
  const resetAt = new Date(Date.now() + windowMs);
  // Upsert atômico: reinicia a janela se expirou, senão incrementa
  const rows = await db.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt")
    VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."resetAt" <= NOW() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" <= NOW() THEN EXCLUDED."resetAt" ELSE "RateLimit"."resetAt" END
    RETURNING "count", "resetAt"`;

  // Limpeza ocasional das janelas vencidas
  if (Math.random() < 0.02) {
    db.rateLimit.deleteMany({ where: { resetAt: { lt: new Date() } } }).catch(() => {});
  }

  return { count: Number(rows[0].count), resetAt: new Date(rows[0].resetAt).getTime() };
};

/** Conta uma tentativa para a chave e diz se ainda está dentro do limite. */
export async function rateLimit(key: string, rule: RateLimitRule): Promise<RateLimitResult> {
  let entry: { count: number; resetAt: number };
  try {
    entry = await hitDatabase(key, rule.windowMs);
  } catch (error) {
    console.error("[RATE_LIMIT] Banco indisponível, usando memória:", error);
    entry = hitMemory(key, rule.windowMs);
  }

  return {
    success: entry.count <= rule.limit,
    remaining: Math.max(0, rule.limit - entry.count),
    retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - Date.now()) / 1000)),
  };
}

/** Confere várias chaves de uma vez; bloqueia se qualquer uma estourar. */
export async function rateLimitAll(checks: [key: string, rule: RateLimitRule][]): Promise<RateLimitResult> {
  const results = await Promise.all(checks.map(([key, rule]) => rateLimit(key, rule)));
  const blocked = results.filter((result) => !result.success);
  if (blocked.length === 0) return { success: true, remaining: Math.min(...results.map((r) => r.remaining)), retryAfterSeconds: 0 };
  return { success: false, remaining: 0, retryAfterSeconds: Math.max(...blocked.map((r) => r.retryAfterSeconds)) };
}

/** Zera o contador (ex.: depois de um login bem-sucedido). */
export async function resetRateLimit(key: string) {
  memory.delete(key);
  try {
    await db.rateLimit.delete({ where: { key } });
  } catch {
    // Chave inexistente: nada a fazer
  }
}

/** IP da cliente. Na Vercel o x-forwarded-for é definido pela própria plataforma. */
export function getIpFromHeaders(source: Headers): string {
  const forwarded = source.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || source.get("x-real-ip")?.trim() || "unknown";
}

export async function getClientIp(): Promise<string> {
  return getIpFromHeaders(await headers());
}

export const tooManyAttemptsMessage = (result: RateLimitResult) => {
  const minutes = Math.ceil(result.retryAfterSeconds / 60);
  return `Muitas tentativas. Tente novamente em ${minutes} ${minutes === 1 ? "minuto" : "minutos"}.`;
};

/** Resposta 429 padrão para rotas de API. */
export const tooManyRequests = (result: RateLimitResult) =>
  NextResponse.json(
    { error: tooManyAttemptsMessage(result) },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } }
  );
