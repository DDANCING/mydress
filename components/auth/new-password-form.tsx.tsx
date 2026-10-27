"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";

import { NewPasswordSchema } from "@/schemas/index";

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

import { CardWrapper } from "@/components/auth/card-wrapper";

import { FormSuccess } from "@/components/form-sucess";
import { newPassword } from "@/actions/new-password";
import { toast } from "sonner";


export const NewPasswordForm = ()  => {
  const  searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [error , setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition(); 

  const form = useForm<z.infer<typeof NewPasswordSchema>>({
    resolver: zodResolver(NewPasswordSchema),
    defaultValues: {
      password: "",
     
    },
  });

 const onSubmit = (values: z.infer<typeof NewPasswordSchema>) => {
  setError("");
  setSuccess("");

  startTransition(() => {
    newPassword(values, token)
      .then((data) => {
        if (data?.error) {
          setError(data.error);
          toast.error("Erro ao atualizar senha", {
            description: data.error,
            action: {
              label: "Fechar",
              onClick: () => console.log("Toast fechado"),
            },
          });
        }

        if (data?.success) {
          setSuccess(data.success);
          toast.success("Senha redefinida com sucesso!", {
            description: "Você já pode fazer login com a nova senha.",
            action: {
              label: "Fechar",
              onClick: () => console.log("Toast fechado"),
            },
          });
        }
      })
      .catch(() => {
        setError("Algo deu errado. Tente novamente.");
        toast.error("Erro inesperado", {
          description: "Tente novamente mais tarde.",
          action: {
            label: "Fechar",
            onClick: () => console.log("Toast fechado"),
          },
        });
      });
  });
};

  return(
    <CardWrapper
    headerLabel="Crie uma nova senha"
    backButtonLabel="Voltar para o login"
    backButtonHref="/auth/login"
    >
      <Form {...form}>
        <form   
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
        >
          <div className="space-y-4">
            <FormField 
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nova senha</FormLabel>
                <FormControl>
                  <Input
                  disabled={isPending}
                  {...field}
                  placeholder="******"
                  type="password"
                  />
                </FormControl>
                <FormMessage/>
              </FormItem>
            )}
            />
           
          </div>
          <FormSuccess message={success}/>
          <Button 
          disabled={isPending} 
          type="submit"
          className="h-12 w-full rounded-full text-[15px] font-medium"
          >  
          Salvar nova senha 
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
};