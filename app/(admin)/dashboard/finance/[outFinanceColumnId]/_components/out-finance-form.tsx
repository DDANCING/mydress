"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Decimal } from "@prisma/client/runtime/library";

import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { AlertModal } from "@/components/modals/alert-modal";
import { Trash } from "lucide-react";

// IMPORTANDO O CALENDÁRIO DO SHADCN UI
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  data: z.date({ required_error: "Data é obrigatória" }),
  store: z.string().min(1, "Loja é obrigatória"),
  method: z.string().min(1, "Método é obrigatório"),
  value: z
    .string()
    .min(1, "Valor é obrigatório")
    .refine((val) => !isNaN(Number(val)), "Valor deve ser um número"),
});

type OutFinanceFormValues = z.infer<typeof formSchema>;

interface OutFinanceFormProps {
  initialData?: {
    id: string;
    name: string;
    data: Date;
    store: string;
    method: string;
    value: number;
    createdAt: Date;
  } | null;
  outFinanceId?: string;
  isModal?: boolean;
  onOutFinanceCreated?: (outFinance: any) => void;
}

export const OutFinanceForm: React.FC<OutFinanceFormProps> = ({
  initialData,
  outFinanceId,
  isModal = false,
  onOutFinanceCreated,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const form = useForm<OutFinanceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          name: initialData.name || "",
          data: initialData.data ? new Date(initialData.data) : undefined,
          store: initialData.store || "",
          method: initialData.method || "",
          value: String(initialData.value ?? ""),
        }
      : {
          name: "",
          data: undefined,
          store: "",
          method: "",
          value: "",
        },
  });

  const title = initialData ? "Editar saída financeira" : "Registrar saída financeira";
  const description = initialData
    ? "Edite os dados da saída financeira"
    : "Adicione uma nova saída financeira";
  const action = initialData ? "Salvar alterações" : "Registrar";

  const onSubmit = async (data: OutFinanceFormValues) => {
    try {
      setLoading(true);

      const payload = {
        ...data,
        data: data.data, // já é Date
        value: Number(data.value),
      };

      if (initialData && outFinanceId) {
        const response = await axios.patch(`/api/out-finance/${outFinanceId}`, payload);
        const updated = response.data;
        toast.success("Saída financeira atualizada com sucesso!");

        if (isModal && onOutFinanceCreated) {
          onOutFinanceCreated(updated);
          return;
        }
      } else {
        try {
          const response = await axios.post("/api/out-finance", payload);
          const created = response.data;
          toast.success("Saída financeira registrada com sucesso!");

          if (isModal && onOutFinanceCreated) {
            onOutFinanceCreated(created);
            return;
          }
        } catch (error: any) {
          toast.error("Erro ao registrar saída financeira.");
          return;
        }
      }

      if (!isModal) {
        router.refresh();
        router.push("/dashboard/finance");
      }
    } catch (error) {
      toast.error("Erro ao salvar saída financeira: " + error);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      if (outFinanceId) {
        await axios.delete(`/api/out-finance/${outFinanceId}`);
        toast.success("Saída financeira deletada");
        router.push("/dashboard/finance");
        router.refresh();
      }
    } catch (error) {
      toast.error("Erro ao deletar saída financeira!");
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

      <div>
        {isModal ? (
          <div></div>
        ) : (
          <div className="flex justify-between mb-4">
            <Heading title={title} description={description} />
            {initialData && (
              <Button
                disabled={loading}
                variant="destructive"
                size="icon"
                onClick={() => setOpen(true)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
        <Separator className="mb-4" />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Nome */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        disabled={loading}
                        placeholder="Digite o nome"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Data com Calendar */}
              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={
                            "w-full pl-3 text-left font-normal " +
                            (!field.value ? "text-muted-foreground" : "")
                          }
                          disabled={loading}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value
                            ? format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            : <span>Escolha uma data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={loading}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Loja */}
              <FormField
                control={form.control}
                name="store"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loja</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        disabled={loading}
                        placeholder="Digite a loja"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Método */}
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        disabled={loading}
                        placeholder="Digite o método"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Valor */}
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="amount"
                        value={field.value ?? ""}
                        disabled={loading}
                        placeholder="Digite o valor"
                        min={0}
                        step={0.01}
                        inputMode="decimal"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button disabled={loading} className="ml-auto" type="submit">
              {action}
            </Button>
          </form>
        </Form>
      </div>
    </>
  );
};