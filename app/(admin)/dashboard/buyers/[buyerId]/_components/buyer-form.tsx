"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Buyer, UserRole } from "@prisma/client";

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
import { cpfCnpjSchema } from "@/schemas/validationSchema";
import { Label } from "@/components/ui/label"; // Alterado aqui
import { Checkbox } from "react-aria-components";
import { RoleGateNoMessage } from "@/components/auth/role-gate";
// Removido o import do Select

// --- Form Schema ---
const formSchema = z.object({
  fullName: z.string().min(1, "Nome é obrigatório"),
  hasNoEmail: z.boolean(),
  email: z.string().email("Email inválido").or(z.literal("")).optional(),
  phone: z.string().min(8, "Telefone inválido"),
  address: z.string().or(z.literal("")).optional(),
  city: z.string().or(z.literal("")).optional(),
  state: z.string().or(z.literal("")).optional(),
  cep: z.string().or(z.literal("")).optional(),
  neighborhood: z.string().or(z.literal("")).optional(),
  number: z.string().or(z.literal("")).optional(),
  complement: z.string().optional(),
  IsEffected: z.boolean(),
  document: z.object({
    cpfCnpj: z.string().optional(),
  }),
}).superRefine((data, ctx) => {
  if (!data.hasNoEmail && !data.email) {
    ctx.addIssue({
      path: ["email"],
      code: z.ZodIssueCode.custom,
      message: "Email é obrigatório",
    });
  }
  
  // Se cliente NÃO é efetivado, não validar campos de endereço
  if (!data.IsEffected) {
    return;
  }
  
  // Se cliente É efetivado, validar todos os campos
  if (!data.address || data.address.trim() === "") {
    ctx.addIssue({
      path: ["address"],
      code: z.ZodIssueCode.custom,
      message: "Rua é obrigatória",
    });
  }
  if (!data.city || data.city.trim() === "") {
    ctx.addIssue({
      path: ["city"],
      code: z.ZodIssueCode.custom,
      message: "Cidade é obrigatória",
    });
  }
  if (!data.state || data.state.trim() === "") {
    ctx.addIssue({
      path: ["state"],
      code: z.ZodIssueCode.custom,
      message: "Estado é obrigatório",
    });
  }
  if (!data.cep || data.cep.trim() === "") {
    ctx.addIssue({
      path: ["cep"],
      code: z.ZodIssueCode.custom,
      message: "CEP é obrigatório",
    });
  }
  if (!data.neighborhood || data.neighborhood.trim() === "") {
    ctx.addIssue({
      path: ["neighborhood"],
      code: z.ZodIssueCode.custom,
      message: "Bairro é obrigatório",
    });
  }
  if (!data.number || data.number.trim() === "") {
    ctx.addIssue({
      path: ["number"],
      code: z.ZodIssueCode.custom,
      message: "Número é obrigatório",
    });
  }
  
  // CPF/CNPJ é obrigatório apenas para clientes efetivados
  if (!data.document.cpfCnpj || data.document.cpfCnpj.trim() === "") {
    ctx.addIssue({
      path: ["document.cpfCnpj"],
      code: z.ZodIssueCode.custom,
      message: "CPF ou CNPJ é obrigatório",
    });
  } else {
    const result = cpfCnpjSchema.safeParse(data.document.cpfCnpj);
    if (!result.success) {
      ctx.addIssue({
        path: ["document.cpfCnpj"],
        code: z.ZodIssueCode.custom,
        message: result.error.errors[0]?.message || "CPF ou CNPJ inválido",
      });
    }
  }
});

type BuyerFormValues = z.infer<typeof formSchema>;

interface BuyerFormProps {
  initialData: Buyer | null;
  buyerId?: string;
  isModal: boolean;
  onBuyerCreated?: (buyer: Buyer) => void;
}

export const BuyerForm: React.FC<BuyerFormProps> = ({
  initialData,
  buyerId,
  isModal,
  onBuyerCreated,
}) => {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const form = useForm<BuyerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          fullName: initialData.fullName || "",
          hasNoEmail: false,
          email: initialData.email || "",
          phone: initialData.phone || "",
          address: initialData.address || "",
          city: initialData.city || "",
          state: initialData.state || "",
          cep: initialData.cep || "",
          neighborhood: initialData.neighborhood || "",
          number: initialData.number || "",
          complement: initialData.complement || "",
          IsEffected: initialData.IsEffected ?? true,
          document: {
            cpfCnpj: initialData.document || "",
          },
        }
      : {
          fullName: "",
          hasNoEmail: false,
          email: "",
          phone: "",
          address: "",
          city: "",
          state: "",
          cep: "",
          neighborhood: "",
          number: "",
          complement: "",
          IsEffected: true,
          document: {
            cpfCnpj: "",
          },
        },
  });

  const title = initialData ? "Editar comprador" : "Criar comprador";
  const description = initialData
    ? "Edite os dados do comprador"
    : "Adicione um novo comprador";
  const action = initialData ? "Salvar alterações" : "Criar";

  const normalizeDocument = (value: string) => value.replace(/[^\d]/g, "");
  const normalizeCep = (value: string) => value.replace(/[^\d]/g, "");

  // Função para buscar endereço pelo CEP
  const fetchAddressByCep = async (cepValue: string) => {
    const cep = normalizeCep(cepValue);
    if (cep.length !== 8) return; // Somente busca se o CEP tiver 8 dígitos
    try {
      setCepLoading(true);
      const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
      if (response.data.erro) {
        toast.error("CEP não encontrado.");
        return;
      }
      form.setValue("address", response.data.logradouro || "");
      form.setValue("neighborhood", response.data.bairro || "");
      form.setValue("city", response.data.localidade || "");
      form.setValue("state", response.data.uf || "");
    } catch (error) {
      toast.error("Erro ao buscar endereço do CEP.");
    } finally {
      setCepLoading(false);
    }
  };

  // Handler para quando o campo CEP perder o foco
  const handleCepBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const cepValue = e.target.value;
    fetchAddressByCep(cepValue);
  };

  // --- Email field logic ---
  const hasNoEmail = form.watch("hasNoEmail");
  const isEffected = form.watch("IsEffected");

  // Limpa email se marcar "Sim"
  useEffect(() => {
    if (hasNoEmail) {
      form.setValue("email", "");
    }
  }, [hasNoEmail, form]);

  // Limpa campos de endereço se cliente não é efetivado
  useEffect(() => {
    if (!isEffected) {
      form.setValue("address", "");
      form.setValue("cep", "");
      form.setValue("neighborhood", "");
      form.setValue("city", "");
      form.setValue("state", "");
      form.setValue("number", "");
      form.setValue("complement", "");
      form.setValue("document.cpfCnpj", "");
    }
  }, [isEffected, form]);

  // --- Submit handler ---
  const onSubmit = async (data: BuyerFormValues) => {
    try {
      setLoading(true);

      // Construir payload de forma condicional baseado em IsEffected
      const payload: any = {
        fullName: data.fullName ? data.fullName.toUpperCase() : data.fullName,
        phone: data.phone,
        email: data.hasNoEmail ? null : data.email,
        IsEffected: data.IsEffected,
      };

      // Apenas incluir campos de endereço se cliente é efetivado
      if (data.IsEffected) {
        payload.cep = normalizeCep(data.cep || "");
        payload.address = data.address || "";
        payload.city = data.city || "";
        payload.state = data.state || "";
        payload.neighborhood = data.neighborhood || "";
        payload.number = data.number || "";
        payload.complement = data.complement || "";
        payload.document = normalizeDocument(data.document.cpfCnpj || "");
      } else {
        // Cliente não efetivado: deixar campos vazios
        payload.cep = null;
        payload.address = null;
        payload.city = null;
        payload.state = null;
        payload.neighborhood = null;
        payload.number = null;
        payload.complement = null;
        payload.document = null;
      }

      if (initialData && buyerId) {
        const response = await axios.patch(`/api/buyers/${buyerId}`, payload);
        const updatedBuyer = response.data;
        toast.success("Comprador atualizado com sucesso!");

        if (isModal && onBuyerCreated) {
          onBuyerCreated(updatedBuyer);
          return;
        }
      } else {
        try {
          const response = await axios.post("/api/buyers", payload);
          const createdBuyer = response.data;
          toast.success("Comprador cadastrado com sucesso!");

          if (isModal && onBuyerCreated) {
            onBuyerCreated(createdBuyer);
            return;
          }
        } catch (error: any) {
          if (error.response?.status === 409) {
            toast.error(error.response.data.error);
          } else {
            toast.error("Erro ao cadastrar comprador.");
          }
          return;
        }
      }

      if (!isModal) {
        router.refresh();
        router.push("/dashboard/buyers");
      }
    } catch (error) {
      toast.error("Erro ao salvar comprador: " + error);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      if (buyerId) {
        await axios.delete(`/api/buyers/${buyerId}`);
        toast.success("Comprador deletado");
        router.push("/dashboard/buyers");
        router.refresh();
      }
    } catch (error) {
      toast.error("Delete todas as compras desse cliente antes de deletá-lo!");
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
            {/* IsEffected Checkbox */}
            <RoleGateNoMessage allowedRoles={[UserRole.ADMIN, UserRole.OWNER]}>
            <FormField
              control={form.control}
              name="IsEffected"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <input
                      id="IsEffected"
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="w-4 h-4"
                    />
                  </FormControl>
                  <FormLabel htmlFor="IsEffected" className="mb-0 font-medium cursor-pointer">
                    Cliente efetivado
                  </FormLabel>
                </FormItem>
              )}
            />
</RoleGateNoMessage>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Nome e Telefone - Sempre visíveis */}
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        disabled={loading}
                        placeholder="Digite o nome completo"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        disabled={loading}
                        placeholder="Digite o telefone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campos adicionais - Apenas se cliente efetivado */}
              {isEffected && (
                <>
                  <FormField
                    control={form.control}
                    name="cep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            disabled={loading || cepLoading}
                            placeholder="Digite o CEP"
                            onBlur={handleCepBlur}
                            autoComplete="postal-code"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rua</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            disabled={loading}
                            placeholder="Digite a rua"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="neighborhood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bairro</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            disabled={loading}
                            placeholder="Digite o bairro"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            disabled={loading}
                            placeholder="Digite o número"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="complement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            disabled={loading}
                            placeholder="Digite o complemento"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            disabled={loading}
                            placeholder="Digite a cidade"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            disabled={loading}
                            placeholder="Digite o estado"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="document.cpfCnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF ou CNPJ</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            disabled={loading}
                            placeholder="Digite o CPF ou CNPJ"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Email field */}
              <div className="flex flex-col">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          disabled={loading || form.watch("hasNoEmail")}
                          placeholder="Digite o email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hasNoEmail"
                  render={({ field }) => (
                    <FormItem className="mt-2 flex justify-start">
                      <FormControl>
                        <input
                          id="hasNoEmail"
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="ml-2"
                        />
                      </FormControl>
                      <FormLabel htmlFor="hasNoEmail" className="ml-2">
                        Cliente não tem email?
                      </FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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