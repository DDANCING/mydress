"use client";

import { AlertModal } from "@/components/modals/alert-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import NextImage from "next/image";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Heading } from "@/components/ui/heading";
import ImageUpload from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { zodResolver } from "@hookform/resolvers/zod";
import { Category, Color, Size } from "@prisma/client";
import type { Image } from "@prisma/client";
import axios from "axios";
import { Trash, Check, ChevronsUpDown, RefreshCw, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  images: z.object({ url: z.string() }).array(),
  price: z.coerce.number().min(1, "Preço é obrigatório"),
  rentalValue: z.coerce.number().min(1, "Valor de aluguel é obrigatório"),
  originalPrice: z.coerce.number().optional(),
  sku: z.string().min(1, "SKU é obrigatório").max(10).regex(/^[a-zA-Z0-9_-]+$/, "SKU deve conter apenas letras, números, hífens e sublinhados."),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  colorId: z.string().min(1, "Cor é obrigatória"),
  sizeId: z.string().min(1, "Tamanho é obrigatório"),
  isOnlyRental: z.boolean().default(false).optional(),
  isFeatured: z.boolean().default(false).optional(),
  isArchived: z.boolean().default(false).optional(),
  siteVisible: z.boolean().default(false).optional(),
});

export type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  initialData: {
    id: string;
    name: string;
    sku: string;
    storeId: string;
    categoryId: string;
    rentalValue: number;
    price: number;
    originalPrice?: number;
    rating?: number;
    reviewCount?: number;
    description?: string;
    isFeatured: boolean;
    isArchived: boolean;
    siteVisible: boolean;
    isOnlyRental: boolean;
    sizeId: string;
    colorId: string;
    images: Image[];
    createdAt: Date;
    updatedAt: Date;
  } | null;
  categories: Category[];
  colors: Color[];
  sizes: Size[];
  storeId?: string; // Opcional para compatibilidade
  onSuccess?: (product: any) => void; // Callback opcional para customizar comportamento após salvar
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  categories,
  colors,
  sizes,
  storeId: propStoreId,
  onSuccess,
}) => {
  const params = useParams();
  const router = useRouter();
  
  // Usar storeId da prop se fornecido, senão usar do params
  const storeId = propStoreId || params.storeId;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [colorsList, setColorsList] = useState<Color[]>(colors);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          price: isNaN(initialData.price) ? 0 : initialData.price,
          originalPrice: initialData.originalPrice && !isNaN(initialData.originalPrice) ? initialData.originalPrice : undefined,
          rentalValue: initialData.rentalValue && !isNaN(initialData.rentalValue) ? initialData.rentalValue : undefined,
          sku: initialData.sku ?? "",
          description: initialData.description ?? "",
        }
      : {
          name: "",
          images: [],
          price: 0,
          originalPrice: undefined,
          sku: "",
          description: "",
          categoryId: "",
          rentalValue: undefined,
          colorId: "",
          sizeId: "",
          isFeatured: false,
          isArchived: false,
          siteVisible: false,
        },
  });

  const title = initialData ? "Editar produto" : "Criar produto";
  const description = initialData ? "Edite um produto" : "Adicione um novo produto";
  const toastMessage = initialData ? "Produto atualizado." : "Produto criado.";
  const action = initialData ? "Salvar alterações" : "Criar produto";

 
  const onSubmit = async (data: ProductFormValues) => {
    try {
      setLoading(true);
      // Ensure SKU is uppercase before sending
      const payload = {
        ...data,
        sku: data.sku ? data.sku.toUpperCase() : data.sku,
      };
      
      let response;
      if (initialData) {
        // Usar o ID do initialData quando disponível (para drawer), senão usar params
        const productId = initialData.id || params.productId;
        response = await axios.patch(`/api/${storeId}/products/${productId}`, payload);
      } else {
        response = await axios.post(`/api/${storeId}/products`, payload);
      }
      
      toast.success(toastMessage);
      
      // Se onSuccess foi fornecido (usado no drawer), chamar o callback
      if (onSuccess) {
        onSuccess(response.data);
      } else {
        // Comportamento padrão (quando usado diretamente na página)
        router.refresh();
        router.push(`/dashboard/store/${storeId}/products`);
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || error.message || "Erro desconhecido";
      toast.error("Algo deu errado: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/${storeId}/products/${params.productId}`);
      router.push(`/dashboard/store/${storeId}/products`);
      router.refresh();
      toast.success("Produto deletado.");
    } catch (error) {
      toast.error("Algo deu errado, tente novamente mais tarde.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <AlertModal isOpen={open} onClose={() => setOpen(false)} onConfirm={onDelete} loading={loading} />
      <Card className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full max-w-7xl mx-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Heading title={title} description={description} />
                {initialData && (
                  <Button type="button" disabled={loading} variant="destructive" size="icon" onClick={() => setOpen(true)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Separator />
            </CardHeader>
            <CardContent>
              {params.storeId && (
                <FormField
                        control={form.control}
                        name="images"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Imagens</FormLabel>
                                <FormControl>
                                    <div className="space-y-4">
                                        <ImageUpload
                                            value={field.value.map((image) => image.url)}
                                            disable={loading}
                                            onChange={(url) => {
                                                const currentImages = form.getValues("images");
                                                field.onChange([...currentImages, { url }]);
                                            }}
                                            onRemove={(url) => field.onChange([...field.value.filter((current) => current.url !== url)])}
                                        />
                                        
                                        {/* Área de reordenação das imagens */}
                                        {field.value.length > 1 && (
                                            <div className="mt-4">
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    Arraste as imagens para reordená-las:
                                                </p>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {field.value.map((image, index) => (
                                                        <div
                                                            key={image.url}
                                                            draggable
                                                            onDragStart={(e) => {
                                                                e.dataTransfer.setData("text/plain", index.toString());
                                                                e.currentTarget.classList.add("opacity-50");
                                                            }}
                                                            onDragEnd={(e) => {
                                                                e.currentTarget.classList.remove("opacity-50");
                                                            }}
                                                            onDragOver={(e) => {
                                                                e.preventDefault();
                                                                e.currentTarget.classList.add("border-blue-400", "bg-blue-50");
                                                            }}
                                                            onDragLeave={(e) => {
                                                                e.currentTarget.classList.remove("border-blue-400", "bg-blue-50");
                                                            }}
                                                            onDrop={(e) => {
                                                                e.preventDefault();
                                                                e.currentTarget.classList.remove("border-blue-400", "bg-blue-50");
                                                                const draggedIndex = parseInt(e.dataTransfer.getData("text/plain"));
                                                                const targetIndex = index;
                                                                
                                                                if (draggedIndex !== targetIndex) {
                                                                    const newImages = [...field.value];
                                                                    const draggedImage = newImages[draggedIndex];
                                                                    newImages.splice(draggedIndex, 1);
                                                                    newImages.splice(targetIndex, 0, draggedImage);
                                                                    field.onChange(newImages);
                                                                }
                                                            }}
                                                            className="relative group cursor-move border-2 border-dashed border-gray-300 rounded-lg p-2 hover:border-gray-400 transition-all duration-200"
                                                        >
                                                            {/* Número da posição */}
                                                            <div className="absolute top-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded z-20">
                                                                {index + 1}
                                                            </div>
                                                            
                                                            {/* Ícone de arrastar */}
                                                            <div className="absolute top-1 right-1 bg-black bg-opacity-70 text-white p-1 rounded z-20">
                                                                <GripVertical className="w-3 h-3" />
                                                            </div>
                                                            
                                                            <NextImage
                                                                src={image.url}
                                                                alt={`Imagem ${index + 1}`}
                                                                width={100}
                                                                height={80}
                                                                className="w-full h-20 object-cover rounded"
                                                            />
                                                            
                                                            {/* Overlay de hover */}
                                                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 rounded flex items-center justify-center">
                                                                <div className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium flex items-center gap-1">
                                                                    <GripVertical className="w-3 h-3" />
                                                                    Arrastar
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />)}
                 
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-10">
                       
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome</FormLabel>
                                    <FormControl>
                                        <Input disabled={loading} placeholder="Nome do produto" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                                               <FormField
  control={form.control}
  name="rentalValue"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Preço de aluguel</FormLabel>
      <FormControl>
        <Input
          type="amount"
          disabled={loading}
          placeholder="Preço para aluguel"
          {...field}
          value={field.value ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            field.onChange((val === "" ? 0 : Number(val)));
          }}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Preço</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="amount" 
                                            disabled={loading} 
                                            placeholder="9.99" 
                                            {...field} 
                                            value={field.value ?? ""}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                field.onChange(val === "" ? 0 : Number(val));
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                         <FormField
  control={form.control}
  name="originalPrice"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Preço original (opcional)</FormLabel>
      <FormControl>
        <Input
          type="amount"
          disabled={loading}
          placeholder="Preço antes do desconto"
          {...field}
          value={field.value ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            field.onChange(val === "" ? undefined : Number(val));
          }}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
                        <FormField
                            control={form.control}
                            name="categoryId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Categoria</FormLabel>
                                    <Select disabled={loading} onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue defaultValue={field.value} placeholder="Selecione uma categoria" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="sizeId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tamanho</FormLabel>
                                    <Select disabled={loading} onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue defaultValue={field.value} placeholder="Selecione um tamanho" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {sizes.map((size) => (
                                                <SelectItem key={size.id} value={size.id}>
                                                    {size.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="colorId"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Cor</FormLabel>
                                    <div className="flex gap-2">
                                        <Popover open={colorOpen} onOpenChange={setColorOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "flex-1 justify-between",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value
                                                            ? (() => {
                                                                const selectedColor = colorsList.find((color) => color.id === field.value);
                                                                return selectedColor ? (
                                                                    <div className="flex items-center gap-x-2">
                                                                        {selectedColor.name}
                                                                        <div
                                                                            className="h-4 w-4 rounded-full border"
                                                                            style={{ backgroundColor: selectedColor.value }}
                                                                        />
                                                                    </div>
                                                                ) : "Selecione uma cor";
                                                            })()
                                                            : "Selecione uma cor"}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full p-0">
                                                <Command>
                                                    <CommandInput placeholder="Buscar cor..." />
                                                    <CommandList>
                                                        <CommandEmpty>Nenhuma cor encontrada.</CommandEmpty>
                                                        <CommandGroup>
                                                            {colorsList.map((color) => (
                                                                <CommandItem
                                                                    key={color.id}
                                                                    value={color.name}
                                                                    onSelect={() => {
                                                                        field.onChange(color.id);
                                                                        setColorOpen(false);
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            color.id === field.value
                                                                                ? "opacity-100"
                                                                                : "opacity-0"
                                                                        )}
                                                                    />
                                                                    <div className="flex items-center gap-x-2">
                                                                        {color.name}
                                                                        <div
                                                                            className="h-4 w-4 rounded-full border"
                                                                            style={{ backgroundColor: color.value }}
                                                                        />
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                                      <FormField
  control={form.control}
  name="sku"
  render={({ field }) => (
    <FormItem>
      <FormLabel>SKU</FormLabel>
      <FormControl>
        <Input disabled={loading} placeholder="SKU (ex: ABC-123)" {...field} value={field.value ?? ""} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

                         <FormField
                            control={form.control}
                            name="isOnlyRental"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                   <FormControl>
                                    <Checkbox 
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    />
                                   </FormControl>
                                   <div className="space-y-1 leading-none">
                                    <FormLabel>
                                     Apenas aluguel
                                    </FormLabel>
                                    <FormDescription>
                                     Esse produto será apenas para aluguel, não estará disponível para compra
                                    </FormDescription>
                                   </div>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="isFeatured"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                   <FormControl>
                                    <Checkbox 
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    />
                                   </FormControl>
                                   <div className="space-y-1 leading-none">
                                    <FormLabel>
                                     em destaque
                                    </FormLabel>
                                    <FormDescription>
                                     Esse produto aparecerá na página inicial
                                    </FormDescription>
                                   </div>
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="isArchived"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                   <FormControl>
                                    <Checkbox 
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    />
                                   </FormControl>
                                   <div className="space-y-1 leading-none">
                                    <FormLabel>
                                     Arquivar
                                    </FormLabel>
                                    <FormDescription>
                                     Esse produto não aparecerá em nenhum lugar da loja
                                    </FormDescription>
                                   </div>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="siteVisible"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                   <FormControl>
                                    <Checkbox 
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    />
                                   </FormControl>
                                   <div className="space-y-1 leading-none">
                                    <FormLabel>
                                     Visível no site
                                    </FormLabel>
                                    <FormDescription>
                                     Esse produto aparecerá nas listagens públicas do site
                                    </FormDescription>
                                   </div>
                                </FormItem>
                            )}
                        />
          
  

<FormField
    control={form.control}
    name="description"
    render={({ field }) => (
        <FormItem className="col-span-full">
            <FormLabel>Descrição</FormLabel>
            <FormControl>
                <textarea
                    disabled={loading}
                    placeholder="Descrição detalhada do produto"
                    className="w-full border rounded-md p-2"
                    rows={4}
                    {...field}
                />
            </FormControl>
            <FormMessage />
        </FormItem>
    )}
/>
                    </div>
            </CardContent>
            <CardFooter>
              <Button disabled={loading} className="ml-auto" type="submit">
                {action}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </>
  );
};
