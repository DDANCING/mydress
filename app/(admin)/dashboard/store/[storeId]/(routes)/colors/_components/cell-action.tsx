"use client"

import { DropdownMenu, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ColorColumn } from "./columns"
import { Button } from "@/components/ui/button";
import { Copy, Edit, MoreHorizontal, Trash } from "lucide-react";
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel } from "@radix-ui/react-dropdown-menu";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { AlertModal } from "@/components/modals/alert-modal";


interface CellActionProps {
    data: ColorColumn;
};

export const CellAction: React.FC<CellActionProps> = ({
    data,
}) => {
      const onCopy = (id: string) => {
        navigator.clipboard.writeText(id);
        toast.success("o id foi copiado para a área de transferência")
    }
    const router = useRouter();
    const params = useParams();
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

     const onDelete = async () => {
        try {
            setLoading(true)
            await axios.delete(`/api/${params.storeId}/colors/${data.id}`);
            router.refresh();
            toast.success("Cor deletada.");
        } catch (error) {
            toast.error("certifique-se de que você removeu todos os produtos que usam essa cor primeiro.")
        } finally {
            setLoading(false)
            setOpen(false)
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
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button  variant="ghost" className="h-4 w-8 p-0">
                   <span className="sr-only">Abrir o menu</span>
                   <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-muted p-2">
                <DropdownMenuLabel className="font-bold">
                    Opções
                </DropdownMenuLabel>
                <DropdownMenuSeparator/>
                <DropdownMenuItem className="flex " onClick={() => router.push(`/dashboard/store/${params.storeId}/colors/${data.id}`)} >
                    <Edit className="mr-2 h-4 w-4"/>
                    Atualizar
                </DropdownMenuItem>
                <DropdownMenuSeparator/>
                 <DropdownMenuItem className="flex " onClick={() => {onCopy(data.id)}}>
                    <Copy className="mr-2 h-4 w-4"/>
                    Copiar id
                </DropdownMenuItem>
                <DropdownMenuSeparator/>
                 <DropdownMenuItem className="flex text-destructive" onClick={() => setOpen(true)}>
                    <Trash className="mr-2 h-4 w-4"/>
                    Deletar
                </DropdownMenuItem>
            </DropdownMenuContent>
         </DropdownMenu>
         </>
    )
}