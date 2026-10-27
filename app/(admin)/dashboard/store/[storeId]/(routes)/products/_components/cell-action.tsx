"use client";

import { DropdownMenu, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ProductColumn } from "./columns";
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
import { env } from "process";

interface CellActionProps {
  data: ProductColumn;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const onCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("O ID foi copiado para a área de transferência");
  };

  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/${params.storeId}/products/${data.id}`);
      router.refresh();
      toast.success("Produto deletado.");
    } catch (error) {
      toast.error("Algo deu errado.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const onGenerateQR = async () => {
    try {
      const productUrl = `${process.env.NEXT_PUBLIC_APP_URL}/product/${data.id}`;
      const qrDataUrl = await QRCode.toDataURL(productUrl);

      const pdf = new jsPDF();

     
      const size = 28.35;

      pdf.addImage(qrDataUrl, "PNG", 21, 21, size, size);
      pdf.text(`${data.sku}`, 28, 20);
      pdf.save(`produto-${data.id}.pdf`);
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
            <span className="sr-only">Abrir o menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-muted p-2">
          <DropdownMenuLabel className="font-bold">Ações</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex" onClick={() => router.push(`/dashboard/store/${params.storeId}/products/${data.id}`)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex" onClick={() => onCopy(data.id)}>
            <Copy className="mr-2 h-4 w-4" />
            Copiar ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex text-destructive" onClick={() => setOpen(true)}>
            <Trash className="mr-2 h-4 w-4" />
            Deletar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex" onClick={onGenerateQR}>
            <QrCode className="mr-2 h-4 w-4" />
            QR Code (PDF)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex" onClick={() => router.push(`/product/${data.id}`)}>
            <Edit className="mr-2 h-4 w-4" />
            Ver na loja
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
