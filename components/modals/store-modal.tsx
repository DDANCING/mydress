"use client"

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useStoreModal } from "@/hooks/use-store-modal"
import { Modal } from "@/components/modal"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import axios from "axios";


const formSchema = z.object({
    name: z.string().min(1),
});

export const StoreModal = () => {
    const StoreModal = useStoreModal(); 
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setLoading(true);

            const response = await axios.post('/api/stores', values);

            window.location.assign(`/dashboard/store/${response.data.id}`)
        } catch {
        toast("Algo deu errado!", {
          description: "Por favor aguarde e tente novamente mais tarde",
          action: {
            label: "Fechar",
            onClick: () => console.log("Undo"),
          },
        })
        } finally {
            setLoading(false)
        }
    }

    return (
    <Modal 
    title="Criar loja"
    description="adicione uma nova loja para adicionar produtos e categorias"
    isOpen={StoreModal.isOpen}
    onClose={StoreModal.onClose}
    >
    <div>
        <div className="space-y-4 py-2 pb-4">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <FormField control={form.control} name="name" render={({ field }) => ( 
                        <FormItem>
                            <FormLabel>
                                Nome
                            </FormLabel>
                            <FormControl>
                                <Input placeholder="E-Commerce" {...field}/>
                            </FormControl>
                            <FormMessage/>
                               
                        </FormItem>
                        )}/>
                        <div className="pt-6 space-x-2 flex items-center justify-end w-full">
                            <Button variant="outline" onClick={StoreModal.onClose}>
                                Cancelar
                            </Button>
                            <Button type="submit">
                                Continuar
                            </Button>
                        </div>
                </form>
            </Form>
        </div>
    </div>
    </Modal>
    );
};