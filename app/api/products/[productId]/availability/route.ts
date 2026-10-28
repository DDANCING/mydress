import { NextResponse } from "next/server";

import { getProductBookings } from "@/lib/store-orders";
import { RATE_LIMITS, getIpFromHeaders, rateLimit, tooManyRequests } from "@/lib/rate-limit";

// Datas ocupadas de um vestido, para o calendário da loja. Não expõe dados de clientes.
export async function GET(req: Request, context: { params: Promise<{ productId: string }> }) {
  try {
    const attempt = await rateLimit(`availability:ip:${getIpFromHeaders(req.headers)}`, RATE_LIMITS.availability);
    if (!attempt.success) return tooManyRequests(attempt);

    const { productId } = await context.params;
    const bookings = await getProductBookings([productId]);
    return NextResponse.json(bookings.get(productId) ?? []);
  } catch (error) {
    console.error("[PRODUCT_AVAILABILITY_GET]", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}
