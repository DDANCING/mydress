"use client";

import { AlertModal } from "@/components/modals/alert-modal";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Heading } from "@/components/ui/heading";
import ImageUpload from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { zodResolver } from "@hookform/resolvers/zod";
import { Size } from "@prisma/client";
import axios from "axios";
import { Trash } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
    sizeName: z.string().min(1),
    value: z.string().min(1)
});

type SizeFormValues = z.infer<typeof formSchema>;

interface SizeFormProps {
    initialData: Size | null;
}

export const SizeForm: React.FC<SizeFormProps> = ({
    initialData
}) => { 
    const params = useParams();
    const router = useRouter();
    
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const form = useForm<SizeFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            sizeName: initialData?.name || "",
            value: initialData?.value || "",
    }
    }); 

    const title = initialData ? "Editar tamanho" : "Criar tamanho";
    const description = initialData ? "Edite um tamanho" : "Adicione um novo tamanho";
    const toastMessage = initialData ? "Tamanho atualizado." : "Tamanho criado.";
    const action = initialData ? "Salvar alterações" : "Criar tamanho";


    const onSubmit = async (data: SizeFormValues) => {
        try {
            setLoading(true);
            if (initialData) {
            await axios.patch(`/api/${params.storeId}/sizes/${params.sizeId}`, data);
            } else {
            await axios.post(`/api/${params.storeId}/sizes`, data);
            }
            router.refresh();
            router.push(`/dashboard/store/${params.storeId}/sizes`);
            toast.success(toastMessage);
        } catch(error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const onDelete = async () => {
        try {
            setLoading(true)
            await axios.delete(`/api/${params.storeId}/sizes/${params.sizeId}`);
            router.push(`/dashboard/store/${params.storeId}/sizes`);
            router.refresh();
            toast.success("Tamanho deletado.");
        } catch (error) {
            toast.error("certifique-se de que você removeu todas as produtos que tem este tamanho primeiro.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
        <AlertModal 
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onDelete}
        loading={loading}
        />
        <div className="flex items-center justify-between">
            <Heading 
            title={title}
            description={description}
            />
           {initialData && (
            <Button
                disabled={loading}
                variant="destructive"
                size="icon"
                onClick={() => setOpen(true)}
            >
                <Trash className="h-4 w-4"/>
            </Button>
        )}
        </div>
        <Separator/>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">

                <div className="grid grid-cols-3 gap-8">
                    <FormField 
                    control={form.control}
                    name="sizeName"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>
                                Nome
                            </FormLabel>
                            <FormControl>
                                <Input disabled={loading} placeholder="Nome para o tamanho" {...field}/>
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                    />
                    <FormField 
                    control={form.control}
                    name="value"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>
                                Medida
                            </FormLabel>
                            <FormControl>
                                <Input disabled={loading} placeholder="Medidas aproximadas" {...field}/>
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                    />
                </div>
                <Button disabled={loading} className="ml-auto" type="submit">
                    {action}
                </Button>
            </form>
        </Form>

        </>
    )
}
