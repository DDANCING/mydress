import { z } from "zod";
import { cpfCnpjSchema } from "@/schemas/validationSchema";

// Dados de entrega pedidos no checkout. O mesmo schema valida o formulário e a API.
export const checkoutBuyerSchema = z.object({
  fullName: z.string().trim().min(3, "Informe o nome completo"),
  phone: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length === 10 || value.length === 11, "Telefone com DDD inválido"),
  document: cpfCnpjSchema,
  cep: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length === 8, "CEP inválido"),
  address: z.string().trim().min(1, "Informe a rua"),
  number: z.string().trim().min(1, "Informe o número"),
  complement: z.string().trim().optional(),
  neighborhood: z.string().trim().min(1, "Informe o bairro"),
  city: z.string().trim().min(1, "Informe a cidade"),
  state: z.string().trim().length(2, "Use a sigla do estado (ex.: SC)").toUpperCase(),
});

export type CheckoutBuyerInput = z.input<typeof checkoutBuyerSchema>;
