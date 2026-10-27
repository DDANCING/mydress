"use client";

import { AlertModal } from "@/components/modals/alert-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { MaterialCategory, MaterialUnit } from "@prisma/client";
import axios from "axios";
import { Trash } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// Schema de validação
const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  category: z.nativeEnum(MaterialCategory, {
    required_error: "Categoria é obrigatória",
  }),
  color: z.string().min(1, "Cor/Detalhe é obrigatório"),
  quantity: z.coerce.number().min(0, "Quantidade não pode ser negativa"),
  unit: z.nativeEnum(MaterialUnit, {
    required_error: "Unidade de medida é obrigatória",
  }),
  minStock: z.coerce.number().min(0, "Estoque mínimo não pode ser negativo"),
  pricePerUnit: z.coerce.number().min(0, "Preço não pode ser negativo").optional(),
  supplier: z.string().optional(),
  imageUrl: z.string().optional(),
});

export type MaterialFormValues = z.infer<typeof formSchema>;

interface MaterialFormProps {
  initialData: {
    id: string;
    name: string;
    category: MaterialCategory;
    color: string;
    quantity: number;
    unit: MaterialUnit;
    minStock: number;
    pricePerUnit: number;
    supplier?: string | null;
    imageUrl?: string | null;
  } | null;
}

export const MaterialForm: React.FC<MaterialFormProps> = ({
  initialData,
}) => {
  const params = useParams();
  const router = useRouter();
  const { storeId, materialId } = params;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const title = initialData ? "Editar matéria-prima" : "Nova matéria-prima";
  const description = initialData ? "Edite os detalhes do material" : "Adicione um novo material ao estoque";
  const toastMessage = initialData ? "Material atualizado." : "Material criado.";
  const action = initialData ? "Salvar alterações" : "Criar material";

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          supplier: initialData.supplier || "",
          pricePerUnit: initialData.pricePerUnit,
          imageUrl: initialData.imageUrl || "",
        }
      : {
          name: "",
          color: "",
          quantity: 0,
          minStock: 5,
          pricePerUnit: 0,
          supplier: "",
          imageUrl: "",
          // Deixe undefined para obrigar o usuário a selecionar
          category: undefined, 
          unit: undefined,
        },
  });

  const onSubmit = async (data: MaterialFormValues) => {
    try {
      setLoading(true);
      
      if (initialData) {
        await axios.patch(`/api/${storeId}/raw-materials/${materialId}`, data);
      } else {
        await axios.post(`/api/${storeId}/raw-materials`, data);
      }
      
      router.refresh();
      router.push(`/dashboard/store/${storeId}/raw-materials`);
      toast.success(toastMessage);
    } catch (error: any) {
      toast.error("Algo deu errado.");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/${storeId}/raw-materials/${materialId}`);
      router.refresh();
      router.push(`/dashboard/store/${storeId}/raw-materials`);
      toast.success("Material deletado.");
    } catch (error) {
      toast.error("Algo deu errado.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onDelete}
        loading={loading}
      />
      
      <Card className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full max-w-7xl mx-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Heading title={title} description={description} />
                {initialData && (
                  <Button
                    type="button"
                    disabled={loading}
                    variant="destructive"
                    size="icon"
                    onClick={() => setOpen(true)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Separator />
            </CardHeader>
            
            <CardContent>
              {/* IMAGEM DO MATERIAL */}
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem className="mb-8">
                    <FormLabel>Imagem do Material</FormLabel>
                    <FormControl>
                      <ImageUpload 
                        value={field.value ? [field.value] : []}
                        disable={loading}
                        onChange={(url) => field.onChange(url)}
                        onRemove={() => field.onChange("")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                
                {/* NOME */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Material</FormLabel>
                      <FormControl>
                        <Input disabled={loading} placeholder="Ex: Tecido Algodão" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CATEGORIA (ENUM) */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select
                        disabled={loading}
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(MaterialCategory).map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* COR (STRING SIMPLES) */}
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor ou Detalhe</FormLabel>
                      <FormControl>
                        <Input disabled={loading} placeholder="Ex: Azul Marinho, Estampado X" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* QUANTIDADE */}
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade em Estoque</FormLabel>
                      <FormControl>
                        <Input 
                            type="number" 
                            disabled={loading} 
                            placeholder="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                         />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* UNIDADE (ENUM) */}
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade de Medida</FormLabel>
                      <Select
                        disabled={loading}
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a unidade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(MaterialUnit).map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ESTOQUE MÍNIMO */}
                <FormField
                  control={form.control}
                  name="minStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estoque Mínimo (Alerta)</FormLabel>
                      <FormControl>
                        <Input 
                            type="number" 
                            disabled={loading} 
                            placeholder="5" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Quantidade mínima para gerar alerta.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* PREÇO POR UNIDADE */}
                <FormField
                  control={form.control}
                  name="pricePerUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo por Unidade</FormLabel>
                      <FormControl>
                        <Input 
                            type="number" 
                            step="0.01"
                            disabled={loading} 
                            placeholder="0.00" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                 {/* FORNECEDOR */}
                 <FormField
                  control={form.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fornecedor (Opcional)</FormLabel>
                      <FormControl>
                        <Input disabled={loading} placeholder="Nome do fornecedor" {...field} />
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