"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useTransition } from "react";

import { RegisterSchema } from "@/schemas/index";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { CardWrapper } from "@/components/auth/card-wrapper"

import { FormSuccess } from "@/components/form-sucess";
import { register } from "@/actions/register"; // Assuming this is your server action
import { toast } from "sonner";

export const RegisterForm = () => {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      register(values)
        .then((data) => {
          if (data?.error) {
            setError(data.error);
            
            toast.error(data.error, {
          action: {
            label: "Fechar",
            onClick: () => console.log("Undo"),
          },
        })
          }

          if (data?.success) {
            setSuccess(data.success);
              toast.success(data.success, {
          description: "Caso não tenha recebido o email, verifique sua caixa de spam 🗑️",
          action: {
            label: "Fechar",
            onClick: () => console.log("Undo"),
          },
        })
          }
        })
        .catch(() => {
          setError("Algo deu errado. Tente novamente."); 
          toast.error("Algo deu errado. Tente novamente."); 
        });
    });
  };

  return (
    <CardWrapper
      headerLabel="Crie sua conta"
      description="Leva menos de um minuto. Depois é só escolher o vestido."
      backButtonLabel="Já tem conta? Entrar"
      backButtonHref="/auth/login"
      showSocial
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5"
        >
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isPending}
                      {...field}
                      placeholder="Como podemos te chamar?"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isPending}
                      {...field}
                      placeholder="seu@email.com"
                      type="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isPending}
                      {...field}
                      placeholder="******"
                      type="password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* You can still keep FormSuccess and FormError for other visual cues */}
          <FormSuccess message={success} />
          {/* You might want a FormError here as well if you have specific error displays */}
          {/* <FormError message={error} /> */}
          <Button
            disabled={isPending}
            type="submit"
            className="h-12 w-full rounded-full text-[15px] font-medium"
          >
            Criar conta
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
};