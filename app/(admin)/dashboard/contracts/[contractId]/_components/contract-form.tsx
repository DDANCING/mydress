"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import axios from "axios";
import { z } from "zod";
import { Buyer, PaymentMethod, Seller, User } from "@prisma/client";

type SellerWithUser = Seller & {
  user: User;
};
import { CalendarIcon, Check, ChevronsUpDown, Trash, UserPlus, AlertTriangle, Plus, Loader2 } from "lucide-react";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { AlertModal } from "@/components/modals/alert-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn, formatter } from "@/lib/utils";
import { SafeProduct } from "@/app/types";
import { ProductSelectorFormField } from "./product-select";
import { ContractPaymentManager } from "./contract-payment-manager";
import { useReceiptModal } from "@/hooks/use-receipt-modal";
import { useBuyerModal } from "@/hooks/use-buyer-modal";
import { ProductForm } from "../../../store/[storeId]/(routes)/products/[productId]/_components/product-form";

interface ContractPayment {
  id?: string;
  paymentMethodId: string;
  amount: number;
  paymentDate: Date;
  description?: string;
  installmentNumber?: number;
  dueDate?: Date;
  isPaid: boolean;
}

// Função helper para criar datas válidas
const safeCreateDate = (dateValue: any): Date | undefined => {
  if (!dateValue) return undefined;
  
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) {
    return undefined;
  }
  return date;
};

const formSchema = z.object({
  contractNumber: z.string().optional(),
  type: z.enum(["SALE", "RENTAL", "ClothingSALE", "clothingRENTAL"]),
  status: z.enum(["PENDING", "CONFIRMED", "DELIVERED", "RETURNED", "CANCELED"]),
  totalAmount: z.coerce.number().min(0.01, "Valor total é obrigatório"),
  downPayment: z.coerce.number().min(0).optional(),
  discount: z.coerce.number().min(0).optional(),
  deliveryDate: z.date({
    required_error: "Data de entrega é obrigatória",
  }),
  eventDate: z.date().optional(),
  returnDate: z.date().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  buyerId: z.string().min(1, "Cliente é obrigatório"),
  product: z.array(z.object({
    id: z.string().min(1, "Produto é obrigatório"),
    quantity: z.number().min(1, "Quantidade deve ser pelo menos 1")
  })).min(1, "Pelo menos um produto é obrigatório"),
  paymentMethodId: z.string().optional(),
  sellerId: z.string().min(1, "Vendedor é obrigatório"),
});

type ContractFormValues = z.infer<typeof formSchema>;

interface ContractFormProps {
  initialData?: any;
  buyers: Buyer[];
  products: SafeProduct[];
  paymentMethods: PaymentMethod[];
  sellers: SellerWithUser[];
  contractId: string;
}

export function ContractForm({ 
  initialData, 
  buyers, 
  products, 
  paymentMethods,
  sellers,
  contractId,
}: ContractFormProps) {
  const router = useRouter();
  const buyerModal = useBuyerModal();
  const receiptModal = useReceiptModal();

  const [openDelete, setOpenDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [buyerOpen, setBuyerOpen] = useState(false);
  const [sellerOpen, setSellerOpen] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [buyersList, setBuyersList] = useState<Buyer[]>(buyers);
  const [productsList, setProductsList] = useState<SafeProduct[]>(products);
  
  // Estados para o drawer de produto
  const [productDrawerOpen, setProductDrawerOpen] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<SafeProduct | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [stores, setStores] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [sizes, setSizes] = useState<any[]>([]);
  const [contractPayments, setContractPayments] = useState<ContractPayment[]>(() => {
    // Converter pagamentos existentes
    if (initialData?.contractPayments && initialData.contractPayments.length > 0) {
      const payments = initialData.contractPayments.map((payment: any) => ({
        id: payment.id,
        paymentMethodId: payment.paymentMethodId,
        amount: Number(payment.amount),
        paymentDate: payment.paymentDate ? new Date(payment.paymentDate) : new Date(),
        description: payment.description || '',
        installmentNumber: payment.installmentNumber || 1,
        dueDate: payment.dueDate ? new Date(payment.dueDate) : undefined,
        isPaid: payment.isPaid !== undefined ? payment.isPaid : true,
      }));
      return payments;
    }
    // Para novos contratos, iniciar com array vazio
    return [];
  });
  const [discountValue, setDiscountValue] = useState(
    initialData?.discount ? Number(initialData.discount) : 0
  );
  const [couponPercent, setCouponPercent] = useState(() => {
    if (initialData?.discount && initialData?.totalAmount) {
      const discount = Number(initialData.discount);
      const total = Number(initialData.totalAmount);
      return total > 0 ? Number(((discount / total) * 100).toFixed(2)) : 0;
    }
    return 0;
  });

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      contractNumber: initialData.contractNumber || "",
      type: initialData.type || "SALE",
      status: initialData.status || "PENDING",
      totalAmount: initialData.totalAmount ? Number(initialData.totalAmount) : 0,
      downPayment: initialData.downPayment ? Number(initialData.downPayment) : 0,
      discount: initialData.discount ? Number(initialData.discount) : 0,
      deliveryDate: safeCreateDate(initialData.deliveryDate) || new Date(),
      eventDate: safeCreateDate(initialData.eventDate) || undefined,
      returnDate: safeCreateDate(initialData.returnDate) || undefined,
      notes: initialData.notes || "",
      terms: initialData.terms || "",
      buyerId: initialData.buyerId || "",
      product: initialData.contractItems && initialData.contractItems.length > 0 
        ? initialData.contractItems.map((item: any) => ({ 
            id: item.productId, 
            quantity: item.quantity 
          }))
        : [{ id: "", quantity: 1 }],
      paymentMethodId: initialData.paymentMethodId || "",
      sellerId: initialData.sellerId || "",
    } : {
      contractNumber: "",
      type: "SALE",
      status: "PENDING",
      totalAmount: 0,
      downPayment: 0,
      discount: 0,
      deliveryDate: new Date(),
      eventDate: undefined,
      returnDate: undefined,
      notes: "",
      terms: "",
      buyerId: "",
      product: [{ id: "", quantity: 1 }],
      paymentMethodId: "",
      sellerId: "",
    },
  });

  const title = initialData ? "Editar contrato" : "Criar contrato";
  const description = initialData ? "Editar um contrato existente" : "Adicionar um novo contrato";
  const toastMessage = initialData ? "Contrato atualizado." : "Contrato criado.";
  const action = initialData ? "Salvar mudanças" : "Criar";

  const contractType = form.watch("type");

  // Calcular valor restante automaticamente
  const totalAmount = form.watch("totalAmount"); // Usar sempre o valor do input
  
  // Função para calcular o total com desconto
  const getDiscountedTotal = () => {
    const couponDiscount = (couponPercent > 0) ? totalAmount * (couponPercent / 100) : 0;
    return totalAmount - (discountValue || couponDiscount);
  };

  // Calcular valor restante baseado no total pago dos pagamentos
  const totalPaid = contractPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const discountedTotal = getDiscountedTotal();
  const remainingAmount = discountedTotal - totalPaid;
  const [deliveryCalendarOpen, setDeliveryCalendarOpen] = useState(false);
  const [eventCalendarOpen, setEventCalendarOpen] = useState(false);
  const [returnCalendarOpen, setReturnCalendarOpen] = useState(false);

  // Estados para o progresso de salvamento
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");

  // Sincronizar a lista local de compradores com a props
  useEffect(() => {
    setBuyersList(buyers);
  }, [buyers]);

  // Sincronizar a lista local de produtos com a props
  useEffect(() => {
    setProductsList(products);
  }, [products]);

  // Sincronizar o totalAmount com o totalPrice quando os produtos mudarem
  useEffect(() => {
    if (totalPrice > 0) {
      form.setValue("totalAmount", totalPrice);
    }
  }, [totalPrice, form]);

  // Buscar stores disponíveis
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await axios.get("/api/stores");
        setStores(response.data);
        if (response.data.length > 0) {
          setSelectedStoreId(response.data[0].id);
        }
      } catch (error) {
        // Se não há stores, ainda assim deixar o usuário continuar
        setStores([]);
      }
    };
    fetchStores();
  }, []);

  // Buscar dados necessários para o produto form quando store for selecionada
  useEffect(() => {
    const fetchProductFormData = async () => {
      if (!selectedStoreId) return;
      
      try {
        const [categoriesRes, colorsRes, sizesRes] = await Promise.all([
          axios.get(`/api/${selectedStoreId}/categories`),
          axios.get(`/api/${selectedStoreId}/colors`),
          axios.get(`/api/${selectedStoreId}/sizes`)
        ]);
        
        setCategories(categoriesRes.data || []);
        setColors(colorsRes.data || []);
        setSizes(sizesRes.data || []);
      } catch (error) {
        // Em caso de erro, definir arrays vazios para evitar loop infinito
        setCategories([]);
        setColors([]);
        setSizes([]);
      }
    };
    
    fetchProductFormData();
  }, [selectedStoreId]);

  // Sincronizar o discount no form quando o discountValue mudar
  useEffect(() => {
    form.setValue("discount", discountValue);
  }, [discountValue, form]);

  const handleBuyerCreated = (buyer: Buyer) => {
    // Adicionar o novo comprador à lista local
    setBuyersList(prevBuyers => [...prevBuyers, buyer]);
    // Selecionar o comprador recém-criado no formulário
    form.setValue("buyerId", buyer.id);
    // Fechar o popover de seleção
    setBuyerOpen(false);
  };

  // Adapter para converter SafeProduct para o formato esperado pelo ProductForm
  const adaptProductForForm = (product: SafeProduct | null) => {
    if (!product) return null;
    
    // Converter imagens do SafeProduct para o formato esperado pelo ProductForm
    const adaptedImages = (product.images || []).map(img => ({
      id: img.id,
      url: img.url,
      productId: product.id,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));
    
    return {
      id: product.id,
      name: product.name,
      sku: product.sku || "",
      storeId: product.storeId,
      categoryId: product.categoryId,
      rentalValue: Number(product.rentalValue),
      price: Number(product.price),
      originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
      rating: product.rating ? Number(product.rating) : undefined,
      reviewCount: product.reviewCount ? Number(product.reviewCount) : undefined,
      description: product.description || "",
      isFeatured: product.isFeatured,
      isArchived: product.isArchived,
      siteVisible: product.siteVisible,
      isOnlyRental: product.isOnlyRental,
      sizeId: product.sizeId,
      colorId: product.colorId,
      images: adaptedImages,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  };

  // Funções para gerenciar o drawer de produto
  const handleCreateProduct = () => {
    setSelectedProductForEdit(null);
    setProductDrawerOpen(true);
  };

  const handleEditProduct = (product: SafeProduct) => {
    setSelectedProductForEdit(product);
    setProductDrawerOpen(true);
  };

  // Função para lidar quando um pagamento é adicionado
  const handlePaymentAdded = (payment: ContractPayment) => {
    // Mostrar toast de sucesso
    toast.success("Pagamento adicionado com sucesso!");
    
  };

  const handleProductSaved = async (savedProduct: any) => {
    try {
      // Atualizar a lista de produtos - buscar todos os produtos do usuário
      const updatedProductsResponse = await axios.get('/api/products');
      
      setProductsList(updatedProductsResponse.data);
      
      // Se foi criação de novo produto, adicionar automaticamente ao formulário
      if (!selectedProductForEdit && savedProduct) {
        // Tentar diferentes possibilidades para o ID do produto
        const productId = savedProduct.id || savedProduct.productId || savedProduct.data?.id;
        
        if (productId) {
          // Verificar se o produto está na lista atualizada
          const productExists = updatedProductsResponse.data.find((p: any) => p.id === productId);
          
          if (productExists) {
            // Obter produtos atuais do formulário
            const currentProducts = form.getValues("product");
            
            // Verificar se já existe um produto vazio (primeiro item sem ID)
            const hasEmptyProduct = currentProducts.some(p => !p.id);
            
            if (hasEmptyProduct) {
              // Encontrar o primeiro produto vazio disponível
              const updatedProducts = currentProducts.map((product, index) => {
                if (!product.id) {
                  return { id: productId, quantity: 1 };
                }
                return product;
              });
              form.setValue("product", updatedProducts);
            } else {
              // Adicionar novo produto à lista
              const newProducts = [...currentProducts, { id: productId, quantity: 1 }];
              form.setValue("product", newProducts);
            }
          } else {
            toast.error("⚠️ Produto não encontrado na lista atualizada");
          }
        } else {
         toast.error("⚠️ Não foi possível encontrar o ID do produto criado");
        }
      }
      
      // Fechar o drawer
      setProductDrawerOpen(false);
      setSelectedProductForEdit(null);
      
      const message = selectedProductForEdit ? "Produto atualizado!" : "Produto criado e adicionado ao contrato!";
      toast.success(message);
    } catch (error) {
      toast.error("Erro ao atualizar lista de produtos");
    }
  };

  useEffect(() => {
  if (contractType === "RENTAL" || contractType === "clothingRENTAL") {
    const deliveryDate = form.watch("deliveryDate");
    if (deliveryDate && deliveryDate instanceof Date && !isNaN(deliveryDate.getTime())) {
      const eventDate = addDays(deliveryDate, 2);
      const returnDate = addDays(deliveryDate, 5);
      form.setValue("eventDate", eventDate);
      form.setValue("returnDate", returnDate);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [form.watch("deliveryDate"), contractType]);

  // Função para verificar se o comprador tem dados incompletos
  const checkBuyerData = (buyerId: string) => {
    const buyer = buyersList.find(b => b.id === buyerId);
    if (!buyer) return { isComplete: true, missingFields: [] };

    const missingFields = [];
    
    if (!buyer.fullName) missingFields.push("Nome completo");
    if (!buyer.email) missingFields.push("Email");
    if (!buyer.phone) missingFields.push("Telefone");
    if (!buyer.address) missingFields.push("Endereço");
    if (!buyer.city) missingFields.push("Cidade");
    if (!buyer.state) missingFields.push("Estado");
    if (!buyer.cep) missingFields.push("CEP");
    if (!buyer.document) missingFields.push("CPF/CNPJ");

    return {
      isComplete: missingFields.length === 0,
      missingFields,
      buyer
    };
  };

  // Verificar dados do comprador selecionado
  const selectedBuyerId = form.watch("buyerId");
  const buyerDataCheck = selectedBuyerId ? checkBuyerData(selectedBuyerId) : { isComplete: true, missingFields: [] };

  const onSubmit = async (data: ContractFormValues) => {
    try {
      setLoading(true);
      setShowProgressModal(true);
      setProgressValue(0);
      setProgressMessage("Iniciando salvamento do contrato...");
      
      // Simular progresso inicial
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgressValue(10);
      setProgressMessage("Validando dados do contrato...");
      
      await new Promise(resolve => setTimeout(resolve, 300));
      setProgressValue(20);
      setProgressMessage("Preparando dados para envio...");
      
      // Validar se há pelo menos um produto selecionado
      if (!data.product[0]?.id) {
        toast.error("Selecione pelo menos um produto.");
        setLoading(false);
        return;
      }

      // Garantir que o totalAmount não seja zero
      if (data.totalAmount <= 0) {
        toast.error("O valor total deve ser maior que zero.");
        setLoading(false);
        return;
      }      // Validar se há pelo menos um pagamento
      if (contractPayments.length === 0 && data.status !== "PENDING") {
        toast.error("Adicione pelo menos um pagamento ao contrato.");
        setLoading(false);
        return;
      }
      if (contractPayments.length > 0 && data.status === "PENDING") {
        toast.error("Contrato está pendente, mas há pagamentos.");
        setLoading(false);
        return;
      }

      // Construir contractItems para a API
      const contractItems = data.product.map(productItem => {
        const product = productsList.find(p => p.id === productItem.id);
        if (!product) {
          throw new Error(`Produto não encontrado: ${productItem.id}`);
        }
        
        const unitPrice = Number(product.price);
        if (isNaN(unitPrice) || unitPrice <= 0) {
          throw new Error(`Preço inválido para o produto: ${product.name}`);
        }
        
        return {
          productId: productItem.id,
          quantity: productItem.quantity,
          unitPrice: unitPrice,
        };
      });

      // Validar se todos os campos obrigatórios estão presentes
      if (!data.sellerId) {
        toast.error("Selecione um vendedor.");
        setLoading(false);
        return;
      }

      // Criar payload para a API
      const { product, ...restData } = data;
      const payload = {
        ...restData,
        // Usar o primeiro método de pagamento como fallback para compatibilidade
        paymentMethodId: contractPayments[0]?.paymentMethodId || data.paymentMethodId,
        // Salvar o valor restante no downPayment para gráficos
        downPayment: remainingAmount,
        remainingAmount,
        deliveryDate: data.deliveryDate.toISOString(),
        eventDate: data.eventDate?.toISOString(),
        returnDate: data.returnDate?.toISOString(),
        contractItems: contractItems,
        contractPayments: contractPayments.map(payment => ({
          paymentMethodId: payment.paymentMethodId,
          amount: payment.amount,
          paymentDate: payment.paymentDate.toISOString(),
          description: payment.description,
          installmentNumber: payment.installmentNumber,
          dueDate: payment.dueDate?.toISOString(),
          isPaid: payment.isPaid,
        })),
      };

      setProgressValue(40);
      setProgressMessage("Salvando contrato no banco de dados...");
      
      let contractResponse;
      if (initialData) {
        contractResponse = await axios.patch(`/api/contracts/${contractId}`, payload);
      } else {
        contractResponse = await axios.post(`/api/contracts`, payload);
      }
      
      setProgressValue(70);
      setProgressMessage("Contrato salvo com sucesso!");

      // Gerenciar agendamentos no calendário
      const contractIdToUse = initialData ? contractId : contractResponse.data.id;
      
      if (contractIdToUse) {
        setProgressValue(80);
        setProgressMessage(initialData ? "Atualizando agendamentos no calendário..." : "Criando agendamentos no calendário...");
        
        const buyerName = buyersList.find(b => b.id === data.buyerId)?.fullName;
        
        if (initialData) {
          // Atualizar agendamentos existentes
          try {
            // Buscar agendamentos existentes do contrato
            const existingSchedulesResponse = await axios.get(`/api/schedules?contractId=${contractIdToUse}`);
            const existingSchedules = existingSchedulesResponse.data || [];
            
            // Atualizar agendamentos de entrega existentes
            const deliverySchedules = existingSchedules.filter((schedule: any) => 
              schedule.tags && schedule.tags.includes("entrega 📦")
            );
            
            for (const schedule of deliverySchedules) {
              const deliveryDate = new Date(data.deliveryDate);
              deliveryDate.setHours(17, 0, 0, 0);
              const deliveryEndDate = new Date(deliveryDate);
              deliveryEndDate.setHours(18, 0, 0, 0);
              
              await axios.patch(`/api/schedules/${schedule.id}`, {
                title: "Entrega de Produto",
                description: `Entrega do contrato para ${buyerName}`,
                startDate: deliveryDate.toISOString(),
                endDate: deliveryEndDate.toISOString(),
                sellerId: data.sellerId,
                buyerId: data.buyerId,
              });
            }
            
            // Atualizar agendamentos de devolução se existirem
            if ((data.type === "RENTAL" || data.type === "clothingRENTAL") && data.returnDate) {
              const returnSchedules = existingSchedules.filter((schedule: any) => 
                schedule.tags && schedule.tags.includes("devolução 📦")
              );
              
              for (const schedule of returnSchedules) {
                const returnDate = new Date(data.returnDate);
                returnDate.setHours(17, 0, 0, 0);
                const returnEndDate = new Date(returnDate);
                returnEndDate.setHours(18, 0, 0, 0);
                
                await axios.patch(`/api/schedules/${schedule.id}`, {
                  title: "Devolução de Produto",
                  description: `Devolução do contrato de ${buyerName}`,
                  startDate: returnDate.toISOString(),
                  endDate: returnEndDate.toISOString(),
                  sellerId: data.sellerId,
                  buyerId: data.buyerId,
                });
              }
            }
            
          } catch (error) {
            console.error("Erro ao atualizar agendamentos:", error);
            // Não bloquear o salvamento do contrato por erro nos agendamentos
          }
          
        } else {
          // Criar novos agendamentos para cada produto
          try {
            // Criar agendamentos de entrega para cada produto
            for (const item of contractItems) {
              const product = productsList.find(p => p.id === item.productId);
              const productName = product?.name || "Produto";
              
              const deliveryDate = new Date(data.deliveryDate);
              deliveryDate.setHours(17, 0, 0, 0); // 17:00 (5 da tarde)
              const deliveryEndDate = new Date(deliveryDate);
              deliveryEndDate.setHours(18, 0, 0, 0); // 18:00 (6 da tarde)
              const sku = product?.sku || "";

              const deliverySchedule = {
                title: `Entrega: ${productName} sku: ${sku}`,
                description: `Entrega para ${buyerName} telefone: ${buyerDataCheck.buyer?.phone} endereço: ${buyerDataCheck.buyer?.address}, ${buyerDataCheck.buyer?.number} ${buyerDataCheck.buyer?.city} - ${buyerDataCheck.buyer?.state} `,
                startDate: deliveryDate.toISOString(),
                endDate: deliveryEndDate.toISOString(),
                type: "CLIENT_APPOINTMENT",
                sellerId: data.sellerId,
                buyerId: data.buyerId,
                contractId: contractIdToUse,
                productId: item.productId,
                tags: ["entrega 📦"],
              };

              await axios.post('/api/schedules', deliverySchedule);
            }

            // Se for locação ou confecção aluguel e tem data de devolução, criar agendamentos de devolução para cada produto
            if ((data.type === "RENTAL" || data.type === "clothingRENTAL") && data.returnDate) {
              for (const item of contractItems) {
                const product = productsList.find(p => p.id === item.productId);
                const productName = product?.name || "Produto";
                
                const returnDate = new Date(data.returnDate);
                returnDate.setHours(17, 0, 0, 0); // 17:00 (5 da tarde)
                const returnEndDate = new Date(returnDate);
                returnEndDate.setHours(18, 0, 0, 0); // 18:00 (6 da tarde)
                
                const returnSchedule = {
                  title: `Devolução: ${productName}`,
                  description: `Devolução de ${buyerName} telefone: ${buyerDataCheck.buyer?.phone} endereço: ${buyerDataCheck.buyer?.address}, ${buyerDataCheck.buyer?.number} ${buyerDataCheck.buyer?.city} - ${buyerDataCheck.buyer?.state} `,
                  startDate: returnDate.toISOString(),
                  endDate: returnEndDate.toISOString(),
                  type: "CLIENT_APPOINTMENT",
                  sellerId: data.sellerId,
                  buyerId: data.buyerId,
                  contractId: contractIdToUse,
                  productId: item.productId,
                  tags: ["devolução 📦"],
                };

                await axios.post('/api/schedules', returnSchedule);
              }
            }
            
          } catch (error) {
            console.error("Erro ao criar agendamentos:", error);
            // Não bloquear o salvamento do contrato por erro nos agendamentos
            toast.error("Contrato salvo, mas houve erro ao criar agendamentos no calendário.");
          }
        }
      }

      setProgressValue(100);
      setProgressMessage("Finalizando...");
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgressMessage("Concluído! Redirecionando...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push(`/dashboard/contracts`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.refresh();
      toast.success(toastMessage);
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409) {
          const conflictData = error.response.data;
          toast.error(conflictData.message || "Produto indisponível no período solicitado.");
        } else if (error.response?.status === 400) {
          const errorData = error.response.data;
          toast.error(errorData.message || "Dados inválidos. Verifique os campos obrigatórios.");
        } else {
          toast.error("Ocorreu um erro ao salvar o contrato.");
        }
      } else {
        toast.error("Ocorreu um erro ao salvar o contrato.");
      }
    } finally {
      setLoading(false);
      setShowProgressModal(false);
      setProgressValue(0);
      setProgressMessage("");
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/contracts/${contractId}`);
      router.refresh();
      router.push(`/dashboard/contracts`);
      toast.success("Contrato deletado.");
    } catch (error: any) {
      toast.error("Erro ao deletar contrato.");
    } finally {
      setLoading(false);
      setOpenDelete(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={onDelete}
        loading={loading}
      />
      <div className="flex items-center justify-between">
        <Heading title={title} description={description} />
        {initialData && (
          <Button
            disabled={loading}
            variant="destructive"
            size="sm"
            onClick={() => setOpenDelete(true)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informações Básicas do Contrato */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium">Informações do Contrato</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="contractNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do Contrato</FormLabel>
                      <FormControl>
                        <Input 
                          disabled={loading} 
                          placeholder="Deixe vazio para gerar automaticamente"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Contrato</FormLabel>
                      <Select disabled={loading} onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SALE">Venda</SelectItem>
                          <SelectItem value="RENTAL">Locação</SelectItem>
                          <SelectItem value="ClothingSALE">Confecção - Venda</SelectItem>
                          <SelectItem value="clothingRENTAL">Confecção - Aluguel</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select disabled={loading} onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PENDING">Pendente</SelectItem>
                          <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                          <SelectItem value="DELIVERED">Entregue</SelectItem>
                          {(contractType === "RENTAL" || contractType === "clothingRENTAL") && (
                            <SelectItem value="RETURNED">Devolvido</SelectItem>
                          )}
                          <SelectItem value="CANCELED">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Seleção de Cliente */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium">Cliente</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="buyerId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Cliente</FormLabel>
                      <Popover open={buyerOpen} onOpenChange={setBuyerOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between truncate max-w-[300px] sm:max-w-[400px] md:max-w-[1000px] mr-6",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? buyersList.find((buyer) => buyer.id === field.value)?.fullName
                                : "Selecionar cliente"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Buscar cliente..." />
                            <CommandList>
                              <CommandEmpty>
                                <div className="p-4 text-center space-y-2">
                                  <p className="text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBuyerOpen(false);
                                      buyerModal.onOpen(handleBuyerCreated);
                                    }}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                                  >
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Criar novo comprador
                                  </button>
                                </div>
                              </CommandEmpty>
                              <CommandGroup>
                                {buyersList.map((buyer) => (
                                  <CommandItem
                                    value={buyer.fullName}
                                    key={buyer.id}
                                    onSelect={() => {
                                      form.setValue("buyerId", buyer.id);
                                      setBuyerOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        buyer.id === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {buyer.fullName}
                                    <span className="ml-auto text-xs text-muted-foreground">
                                      {buyer.email}
                                    </span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                            
                            {/* Área fixa no final sempre visível */}
                            <div className="border-t bg-popover p-1">
                              <CommandItem
                                onSelect={() => {
                                  setBuyerOpen(false);
                                  buyerModal.onOpen(handleBuyerCreated);
                                }}
                                className="w-full"
                              >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Criar novo comprador
                              </CommandItem>
                            </div>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Aviso de dados incompletos do comprador */}
                {selectedBuyerId && !buyerDataCheck.isComplete && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Dados do cliente incompletos
                        </h3>
                        <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                          Os seguintes campos estão faltando: {buyerDataCheck.missingFields.join(", ")}
                        </p>
                        <div className="mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const selectedBuyer = buyersList.find(b => b.id === selectedBuyerId);
                              buyerModal.onOpen((updatedBuyer: Buyer) => {
                                // Atualizar o comprador na lista local
                                setBuyersList(prevBuyers => 
                                  prevBuyers.map(buyer => 
                                    buyer.id === updatedBuyer.id ? updatedBuyer : buyer
                                  )
                                );
                              }, selectedBuyer);
                            }}
                            className="text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-xs sm:text-sm truncate max-w-[170px] sm:max-w-[400px] "
                          >
                            Completar dados do cliente
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="sellerId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Vendedor</FormLabel>
                      <Popover open={sellerOpen} onOpenChange={setSellerOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? sellers.find((seller) => seller.id === field.value)?.user?.name || "Vendedor"
                                : "Selecionar vendedor"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Buscar vendedor..." />
                            <CommandList>
                              <CommandEmpty>
                                <div className="p-4 text-center">
                                  <p className="text-sm text-muted-foreground mb-2">Nenhum vendedor encontrado.</p>
                                </div>
                              </CommandEmpty>
                              <CommandGroup>
                                {sellers.map((seller) => (
                                  <CommandItem
                                    value={seller.user.name || seller.id}
                                    key={seller.id}
                                    onSelect={() => {
                                      form.setValue("sellerId", seller.id);
                                      setSellerOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        seller.id === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {seller.user.name || "Vendedor"}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="grid md:flex gap-6 lg:col-span-2">
            <Card className="flex-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <h3 className="text-lg font-medium">Produtos</h3>
              
              </CardHeader>
              <CardContent>
                <ProductSelectorFormField
                  products={productsList}
                  control={form.control}
                  setValue={form.setValue}
                  getValues={form.getValues}
                  setPrice={setTotalPrice}
                  contractType={contractType}
                  onEditProduct={handleEditProduct}
                  onCreateProduct={handleCreateProduct}
                />
              </CardContent>
            </Card>

            {/* Valores Financeiros */}
            <Card className="flex-1">
              <CardHeader>
                <h3 className="text-lg font-medium">Valores</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Total</FormLabel>
                      <FormControl>
                        <Input
                          type="amount"
                          step="0.01"
                          disabled={loading}
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campos de desconto */}
                <div className="flex justify-between gap-4 flex-wrap">
                  <div className="flex flex-col gap-1">
                    <Label className="text-sm font-medium">Cupom (%)</Label>
                    <Input
                      type="number"
                      step="any"
                      className="border px-2 py-1 rounded w-32"
                      value={couponPercent}
                      onChange={(e) => {
                        const percent = Number(e.target.value);
                        setCouponPercent(percent);
                        const calculatedDiscount = Number(((totalAmount * percent) / 100).toFixed(2));
                        setDiscountValue(calculatedDiscount);
                      }}
                      placeholder="0%"
                      min={0}
                      max={100}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label className="text-sm font-medium">Desconto (R$)</Label>
                    <Input
                      type="number"
                      step="any"
                      className="border px-2 py-1 rounded w-32"
                      value={discountValue}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setDiscountValue(value);
                        const calculatedPercent = totalAmount > 0 ? Number(((value / totalAmount) * 100).toFixed(2)) : 0;
                        setCouponPercent(calculatedPercent);
                      }}
                      placeholder="0.00"
                      min={0}
                      max={totalAmount}
                    />
                  </div>
                </div>

                {/* Mostrar total com desconto */}
                {(discountValue > 0 || couponPercent > 0) && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium">
                      Total com Desconto: R$ {discountedTotal.toFixed(2)}
                    </p>
                  </div>
                )}

                {/* Mostrar valor restante baseado nos pagamentos */}
                {totalPaid > 0 && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium">
                      Valor Restante: {formatter.format(remainingAmount)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Datas */}
            <Card className="flex-1">
  <CardHeader>
    <h3 className="text-lg font-medium">Datas</h3>
  </CardHeader>
  <CardContent className="space-y-4">
    <FormField
      control={form.control}
      name="deliveryDate"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>Data de Entrega</FormLabel>
          <Popover open={deliveryCalendarOpen} onOpenChange={setDeliveryCalendarOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  {field.value && field.value instanceof Date && !isNaN(field.value.getTime()) ? (
                    format(field.value, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={date => {
                  field.onChange(date);
                  setDeliveryCalendarOpen(false);
                }}
                disabled={date => date < new Date()}
                initialFocus
                defaultMonth={field.value}
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />

    {(contractType === "RENTAL" || contractType === "clothingRENTAL") && (
      <>
        <FormField
          control={form.control}
          name="eventDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data do Evento</FormLabel>
              <Popover open={eventCalendarOpen} onOpenChange={setEventCalendarOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value && field.value instanceof Date && !isNaN(field.value.getTime()) ? (
                        format(field.value, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione a data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={date => {
                      field.onChange(date);
                      setEventCalendarOpen(false);
                    }}
                    disabled={date => date < new Date()}
                    initialFocus
                    defaultMonth={field.value}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="returnDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Devolução</FormLabel>
              <Popover open={returnCalendarOpen} onOpenChange={setReturnCalendarOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value && field.value instanceof Date && !isNaN(field.value.getTime()) ? (
                        format(field.value, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione a data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={date => {
                      field.onChange(date);
                      setReturnCalendarOpen(false);
                    }}
                    disabled={date => date < new Date()}
                    initialFocus
                    defaultMonth={field.value}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </>
    )}
  </CardContent>
</Card>
            </div>

            {/* Observações e Termos */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <h3 className="text-lg font-medium">Observações e Termos</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          disabled={loading}
                          placeholder="Observações sobre o contrato..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Termos e Condições</FormLabel>
                      <FormControl>
                        <Textarea
                          disabled={loading}
                          placeholder="Termos e condições específicos..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Gestão de Pagamentos */}
            <div className="lg:col-span-2">
              <ContractPaymentManager
                paymentMethods={paymentMethods}
                contractPayments={contractPayments}
                onPaymentsChange={setContractPayments}
                totalAmount={totalAmount}
                discountedTotal={discountedTotal}
                loading={loading}
                onPaymentAdded={handlePaymentAdded}
              />
            </div>
          </div>

          <Button disabled={loading} className="ml-auto" type="submit">
            {action}
          </Button>
        </form>
      </Form>

      {/* Drawer para criar/editar produto */}
      <Drawer open={productDrawerOpen} onOpenChange={setProductDrawerOpen}>
        <DrawerContent className="h-[100vh]">
         <DrawerHeader>
          <DrawerTitle></DrawerTitle>
        </DrawerHeader>
          <div className="flex-1 overflow-y-auto p-6">
            {/* Seleção de Store */}
            <div className="mb-6">
              <Label htmlFor="store-select" className="text-sm font-medium">
                Loja *
              </Label>
              {stores.length > 0 ? (
                <Select 
                  value={selectedStoreId} 
                  onValueChange={setSelectedStoreId}
                  disabled={!!selectedProductForEdit} 
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione uma loja" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="mt-1 p-3 border border-dashed border-gray-300 rounded-md text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma loja encontrada. Você precisa criar uma loja primeiro.
                  </p>
                </div>
              )}
            </div>

            {/* Product Form */}
            {selectedStoreId && (
              <>
                {categories.length > 0 && colors.length > 0 && sizes.length > 0 ? (
                  <ProductForm
                    initialData={adaptProductForForm(selectedProductForEdit)}
                    categories={categories}
                    colors={colors}
                    sizes={sizes}
                    storeId={selectedStoreId}
                    onSuccess={handleProductSaved}
                  />
                ) : (
                  <div className="flex items-center justify-center h-40">
                    <div className="text-center space-y-2">
                      <p className="text-muted-foreground">
                        {categories.length === 0 && colors.length === 0 && sizes.length === 0 
                          ? "Carregando dados da loja..."
                          : "Esta loja não possui dados completos (categorias, cores ou tamanhos) para criar produtos."
                        }
                      </p>
                      {categories.length === 0 && colors.length === 0 && sizes.length === 0 && (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

        </DrawerContent>
      </Drawer>

      {/* Modal de Progresso */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-muted/50 backdrop-blur-lg flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 w-96 max-w-[90vw]">
            <div className="flex items-center space-x-3 mb-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <h3 className="text-lg font-semibold">Salvando Contrato</h3>
            </div>
            
            <div className="space-y-4">
              <Progress value={progressValue} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                {progressMessage}
              </p>
              <div className="text-center text-sm font-medium">
                {progressValue}% concluído
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}