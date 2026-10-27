"use client"

import { DropdownMenu, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ContractColumn } from "./columns"
import { Button } from "@/components/ui/button";
import { Copy, Edit, MoreHorizontal, Trash, FileText } from "lucide-react";
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel } from "@radix-ui/react-dropdown-menu";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { AlertModal } from "@/components/modals/alert-modal";
import { CellActionNFE } from "./cell-action-nfe";
import { ResendNfeEmail } from "./resend-nfe-email";


interface CellActionProps {
    data: ContractColumn;
};

export const CellAction: React.FC<CellActionProps> = ({
    data,
}) => {
      const onCopy = (id: string) => {
        navigator.clipboard.writeText(id);
        toast.success("o id foi copiado para a área de transferência")
    }

    const onGenerateContract = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/contracts/${data.id}/generate-pdf`);
            
            if (!response.ok) {
                throw new Error('Erro ao gerar contrato');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Contrato_${data.buyerName.replace(/\s+/g, '')}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            toast.success("Contrato gerado com sucesso!");
        } catch (error) {
            toast.error("Erro ao gerar contrato.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }
    const router = useRouter();
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

     const onDelete = async () => {
        try {
            setLoading(true)
            await axios.delete(`/api/contracts/${data.id}`);
            router.refresh();
            toast.success("Contrato deletado.");
        } catch (error) {
            toast.error("aguarde um momento.")
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
        <CellActionNFE
        contractId={data.id}
        haveNfe={data.haveNfe}
        nfeKey={data.nfeKey}
        buyerEmail={data.buyerEmail}
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
                    Ações
                </DropdownMenuLabel>
                <DropdownMenuSeparator/>
                <DropdownMenuItem className="flex " onClick={() => router.push(`/dashboard/contracts/${data.id}`)} >
                    <Edit className="mr-2 h-4 w-4"/>
                    Atualizar
                </DropdownMenuItem>
                <DropdownMenuSeparator/>
                <DropdownMenuItem className="flex" onClick={onGenerateContract} disabled={loading}>
                    <FileText className="mr-2 h-4 w-4"/>
                    {loading ? "Gerando..." : "Gerar Contrato"}
                </DropdownMenuItem>
                <DropdownMenuSeparator/>
                 <DropdownMenuItem className="flex " onClick={() => {onCopy(data.id)}}>
                    <Copy className="mr-2 h-4 w-4"/>
                    Copiar ID
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