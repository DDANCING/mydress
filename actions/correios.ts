"use server";

import { quoteShipping, ShippingQuote } from "@/lib/shipping";
import { RATE_LIMITS, getClientIp, rateLimit, tooManyAttemptsMessage } from "@/lib/rate-limit";

export interface FreteData {
  cep: string;
  quantidade: number;
  // Valor declarado para o seguro do envio
  valorDeclarado?: number;
}

export type FreteResult = ShippingQuote;

// A origem e o tamanho da caixa são definidos no servidor (lib/shipping.ts), nunca pelo navegador
export async function calcularFrete(data: FreteData): Promise<FreteResult[]> {
  // Cada cotação consulta serviços externos (Melhor Envio, ViaCEP): limita por IP
  const attempt = await rateLimit(`shipping:ip:${await getClientIp()}`, RATE_LIMITS.shippingQuote);
  if (!attempt.success) throw new Error(tooManyAttemptsMessage(attempt));

  return quoteShipping({
    cep: String(data.cep ?? ""),
    quantity: Math.min(Math.max(1, Math.floor(Number(data.quantidade) || 1)), 10),
    insuranceValue: Math.max(0, Number(data.valorDeclarado) || 0),
  });
}
