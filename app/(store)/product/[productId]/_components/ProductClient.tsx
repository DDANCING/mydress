"use client";

import { MouseEventHandler, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { calcularFrete } from "@/actions/correios";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button, buttonVariants } from "@/components/ui/button";
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
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, addDays, subDays, isAfter, isBefore, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, formatter } from "@/lib/utils";
import { StoreProduct } from "@/app/types";
import {
  fadeIn,
  fadeInUp,
  scaleIn,
  staggerContainer,
} from "@/lib/animations";
import WishlistButton from "@/components/ui/WishlistButton";
import useCart from "@/hooks/use-cart";

interface Schedule {
  id: string;
  eventDate: Date;
  contractType: "SALE" | "RENTAL";
}

interface ProductClientProps {
  product: StoreProduct;
  suggestedProducts: StoreProduct[];
  wishlist: boolean;
  schedules?: Schedule[]; 
  userId?: string; 
}

export default function ProductClient({
  product,
  userId,
  suggestedProducts,
  wishlist,
  schedules = []
}: ProductClientProps) {
  const [selectedImage, setSelectedImage] = useState(product.images[0]);
  const [isAdding, setIsAdding] = useState(false);

  // NOVA LÓGICA
  const isOnlyRental = product.isOnlyRental === true;
  // rentalValue pode vir null, string, ou number. Deixe sempre como number ou undefined.
  const rentalValue = product.rentalValue !== null && product.rentalValue !== undefined ? Number(product.rentalValue) : undefined;

  // Defina o tipo inicial do contrato baseado em isOnlyRental
  const [contractType, setContractType] = useState<"SALE" | "RENTAL">(isOnlyRental ? "RENTAL" : "SALE");
  const [cep, setCep] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [shippingDays, setShippingDays] = useState(3); 
  const [isValidCep, setIsValidCep] = useState(false);
  const [freteData, setFreteData] = useState<{price: number; name: string} | null>(null);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const cart = useCart();
  const size = 1; 

  // Preço a ser exibido (RENTAL ou SALE)
  let displayPrice: number;
  if (contractType === "RENTAL") {
    displayPrice = rentalValue !== undefined ? rentalValue : Number(product.price) / 2;
  } else {
    // Se só pode alugar, não exibe venda, mas se por algum motivo está em SALE, mantém o padrão.
    displayPrice = Number(product.price);
  }

  // Função para validar CEP 
  const validateCep = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setIsLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          try {
            const fretes = await calcularFrete({
              sCepOrigem: "85812011", 
              sCepDestino: cleanCep,
              quantidade: 1
            });
            const pac = fretes.find(frete => frete.id === "04510" || frete.name === "PAC");
            if (pac) {
              setIsValidCep(true);
              setShippingDays(pac.delivery_time);
              setFreteData({ price: pac.price, name: pac.name });
            } else {
              setIsValidCep(true);
              setShippingDays(7);
              setFreteData(null);
            }
          } catch (freteError) {
            setIsValidCep(true);
            const uf = data.uf;
            const shippingTime = uf === 'SP' ? 2 : uf === 'RJ' ? 3 : uf === 'MG' ? 4 : 7;
            setShippingDays(shippingTime);
            setFreteData(null);
          }
        } else {
          setIsValidCep(false);
          setFreteData(null);
        }
      } catch (error) {
        setIsValidCep(false);
        setFreteData(null);
      } finally {
        setIsLoadingCep(false);
      }
    } else {
      setIsValidCep(false);
      setFreteData(null);
      setIsLoadingCep(false);
    }
  };

  // Função para verificar se uma data está disponível
  const isDateAvailable = (date: Date) => {
    const today = new Date();
    if (isBefore(date, today)) return false;
    const minDate = addDays(today, shippingDays);
    if (isBefore(date, minDate)) return false;
    if (contractType === "SALE" && !isOnlyRental) {
      const lastSchedule = schedules.sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime())[0];
      if (lastSchedule) {
        const availableFromDate = addDays(lastSchedule.eventDate, shippingDays + 3);
        if (isBefore(date, availableFromDate)) {
          return false;
        }
      }
    }
    if (contractType === "RENTAL") {
      const rentalStart = subDays(date, 3 + shippingDays);
      const rentalEnd = addDays(date, 3);
      for (const schedule of schedules) {
        if (schedule.contractType === "RENTAL") {
          const existingRentalStart = subDays(schedule.eventDate, 3 + shippingDays);
          const existingRentalEnd = addDays(schedule.eventDate, 3);
          if (
            (isAfter(rentalStart, existingRentalStart) || isSameDay(rentalStart, existingRentalStart)) &&
            (isBefore(rentalStart, existingRentalEnd) || isSameDay(rentalStart, existingRentalEnd))
          ) {
            return false;
          }
          if (
            (isAfter(rentalEnd, existingRentalStart) || isSameDay(rentalEnd, existingRentalStart)) &&
            (isBefore(rentalEnd, existingRentalEnd) || isSameDay(rentalEnd, existingRentalEnd))
          ) {
            return false;
          }
          if (
            (isBefore(rentalStart, existingRentalStart) || isSameDay(rentalStart, existingRentalStart)) &&
            (isAfter(rentalEnd, existingRentalEnd) || isSameDay(rentalEnd, existingRentalEnd))
          ) {
            return false;
          }
        }
      }
      for (const schedule of schedules) {
        if (schedule.contractType === "SALE") {
          const saleDeliveryDate = addDays(schedule.eventDate, shippingDays);
          if (
            (isAfter(saleDeliveryDate, rentalStart) || isSameDay(saleDeliveryDate, rentalStart)) &&
            (isBefore(saleDeliveryDate, rentalEnd) || isSameDay(saleDeliveryDate, rentalEnd))
          ) {
            return false;
          }
        }
      }
    }
    return true;
  };

  // Função para formatar CEP
  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) {
      return numbers;
    }
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  // Reset selectedDate quando muda contractType
  const handleContractTypeChange = (value: "SALE" | "RENTAL") => {
    setContractType(value);
    setSelectedDate(undefined);
    if (cep.length === 9 && isValidCep && !isLoadingCep) {
      validateCep(cep);
    }
  };

  const onAddToCart: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();
    if (!isValidCep || !selectedDate) {
      alert("Por favor, preencha um CEP válido e selecione uma data.");
      return;
    }
    setIsAdding(true);
    cart.addItem({
      product,
      contractType,
      eventDate: selectedDate,
      cep,
      shippingPrice: freteData?.price || 0
    });
    setTimeout(() => {
      setIsAdding(false);
    }, 1000);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* ===== MOBILE ===== */}
      <motion.div {...fadeIn} className="block md:hidden">
        <Carousel className="w-full">
          <CarouselContent>
            {product.images.map((image) => (
              <CarouselItem key={image.id} className="basis-full">
                <div className="relative w-full aspect-square">
                  <Image
                    src={image.url}
                    alt={product.name}
                    fill
                    className="object-cover rounded-lg"
                    sizes="100vw"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>

        <motion.div {...fadeInUp} className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{product.name}</h1>
            {userId && <WishlistButton productId={product.id} initialInWishlist={wishlist} />}
            
          </div>
          
          {/* Tipo de contrato: só mostra se não é isOnlyRental */}
          {!isOnlyRental && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Tipo de Contrato</Label>
              <RadioGroup 
                value={contractType} 
                onValueChange={handleContractTypeChange}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="SALE" id="sale-mobile" />
                  <Label htmlFor="sale-mobile">Venda</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="RENTAL" id="rental-mobile" />
                  <Label htmlFor="rental-mobile">Aluguel</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Se for aluguel exclusivo, mostra label fixa */}
          {isOnlyRental && (
            <div className="space-y-2">
              <Label className="text-base font-medium text-primary">Este produto está disponível apenas para aluguel</Label>
            </div>
          )}
          
          {/* CEP Input */}
          <div className="space-y-2">
            <Label htmlFor="cep-mobile">CEP de Entrega</Label>
            <Input
              id="cep-mobile"
              type="text"
              placeholder="00000-000"
              value={cep}
              onChange={(e) => {
                const formatted = formatCep(e.target.value);
                setCep(formatted);
                if (formatted.length === 9) {
                  validateCep(formatted);
                }
              }}
              className={cn(
                "w-full",
                isValidCep ? "border-green-500" : 
                isLoadingCep ? "border-blue-500" :
                cep.length === 9 ? "border-red-500" : ""
              )}
            />
            {isLoadingCep && (
              <p className="text-sm text-blue-500">Buscando...</p>
            )}
            {!isLoadingCep && cep.length === 9 && !isValidCep && (
              <p className="text-sm text-red-500">CEP inválido</p>
            )}
            {!isLoadingCep && isValidCep && (
              <div className="space-y-1">
                <p className="text-sm text-green-600">
                  Tempo de entrega: {shippingDays} dias úteis
                </p>
              </div>
            )}
          </div>
          
          {/* Date Selection */}
          {isValidCep && (
            <div className="space-y-2">
              <Label>
                Data de {contractType === "SALE" && !isOnlyRental ? "Entrega" : "Evento"}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => !isDateAvailable(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {contractType === "RENTAL" && selectedDate && (
                <p className="text-sm text-muted-foreground">
                  Período de uso: {format(subDays(selectedDate, 3), "dd/MM", { locale: ptBR })} a {format(addDays(selectedDate, 3), "dd/MM", { locale: ptBR })}
                </p>
              )}
            </div>
          )}
          
          <div className="space-y-1">
            <p className="text-xl font-semibold">
              {formatter.format(displayPrice)}
            </p>
            {/* Não mostra preço original se for aluguel exclusivo */}
            {contractType === "RENTAL" && !isOnlyRental && (
              <p className="text-sm text-muted-foreground">
                Preço original: {formatter.format(Number(product.price))}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:flex gap-2">
            <motion.button
              onClick={onAddToCart}
              disabled={isAdding || !isValidCep || !selectedDate}
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full font-medium",
                "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary",
                "shadow-lg shadow-primary/25 disabled:opacity-60"
              )}
              style={{ height: `${48 * size}px`, fontSize: `${1 * size}rem` }}
            >
              <ShoppingCart className="w-4 h-4 mr-2" style={{
                width: `${16 * size}px`,
                height: `${16 * size}px`,
              }} />
              {isAdding ? "Adicionado!" : 
               !isValidCep ? "Informe o CEP" : 
               !selectedDate ? "Selecione a data" : 
               "Adicionar ao Carrinho"}
            </motion.button>
            <Button variant="outline" size="lg" className="flex-1">
              ENCONTRAR NA LOJA
            </Button>
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="overview">
              <AccordionTrigger>Visão Geral do Produto</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm leading-relaxed">{product.description}</p>
                <ul className="text-sm mt-3 space-y-1">
                  <li> {product.sku} </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            {/* Só mostra termos de venda se não for aluguel exclusivo */}
            {!isOnlyRental && (
              <AccordionItem value="terms">
                <AccordionTrigger>
                  Termos de {contractType === "SALE" ? "Venda" : "Locação"}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="text-sm leading-relaxed space-y-3">
                        <div>
                    <h4 className="font-semibold mb-2">My Dress Floripa - Termos Gerais</h4>
                    <p>Todo o conteúdo, incluindo imagens, textos e design dos produtos, é de propriedade da My Dress Floripa.</p>
                  </div>

                  {contractType === "SALE" ? (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold mb-2">Termos Específicos para VENDA</h4>
                        <div className="space-y-2">
                          <div>
                            <h5 className="font-medium">Ajustes e Confecção:</h5>
                            <p>• Para produtos &quot;Sob Medida&quot;, você é responsável por fornecer suas medidas exatas conforme o guia disponível.</p>
                            <p>• Para produtos de &quot;Tamanho Padrão&quot;, consulte nossa tabela de medidas para escolher o tamanho adequado.</p>
                          </div>
                          
                          <div>
                            <h5 className="font-medium">Direito de Arrependimento:</h5>
                            <p>• Você tem 7 dias corridos após o recebimento para desistir da compra e solicitar devolução.</p>
                            <p>• <strong>EXCEÇÃO:</strong> Produtos &quot;Sob Medida&quot; ou personalizados não permitem arrependimento por serem únicos.</p>
                            <p>• Para exercer o direito, o produto deve ser devolvido na embalagem original, sem uso, com todos os acessórios.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold mb-2">Termos Específicos para LOCAÇÃO</h4>
                        <div className="space-y-2">
                          <div>
                            <h5 className="font-medium">Processo de Locação:</h5>
                            <p>• A locação é para produtos de &quot;Tamanho Padrão&quot; apenas. Não realizamos ajustes à distância.</p>
                            <p>• A reserva só é confirmada após aprovação do pagamento.</p>
                          </div>
                          
                          <div>
                            <h5 className="font-medium">Entrega e Devolução:</h5>
                            <p>• O traje chegará com antecedência segura em relação ao evento.</p>
                            <p>• Você receberá embalagem e etiqueta pré-paga para devolução.</p>
                            <p>• <strong>OBRIGATÓRIO:</strong> Postar o traje no primeiro dia útil após o evento.</p>
                          </div>
                          
                          <div>
                            <h5 className="font-medium text-red-600">Multas e Responsabilidades:</h5>
                            <p>• <strong>Atraso na devolução:</strong> Multa diária de 20% sobre o valor da locação.</p>
                            <p>• <strong>Danos ou sujeira excessiva:</strong> Taxa mínima de R$ 200,00 para reparo/limpeza.</p>
                            <p>• <strong>Extravio ou dano irreparável:</strong> Pagamento do valor integral de venda do produto.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-semibold mb-2">Entrega e Frete</h4>
                    <p>• Prazos são estimativas das transportadoras a partir da confirmação do pagamento.</p>
                    <p>• Você é responsável por fornecer endereço correto e completo.</p>
                    <p>• Para envios internacionais: taxas de importação e impostos são de sua responsabilidade.</p>
                  </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
            {/* Se for aluguel exclusivo, só mostra termos de locação */}
            {isOnlyRental && (
              <AccordionItem value="terms-rental-only">
                <AccordionTrigger>
                  Termos de Locação
                </AccordionTrigger>
                <AccordionContent>
                  <div className="text-sm leading-relaxed space-y-3">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold mb-2">Termos Específicos para LOCAÇÃO</h4>
                        <div className="space-y-2">
                          <div>
                            <h5 className="font-medium">Processo de Locação:</h5>
                            <p>• A locação é para produtos de &quot;Tamanho Padrão&quot; apenas. Não realizamos ajustes à distância.</p>
                            <p>• A reserva só é confirmada após aprovação do pagamento.</p>
                          </div>
                          
                          <div>
                            <h5 className="font-medium">Entrega e Devolução:</h5>
                            <p>• O traje chegará com antecedência segura em relação ao evento.</p>
                            <p>• Você receberá embalagem e etiqueta pré-paga para devolução.</p>
                            <p>• <strong>OBRIGATÓRIO:</strong> Postar o traje no primeiro dia útil após o evento.</p>
                          </div>
                          
                          <div>
                            <h5 className="font-medium text-red-600">Multas e Responsabilidades:</h5>
                            <p>• <strong>Atraso na devolução:</strong> Multa diária de 20% sobre o valor da locação.</p>
                            <p>• <strong>Danos ou sujeira excessiva:</strong> Taxa mínima de R$ 200,00 para reparo/limpeza.</p>
                            <p>• <strong>Extravio ou dano irreparável:</strong> Pagamento do valor integral de venda do produto.</p>
                          </div>
                        </div> 
                      </div>
                    </div>
                     <div>
                    <h4 className="font-semibold mb-2">Entrega e Frete</h4>
                    <p>• Prazos são estimativas das transportadoras a partir da confirmação do pagamento.</p>
                    <p>• Você é responsável por fornecer endereço correto e completo.</p>
                    <p>• Para envios internacionais: taxas de importação e impostos são de sua responsabilidade.</p>
                  </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
            <AccordionItem value="policy">
              <AccordionTrigger>
                Política de Entrega, Devolução e Troca
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm leading-relaxed">
                  O envio será feito com base na data solicitada. Trocas e devoluções em
                  até 7 dias corridos após o recebimento.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>
      </motion.div>

      {/* ===== TABLET / DESKTOP ===== */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-10 gap-x-8">
        {/* Miniaturas */}
        <motion.div {...staggerContainer} className="hidden lg:flex lg:flex-col lg:col-span-2 gap-y-4">
          {product.images.map((image) => (
            <motion.button
              key={image.id}
              type="button"
              onClick={() => setSelectedImage(image)}
              className={cn(
                "relative h-48 w-48 overflow-hidden rounded-lg border",
                selectedImage.id === image.id ? "border-black" : "border-muted"
              )}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Image
                src={image.url}
                alt="Miniatura"
                fill
                className="object-cover"
                sizes="33vw"
              />
            </motion.button>
          ))}
        </motion.div>

        {/* Imagem Principal */}
        <motion.div {...scaleIn} className="relative w-full aspect-square lg:col-span-5">
          <div className="absolute top-4 right-4 z-10 bg-muted rounded-full">
           <WishlistButton productId={product.id} initialInWishlist={wishlist} />
          </div>
          <Image
            src={selectedImage.url}
            alt={product.name}
            fill
            className="object-cover rounded-lg"
            sizes="50vw"
          />
        </motion.div>

        {/* Informações do Produto */}
        <motion.div {...fadeInUp} className="mt-6 md:mt-0 space-y-6 lg:col-span-3">
          <div>
            <Breadcrumb className="w-96">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/products">Catálogo</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/category/${product.category.id}`}>{product.category.name.length > 9 ? product.category.name.slice(0, 9) + "..." : product.category.name}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbPage>
                {product.name.length > 9 ? product.name.slice(0, 9) + "..." : product.name}
               </BreadcrumbPage>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
            </div>
            
            {/* Tipo de contrato: só mostra se não é aluguel exclusivo */}
            {!isOnlyRental && (
              <div className="space-y-3">
                <Label className="text-base font-medium">Tipo de Contrato</Label>
                <RadioGroup 
                  value={contractType} 
                  onValueChange={handleContractTypeChange}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="SALE" id="sale-desktop" />
                    <Label htmlFor="sale-desktop">Venda</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="RENTAL" id="rental-desktop" />
                    <Label htmlFor="rental-desktop">Aluguel</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
            {isOnlyRental && (
              <div className="space-y-2">
                <Label className="text-base font-medium text-primary">Este produto está disponível apenas para aluguel</Label>
              </div>
            )}
            <div className="flex flex-col lg:flex-row gap-4 my-4">
              <div className="space-y-2">
                <Label htmlFor="cep-desktop">CEP de Entrega</Label>
                <Input
                  id="cep-desktop"
                  type="text"
                  placeholder="00000-000"
                  value={cep}
                  onChange={(e) => {
                    const formatted = formatCep(e.target.value);
                    setCep(formatted);
                    if (formatted.length === 9) {
                      validateCep(formatted);
                    }
                  }}
                  className={cn(
                    "w-full max-w-xs",
                    isValidCep ? "border-green-500" : 
                    isLoadingCep ? "border-blue-500" :
                    cep.length === 9 ? "border-red-500" : ""
                  )}
                />
                {isLoadingCep && (
                  <p className="text-sm text-blue-500">Buscando...</p>
                )}
                {!isLoadingCep && cep.length === 9 && !isValidCep && (
                  <p className="text-sm text-red-500">CEP inválido</p>
                )}
                {!isLoadingCep && isValidCep && (
                  <div className="space-y-1">
                    <p className="text-sm text-green-600">
                      Tempo de entrega: {shippingDays} dias úteis
                    </p>
                  </div>
                )}
              </div>
              {/* Date Selection */}
              {isValidCep && (
                <div className="space-y-2">
                  <Label>
                    Data de {contractType === "SALE" && !isOnlyRental ? "Entrega" : "Evento"}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full max-w-xs justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                          format(selectedDate, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione a data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => !isDateAvailable(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {contractType === "RENTAL" && selectedDate && (
                    <p className="text-sm text-muted-foreground">
                      Período de uso: {format(subDays(selectedDate, 3), "dd/MM", { locale: ptBR })} a {format(addDays(selectedDate, 3), "dd/MM", { locale: ptBR })}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-2xl font-semibold">
                  {formatter.format(displayPrice)}
                </p>
                {/* Não mostra preço original se for aluguel exclusivo */}
                {product.originalPrice && contractType === "SALE" && !isOnlyRental && (
                  <p className="text-lg font-semibold text-muted-foreground line-through">
                    {formatter.format(Number(product.originalPrice))}
                  </p>
                )}
              </div>
              {contractType === "RENTAL" && !isOnlyRental && (
                <p className="text-sm text-muted-foreground">
                  Preço original: {formatter.format(Number(product.price))}
                </p>
              )}
            </div>
          </div>

          <div className="grid 2xl:flex gap-2 items-center">
            <motion.button
              onClick={onAddToCart}
              disabled={isAdding || !isValidCep || !selectedDate}
              className={cn(
                buttonVariants({ variant: "default" }),
                "font-medium",
                "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary",
                "shadow-lg shadow-primary/25 disabled:opacity-60"
              )}
              style={{ height: `${48 * size}px`, fontSize: `${1 * size}rem` }}
            >
              <ShoppingCart className="w-4 h-4 mr-2" style={{
                width: `${16 * size}px`,
                height: `${16 * size}px`,
              }} />
              {isAdding ? "Adicionado!" : 
               !isValidCep ? "Informe o CEP" : 
               !selectedDate ? "Selecione a data" : 
               "Adicionar ao Carrinho"}
            </motion.button>
            <Link href={`/products`}>
              <Button variant="outline" className="h-12 w-full">ENCONTRAR NA LOJA</Button>
            </Link>
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="overview-desktop">
              <AccordionTrigger>Visão Geral do Produto</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm leading-relaxed">{product.description}</p>
                <ul className="text-sm mt-3 space-y-1">
                  <li>SKU: {product.sku}</li>
                  <li>Tamanho: {product.size.name}</li>
                  <li className="flex gap-2 items-center">
                    Cor: {product.color.name}
                    <div
                      className="h-6 w-6 rounded-full border"
                      style={{ backgroundColor: product.color.value }}
                    />
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            {/* Só mostra termos de venda se não for aluguel exclusivo */}
            {!isOnlyRental && (
              <AccordionItem value="terms-desktop">
                <AccordionTrigger>
                  Termos de {contractType === "SALE" ? "Venda" : "Locação"}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="text-sm leading-relaxed space-y-3">
                     <div>
                    <h4 className="font-semibold mb-2">My Dress Floripa - Termos Gerais</h4>
                    <p>Todo o conteúdo, incluindo imagens, textos e design dos produtos, é de propriedade da My Dress Floripa.</p>
                  </div>

                  {contractType === "SALE" ? (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold mb-2">Termos Específicos para VENDA</h4>
                        <div className="space-y-2">
                          <div>
                            <h5 className="font-medium">Ajustes e Confecção:</h5>
                            <p>• Para produtos &quot;Sob Medida&quot;, você é responsável por fornecer suas medidas exatas conforme o guia disponível.</p>
                            <p>• Para produtos de &quot;Tamanho Padrão&quot;, consulte nossa tabela de medidas para escolher o tamanho adequado.</p>
                          </div>
                          
                          <div>
                            <h5 className="font-medium">Direito de Arrependimento:</h5>
                            <p>• Você tem 7 dias corridos após o recebimento para desistir da compra e solicitar devolução.</p>
                            <p>• <strong>EXCEÇÃO:</strong> Produtos &quot;Sob Medida&quot; ou personalizados não permitem arrependimento por serem únicos.</p>
                            <p>• Para exercer o direito, o produto deve ser devolvido na embalagem original, sem uso, com todos os acessórios.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold mb-2">Termos Específicos para LOCAÇÃO</h4>
                        <div className="space-y-2">
                          <div>
                            <h5 className="font-medium">Processo de Locação:</h5>
                            <p>• A locação é para produtos de &quot;Tamanho Padrão&quot; apenas. Não realizamos ajustes à distância.</p>
                            <p>• A reserva só é confirmada após aprovação do pagamento.</p>
                          </div>
                          
                          <div>
                            <h5 className="font-medium">Entrega e Devolução:</h5>
                            <p>• O traje chegará com antecedência segura em relação ao evento.</p>
                            <p>• Você receberá embalagem e etiqueta pré-paga para devolução.</p>
                            <p>• <strong>OBRIGATÓRIO:</strong> Postar o traje no primeiro dia útil após o evento.</p>
                          </div>
                          
                          <div>
                            <h5 className="font-medium text-red-600">Multas e Responsabilidades:</h5>
                            <p>• <strong>Atraso na devolução:</strong> Multa diária de 20% sobre o valor da locação.</p>
                            <p>• <strong>Danos ou sujeira excessiva:</strong> Taxa mínima de R$ 200,00 para reparo/limpeza.</p>
                            <p>• <strong>Extravio ou dano irreparável:</strong> Pagamento do valor integral de venda do produto.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-semibold mb-2">Entrega e Frete</h4>
                    <p>• Prazos são estimativas das transportadoras a partir da confirmação do pagamento.</p>
                    <p>• Você é responsável por fornecer endereço correto e completo.</p>
                    <p>• Para envios internacionais: taxas de importação e impostos são de sua responsabilidade.</p>
                  </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
            {/* Se for aluguel exclusivo, só mostra termos de locação */}
            {isOnlyRental && (
              <AccordionItem value="terms-rental-only-desktop">
                <AccordionTrigger>
                  Termos de Locação
                </AccordionTrigger>
                <AccordionContent>
                  <div className="text-sm leading-relaxed space-y-3">
                       <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold mb-2">Termos Específicos para LOCAÇÃO</h4>
                        <div className="space-y-2">
                          <div>
                            <h5 className="font-medium">Processo de Locação:</h5>
                            <p>• A locação é para produtos de &quot;Tamanho Padrão&quot; apenas. Não realizamos ajustes à distância.</p>
                            <p>• A reserva só é confirmada após aprovação do pagamento.</p>
                          </div>
                          
                          <div>
                            <h5 className="font-medium">Entrega e Devolução:</h5>
                            <p>• O traje chegará com antecedência segura em relação ao evento.</p>
                            <p>• Você receberá embalagem e etiqueta pré-paga para devolução.</p>
                            <p>• <strong>OBRIGATÓRIO:</strong> Postar o traje no primeiro dia útil após o evento.</p>
                          </div>
                          
                          <div>
                            <h5 className="font-medium text-red-600">Multas e Responsabilidades:</h5>
                            <p>• <strong>Atraso na devolução:</strong> Multa diária de 20% sobre o valor da locação.</p>
                            <p>• <strong>Danos ou sujeira excessiva:</strong> Taxa mínima de R$ 200,00 para reparo/limpeza.</p>
                            <p>• <strong>Extravio ou dano irreparável:</strong> Pagamento do valor integral de venda do produto.</p>
                          </div>
                          <div>
                    <h4 className="font-semibold mb-2">Entrega e Frete</h4>
                    <p>• Prazos são estimativas das transportadoras a partir da confirmação do pagamento.</p>
                    <p>• Você é responsável por fornecer endereço correto e completo.</p>
                    <p>• Para envios internacionais: taxas de importação e impostos são de sua responsabilidade.</p>
                  </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
            <AccordionItem value="policy-desktop">
              <AccordionTrigger>
                Política de Entrega, Devolução e Troca
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm leading-relaxed">
                  O envio será feito com base na data solicitada. Trocas e devoluções em
                  até 7 dias corridos após o recebimento.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>
      </div>

      {/* ===== SUGERIDOS ===== */}
      {suggestedProducts.length > 0 && (
        <motion.section {...fadeInUp} className="mt-16">
          <Separator className="mb-4" />
          <h2 className="text-xl font-semibold mb-4">Você também pode gostar</h2>
          <Carousel opts={{ align: "start" }} className="w-full">
            <CarouselContent>
              {suggestedProducts.map((item) => (
                <CarouselItem
                  key={item.id}
                  className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
                >
                  <Link href={`${item.id}`}>
                    <motion.div
                      {...fadeIn}
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="space-y-2"
                    >
                      <div className="relative w-full aspect-square overflow-hidden rounded-lg border">
                        <Image
                          src={item.images[0].url}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="25vw"
                        />
                      </div>
                      <p className="text-center text-sm">{item.name}</p>
                    </motion.div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </motion.section>
      )}
    </div>
  );
}