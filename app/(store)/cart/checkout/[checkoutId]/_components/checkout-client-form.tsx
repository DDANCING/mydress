"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Loader2, Lock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatter, cn } from "@/lib/utils";
import { getRentalUsePeriod } from "@/lib/booking-rules";
import { checkoutBuyerSchema, CheckoutBuyerInput } from "@/schemas/checkout";

export type CheckoutOrder = {
  id: string;
  eventDate: string | null;
  shippingMethod: string | null;
  shippingCost: number;
  shippingTime: number | null;
  subtotal: number;
  discount: number;
  couponCode: string | null;
  hasRental: boolean;
  items: {
    id: string;
    name: string;
    sku: string | null;
    image: string | null;
    color: string;
    size: string;
    type: "SALE" | "RENTAL";
    unitPrice: number;
  }[];
  buyer: CheckoutBuyerInput & { email: string };
};

const digits = (value: string) => value.replace(/\D/g, "");

const maskPhone = (value: string) => {
  const d = digits(value).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const maskDocument = (value: string) => {
  const d = digits(value).slice(0, 14);
  if (d.length <= 11) {
    return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

const maskCep = (value: string) => {
  const d = digits(value).slice(0, 8);
  return d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5)}`;
};

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default function CheckoutClientForm({ order, canceled }: { order: CheckoutOrder; canceled?: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLookingUpCep, setIsLookingUpCep] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutBuyerInput>({
    resolver: zodResolver(checkoutBuyerSchema),
    defaultValues: {
      ...order.buyer,
      phone: maskPhone(order.buyer.phone),
      document: maskDocument(order.buyer.document),
      cep: maskCep(order.buyer.cep),
    },
  });

  useEffect(() => {
    if (canceled) toast.error("Pagamento cancelado", { description: "Seu pedido continua salvo. Tente novamente quando quiser." });
  }, [canceled]);

  // Preenche o endereço pelo CEP
  const lookupCep = async (cep: string) => {
    if (digits(cep).length !== 8) return;
    setIsLookingUpCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits(cep)}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }
      setValue("address", data.logradouro || "", { shouldValidate: !!data.logradouro });
      setValue("neighborhood", data.bairro || "", { shouldValidate: !!data.bairro });
      setValue("city", data.localidade || "", { shouldValidate: true });
      setValue("state", data.uf || "", { shouldValidate: true });
    } catch {
      // Sem ViaCEP a cliente preenche manualmente
    } finally {
      setIsLookingUpCep(false);
    }
  };

  const onSubmit = async (buyer: CheckoutBuyerInput) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, buyer }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) throw new Error(data.error || "Erro ao abrir o pagamento");
      window.location.href = data.url;
    } catch (error) {
      toast.error("Não foi possível continuar", { description: (error as Error).message });
      setIsLoading(false);
    }
  };

  const eventDate = order.eventDate ? new Date(order.eventDate) : null;
  const period = order.hasRental && eventDate ? getRentalUsePeriod(eventDate) : null;
  const total = order.subtotal - order.discount + order.shippingCost;
  const cepField = register("cep");
  const phoneField = register("phone");
  const documentField = register("document");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-10">
      <h1 className="mb-6 text-2xl font-bold">Finalizar pedido</h1>

      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 lg:col-span-7" noValidate>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Seus dados</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome completo" error={errors.fullName?.message} className="sm:col-span-2">
                <Input autoComplete="name" {...register("fullName")} />
              </Field>
              <Field label="E-mail">
                <Input value={order.buyer.email} disabled className="bg-muted" />
              </Field>
              <Field label="Celular com DDD" error={errors.phone?.message}>
                <Input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="(48) 99999-9999"
                  {...phoneField}
                  onChange={(e) => {
                    e.target.value = maskPhone(e.target.value);
                    phoneField.onChange(e);
                  }}
                />
              </Field>
              <Field label="CPF ou CNPJ" error={errors.document?.message} className="sm:col-span-2">
                <Input
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  {...documentField}
                  onChange={(e) => {
                    e.target.value = maskDocument(e.target.value);
                    documentField.onChange(e);
                  }}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Endereço de entrega</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-6">
              <Field label="CEP" error={errors.cep?.message} className="sm:col-span-2">
                <div className="relative">
                  <Input
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="00000-000"
                    {...cepField}
                    onChange={(e) => {
                      e.target.value = maskCep(e.target.value);
                      cepField.onChange(e);
                      if (e.target.value.length === 9) lookupCep(e.target.value);
                    }}
                  />
                  {isLookingUpCep && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>
              </Field>
              <Field label="Rua" error={errors.address?.message} className="sm:col-span-4">
                <Input autoComplete="address-line1" {...register("address")} />
              </Field>
              <Field label="Número" error={errors.number?.message} className="sm:col-span-2">
                <Input inputMode="numeric" {...register("number")} />
              </Field>
              <Field label="Complemento" className="sm:col-span-4">
                <Input autoComplete="address-line2" placeholder="Apto, bloco (opcional)" {...register("complement")} />
              </Field>
              <Field label="Bairro" error={errors.neighborhood?.message} className="sm:col-span-2">
                <Input {...register("neighborhood")} />
              </Field>
              <Field label="Cidade" error={errors.city?.message} className="sm:col-span-3">
                <Input autoComplete="address-level2" {...register("city")} />
              </Field>
              <Field label="UF" error={errors.state?.message} className="sm:col-span-1">
                <Input maxLength={2} className="uppercase" autoComplete="address-level1" {...register("state")} />
              </Field>
              {digits(watch("cep") ?? "") !== digits(order.buyer.cep) && digits(watch("cep") ?? "").length === 8 && (
                <p className="text-xs text-muted-foreground sm:col-span-6">
                  O frete será recalculado para este CEP antes do pagamento.
                </p>
              )}
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="h-12 w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
            {isLoading ? "Abrindo pagamento seguro..." : "Ir para o pagamento"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            O pagamento é concluído na página segura do Stripe.
          </p>
        </form>

        <Card className="h-fit lg:sticky lg:top-24 lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-lg">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                  {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.color} • {item.size} · {item.type === "SALE" ? "Compra" : "Aluguel"}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium">{formatter.format(item.unitPrice)}</p>
              </div>
            ))}

            {eventDate && (
              <div className="flex items-start gap-2 rounded-md bg-muted p-3 text-sm">
                <CalendarIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">
                    {order.hasRental ? "Evento" : "Entrega"}: {format(eventDate, "PPP", { locale: ptBR })}
                  </p>
                  {period && (
                    <p className="text-xs text-muted-foreground">
                      Com você de {format(period.from, "dd/MM")} a {format(period.to, "dd/MM")}
                    </p>
                  )}
                </div>
              </div>
            )}

            <dl className="space-y-1 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatter.format(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <dt>Cupom {order.couponCode}</dt>
                  <dd>-{formatter.format(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>Frete {order.shippingMethod ? `(${order.shippingMethod})` : ""}</dt>
                <dd>{formatter.format(order.shippingCost)}</dd>
              </div>
              <div className="flex justify-between pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatter.format(total)}</dd>
              </div>
            </dl>

            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link href="/products">Continuar comprando</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
