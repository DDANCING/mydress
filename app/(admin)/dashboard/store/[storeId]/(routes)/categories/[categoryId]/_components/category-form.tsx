"use client";

import { AlertModal } from "@/components/modals/alert-modal";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { zodResolver } from "@hookform/resolvers/zod";
import { Billboard, Category } from "@prisma/client";
import axios from "axios";
import { Trash } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
    name: z.string().min(1),
    billboardId: z.string().min(1),
});

type CategoryFormValues = z.infer<typeof formSchema>;

interface CategoryFormProps {
    initialData: Category | null;
    billboards: Billboard[];
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
    initialData, billboards,
}) => { 
    const params = useParams();
    const router = useRouter();
    
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || {
            name: "",
            billboardId: "",
        }
    }); 

    const title = initialData ? "Editar categoria" : "Criar categoria";
    const description = initialData ? "Edite uma categoria" : "Adicione uma nova categoria";
    const toastMessage = initialData ? "Categoria atualizada." : "Categoria criada.";
    const action = initialData ? "Salvar alterações" : "Criar categoria";


    const onSubmit = async (data: CategoryFormValues) => {
        try {
            setLoading(true);
            if (initialData) { 
            await axios.patch(`/api/${params.storeId}/categories/${params.categoryId}`, data);
            } else {
            await axios.post(`/api/${params.storeId}/categories`, data);
            }
            router.refresh();
            router.push(`/dashboard/store/${params.storeId}/categories`);
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
            await axios.delete(`/api/${params.storeId}/categories/${params.categoryId}`);
            router.push(`/dashboard/store/${params.storeId}/categories`);
            router.refresh();
            toast.success("Categoria deletada.");
        } catch (error) {
            toast.error("certifique-se de que você removeu todos os produtos que usam essa capa primeiro.")
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
                    name="name"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>
                                Nome
                            </FormLabel>
                            <FormControl>
                                <Input disabled={loading} placeholder="nome da categoria" {...field}/>
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                    />
                     <FormField 
                    control={form.control}
                    name="billboardId"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>
                                Outdoor
                            </FormLabel>
                           <Select disabled={loading} onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue defaultValue={field.value} placeholder="Selecione um outdoor"/>
                                </SelectTrigger>
                            </FormControl>
                                <SelectContent>
                                    {billboards.map((billboard) => (
                                        <SelectItem key={billboard.id} value={billboard.id}>
                                            {billboard.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                           </Select>
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
