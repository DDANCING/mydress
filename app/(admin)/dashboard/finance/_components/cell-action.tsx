"use client"

import { FinanceColumn } from "./entryColumns";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { AlertModal } from "@/components/modals/alert-modal";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";


interface CellActionProps {
    data: FinanceColumn;
};

export const CellAction: React.FC<CellActionProps> = ({
    data,
}) => {
    const router = useRouter();
    const params = useParams();
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

     const onDelete = async () => {
        try {
            setLoading(true)
            await axios.delete(`/api/buyers/${data.id}`);
            router.refresh();
            toast.success("Cliente deletado.");
        } catch (error) {
            toast.error("aguarde um momento.")
        } finally {
            setLoading(false)
            setOpen(false)
        }
    }

    const handleEdit = () => {
        router.push(`/dashboard/contracts/${data.contractId}`);
    }

    return (
        <>
         <AlertModal 
                isOpen={open}
                onClose={() => setOpen(false)}
                onConfirm={onDelete}
                loading={loading}
                />
         
         <TooltipProvider>
            <div className="flex items-center gap-1">
                {/* Botão Editar */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={handleEdit}
                            disabled={loading}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Editar Contrato</p>
                    </TooltipContent>
                </Tooltip>
            </div>
         </TooltipProvider>
         </>
    )
}