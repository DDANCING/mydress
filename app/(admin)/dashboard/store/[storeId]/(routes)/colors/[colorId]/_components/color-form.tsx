"use client";

import { AlertModal } from "@/components/modals/alert-modal";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { zodResolver } from "@hookform/resolvers/zod";
import { Size } from "@prisma/client"; // Note: This should likely be 'Color' if this is a ColorForm. Keeping 'Size' for now as per original code.
import axios from "axios";
import { Trash } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { HexColorPicker } from "react-colorful";

const formSchema = z.object({
  colorName: z.string().min(1),
  value: z.string().min(4).regex(/^#/, {
    message: "A cadeia de caracteres deve ser um código hexadecimal válido",
  }),
});

type ColorFormValues = z.infer<typeof formSchema>;

interface ColorFormProps {
  initialData: Size | null; // Assuming 'Size' is a placeholder and should be 'Color' for a ColorForm
}

export const ColorForm: React.FC<ColorFormProps> = ({ initialData }) => {
  const params = useParams();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<ColorFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      colorName: initialData?.name || "",
      value: initialData?.value || "#000000",
    },
  });

  const title = initialData ? "Editar cor" : "Criar cor";
  const description = initialData ? "Edite uma cor" : "Adicione uma nova cor";
  const toastMessage = initialData ? "Cor atualizada." : "Cor criada.";
  const action = initialData ? "Salvar alterações" : "Criar cor";

  const onSubmit = async (data: ColorFormValues) => {
    try {
      setLoading(true);
      if (initialData) {
        await axios.patch(`/api/${params.storeId}/colors/${params.colorId}`, data); 
      } else {
        await axios.post(`/api/${params.storeId}/colors`, data);
      }
      router.refresh();
      router.push(`/dashboard/store/${params.storeId}/colors`);
      toast.success(toastMessage);
    } catch (error) {
      toast.error("Algo deu errado.");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/${params.storeId}/colors/${params.colorId}`); 
      router.push(`/dashboard/store/${params.storeId}/colors`);
      router.refresh();
      toast.success("Cor deletada.");
    } catch (error) {
      toast.error("Remova todos os produtos com essa cor antes de deletar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlertModal isOpen={open} onClose={() => setOpen(false)} onConfirm={onDelete} loading={loading} />

      <div className="flex items-center justify-between">
        <Heading title={title} description={description} />
        {initialData && (
          <Button disabled={loading} variant="destructive" size="icon" onClick={() => setOpen(true)}>
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Separator />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="colorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input disabled={loading} placeholder="Nome para a cor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hex Value and Color Preview */}
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Hex</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-x-4">
                      <Input disabled={loading} placeholder="#hex" {...field} />
                      <div className="border p-4 rounded-full" style={{ backgroundColor: field.value }} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Hex Color Picker (below the input fields) */}
          <div className="w-full flex justify-end py-4"> 
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <HexColorPicker color={field.value} onChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <Button disabled={loading} className="mr-auto relative bottom-56" type="submit">
            {action}
          </Button>
        </form>
      </Form>
    </>
  );
};