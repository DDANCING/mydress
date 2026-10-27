"use client";

import { AlertModal } from "@/components/modals/alert-modal";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Heading } from "@/components/ui/heading";
import ImageUpload from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

import { zodResolver } from "@hookform/resolvers/zod";
import { Billboard } from "@prisma/client";
import axios from "axios";
import { Trash } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
    label: z.string().min(1),
    imageUrl: z.string().min(1),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    callToActionText: z.string().optional(),
    callToActionHref: z.string().optional(),
});

type BillboardFormValues = z.infer<typeof formSchema>;

interface BillboardFormProps {
    initialData: (Billboard & { 
        callToAction?: { 
            text?: string | null; 
            href?: string | null 
        } | null 
    }) | null;
}

export const BillboardForm: React.FC<BillboardFormProps> = ({
    initialData
}) => { 
    const params = useParams();
    const router = useRouter();
    
    
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const form = useForm<BillboardFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData ? {
            label: initialData.label,
            imageUrl: initialData.imageUrl,
            subtitle: initialData.subtitle || "",
            description: initialData.description || "",
            callToActionText: initialData.callToAction?.text || "",
            callToActionHref: initialData.callToAction?.href || "",
        } : {
            label: "",
            imageUrl: "",
            subtitle: "",
            description: "",
            callToActionText: "",
            callToActionHref: "",
        }
    }); 

    const title = initialData ? "Editar outdoor" : "Criar outdoor";
    const description = initialData ? "Edite um outdoor" : "Adicione um novo outdoor";
    const toastMessage = initialData ? "Outdoor atualizado." : "Outdoor criado.";
    const action = initialData ? "Salvar alterações" : "Criar outdoor";

    const onSubmit = async (data: BillboardFormValues) => {
        try {
            setLoading(true);
            if (initialData) {
            await axios.patch(`/api/${params.storeId}/billboards/${params.billboardId}`, data);
            } else {
            await axios.post(`/api/${params.storeId}/billboards`, data);
            }
            router.refresh();
            router.push(`/dashboard/store/${params.storeId}/billboards`);
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
            await axios.delete(`/api/${params.storeId}/billboards/${params.billboardId}`);
            router.push("/dashboard");
            router.refresh();
            toast.success("Capa deletada.");
        } catch (error) {
            toast.error("certifique-se de que você removeu todas as categorias que usam essa capa primeiro.")
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
                 <FormField 
                    control={form.control}
                    name="imageUrl"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>
                                Imagem de fundo
                            </FormLabel>
                            <FormControl>
                               <ImageUpload 
                               value={field.value ? [field.value] : []}
                               disable={loading}
                               onChange={(url) => field.onChange(url)}
                               onRemove={() => field.onChange("")}
                               />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                    />
                <div className="grid grid-cols-3 gap-8">
                    <FormField 
                    control={form.control}
                    name="label"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>
                                Título Principal
                            </FormLabel>
                            <FormControl>
                                <Input disabled={loading} placeholder="Título do billboard" {...field}/>
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                    />
                    <FormField 
                    control={form.control}
                    name="subtitle"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>
                                Subtítulo (Opcional)
                            </FormLabel>
                            <FormControl>
                                <Input disabled={loading} placeholder="Subtítulo do billboard" {...field}/>
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                    />
                    
                </div>
                <FormField 
                control={form.control}
                name="description"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>
                            Descrição (Opcional)
                        </FormLabel>
                        <FormControl>
                            <Textarea disabled={loading} placeholder="Descrição detalhada do billboard" {...field}/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
                />
                <div className="grid grid-cols-2 gap-8">
                    <FormField 
                    control={form.control}
                    name="callToActionText"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>
                                Texto do Botão (Opcional)
                            </FormLabel>
                            <FormControl>
                                <Input disabled={loading} placeholder="Ex: Comprar Agora, Ver Mais..." {...field}/>
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                    />
                    <FormField 
                    control={form.control}
                    name="callToActionHref"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>
                                Link do Botão (Opcional)
                            </FormLabel>
                            <FormControl>
                                <Input disabled={loading} placeholder="https://..." {...field}/>
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
