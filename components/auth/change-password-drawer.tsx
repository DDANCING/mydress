"use client"

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form"
import { SettingsSchema } from "@/schemas";
import { settings } from "@/actions/settings";

import { Button } from "@/components/ui/button";
import { useTransition, useState } from "react";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/data/hooks/use-current-user";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SyncLoader } from "react-spinners";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { KeyRound } from "lucide-react";

export const ChangePasswordDrawer = () => {
  const [error, setError] = useState<string | undefined>(); 
  const [success, setSuccess] = useState<string | undefined>();   
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const user = useCurrentUser();
  const { update } = useSession();

  const form = useForm<z.infer<typeof SettingsSchema>>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      password: undefined,
      newPassword: undefined,
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
          form.reset();
          setIsOpen(false);
        }
      })
      .catch(() => {
        setError("Algo deu errado!");
        toast.error("Algo deu errado!");
      });
    });
  }

  // Só mostra o botão se não for OAuth
  if (user?.isOAuth !== false) {
    return null;
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <KeyRound className="mr-2 h-4 w-4" />
          Alterar Senha
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Alterar Senha</DrawerTitle>
            <DrawerDescription>
              Digite sua senha atual e a nova senha para fazer a alteração.
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="p-4 pb-0">
            <Form {...form}>
              <form 
                className="space-y-4" 
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha Atual</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="******" 
                          type="password"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Senha</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="******" 
                          type="password"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
          
          <DrawerFooter>
            <Button 
              onClick={form.handleSubmit(onSubmit)}
              disabled={isPending} 
              className="w-full"
            >
              {isPending ? <SyncLoader size={9} color="#ffffff"/> : "Alterar Senha"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};