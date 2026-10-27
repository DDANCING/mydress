"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useTransition } from "react";


import { ResetSchema } from "@/schemas/index";

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
import { reset } from "@/actions/reset";


export const ResetForm = ()  => {
 
  const [error , setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition(); 

  const form = useForm<z.infer<typeof ResetSchema>>({
    resolver: zodResolver(ResetSchema),
    defaultValues: {
      email: "",
     
    },
  });

  const onSubmit = (values: z.infer<typeof ResetSchema>) => {
   setError("");
   setSuccess("");

    

    startTransition(() => {
    reset(values)
     .then((data) => {
      setError(data?.error);
      setSuccess(data?.success);
     })
    });
  };

  return(
    <CardWrapper
    headerLabel="Esqueceu sua senha?"
    description="Informe seu e-mail e enviaremos um link para criar uma nova senha."
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
          Enviar link de redefinição
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
};