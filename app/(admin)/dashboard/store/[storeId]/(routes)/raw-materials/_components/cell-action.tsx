"use client";

import { DropdownMenu, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RawMaterialColumn } from "./columns";
import { Button } from "@/components/ui/button";
import { Copy, Edit, MoreHorizontal, Trash, QrCode } from "lucide-react";
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel } from "@radix-ui/react-dropdown-menu";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { AlertModal } from "@/components/modals/alert-modal";
import QRCode from "qrcode";
import jsPDF from "jspdf";

interface CellActionProps {
  data: RawMaterialColumn;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const onCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("ID copiado para a área de transferência");
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/${params.storeId}/raw-materials/${data.id}`);
      router.refresh();
      toast.success("Matéria-prima deletada.");
    } catch (error) {
      toast.error("Algo deu errado ao deletar.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const onGenerateQR = async () => {
    const productUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/store/${params.storeId}/raw-materials/${data.id}`;
    try {
      // Gera QR code que aponta direto para a URL do produto
      const qrDataUrl = await QRCode.toDataURL(productUrl);

      const pdf = new jsPDF();
      const size = 40; 

      pdf.text(`Material: ${data.name}`, 10, 10);
      pdf.text(`ID: ${data.id}`, 10, 18);
      pdf.addImage(qrDataUrl, "PNG", 10, 25, size, size);
      pdf.save(`material-${data.name}.pdf`);
      
      toast.success("QR Code gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar QR Code PDF", error);
      toast.error("Erro ao gerar o QR Code.");
    }
  };

  return (
    <>
      <AlertModal isOpen={open} onClose={() => setOpen(false)} onConfirm={onDelete} loading={loading} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-4 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-muted p-2 w-48 shadow-lg rounded-md border">
          <DropdownMenuLabel className="font-bold px-2 py-1">Ações</DropdownMenuLabel>
          <DropdownMenuSeparator className="my-1 border-b" />
          
          <DropdownMenuItem className="flex cursor-pointer hover:bg-slate-200 p-2 rounded-sm outline-none" onClick={() => router.push(`/dashboard/store/${params.storeId}/raw-materials/${data.id}`)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          
          <DropdownMenuItem className="flex cursor-pointer hover:bg-slate-200 p-2 rounded-sm outline-none" onClick={() => onCopy(data.id)}>
            <Copy className="mr-2 h-4 w-4" />
            Copiar ID
          </DropdownMenuItem>

          <DropdownMenuItem className="flex cursor-pointer hover:bg-slate-200 p-2 rounded-sm outline-none" onClick={onGenerateQR}>
            <QrCode className="mr-2 h-4 w-4" />
            Etiqueta QR (PDF)
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="my-1 border-b" />
          
          <DropdownMenuItem className="flex text-destructive cursor-pointer hover:bg-red-100 p-2 rounded-sm outline-none" onClick={() => setOpen(true)}>
            <Trash className="mr-2 h-4 w-4" />
            Deletar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};