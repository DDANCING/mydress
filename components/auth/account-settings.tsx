"use client"

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form"
import { SettingsSchema } from "@/schemas";
import { settings } from "@/actions/settings";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransition, useState } from "react";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/data/hooks/use-current-user";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { SyncLoader } from "react-spinners";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useSession } from "next-auth/react";

export const AccountSettings = () => {
  const [error, setError] = useState<string | undefined>(); 
  const [success, setSuccess] = useState<string | undefined>();   
  const [isPending, startTransition] = useTransition();
  const user = useCurrentUser();
  const { update } = useSession();

  const form = useForm<z.infer<typeof SettingsSchema>>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      name: user?.name || undefined,
      email: user?.email || undefined,
      isTwoFactorEnabled: user?.isTwoFactorEnabled || undefined,
    }
  });

  const onSubmit = (values: z.infer<typeof SettingsSchema>) => {
    startTransition(() => {
      settings(values)
      .then((data) => {
        if (data.error) {
          setError(data.error)
          toast.error(data.error);
        }

        if (data.success) {
          update(); 
          setSuccess(data.success);
          toast.success(data.success);
        }
      })
      .catch(() => {
        setError("Algo deu errado!");
        toast.error("Algo deu errado!");
      });
    });
  }

  return (
    <Card className="shadow-sm bg-background">
      <CardHeader>
        <CardTitle>Configurações da Conta</CardTitle>
        <CardDescription>
          Gerencie suas informações pessoais e configurações de segurança.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form 
            className="space-y-6" 
            onSubmit={form.handleSubmit(onSubmit)}
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
                        {...field}
                        placeholder={user?.name || ""} 
                        disabled={isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {user?.isOAuth === false && (
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={user?.email || ""} 
                          disabled={isPending}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )} 

              {user?.isOAuth === false && (
                <FormField
                  control={form.control}
                  name="isTwoFactorEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Autenticação em Duas Etapas</FormLabel>
                        <FormDescription>
                          Ative a autenticação em duas etapas para sua conta.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch 
                          disabled={isPending}
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            <Button 
              variant="default" 
              disabled={isPending} 
              type="submit" 
              className="w-full sm:w-auto"
            > 
              {isPending ? <SyncLoader size={9} color="#ffffff"/> : "Salvar Alterações"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};