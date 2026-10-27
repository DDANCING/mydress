import { db } from "@/lib/db";
import * as z from "zod";
import { ScheduleType } from "@prisma/client";

export const SettingsSchema = z.object({
  name: z.optional(z.string()),
  isTwoFactorEnabled: z.optional(z.boolean()),
  email: z.optional(z.string().email()),
  password: z.optional(z.string().min(6)),
  newPassword: z.optional(z.string().min(6)),
})
.refine((data) => {
  if (data.password && !data.newPassword) {
    return false;
  }

  if (data.newPassword && !data.password) {
    return false;
  }

  return true;
}, {
  message: "New password is required!",
  path: ["newPassword"]
})
.refine((data) => {
  if (data.newPassword && !data.password) {
    return false;
  }


  return true;
}, {
  message: "password is required!",
  path: ["password"]
})


export const NewPasswordSchema = z.object({
  password: z.string().min(6, {
    message: "Minimum 6 characters required",

  }),
});

export const ResetSchema = z.object({
  email: z.string().email({
    message: "Email is required",

  }),


});
  export const LoginSchema = z.object({
    email: z.string().email({
      message: "Email is required",

    }),
    password: z.string().min(1, {
      message: "password is required",

    }),
    code: z.optional(z.string()),

  });
export const RegisterSchema = z.object({
  name: z.string().min(1, { message: "Nome é obrigatório" }),
  email: z.string().email({ message: "Email inválido" }),
  password: z
    .string()
    .min(8, { message: "A senha deve ter pelo menos 8 caracteres" })
    .regex(/[A-Z]/, { message: "A senha deve ter pelo menos uma letra maiúscula" })
    .regex(/[a-z]/, { message: "A senha deve ter pelo menos uma letra minúscula" })
    .regex(/[0-9]/, { message: "A senha deve ter pelo menos um número" })
    .regex(/[\W_]/, { message: "A senha deve ter pelo menos um símbolo" }),
});

export const ScheduleSchema = z.object({
  startDate: z.date({
    required_error: "Data de início é obrigatória",
  }),
  endDate: z.date({
    required_error: "Data de fim é obrigatória",
  }),
  type: z.nativeEnum(ScheduleType, {
    required_error: "Tipo é obrigatório",
  }),
  productId: z.string().optional(),
  buyerId: z.string().optional(),
  sellerId: z.string().optional(),
  contractId: z.string().optional(),
}).refine((data) => {
  // A data de fim deve ser depois da data de início
  return data.endDate > data.startDate;
}, {
  message: "Data de fim deve ser posterior à data de início",
  path: ["endDate"]
});

