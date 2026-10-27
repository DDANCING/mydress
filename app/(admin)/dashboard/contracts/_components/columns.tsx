"use client"

import { ColumnDef } from "@tanstack/react-table"

import { CellAction } from "./cell-action"
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button";

export type ContractColumn = {
  id: string
  type: string
  typeRaw: string // Tipo original sem tradução, para filtros
  status: string
  buyerName: string
  productName: string
  sku?: string
  sellerName: string
  paymentMethod: string
  totalAmount: string
  deliveryDate: string
  deliveryDateRaw: Date // Adicionar data original para filtro
  createdAt: string
  createdAtRaw: Date // Adicionar data original para filtro
  haveNfe?: boolean // Adicionar campo para verificar se tem NFE
  nfeKey?: string // Adicionar chave da NFE
  buyerEmail?: string // Adicionar email do comprador
  productCategories?: string[] // Categorias dos produtos
}

export type OrderColumn = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  isPaid: boolean;
  method: string;
  totalAmount: string;
  sent: string;
  createdAt: string;
  installments: number;
  shippingMethod: string;
  shippingCost: number;
  totalPaid: number;
  coupon: {
    id: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    code: string;
  };
}

export const contractColumns: ColumnDef<ContractColumn>[] = [
  {
    accessorKey: "type",
    header: "Tipo",
  },
  {
    accessorKey: "status", 
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      
      const getStatusVariant = (status: string) => {
        switch (status) {
          case "PENDING":
            return "secondary";
          case "CONFIRMED":
            return "default";
          case "DELIVERED":
            return "outline";
          case "RETURNED":
            return "outline";
          case "CANCELED":
            return "destructive";
          default:
            return "secondary";
        }
      };

      const getStatusLabel = (status: string) => {
        switch (status) {
          case "PENDING":
            return "Pendente";
          case "CONFIRMED":
            return "Confirmado";
          case "DELIVERED":
            return "Entregue";
          case "RETURNED":
            return "Devolvido";
          case "CANCELED":
            return "Cancelado";
          default:
            return status;
        }
      };

      return (
        <Badge variant={getStatusVariant(status)}>
          {getStatusLabel(status)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "buyerName",
     header: "Cliente",
    cell: ({ row }) => {
      const buyerName = row.getValue("buyerName") as string;
      if (buyerName && buyerName.length > 20) {
        return buyerName.substring(0, 20) + "...";
      }
      return buyerName;
    },
  },
  {
    accessorKey: "sku",
    header: "SKU",
  },
  {
    accessorKey: "productName",
    header: "Produto",
    cell: ({ row }) => {
      const productName = row.getValue("productName") as string;
      if (productName && productName.length > 30) {
        return productName.substring(0, 30) + "...";
      }
      return productName;
    },
  },
  {
    accessorKey: "sellerName",
    header: "Vendedor",
  },
  {
    accessorKey: "totalPaid",
    header: "Total Pago",
  },
  {
    accessorKey: "totalAmount",
    header: "Valor Total",
  },
  {
    accessorKey: "deliveryDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-3"
      >
        Data de Entrega
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const value = row.getValue("deliveryDate");
      if (!value) return "";
      let date: Date | null = null;
      if (typeof value === "string" || value instanceof Date) {
        date = new Date(value);
      }
      if (!date || isNaN(date.getTime())) return "";
      return date.toLocaleDateString("pt-BR");
    },
    filterFn: (row, id) => {
      const cellValue = row.getValue(id);
      if (!cellValue) return false;
      let cellDate: Date | null = null;
      if (typeof cellValue === "string" || cellValue instanceof Date) {
        cellDate = new Date(cellValue);
      }
      if (!cellDate || isNaN(cellDate.getTime())) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return cellDate >= today;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Data de Criação",
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />  
  },
];
