"use client";

import Image from "next/image";
import { useState, useMemo, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ChevronDown, MessageCircle, Loader2, ShoppingCart, Calendar as CalendarIcon } from "lucide-react";
import { format, addDays, subDays, isAfter, isBefore, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

import { formatter, cn } from "@/lib/utils";
import useCart from "@/hooks/use-cart";
import { siteConfig } from "@/lib/site-config";
import { calcularFrete } from "@/actions/correios";
import { toast } from "sonner";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { countries } from "@/lib/countries";
import { FaWhatsapp } from "react-icons/fa";
import { Progress } from "@/components/ui/progress";

interface CartClientProps {
  user: {
    name: string;  
    email: string;
  };
  searchParams?: {
    success?: string;
    canceled?: string;
    orderId?: string;
  };
}

export default function CartClient({ user, searchParams }: CartClientProps) {
  const cart = useCart();
  const router = useRouter();

  // Obter o primeiro CEP dos itens do carrinho (se disponível)
  const cepFromCart = cart.items.length > 0 && cart.items[0].cep ? cart.items[0].cep : "";
  
  const [cepDestino, setCepDestino] = useState(cepFromCart);
  const [pais, setPais] = useState("Brasil");
  const [fretes, setFretes] = useState<
    { id: string; name: string; price: number; delivery_time: number }[]
  >([]);
  const [freteSelecionado, setFreteSelecionado] = useState<null | {
    price: number;
    name: string;
    delivery_time: number;
  }>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [cupomValido, setCupomValido] = useState<null | {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
}>(null);
  const [isPending, startTransition] = useTransition();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // Tratar parâmetros de sucesso/cancelamento do pagamento
  useEffect(() => {
    if (searchParams?.success === "1") {
      // Limpar o carrinho após pagamento bem-sucedido
      cart.removeAll();
      
      // Redirecionar para página de agradecimento com orderId
      if (searchParams.orderId) {
        // Usar window.location.replace para evitar loops de navegação
        window.location.replace(`/order/${searchParams.orderId}`);
      } else {
        toast.success("Pagamento realizado com sucesso!", {
          description: "Seu pedido foi confirmado",
          duration: 5000,
        });
        
        // Redirecionar para página de pedidos após alguns segundos
        setTimeout(() => {
          window.location.replace("/profile/orders");
        }, 3000);
      }
    } else if (searchParams?.canceled === "1") {
      toast.error("Pagamento cancelado", {
        description: "Você pode tentar novamente ou escolher outro método de pagamento",
        duration: 5000,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  
  // Estados para o modal de data
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDateForItem, setSelectedDateForItem] = useState<Date>();
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [itemsWithoutDate, setItemsWithoutDate] = useState<typeof cart.items>([]);
  const [itemSchedules, setItemSchedules] = useState<Array<{
    id: string;
    eventDate: Date;
    contractType: "SALE" | "RENTAL";
  }>>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  // Buscar fretes automaticamente quando houver CEP no carrinho
  useEffect(() => {
    const buscarFretesAuto = () => {
      if (!cepDestino || cart.items.length === 0) return;

      const quantidade = cart.items.length;
      const isInternacional = cepDestino.length < 8 || /\D/.test(cepDestino);

      const args = {
        sCepOrigem: "85812011",
        sCepDestino: cepDestino.replace("-", ""),
        quantidade,
        ...(isInternacional && { paisDestino: pais })
      };

      startTransition(async () => {
        try {
          const result = await calcularFrete(args);

          if (!Array.isArray(result)) {
            setFretes([]);
            return;
          }

          const servicos = result.map((s) => ({
            id: s.id,
            name: s.name,
            price: parseFloat(s.price.toFixed(2)),
            delivery_time: s.delivery_time,
          }));

          setFretes(servicos);
        } catch (error) {
          setFretes([]);
        }
      });
    };

    if (cepFromCart && cart.items.length > 0 && cepDestino) {
      // Pequeno delay para evitar múltiplas chamadas
      const timeoutId = setTimeout(() => {
        buscarFretesAuto();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [cepFromCart, cart.items.length, cepDestino, pais]);

  // Atualizar CEP quando o carrinho mudar
  useEffect(() => {
    const novoCep = cart.items.length > 0 && cart.items[0].cep ? cart.items[0].cep : "";
    if (novoCep && novoCep !== cepDestino) {
      setCepDestino(novoCep);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.items]);

  

  const subtotal = useMemo(
    () => cart.items.reduce((acc, item) => acc + item.cartPrice, 0),
    [cart.items]
  );

  // Verificar se há frete já calculado nos itens do carrinho
  const freteFromCart = useMemo(() => {
    if (cart.items.length > 0 && cart.items[0].shippingPrice !== undefined) {
      return cart.items[0].shippingPrice;
    }
    return 0;
  }, [cart.items]);

  const discount = promoApplied && cupomValido
  ? cupomValido.discountType === "percentage"
    ? subtotal * (cupomValido.discountValue / 100) 
    : cupomValido.discountValue
  : 0;
  
  // Usar o frete do carrinho se disponível, caso contrário usar o selecionado
  const deliveryCost = freteSelecionado?.price || freteFromCart;
  const total = subtotal - discount + deliveryCost;

  // Função para buscar schedules de um produto
  const fetchProductSchedules = async (productId: string) => {
    setLoadingSchedules(true);
    try {
      const response = await fetch(`/api/products/${productId}/schedules`);
      if (response.ok) {
        const schedules = await response.json();
        setItemSchedules(schedules.map((schedule: any) => ({
          id: schedule.id,
          eventDate: new Date(schedule.eventDate || schedule.deliveryDate),
          contractType: schedule.type === "SALE" || schedule.type === "ClothingSALE" ? "SALE" as const : "RENTAL" as const
        })));
      } else {
        // Fallback - buscar schedules via contracts
        const contractsResponse = await fetch(`/api/contracts/by-product/${productId}`);
        if (contractsResponse.ok) {
          const contracts = await contractsResponse.json();
          setItemSchedules(contracts.map((contract: any) => ({
            id: contract.id,
            eventDate: new Date(contract.eventDate || contract.deliveryDate),
            contractType: contract.type === "SALE" || contract.type === "ClothingSALE" ? "SALE" as const : "RENTAL" as const
          })));
        } else {
          setItemSchedules([]);
        }
      }
    } catch (error) {
      setItemSchedules([]);
    } finally {
      setLoadingSchedules(false);
    }
  };

  // Função para verificar se uma data está disponível (baseada no ProductClient)
  const isDateAvailable = (date: Date, contractType: "SALE" | "RENTAL") => {
    const today = new Date();
    const shippingDays = freteSelecionado?.delivery_time || 3; // Usar tempo do frete selecionado ou padrão
    
    // Não permitir datas no passado
    if (isBefore(date, today)) return false;
    
    // Verificar se a data mínima de envio é respeitada
    const minDate = addDays(today, shippingDays);
    if (isBefore(date, minDate)) return false;
    
    // Para vendas, verificar se há agendamentos que impedem a venda
    if (contractType === "SALE") {
      // Encontrar a última data agendada (qualquer tipo de contrato)
      const lastSchedule = itemSchedules
        .sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime())[0];
      
      if (lastSchedule) {
        // A última data + tempo de entrega + 3 dias é quando o produto estará disponível para venda
        const availableFromDate = addDays(lastSchedule.eventDate, shippingDays + 3);
        if (isBefore(date, availableFromDate)) {
          return false;
        }
      }
    }
    
    // Para aluguéis, verificar conflitos com outros eventos
    if (contractType === "RENTAL") {
      // Período que o produto ficará ocupado para o aluguel atual
      const rentalStart = subDays(date, 3 + shippingDays); // 3 dias antes + tempo de envio para preparação
      const rentalEnd = addDays(date, 3); // 3 dias após o evento para limpeza/retorno
      
      // Verificar conflitos com outros aluguéis
      for (const schedule of itemSchedules) {
        if (schedule.contractType === "RENTAL") {
          // Período ocupado pelo aluguel existente
          const existingRentalStart = subDays(schedule.eventDate, 3 + shippingDays);
          const existingRentalEnd = addDays(schedule.eventDate, 3);
          
          // Verificar se há sobreposição de períodos
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
          
          // Verificar se o aluguel atual engloba completamente o existente
          if (
            (isBefore(rentalStart, existingRentalStart) || isSameDay(rentalStart, existingRentalStart)) &&
            (isAfter(rentalEnd, existingRentalEnd) || isSameDay(rentalEnd, existingRentalEnd))
          ) {
            return false;
          }
        }
      }
      
      // Verificar conflitos com vendas
      for (const schedule of itemSchedules) {
        if (schedule.contractType === "SALE") {
          const saleDeliveryDate = addDays(schedule.eventDate, shippingDays);
          
          // Se a venda for entregue durante o período de preparação ou execução do aluguel, há conflito
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


  const formatPrice = (value: number) => formatter.format(value);

  // Função para gerar mensagem do WhatsApp
  const generateWhatsAppMessage = () => {
    if (cart.items.length === 0) return "";
    
    let message = "Olá! Gostaria de finalizar meu pedido pelo WhatsApp:\n\n";
    message += "📋 *ITENS DO CARRINHO:*\n";
    
    cart.items.forEach((item, index) => {
      const tipoContrato = item.contractType === "RENTAL" ? "Aluguel" : "Venda";
      message += `${index + 1}. *${item.name}*\n`;
      message += `   - Código: ${item.sku || item.id}\n`;
      message += `   - Tipo: ${tipoContrato}\n`;
      message += `   - Cor: ${item.color.name}\n`;
      message += `   - Tamanho: ${item.size.name}\n`;
      message += `   - Preço: ${formatPrice(item.cartPrice)}\n`;
      if (item.contractType === "RENTAL") {
        message += `   - Preço original: ${formatPrice(item.price)}\n`;
      }
      // Adicionar informações de data e CEP se disponíveis
      if (item.eventDate) {
        const dateLabel = item.contractType === "RENTAL" ? "Data do evento" : "Data de entrega";
        message += `   - ${dateLabel}: ${format(item.eventDate, "dd/MM/yyyy", { locale: ptBR })}\n`;
      }
      if (item.cep) {
        message += `   - CEP: ${item.cep}\n`;
      }
      message += "\n";
    });
    
    message += `💰 *RESUMO:*\n`;
    message += `Subtotal: ${formatPrice(subtotal)}\n`;
    if (discount > 0) {
      message += `Desconto: -${formatPrice(discount)}\n`;
    }
    if (deliveryCost > 0) {
      message += `Entrega: ${formatPrice(deliveryCost)}\n`;
    }
    message += `*Total: ${formatPrice(total)}*\n\n`;
    
    if (freteSelecionado) {
      message += `🚚 *ENTREGA:*\n`;
      message += `${freteSelecionado.name} - ${freteSelecionado.delivery_time} dias úteis\n`;
      message += `CEP: ${cepDestino}\n\n`;
    } else if (cepDestino) {
      message += `🚚 *ENTREGA:*\n`;
      message += `CEP: ${cepDestino}\n\n`;
    }
    
    message += "Aguardo retorno para finalizar o pedido! 😊";
    
    return encodeURIComponent(message);
  };

  const handleWhatsAppRedirect = () => {
    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/${siteConfig.whatsapp.number}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

const handleApplyPromo = async () => {
  if (!promoCode.trim()) return;

  try {
    const res = await fetch(`/api/coupons?code=${promoCode}`);
    
    if (!res.ok) {
      const errorText = await res.text();
      if (res.status === 404) {
        alert("Cupom não encontrado.");
      } else if (res.status === 400) {
        alert(errorText || "Cupom expirado ou limite atingido.");
      } else {
        alert("Cupom inválido.");
      }
      return;
    }

    const cupom = await res.json();

    setCupomValido({
      id: cupom.id,
      code: cupom.code,
      discountType: cupom.discountType,
      discountValue: parseFloat(cupom.discountValue),
    });

    setPromoApplied(true);
    alert(`Cupom "${cupom.code}" aplicado com sucesso!`);
  } catch (err) {
    alert("Erro ao processar cupom. Tente novamente.");
    setPromoApplied(false);
    setCupomValido(null);
  }
};
  const buscarFretes = () => {
    if (!cepDestino || cart.items.length === 0) return;

    const quantidade = cart.items.length;
    const isInternacional = cepDestino.length < 8 || /\D/.test(cepDestino);

    const args = {
      sCepOrigem: "85812011",
      sCepDestino: cepDestino.replace("-", ""),
      quantidade,
      ...(isInternacional && { paisDestino: pais })
    };

    startTransition(async () => {
      try {
        const result = await calcularFrete(args);

        if (!Array.isArray(result)) {
          setFretes([]);
          return;
        }

        const servicos = result.map((s) => ({
          id: s.id,
          name: s.name,
          price: parseFloat(s.price.toFixed(2)),
          delivery_time: s.delivery_time,
        }));

        setFretes(servicos);
      } catch (error) {
        setFretes([]);
      }
    });
  };

  const finalizarCompra = async () => {
    // Verificar se todos os itens têm data definida
    const itemsSemData = cart.items.filter(item => !item.eventDate);
    
    if (itemsSemData.length > 0) {
      // Se houver itens sem data, configurar para abrir modal sequencialmente
      setItemsWithoutDate(itemsSemData);
      setCurrentItemIndex(0);
      const firstItemWithoutDate = itemsSemData[0];
      await fetchProductSchedules(firstItemWithoutDate.id);
      setShowDateModal(true);
      return;
    }

    // Verificar se há frete definido (selecionado ou já calculado nos itens)
    if (!freteSelecionado && freteFromCart === 0) {
      toast.error("Calcule o frete antes de finalizar a compra");
      return;
    }

    setIsCheckingOut(true);
    setLoadingStep(0);

    try {
      let buyer;

      // Passo 1: Validando informações
      setLoadingStep(1);
      await new Promise(resolve => setTimeout(resolve, 800)); // Simular delay para UX

      // 1. Criação ou obtenção do comprador
      const buyerRes = await fetch("/api/buyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: user.name,
          email: user.email,
          phone: "00000000000",
          address: "Rua Exemplo",
          city: "Cidade",
          state: "UF",
          neighborhood: "Bairro",
          number: "123",
          cep: cepDestino,
          document: "00000000000",
          complement: "Complemento",
        }),
      });

      if (buyerRes.status === 409) {
        const existingBuyer = await fetch(`/api/buyers?email=${user.email}`);
        if (!existingBuyer.ok) throw new Error("Erro ao buscar comprador existente");
        buyer = await existingBuyer.json();
      } else if (!buyerRes.ok) {
        const error = await buyerRes.text();
        throw new Error("Erro ao criar comprador: " + error);
      } else {
        buyer = await buyerRes.json();
      }

      // Passo 2: Criando pedido
      setLoadingStep(2);
      await new Promise(resolve => setTimeout(resolve, 500));
const orderRes = await fetch("/api/orders", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    buyer,
    order: {
      isPaid: false,
      paymentMethod: "N/S",
      installments: 1,
      status: "PENDING",
      totalAmount: Number(total.toFixed(2)),
      shippingMethod: freteSelecionado?.name || "Calculado no produto",
      shippingCost: Number((freteSelecionado?.price || freteFromCart).toFixed(2)),
      shippingTime: freteSelecionado?.delivery_time || 3,
      eventDate: cart.items[0]?.eventDate || null,
      couponId: cupomValido?.id || null,
    },
    orderItems: cart.items.map((item) => {
      // USAR DIRETAMENTE O CARTPRICE - não recalcular!
      const unitPrice = Number(item.cartPrice);

      return {
        productId: item.id,
        quantity: 1,
        type: item.contractType,
        unitPrice: Number(unitPrice.toFixed(2)),
        subtotal: Number(unitPrice.toFixed(2)),
      };
    }),
  }),
});

      if (!orderRes.ok) {
        const error = await orderRes.text();
        throw new Error("Erro ao criar pedido: " + error);
      }

      const order = await orderRes.json();

      // Passo 3: Preparando checkout
      setLoadingStep(3);
      await new Promise(resolve => setTimeout(resolve, 500));

      cart.removeAll();
      
      // Notificação de sucesso
      toast.success("Pedido criado com sucesso!", {
        description: "Redirecionando para o checkout...",
        duration: 2000,
      });
      
      router.push(`/cart/checkout/${order.id}`);
    } catch (error) {
      // Notificação de erro
      toast.error("Erro ao processar pedido", {
        description: "Verifique os dados e tente novamente.",
        duration: 4000,
      });
      
    } finally {
      setIsCheckingOut(false);
      setLoadingStep(0);
    }
  };

  // Função para confirmar a data selecionada no modal
  const confirmarDataSelecionada = async () => {
    if (!selectedDateForItem) return;
    
    // Atualizar o item atual com a data selecionada
    const currentItem = itemsWithoutDate[currentItemIndex];
    if (currentItem) {
      cart.updateItemDate(currentItem.id, currentItem.contractType, selectedDateForItem);
    }
    
    // Limpar a data selecionada
    setSelectedDateForItem(undefined);
    
    // Verificar se há mais itens sem data
    const nextIndex = currentItemIndex + 1;
    if (nextIndex < itemsWithoutDate.length) {
      // Há mais itens, processar o próximo
      setCurrentItemIndex(nextIndex);
      const nextItem = itemsWithoutDate[nextIndex];
      await fetchProductSchedules(nextItem.id);
      // Modal permanece aberto para o próximo item
    } else {
      // Todos os itens têm data agora, fechar modal e tentar finalizar
      setShowDateModal(false);
      setCurrentItemIndex(0);
      setItemsWithoutDate([]);
      
      // Tentar finalizar compra novamente
      setTimeout(() => {
        finalizarCompra();
      }, 100);
    }
  };

  return (
    <>
      {/* Loading Overlay */}
      {isCheckingOut  && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-background rounded-2xl p-8 max-w-md w-full mx-4 text-center border border-muted">
            
            <h2 className="text-xl font-semibold mb-2">Processando seu pedido</h2>
            <p className="text-foreground mb-6">
              Estamos criando seu pedido e preparando tudo para você. 
              Por favor, não feche esta página.
            </p>
            
            <div className="relative w-full mb-8">
              <div className="w-full rounded-full h-2 mb-4">
                <Progress className="transition-all duration-500 ease-in-out" value={(loadingStep / 3) * 100}  />
              </div>
              <div 
                className="absolute top-0 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-in-out"
                style={{ left: `${(loadingStep / 3) * 100}%` }}
              >
                <div className="bg-primary rounded-full p-2">
                  <ShoppingCart className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
            </div>
            
            {/* Loading Steps */}
            <div className="space-y-3 text-sm text-left">
              <div className={`flex items-center gap-3 ${loadingStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-3 h-3 rounded-full ${loadingStep >= 1 ? 'bg-primary' : 'bg-background'} 
                  ${loadingStep === 1 ? 'animate-pulse' : ''}`} />
                <span className={loadingStep >= 1 ? 'font-medium' : ''}>
                  Validando informações do pedido
                </span>
                {loadingStep > 1 && (
                  <Check className="w-4 h-4 text-emerald-500 ml-auto" />
                )}
              </div>
              
              <div className={`flex items-center gap-3 ${loadingStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-3 h-3 rounded-full ${loadingStep >= 2 ? 'bg-primary' : 'bg-background'} 
                  ${loadingStep === 2 ? 'animate-pulse' : ''}`} />
                <span className={loadingStep >= 2 ? 'font-medium' : ''}>
                  Criando pedido no sistema
                </span>
                {loadingStep > 2 && (
                  <Check className="w-4 h-4 text-emerald-500 ml-auto" />
                )}
              </div>
              
              <div className={`flex items-center gap-3 ${loadingStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-3 h-3 rounded-full ${loadingStep >= 3 ? 'bg-primary' : 'bg-background'} 
                  ${loadingStep === 3 ? 'animate-pulse' : ''}`} />
                <span className={loadingStep >= 3 ? 'font-medium' : ''}>
                  Preparando página de checkout
                </span>
                {loadingStep > 3 && (
                  <Check className="w-4 h-4 text-emerald-500 ml-auto" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-25 m-5">{/* Resto do componente continua igual */}
         {/* Cart items */}
         <section className="lg:col-span-8 space-y-4 border rounded-2xl p-4">
           <h2 className="text-lg font-bold">Carrinho</h2>
           {cart.items.length === 0 && (
             <p className="text-muted-foreground text-center mt-40">Seu carrinho está vazio.</p>
           )}
           {cart.items.map((item) => (
             <div key={`${item.id}-${item.contractType}`} className=" grid sm:flex  items-start gap-4 p-4 border rounded-lg">
               <div className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden">
                 <Image
                   src={item.images[0].url}
                   alt={item.name}
                   fill
                   className="object-cover"
                 />
               </div>
               <div className="flex-1 space-y-1">
                 <div className="flex justify-between items-start">
                   <div>
                     <p className="font-medium">{item.name}</p>
                     <p className="text-sm text-muted-foreground">
                       {item.color.name} • {item.size.name}
                     </p>
                     <span className={cn(
                       "inline-block px-2 py-1 rounded-full text-xs font-medium",
                       item.contractType === "RENTAL" 
                         ? "bg-orange-100 text-orange-800" 
                         : "bg-green-100 text-green-800"
                     )}>
                       {item.contractType === "RENTAL" ? "Aluguel" : "Venda"}
                     </span>
                     {/* Mostrar informações adicionais do item */}
                     {item.eventDate && (
                       <p className="text-xs text-muted-foreground mt-1">
                         {item.contractType === "RENTAL" ? "Evento" : "Entrega"}: {format(item.eventDate, "dd/MM/yyyy", { locale: ptBR })}
                       </p>
                     )}
                     {item.cep && (
                       <p className="text-xs text-muted-foreground">
                         CEP: {item.cep}
                       </p>
                     )}
                     {item.shippingPrice !== undefined && item.shippingPrice > 0 && (
                       <p className="text-xs text-muted-foreground">
                         Frete: {formatPrice(item.shippingPrice)}
                       </p>
                     )}
                   </div>
                   <div className="text-right">
                     <span className="font-semibold">{formatPrice(item.cartPrice)}</span>
                     {item.contractType === "RENTAL" && (
                       <p className="text-xs text-muted-foreground line-through">
                         {formatPrice(item.price)}
                       </p>
                     )}
                     {item.totalPrice && item.totalPrice !== item.cartPrice && (
                       <p className="text-xs font-medium text-primary">
                         Total: {formatPrice(item.totalPrice)}
                       </p>
                     )}
                   </div>
                 </div>
                 <div className="flex gap-4 text-sm mt-2">
                   <button onClick={() => {}} className="text-primary underline">
                     Salvar
                   </button>
                   <button
                     onClick={() => cart.removeItem(item.id, item.contractType)}
                     className="text-destructive underline"
                   >
                     Remover
                   </button>
                 </div>
               </div>
             </div>
           ))}
         </section>
   
         {/* Summary */}
         <aside className="lg:col-span-4 space-y-6 border rounded-2xl p-4">
           <h2 className="text-lg font-semibold">Resumo</h2>
   
           {/* Entrega */}
           <div className="space-y-2">
             <h3 className="font-medium">Entrega</h3>
             
   
             {/* Popover de País */}
             <Popover>
               <PopoverTrigger asChild>
                 <Button
                   variant="outline"
                   role="combobox"
                   className="w-full justify-between"
                 >
                   {pais} <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                 </Button>
               </PopoverTrigger>
               <PopoverContent className="w-full p-0">
                 <Command>
                   <CommandInput placeholder="Buscar país..." className="h-9" />
                   <CommandList>
                     {countries.map((c) => (
                       <CommandItem
                         key={c}
                         value={c}
                         onSelect={() => setPais(c)}
                       >
                         {c}
                         {pais === c ? (
                           <Check className="ml-auto h-4 w-4" />
                         ) : null}
                       </CommandItem>
                     ))}
                   </CommandList>
                 </Command>
               </PopoverContent>
             </Popover>
   
             {/* Campo de CEP */}
             <div className="flex gap-2">
               <input
                 type="text"
                 placeholder="Digite o CEP ou ZIP"
                 value={cepDestino}
                 onChange={(e) => setCepDestino(e.target.value)}
                 className="flex-1 border rounded-lg px-3 py-2 text-sm"
               />
               <button
                 onClick={buscarFretes}
                 className="px-4 py-2 border rounded-lg text-sm"
               >
                 Buscar
               </button>
             </div>
   
             {isPending && (
               <p className="text-sm text-muted-foreground">Buscando fretes...</p>
             )}
   
             {fretes.length > 0 && (
               <div className="space-y-2 mt-2">
                 {fretes.map((frete) => (
                   <button
                     key={frete.id}
                     onClick={() =>
                       setFreteSelecionado({
                         price: frete.price,
                         name: frete.name,
                         delivery_time: frete.delivery_time,
                       })
                     }
                     className={cn(
                       "w-full text-left px-3 py-2 border rounded-lg text-sm",
                       freteSelecionado?.name === frete.name
                         ? "border-primary font-medium"
                         : "border-muted"
                     )}
                   >
                     {frete.name} - R$ {frete.price.toFixed(2)} ({frete.delivery_time} dias úteis)
                   </button>
                 ))}
               </div>
             )}
   
             {freteSelecionado && (
               <p className="text-sm text-muted-foreground">
                 Selecionado: {freteSelecionado.name} –{" "}
                 {formatPrice(freteSelecionado.price)} ({freteSelecionado.delivery_time} dias úteis)
               </p>
             )}
             
             {freteFromCart > 0 && !freteSelecionado && (
               <p className="text-sm text-green-600">
                 Frete já calculado: {formatPrice(freteFromCart)}
               </p>
             )}
           </div>
   
           {/* Cupom */}
           <div className="space-y-2">
             <h3 className="font-medium">Cupom</h3>
             <div className="flex gap-2">
               <input
                 type="text"
                 value={promoCode}
                 onChange={(e) => setPromoCode(e.target.value)}
                 placeholder="Digite o cupom"
                 className="flex-1 border rounded-lg px-3 py-2 text-sm"
               />
               <button
                 onClick={handleApplyPromo}
                 className="px-4 py-2 border rounded-lg text-sm"
               >
                 Aplicar
               </button>
             </div>
             {promoApplied && cupomValido && (
  <p className="text-xs text-emerald-600">
    {cupomValido.discountType === "percentage"
      ? `${cupomValido.discountValue}% de desconto aplicado!`
      : `Desconto de ${formatPrice(cupomValido.discountValue)} aplicado!`}
  </p>
)}
           </div>
   
           {/* Totais */}
           <div className="space-y-1 text-sm">
             <div className="flex justify-between">
               <span>Subtotal</span>
               <span>{formatPrice(subtotal)}</span>
             </div>
             <div className="flex justify-between">
               <span>Desconto</span>
               <span>-{formatPrice(discount)}</span>
             </div>
             <div className="flex justify-between">
               <span>Entrega</span>
               <span>{formatPrice(deliveryCost)}</span>
             </div>
             <div className="flex justify-between font-semibold pt-2 border-t mt-2">
               <span>Total</span>
               <span>{formatPrice(total)}</span>
             </div>
           </div>
   
           {/* Ações */}
           <div>
             <Button
              onClick={finalizarCompra}
              disabled={cart.items.length === 0 || (!freteSelecionado && freteFromCart === 0) || isCheckingOut}
              className="w-full py-3 rounded-lg bg-primary disabled:opacity-50 mb-2"
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando pedido...
                </>
              ) : cart.items.length === 0 ? (
                "Carrinho vazio"
              ) : !freteSelecionado && freteFromCart === 0 ? (
                "Calcule o frete"
              ) : cart.items.some(item => !item.eventDate) ? (
                "Selecionar datas"
              ) : (
                "Finalizar compra"
              )}
            </Button>            
             
             {/* Botão WhatsApp */}
             <Button
               onClick={handleWhatsAppRedirect}
               disabled={cart.items.length === 0 || isCheckingOut}
               variant="outline"
               className="w-full py-3 rounded-lg border border-green-500 text-green-600 hover:bg-green-50 disabled:opacity-50 mb-2"
             >
               <FaWhatsapp className="w-4 h-4 mr-2" />
               Continuar pelo WhatsApp
             </Button>
             
             <Link href="/products">
             <Button 
               variant={"outline"} 
               className="w-full py-3 rounded-lg border" 
               disabled={isCheckingOut}
             > 
               Continuar comprando 
             </Button>
             </Link>
           </div>
         </aside>
       </div>
       
       {/* Modal de Seleção de Data */}
       <Dialog open={showDateModal} onOpenChange={setShowDateModal}>
         <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <DialogTitle>
               Selecione a Data ({currentItemIndex + 1} de {itemsWithoutDate.length})
             </DialogTitle>
             <DialogDescription>
               {itemsWithoutDate[currentItemIndex] && (
                 <>
                   Selecione a data de {itemsWithoutDate[currentItemIndex].contractType === "RENTAL" ? "evento" : "entrega"} para o produto{" "}
                   <strong>{itemsWithoutDate[currentItemIndex].name}</strong>
                 </>
               )}
             </DialogDescription>
           </DialogHeader>
           
           <div className="space-y-4">
             {loadingSchedules ? (
               <div className="flex items-center justify-center py-8">
                 <Loader2 className="w-6 h-6 animate-spin" />
                 <span className="ml-2">Carregando disponibilidade...</span>
               </div>
             ) : (
               <>
                 <div className="space-y-2">
                   <Label>Data de {itemsWithoutDate[currentItemIndex]?.contractType === "RENTAL" ? "Evento" : "Entrega"}</Label>
                   <Popover>
                     <PopoverTrigger asChild>
                       <Button
                         variant="outline"
                         className={cn(
                           "w-full justify-start text-left font-normal",
                           !selectedDateForItem && "text-muted-foreground"
                         )}
                       >
                         <CalendarIcon className="mr-2 h-4 w-4" />
                         {selectedDateForItem ? (
                           format(selectedDateForItem, "PPP", { locale: ptBR })
                         ) : (
                           "Selecione uma data"
                         )}
                       </Button>
                     </PopoverTrigger>
                     <PopoverContent className="w-auto p-0" align="start">
                       <Calendar
                         mode="single"
                         selected={selectedDateForItem}
                         onSelect={setSelectedDateForItem}
                         disabled={(date) => {
                           const currentItem = itemsWithoutDate[currentItemIndex];
                           return currentItem ? !isDateAvailable(date, currentItem.contractType) : true;
                         }}
                         initialFocus
                       />
                     </PopoverContent>
                   </Popover>
                   
                   {itemsWithoutDate[currentItemIndex]?.contractType === "RENTAL" && selectedDateForItem && (
                     <p className="text-sm text-muted-foreground">
                       Período de uso: {format(subDays(selectedDateForItem, 3), "dd/MM", { locale: ptBR })} a {format(addDays(selectedDateForItem, 3), "dd/MM", { locale: ptBR })}
                     </p>
                   )}
                 </div>
                 
                 <div className="flex gap-2 pt-4">
                   <Button
                     variant="outline"
                     onClick={() => {
                       setShowDateModal(false);
                       setCurrentItemIndex(0);
                       setItemsWithoutDate([]);
                       setSelectedDateForItem(undefined);
                     }}
                     className="flex-1"
                   >
                     Cancelar
                   </Button>
                   <Button
                     onClick={confirmarDataSelecionada}
                     disabled={!selectedDateForItem}
                     className="flex-1"
                   >
                     {currentItemIndex + 1 < itemsWithoutDate.length ? "Próximo Item" : "Finalizar"}
                   </Button>
                 </div>
               </>
             )}
           </div>
         </DialogContent>
       </Dialog>
    </>
  );
}
