'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { CalendarIcon } from 'lucide-react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format, addDays, subDays, isAfter, isBefore, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn, formatter } from '@/lib/utils';
import { formatPrice } from '@/lib/format';
import useCart from '@/hooks/use-cart';
import { toast } from '@/hooks/use-toast';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from 'zod';
import { cpfCnpjSchema } from '@/schemas/validationSchema';


const formSchema = z.object({
  fullName: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(8, "Telefone inválido"),
  address: z.string().min(1, "Rua é obrigatória"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(1, "Estado é obrigatório"),
  cep: z.string().min(8, "CEP inválido").max(9, "CEP inválido"),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  document: z.object({
    cpfCnpj: cpfCnpjSchema,
  }),
});

interface Schedule {
  id: string;
  startDate: Date;
  endDate: Date;
  type: 'PRODUCT_BLOCK' | 'CLIENT_APPOINTMENT';
  productId: string | null;
}

type ProductData = {
  id: string;
  sku: string;
  name: string;
  price: number;
  images: string[];
  color: {
    name: string;
    value: string;
  };
  size: {
    name: string;
    value: string;
  };
  rentalValue?: number;
  isOnlyRental?: boolean;
};

type OrderItemData = {
  quantity: number;
  unitPrice: number;
  type: 'SALE' | 'RENTAL';
  product: ProductData;
}; 

type BuyerData = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  cep?: string | null;
  document?: { cpfCnpj?: string };
};

type coupon = {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  isActive?: boolean;
};

export type OrderData = {
  id: string;
  buyer: BuyerData;
  orderItems: OrderItemData[];
  sku: string;
  totalAmount: number;
  shippingMethod?: string | null;
  shippingCost?: number | null;
  shippingTime?: number | null;
  eventDate?: Date | null;
  coupon: coupon | null;
  schedules?: Schedule[];
  status?: string;
};

interface CheckoutClientFormProps {
  order: OrderData;
}

type FormValues = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  document: { cpfCnpj: string };
};

const CheckoutClientForm: React.FC<CheckoutClientFormProps> = ({ order }) => {
  // Máscara privativa para telefone: (**)****-1234
  // (definição única abaixo)
  // Estado para alternar exibição privativa
  const [showPhone, setShowPhone] = useState(false);
  const [showCpf, setShowCpf] = useState(false);
  // Estado para exibir máscara visual sem alterar valor salvo
  const [phoneDisplay, setPhoneDisplay] = useState('');
  const [cpfDisplay, setCpfDisplay] = useState('');
  const cart = useCart();
  // Funções de máscara
  const formatPhone = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 3) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
    }
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`;
  };
  // Máscara privativa para telefone: (**)****-1234
  const maskPhonePrivate = (value: string) => {
    if (!value) return value;
    const phone = value.replace(/[^\d]/g, '');
    if (phone.length < 8) return value;
    return `(**)****-${phone.slice(-4)}`;
  };
  // Máscara privativa para CPF/CNPJ
  const maskCPFPrivate = (value: string) => {
    if (!value) return value;
    const cpf = value.replace(/[^\d]/g, '');
    if (cpf.length === 11) {
      return `${cpf.slice(0,3)}.***.***-${cpf.slice(-2)}`;
    }
    if (cpf.length === 14) {
      return `${cpf.slice(0,2)}.***.***/${cpf.slice(8,12)}-${cpf.slice(-2)}`;
    }
    return value;
  };

  const formatCPF = (value: string) => {
    if (!value) return value;
    const cpf = value.replace(/[^\d]/g, '');
    if (cpf.length <= 11) {
      return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    // CNPJ
    return cpf.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    setValue('phone', raw);
    setPhoneDisplay(formatPhone(raw));
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    setValue('document.cpfCnpj', raw);
    setCpfDisplay(formatCPF(raw));
  };

  // Verificar se todos os itens do carrinho já têm eventDate
  const cartItems = cart.items;
  const allItemsHaveEventDate = cartItems.length > 0 && cartItems.every(item => item.eventDate);

  // Verificar se a order já tem eventDate (vem do banco de dados)
  const orderHasEventDate = order.eventDate !== null && order.eventDate !== undefined;

  // react-hook-form + zod
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: order.buyer.fullName,
      email: order.buyer.email,
      phone: order.buyer.phone || '',
      city: order.buyer.city || '',
      cep: order.buyer.cep || '',
      state: order.buyer.state || '',
      address: order.buyer.address || '',
      number: order.buyer.number || '',
      complement: order.buyer.complement || '',
      neighborhood: order.buyer.neighborhood || '',
      document: { cpfCnpj: order.buyer.document?.cpfCnpj || "" },
    },
  });

  // State para data - usar da order primeiro, depois do carrinho
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(() => {
    if (orderHasEventDate) {
      return new Date(order.eventDate!);
    }
    if (allItemsHaveEventDate && cartItems[0]?.eventDate) {
      return new Date(cartItems[0].eventDate);
    }
    return undefined;
  });
  const [note, setNote] = useState('');
  const [shippingDays, setShippingDays] = useState(order.shippingTime || 3);
  const [isLoading, setIsLoading] = useState(false);

  // State para controlar mudanças nos OrderItems - usar dados do carrinho se disponível
  const [orderItems, setOrderItems] = useState(() => {
    if (cartItems.length > 0) {
      // Mapear itens do carrinho para orderItems com os tipos corretos
      return cartItems.map(cartItem => ({
        quantity: 1,
        unitPrice: cartItem.cartPrice,
        type: cartItem.contractType,
        product: {
          id: cartItem.id,
          sku: cartItem.sku || '',
          name: cartItem.name,
          price: cartItem.price,
          images: cartItem.images.map(img => img.url),
          color: cartItem.color,
          size: cartItem.size,
        }
      }));
    }
    // Se não há itens no carrinho, usar dados da order do banco
    // Verificar se os unitPrice estão corretos para aluguéis
    return order.orderItems.map(item => ({
      ...item,
      unitPrice: item.type === 'RENTAL' && item.unitPrice === item.product.price 
        ? (item.product.rentalValue !== undefined && item.product.rentalValue !== null 
           ? item.product.rentalValue 
           : item.product.price / 2)
        : item.unitPrice
    }));
  });

  // Sincroniza exibição da máscara visual com valor salvo
  useEffect(() => {
    setPhoneDisplay(showPhone ? formatPhone(getValues('phone')) : maskPhonePrivate(getValues('phone')));
    setCpfDisplay(showCpf ? formatCPF(getValues('document.cpfCnpj')) : maskCPFPrivate(getValues('document.cpfCnpj')));
  }, [getValues, showPhone, showCpf]);

  // Sincronizar data com order e carrinho
  useEffect(() => {
    if (orderHasEventDate) {
      setDeliveryDate(new Date(order.eventDate!));
    } else if (allItemsHaveEventDate && cartItems[0]?.eventDate) {
      setDeliveryDate(new Date(cartItems[0].eventDate));
    }

    // Atualizar orderItems com dados do carrinho se disponível
    if (cartItems.length > 0) {
      const updatedOrderItems = cartItems.map(cartItem => ({
        quantity: 1,
        unitPrice: cartItem.cartPrice,
        type: cartItem.contractType,
        product: {
          id: cartItem.id,
          sku: cartItem.sku || '',
          name: cartItem.name,
          price: cartItem.price,
          images: cartItem.images.map(img => img.url),
          color: cartItem.color,
          size: cartItem.size,
        }
      }));
      setOrderItems(updatedOrderItems);
    }
  }, [orderHasEventDate, allItemsHaveEventDate, cartItems, order.eventDate]);

  // Função para verificar se uma data está disponível
  const isDateAvailable = (date: Date, contractType: 'SALE' | 'RENTAL') => {
    const today = new Date();

    // Não permitir datas no passado
    if (isBefore(date, today)) return false;

    // Verificar se a data mínima de envio é respeitada
    const minDate = addDays(today, shippingDays);
    if (isBefore(date, minDate)) return false;

    const schedules = order.schedules || [];

    // Para vendas, verificar se há agendamentos que impedem a venda
    if (contractType === "SALE") {
      // Encontrar a última data agendada (qualquer tipo de contrato)
      const lastSchedule = schedules
        .sort((a, b) => b.endDate.getTime() - a.endDate.getTime())[0];

      if (lastSchedule) {
        // A última data + tempo de entrega + 3 dias é quando o produto estará disponível para venda
        const availableFromDate = addDays(lastSchedule.endDate, shippingDays + 3);
        if (isBefore(date, availableFromDate)) {
          return false;
        }
      }
    }

    // Para aluguéis, verificar conflitos com outros eventos
    if (contractType === "RENTAL") {
      // Período que o produto ficará ocupado para o aluguel atual
      const rentalStart = subDays(date, 3 + shippingDays);
      const rentalEnd = addDays(date, 3);

      // Verificar conflitos com outros aluguéis
      for (const schedule of schedules) {
        // Período ocupado pelo agendamento existente
        const existingStart = schedule.startDate;
        const existingEnd = schedule.endDate;

        // Verificar se há sobreposição de períodos
        if (
          (isAfter(rentalStart, existingStart) || isSameDay(rentalStart, existingStart)) &&
          (isBefore(rentalStart, existingEnd) || isSameDay(rentalStart, existingStart))
        ) {
          return false;
        }

        if (
          (isAfter(rentalEnd, existingStart) || isSameDay(rentalEnd, existingStart)) &&
          (isBefore(rentalEnd, existingEnd) || isSameDay(rentalEnd, existingEnd))
        ) {
          return false;
        }

        // Verificar se o aluguel atual engloba completamente o existente
        if (
          (isBefore(rentalStart, existingStart) || isSameDay(rentalStart, existingStart)) &&
          (isAfter(rentalEnd, existingEnd) || isSameDay(rentalEnd, existingEnd))
        ) {
          return false;
        }
      }
    }

    return true;
  };

  // Submit handler
  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);

      // Primeiro, salvar os dados do usuário no pedido
      const updateResponse = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buyer: {
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            address: data.address,
            number: data.number,
            complement: data.complement,
            neighborhood: data.neighborhood,
            city: data.city,
            state: data.state,
            cep: data.cep,
            document: { cpfCnpj: data.document.cpfCnpj },
          },
          order: {
            eventDate: deliveryDate,
            shippingTime: shippingDays,
            shippingMethod: order.shippingMethod,
            shippingCost: order.shippingCost,
            totalAmount: subtotal + (order.shippingCost ?? 0),
            status: order.status || 'PENDING',
            isPaid: false,
          },
        }),
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('Erro ao atualizar pedido:', errorText);
        throw new Error('Erro ao salvar dados do pedido');
      }

      // Depois, chamar a API de checkout do Stripe
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Erro ao processar pagamento');
      }

      const responseData = await response.json();

      if (responseData.url) {
        window.location = responseData.url;
      } else {
        throw new Error('URL de pagamento não encontrada');
      }
    } catch (error) {
      console.error('Erro no checkout:', error);
      toast({
        title: "Erro no pagamento",
        description: error instanceof Error ? error.message : "Erro inesperado ao processar pagamento",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const baseTotal = orderItems.reduce(
    (acc, item) => acc + item.unitPrice * item.quantity,
    0
  );

  const discount = order.coupon
    ? order.coupon.discountType === 'fixed'
      ? order.coupon.discountValue
      : order.coupon.discountType === 'percentage'
      ? baseTotal * (order.coupon.discountValue / 100)
      : 0
    : 0;

  const subtotal = baseTotal - discount;

  return (
    <div className="bg-background min-h-screen p-6 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={handleSubmit(onSubmit)}>
            <Card className='bg-gradient-to-b from-muted/30 via-background/30 to-background/30 backdrop-blur-md gap-4'>
              <CardHeader>
                <CardTitle>Informações de Entrega</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome Completo</Label>
                  <Input {...register("fullName")} />
                  {errors.fullName && (
                    <span className="text-red-500 text-xs">{errors.fullName.message}</span>
                  )}
                </div>
                <div>
                  <Label>Telefone</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={phoneDisplay}
                      onChange={handlePhoneChange}
                      maxLength={15}
                    />
                    
                  </div>
                  {errors.phone && (
                    <span className="text-red-500 text-xs">{errors.phone.message}</span>
                  )}
                </div>
                <div>
                  <Label>Email</Label>
                  <Input {...register("email")} disabled className="bg-muted" />
                  {errors.email && (
                    <span className="text-red-500 text-xs">{errors.email.message}</span>
                  )}
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input {...register("city")} />
                  {errors.city && (
                    <span className="text-red-500 text-xs">{errors.city.message}</span>
                  )}
                </div>
                <div>
                  <Label>CEP</Label>
                  <Input {...register("cep")} />
                  {errors.cep && (
                    <span className="text-red-500 text-xs">{errors.cep.message}</span>
                  )}
                </div>
                <div>
                  <Label>Estado</Label>
                  <Input {...register("state")} />
                  {errors.state && (
                    <span className="text-red-500 text-xs">{errors.state.message}</span>
                  )}
                </div>
                <div>
                  <Label>Endereço</Label>
                  <Input {...register("address")} />
                  {errors.address && (
                    <span className="text-red-500 text-xs">{errors.address.message}</span>
                  )}
                </div>
                <div>
                  <Label>Número</Label>
                  <Input {...register("number")} />
                  {errors.number && (
                    <span className="text-red-500 text-xs">{errors.number.message}</span>
                  )}
                </div>
                <div>
                  <Label>Bairro</Label>
                  <Input {...register("neighborhood")} />
                  {errors.neighborhood && (
                    <span className="text-red-500 text-xs">{errors.neighborhood.message}</span>
                  )}
                </div>
                <div>
                  <Label>Complemento</Label>
                  <Input {...register("complement")} />
                </div>
                <div className="md:col-span-2">
                  <Label>CPF ou CNPJ</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={cpfDisplay}
                      onChange={handleCPFChange}
                      maxLength={18}
                    />
                    
                  </div>
                  {errors.document?.cpfCnpj && (
                    <span className="text-red-500 text-xs">{errors.document.cpfCnpj.message}</span>
                  )}
                </div>

                {/* Seção de Data - apenas se não foi escolhida anteriormente */}
                {!orderHasEventDate && !allItemsHaveEventDate && !deliveryDate && (
                  <div className="md:col-span-2">
                    <Label>Data de {orderItems.some(item => item.type === 'RENTAL') ? 'Evento' : 'Entrega'}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !deliveryDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {deliveryDate ? (
                            format(deliveryDate, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={deliveryDate}
                          onSelect={setDeliveryDate}
                          disabled={(date) => !isDateAvailable(date, orderItems[0]?.type || 'SALE')}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {deliveryDate && orderItems.some(item => item.type === 'RENTAL') && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Período de uso: {format(subDays(deliveryDate, 3), "dd/MM", { locale: ptBR })} a {format(addDays(deliveryDate, 3), "dd/MM", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                )}

                {/* Mostrar data se já foi escolhida */}
                {(orderHasEventDate || allItemsHaveEventDate || deliveryDate) && (
                  <div className="md:col-span-2">
                    <Label>Data do Evento/Entrega</Label>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">
                        📅 {deliveryDate ? format(deliveryDate, "PPP", { locale: ptBR }) : 'Data não definida'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {orderHasEventDate ? 'Data definida no pedido' : allItemsHaveEventDate ? 'Data selecionada nas telas anteriores' : 'Data selecionada'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="md:col-span-2">
                  <Label>Observações</Label>
                  <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
              </CardContent>
            </Card>
            <Button 
              className="w-full mt-4"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Processando...' : 'Confirmar Pedido e Pagar'}
            </Button>
          </form>
        </div>

        {/* Order Summary */}
        <Card className="h-fit bg-gradient-to-b from-muted/30 via-background/30 to-background/30 backdrop-blur-md gap-4">
          <CardHeader>
            <CardTitle>Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {orderItems.map((item, index) => (
              <div key={item.product.id} className="space-y-3 p-4 border rounded-lg">
                <div className="grid sm:flex items-center gap-4">
                  <div className="relative w-16 h-16">
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">SKU: {item.product.sku}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.product.color.name} • {item.product.size.name}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-medium">{formatPrice(item.unitPrice)}</p>
                    {item.type === 'RENTAL' && (
                      <p className="text-xs text-muted-foreground line-through">
                        {formatPrice(item.product.price)}
                      </p>
                    )}
                    {item.type === 'SALE' && (
                      <p className="text-xs text-muted-foreground">
                        Valor de venda
                      </p>
                    )}
                  </div>
                </div>

                {/* Mostrar apenas o tipo de contrato, sem opção de mudança */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tipo de Contrato</Label>
                  <div className="p-2 bg-muted rounded-md">
                    <span className="text-sm font-medium">
                      {item.type === 'SALE' ? '💰 Venda' : '📅 Aluguel'}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <div className="border-t pt-4 text-sm space-y-2 text-muted-foreground">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatter.format(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Envio:</span>
                <span>{formatter.format(order.shippingCost ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Desconto:</span>
                <span>-{formatter.format(discount)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base text-foreground">
                <span>Total:</span>
                <span>{formatter.format(subtotal + (order.shippingCost ?? 0))}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckoutClientForm;