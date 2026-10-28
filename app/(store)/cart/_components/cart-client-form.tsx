"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarIcon, Loader2, ShoppingBag, Trash2, Truck } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import { CartItem } from "@/app/types";
import { calcularFrete, FreteResult } from "@/actions/correios";
import useCart from "@/hooks/use-cart";
import { cn, formatter } from "@/lib/utils";
import { whatsappLink } from "@/lib/site-config";
import {
  Booking,
  DEFAULT_SHIPPING_DAYS,
  getMinimumEventDate,
  getRentalUsePeriod,
  isDateAvailable,
  isSameEventDay,
} from "@/lib/booking-rules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CartClientProps {
  user: { name: string; email: string };
  searchParams?: { success?: string; canceled?: string; orderId?: string };
}

type Coupon = { code: string; discountType: "percentage" | "fixed"; discountValue: number };

const formatCep = (value: string) => {
  const numbers = value.replace(/\D/g, "").slice(0, 8);
  return numbers.length <= 5 ? numbers : `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
};

const itemKey = (item: CartItem) => `${item.id}-${item.contractType}`;
const toDate = (value?: Date | string) => (value ? new Date(value) : undefined);

export default function CartClient({ searchParams }: CartClientProps) {
  const cart = useCart();
  const router = useRouter();

  // O carrinho vem do localStorage: só renderiza os itens depois de montar, para não piscar "vazio"
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const items = useMemo(() => (mounted ? cart.items : []), [mounted, cart.items]);

  const [cep, setCep] = useState("");
  const [quotes, setQuotes] = useState<FreteResult[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [isQuoting, startQuoting] = useTransition();

  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Escolha de data de um item
  const [dateItem, setDateItem] = useState<CartItem | null>(null);
  const [dateBookings, setDateBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Retorno do Stripe em links antigos (/cart?success=1)
  useEffect(() => {
    if (searchParams?.success === "1" && searchParams.orderId) {
      cart.removeAll();
      window.location.replace(`/order/${searchParams.orderId}`);
    } else if (searchParams?.canceled === "1") {
      toast.error("Pagamento cancelado", { description: "Você pode tentar novamente quando quiser." });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // CEP informado na página do produto
  useEffect(() => {
    const cepFromCart = items.find((item) => item.cep)?.cep;
    if (cepFromCart && !cep) setCep(formatCep(cepFromCart));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const eventDate = toDate(items.find((item) => item.eventDate)?.eventDate);
  const missingDate = items.some((item) => !item.eventDate);
  const mixedDates = items.some((item) => item.eventDate && !isSameEventDay(item.eventDate, eventDate));

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.cartPrice, 0), [items]);
  const discount = coupon
    ? Math.min(subtotal, coupon.discountType === "percentage" ? subtotal * (coupon.discountValue / 100) : coupon.discountValue)
    : 0;

  // Uma opção de frete só serve se chega antes da data escolhida
  const arrivesInTime = (quote: FreteResult) => !eventDate || eventDate >= getMinimumEventDate(quote.delivery_time);
  const selectedQuote = quotes.find((quote) => quote.id === selectedQuoteId && arrivesInTime(quote)) ?? null;
  const total = subtotal - discount + (selectedQuote?.price ?? 0);

  const quote = (value = cep) => {
    if (value.length !== 9 || items.length === 0) return;
    startQuoting(async () => {
      try {
        const result = await calcularFrete({ cep: value, quantidade: items.length, valorDeclarado: subtotal });
        setQuotes(result);
        const firstValid = result.find(arrivesInTime);
        setSelectedQuoteId(firstValid?.id ?? null);
        if (result.length === 0) toast.error("Não encontramos frete para este CEP.");
      } catch {
        setQuotes([]);
        setSelectedQuoteId(null);
        toast.error("CEP inválido ou não encontrado.");
      }
    });
  };

  // Recalcula quando o CEP fica completo ou a quantidade de itens muda
  useEffect(() => {
    if (cep.length === 9) quote(cep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cep, items.length]);

  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) return;
    setIsApplyingCoupon(true);
    try {
      const res = await fetch(`/api/coupons?code=${encodeURIComponent(code)}`);
      if (!res.ok) {
        toast.error(res.status === 404 ? "Cupom não encontrado." : (await res.text()) || "Cupom inválido.");
        setCoupon(null);
        return;
      }
      const data = await res.json();
      setCoupon({ code: data.code, discountType: data.discountType, discountValue: Number(data.discountValue) });
      toast.success(`Cupom ${data.code} aplicado!`);
    } catch {
      toast.error("Não foi possível validar o cupom.");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const openDatePicker = async (item: CartItem) => {
    setDateItem(item);
    setLoadingBookings(true);
    try {
      const res = await fetch(`/api/products/${item.id}/availability`);
      setDateBookings(res.ok ? await res.json() : []);
    } catch {
      setDateBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Com outro item já datado, o pedido inteiro fica naquela data
  const otherItemsDate = dateItem
    ? toDate(items.find((item) => item.eventDate && itemKey(item) !== itemKey(dateItem))?.eventDate)
    : undefined;
  const pickerShippingDays = selectedQuote?.delivery_time ?? (quotes.length ? Math.min(...quotes.map((q) => q.delivery_time)) : DEFAULT_SHIPPING_DAYS);

  const chooseDate = (date?: Date) => {
    if (!date || !dateItem) return;
    cart.updateItemDate(dateItem.id, dateItem.contractType, date);
    setDateItem(null);
  };

  const finalizarCompra = async () => {
    if (!selectedQuote || !eventDate || missingDate || mixedDates) return;
    setIsCheckingOut(true);
    try {
      const res = await fetch("/api/store/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({ productId: item.id, type: item.contractType, eventDate: item.eventDate })),
          cep,
          shippingServiceId: selectedQuote.id,
          couponCode: coupon?.code,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não foi possível criar o pedido.");

      cart.removeAll();
      router.push(`/cart/checkout/${data.id}`);
    } catch (error) {
      toast.error("Não foi possível finalizar", { description: (error as Error).message });
      setIsCheckingOut(false);
    }
  };

  const whatsappMessage = () => {
    let message = "Olá! Gostaria de finalizar meu pedido pelo WhatsApp:\n\n";
    items.forEach((item, index) => {
      message += `${index + 1}. *${item.name}* (${item.contractType === "RENTAL" ? "Aluguel" : "Compra"})\n`;
      message += `   Código: ${item.sku || item.id} · ${item.color.name} · Tam. ${item.size.name}\n`;
      message += `   ${formatter.format(item.cartPrice)}`;
      if (item.eventDate) message += ` · ${format(new Date(item.eventDate), "dd/MM/yyyy")}`;
      message += "\n";
    });
    if (selectedQuote) message += `\nFrete: ${selectedQuote.name} ${formatter.format(selectedQuote.price)} (CEP ${cep})`;
    if (coupon) message += `\nCupom: ${coupon.code}`;
    message += `\n*Total: ${formatter.format(total)}*`;
    return message;
  };

  const checkoutLabel = isCheckingOut
    ? "Criando pedido..."
    : items.length === 0
      ? "Carrinho vazio"
      : missingDate
        ? "Escolha a data dos itens"
        : mixedDates
          ? "Use a mesma data em todos os itens"
          : !selectedQuote
            ? "Calcule o frete"
            : "Continuar para pagamento";

  if (mounted && items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <ShoppingBag className="mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Seu carrinho está vazio</h1>
        <p className="mt-2 text-sm text-muted-foreground">Escolha um vestido para alugar ou comprar.</p>
        <Button asChild className="mt-6">
          <Link href="/products">Ver catálogo</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-10">
      <h1 className="mb-6 text-2xl font-bold">Carrinho</h1>

      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Itens */}
        <section className="space-y-3 lg:col-span-7">
          {items.map((item) => {
            const date = toDate(item.eventDate);
            const period = item.contractType === "RENTAL" && date ? getRentalUsePeriod(date) : null;
            return (
              <article key={itemKey(item)} className="flex gap-3 rounded-xl border p-3 sm:gap-4 sm:p-4">
                <Link
                  href={`/product/${item.id}`}
                  className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:w-24"
                >
                  <Image src={item.images[0]?.url ?? "/placeholder.svg"} alt={item.name} fill className="object-cover" sizes="96px" />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.color.name} • {item.size.name}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold">{formatter.format(item.cartPrice)}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 font-medium",
                        item.contractType === "RENTAL" ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"
                      )}
                    >
                      {item.contractType === "RENTAL" ? "Aluguel" : "Compra"}
                    </span>
                    <button
                      type="button"
                      onClick={() => openDatePicker(item)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
                        !date && "border-destructive text-destructive"
                      )}
                    >
                      <CalendarIcon className="h-3 w-3" />
                      {date
                        ? `${item.contractType === "RENTAL" ? "Evento" : "Entrega"}: ${format(date, "dd/MM/yyyy")}`
                        : "Escolher data"}
                    </button>
                  </div>

                  {period && (
                    <p className="text-xs text-muted-foreground">
                      Com você de {format(period.from, "dd/MM")} a {format(period.to, "dd/MM")}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => cart.removeItem(item.id, item.contractType)}
                    className="mt-auto inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" /> Remover
                  </button>
                </div>
              </article>
            );
          })}
          {mixedDates && (
            <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              Os itens estão com datas diferentes. Cada pedido tem uma única data: ajuste as datas ou finalize um
              pedido por vez.
            </p>
          )}
        </section>

        {/* Resumo */}
        <aside className="h-fit space-y-6 rounded-xl border p-4 sm:p-5 lg:sticky lg:top-24 lg:col-span-5">
          <div className="space-y-2">
            <Label htmlFor="cart-cep">Frete</Label>
            <div className="relative">
              <Input
                id="cart-cep"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="CEP de entrega"
                value={cep}
                onChange={(e) => setCep(formatCep(e.target.value))}
                className="pr-10"
              />
              {isQuoting && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>

            {quotes.length > 0 && (
              <div className="space-y-2" role="radiogroup" aria-label="Opções de frete">
                {quotes.map((option) => {
                  const inTime = arrivesInTime(option);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={selectedQuoteId === option.id}
                      disabled={!inTime}
                      onClick={() => setSelectedQuoteId(option.id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50",
                        selectedQuoteId === option.id && inTime ? "border-foreground ring-1 ring-foreground" : "hover:border-foreground/50"
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Truck className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{option.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {inTime ? `${option.delivery_time} dias úteis` : "Não chega antes da data"}
                          </span>
                        </span>
                      </span>
                      <span className="shrink-0 font-medium">{formatter.format(option.price)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cart-coupon">Cupom</Label>
            <div className="flex gap-2">
              <Input
                id="cart-coupon"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                placeholder="Código do cupom"
              />
              <Button variant="outline" onClick={applyCoupon} disabled={isApplyingCoupon || !couponCode.trim()}>
                {isApplyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
              </Button>
            </div>
            {coupon && (
              <p className="text-xs text-emerald-600">
                {coupon.code}:{" "}
                {coupon.discountType === "percentage"
                  ? `${coupon.discountValue}% de desconto`
                  : `${formatter.format(coupon.discountValue)} de desconto`}
              </p>
            )}
          </div>

          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatter.format(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <dt>Desconto</dt>
                <dd>-{formatter.format(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Frete</dt>
              <dd>{selectedQuote ? formatter.format(selectedQuote.price) : "—"}</dd>
            </div>
            <div className="mt-2 flex justify-between border-t pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatter.format(total)}</dd>
            </div>
          </dl>

          <div className="space-y-2">
            <Button
              size="lg"
              className="h-12 w-full"
              onClick={finalizarCompra}
              disabled={isCheckingOut || !selectedQuote || missingDate || mixedDates || items.length === 0}
            >
              {isCheckingOut && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {checkoutLabel}
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 w-full border-green-500 text-green-700 hover:bg-green-50"
            >
              <a href={whatsappLink(whatsappMessage())} target="_blank" rel="noopener noreferrer">
                <FaWhatsapp className="mr-2 h-4 w-4" /> Finalizar pelo WhatsApp
              </a>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/products">Continuar comprando</Link>
            </Button>
          </div>
        </aside>
      </div>

      <Dialog open={!!dateItem} onOpenChange={(open) => !open && setDateItem(null)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dateItem?.contractType === "RENTAL" ? "Data do evento" : "Data de entrega"}</DialogTitle>
            <DialogDescription>
              {dateItem?.name}
              {otherItemsDate && " · os outros itens do carrinho estão nesta data"}
            </DialogDescription>
          </DialogHeader>
          {loadingBookings ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            dateItem && (
              <Calendar
                mode="single"
                locale={ptBR}
                className="mx-auto"
                selected={toDate(dateItem.eventDate) ?? otherItemsDate}
                defaultMonth={toDate(dateItem.eventDate) ?? otherItemsDate}
                onSelect={chooseDate}
                disabled={(date) =>
                  (!!otherItemsDate && !isSameEventDay(date, otherItemsDate)) ||
                  !isDateAvailable({
                    date,
                    contractType: dateItem.contractType,
                    bookings: dateBookings,
                    shippingDays: pickerShippingDays,
                  })
                }
              />
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
