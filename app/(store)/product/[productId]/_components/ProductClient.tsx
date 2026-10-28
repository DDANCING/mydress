"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarIcon, Loader2, ShoppingCart, Truck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { calcularFrete, FreteResult } from "@/actions/correios";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, formatter } from "@/lib/utils";
import { StoreProduct } from "@/app/types";
import { fadeIn, fadeInUp } from "@/lib/animations";
import {
  Booking,
  ContractKind,
  DEFAULT_SHIPPING_DAYS,
  getRentalUsePeriod,
  isDateAvailable,
} from "@/lib/booking-rules";
import WishlistButton from "@/components/ui/WishlistButton";
import useCart, { getCartPrice } from "@/hooks/use-cart";
import { PurchaseTerms } from "./purchase-terms";

interface ProductClientProps {
  product: StoreProduct;
  suggestedProducts: StoreProduct[];
  wishlist: boolean;
  bookings?: Booking[];
  userId?: string;
}

const formatCep = (value: string) => {
  const numbers = value.replace(/\D/g, "").slice(0, 8);
  return numbers.length <= 5 ? numbers : `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
};

export default function ProductClient({
  product,
  userId,
  suggestedProducts,
  wishlist,
  bookings = [],
}: ProductClientProps) {
  const [selectedImage, setSelectedImage] = useState(product.images[0]);
  const [isAdding, setIsAdding] = useState(false);

  const isOnlyRental = product.isOnlyRental === true;
  // Mesmo padrão do card da vitrine: com valor de locação, o vestido abre como aluguel
  const [contractType, setContractType] = useState<ContractKind>(
    isOnlyRental || Number(product.rentalValue) > 0 ? "RENTAL" : "SALE"
  );
  const [cep, setCep] = useState("");
  const [quotes, setQuotes] = useState<FreteResult[]>([]);
  const [cepError, setCepError] = useState<string | null>(null);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();

  const cart = useCart();

  const salePrice = getCartPrice(product, "SALE");
  const rentalPrice = getCartPrice(product, "RENTAL");
  const displayPrice = contractType === "RENTAL" ? rentalPrice : salePrice;

  // O calendário usa o frete mais rápido; no carrinho só aparecem opções que chegam a tempo
  const shippingDays = quotes.length > 0 ? Math.min(...quotes.map((q) => q.delivery_time)) : DEFAULT_SHIPPING_DAYS;
  const hasShipping = quotes.length > 0;

  const lookupCep = async (formatted: string) => {
    setIsLoadingCep(true);
    setCepError(null);
    try {
      const result = await calcularFrete({ cep: formatted, quantidade: 1, valorDeclarado: displayPrice });
      setQuotes(result);
      if (result.length === 0) setCepError("Não encontramos frete para este CEP.");
    } catch {
      setQuotes([]);
      setCepError("CEP inválido ou não encontrado.");
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleCepChange = (value: string) => {
    const formatted = formatCep(value);
    setCep(formatted);
    setSelectedDate(undefined);
    if (formatted.length === 9) {
      lookupCep(formatted);
    } else {
      setQuotes([]);
      setCepError(null);
    }
  };

  const handleContractTypeChange = (value: ContractKind) => {
    setContractType(value);
    setSelectedDate(undefined);
  };

  const onAddToCart = () => {
    if (!hasShipping || !selectedDate) return;
    setIsAdding(true);
    cart.addItem({ product, contractType, eventDate: selectedDate, cep });
    setTimeout(() => setIsAdding(false), 1000);
  };

  const usePeriod = contractType === "RENTAL" && selectedDate ? getRentalUsePeriod(selectedDate) : null;
  const dateLabel = contractType === "RENTAL" ? "Data do evento" : "Data de entrega";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:py-10">
      <Breadcrumb className="mb-4 hidden sm:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/products">Catálogo</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem className="max-w-40 truncate">
            <BreadcrumbLink href={`/category/${product.category.id}`}>{product.category.name}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbPage className="max-w-48 truncate">{product.name}</BreadcrumbPage>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-12 lg:gap-12">
        {/* Galeria */}
        <motion.div {...fadeIn} className="min-w-0 lg:col-span-7">
          {/* Celular: arrastar entre as fotos */}
          <Carousel className="md:hidden">
            <CarouselContent>
              {product.images.map((image) => (
                <CarouselItem key={image.id}>
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-muted">
                    <Image src={image.url} alt={product.name} fill className="object-cover" sizes="100vw" priority />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {product.images.length > 1 && (
              <>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </>
            )}
          </Carousel>

          {/* Tablet/desktop: foto principal com miniaturas */}
          <div className="hidden gap-4 md:flex md:flex-col lg:flex-row-reverse">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-muted">
              <Image
                src={selectedImage?.url ?? product.images[0]?.url}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 50vw, 50vw"
                priority
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1 lg:w-24 lg:shrink-0 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:pb-0">
                {product.images.map((image) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    aria-label="Ver foto"
                    className={cn(
                      "relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-md border-2 transition lg:w-full",
                      selectedImage?.id === image.id ? "border-foreground" : "border-transparent opacity-70 hover:opacity-100"
                    )}
                  >
                    <Image src={image.url} alt="" fill className="object-cover" sizes="96px" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Compra */}
        <motion.div {...fadeInUp} className="min-w-0 space-y-6 lg:col-span-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{product.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {product.color.name} • Tamanho {product.size.name}
              </p>
            </div>
            {userId && <WishlistButton productId={product.id} initialInWishlist={wishlist} />}
          </div>

          <div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-2xl font-semibold sm:text-3xl">{formatter.format(displayPrice)}</p>
              {contractType === "SALE" && product.originalPrice ? (
                <p className="text-lg text-muted-foreground line-through">
                  {formatter.format(Number(product.originalPrice))}
                </p>
              ) : null}
            </div>
            {contractType === "RENTAL" && (
              <p className="text-sm text-muted-foreground">Valor do aluguel para o seu evento</p>
            )}
          </div>

          {/* Compra ou aluguel */}
          {isOnlyRental ? (
            <p className="rounded-md bg-muted px-3 py-2 text-sm font-medium">Disponível apenas para aluguel</p>
          ) : (
            <div className="space-y-2">
              <Label>Como você quer este vestido?</Label>
              <div className="grid grid-cols-2 gap-2" role="radiogroup">
                {(
                  [
                    { value: "RENTAL", label: "Alugar", price: rentalPrice },
                    { value: "SALE", label: "Comprar", price: salePrice },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={contractType === option.value}
                    onClick={() => handleContractTypeChange(option.value)}
                    className={cn(
                      "rounded-lg border px-3 py-3 text-left transition",
                      contractType === option.value
                        ? "border-foreground bg-foreground/5 ring-1 ring-foreground"
                        : "border-border hover:border-foreground/50"
                    )}
                  >
                    <span className="block text-sm font-semibold">{option.label}</span>
                    <span className="block text-sm text-muted-foreground">{formatter.format(option.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CEP e frete */}
          <div className="space-y-2">
            <Label htmlFor="cep">CEP de entrega</Label>
            <div className="relative">
              <Input
                id="cep"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="00000-000"
                value={cep}
                onChange={(e) => handleCepChange(e.target.value)}
                aria-invalid={!!cepError}
                className={cn("pr-10", cepError && "border-destructive")}
              />
              {isLoadingCep && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
            {cepError && <p className="text-sm text-destructive">{cepError}</p>}
            {hasShipping && (
              <ul className="space-y-1 rounded-md border p-3 text-sm">
                {quotes.slice(0, 3).map((quote) => (
                  <li key={quote.id} className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <Truck className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{quote.name}</span>
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {formatter.format(quote.price)} · {quote.delivery_time} dias úteis
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Data */}
          {hasShipping && (
            <div className="space-y-2">
              <Label>{dateLabel}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    locale={ptBR}
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => !isDateAvailable({ date, contractType, bookings, shippingDays })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {usePeriod && (
                <p className="text-sm text-muted-foreground">
                  Você fica com o vestido de {format(usePeriod.from, "dd/MM", { locale: ptBR })} a{" "}
                  {format(usePeriod.to, "dd/MM", { locale: ptBR })}.
                </p>
              )}
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              size="lg"
              onClick={onAddToCart}
              disabled={isAdding || !hasShipping || !selectedDate}
              className="h-12 w-full shadow-lg shadow-primary/25 sm:col-span-2"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {isAdding
                ? "Adicionado!"
                : !hasShipping
                  ? "Informe o CEP"
                  : !selectedDate
                    ? "Selecione a data"
                    : "Adicionar ao carrinho"}
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 w-full sm:col-span-2">
              <Link href="/contact">Experimentar na loja</Link>
            </Button>
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="overview">
              <AccordionTrigger>Detalhes do vestido</AccordionTrigger>
              <AccordionContent>
                {product.description && <p className="text-sm leading-relaxed">{product.description}</p>}
                <ul className="mt-3 space-y-1 text-sm">
                  {product.sku && <li>Código: {product.sku}</li>}
                  <li>Tamanho: {product.size.name}</li>
                  <li className="flex items-center gap-2">
                    Cor: {product.color.name}
                    <span className="h-5 w-5 rounded-full border" style={{ backgroundColor: product.color.value }} />
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="terms">
              <AccordionTrigger>Termos de {contractType === "SALE" ? "compra" : "locação"}</AccordionTrigger>
              <AccordionContent>
                <PurchaseTerms contractType={contractType} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="policy">
              <AccordionTrigger>Entrega, devolução e troca</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm leading-relaxed">
                  O envio é feito com base na data escolhida. Trocas e devoluções em até 7 dias corridos após o
                  recebimento.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>
      </div>

      {suggestedProducts.length > 0 && (
        <motion.section {...fadeInUp} className="mt-16">
          <Separator className="mb-6" />
          <h2 className="mb-4 text-xl font-semibold">Você também pode gostar</h2>
          <Carousel opts={{ align: "start" }} className="w-full">
            <CarouselContent>
              {suggestedProducts.map((item) => (
                <CarouselItem key={item.id} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                  <Link href={`/product/${item.id}`} className="group block space-y-2">
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg border bg-muted">
                      <Image
                        src={item.images[0]?.url ?? "/placeholder.svg"}
                        alt={item.name}
                        fill
                        className="object-cover transition group-hover:scale-105"
                        sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                      />
                    </div>
                    <p className="truncate text-center text-sm">{item.name}</p>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
        </motion.section>
      )}
    </div>
  );
}
