"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { LoginSchema } from "@/schemas/index";

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
import { login } from "@/actions/login";
import Link from "next/link";



export const LoginForm = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const urlError = searchParams.get("error") === "OAuthAccountNotLinked"
    ? "Este e-mail já está cadastrado com outro método de login"
    : ""
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      login(values, callbackUrl)
        .then((data) => {
          if (data?.error) {
            form.reset();
            setError(data.error);
            toast.error("Credenciais inválidas", {
          description: "Verifique seu e-mail e senha e tente novamente",
          action: {
            label: "Fechar",
            onClick: () => console.log("Undo"),
          },
        }) 
          }

          if (data?.success) {
            form.reset();
            setSuccess(data.success);
             toast.success(data.success, {
          description: "Caso não tenha recebido o email, verifique sua caixa de spam 🗑️",
          action: {
            label: "Fechar",
            onClick: () => console.log("Undo"),
          },
        })
          }

          if (data?.twoFactor) {
            setShowTwoFactor(true);
          }
        })
        .catch(() => {
          setError("Algo deu errado. Tente novamente.");  
        });
    });
  };

  return (
    <CardWrapper
      headerLabel="Que bom te ver de novo"
      description="Entre para ver seus favoritos e acompanhar seus aluguéis."
      backButtonLabel={showTwoFactor ? "" : "Não tem conta? Criar conta"}
      backButtonHref="/auth/register"
      showSocial
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5"
        >
          <div className="space-y-4">
            {showTwoFactor && (
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de verificação</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isPending}
                        {...field}
                        placeholder="123456"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {!showTwoFactor && (
              <>
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
                      <Button
                        size="sm"
                        variant="link"
                        asChild
                        className="px-0 font-normal"
                      >
                        <Link href="/auth/reset">
                          Esqueceu a senha?
                        </Link>
                      </Button>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
          <FormSuccess message={success} />

          <Button
            disabled={isPending}
            type="submit"
            className="h-12 w-full rounded-full text-[15px] font-medium"
          >
            {showTwoFactor ? "Confirmar" : "Entrar"}
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
};