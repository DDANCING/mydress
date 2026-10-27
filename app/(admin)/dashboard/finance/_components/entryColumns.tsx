"use client"

import { ColumnDef } from "@tanstack/react-table"

import { CellAction } from "./cell-action"
import { Badge } from "@/components/ui/badge";

export type FinanceColumn = {
  id: string;
  contractId: string;
  fullName: string;
  data: string;
  email: string;
  method: string;
  phone: string;
  value: string;
  isPaid: boolean;
  instalmentNumber: number;
}

export const columns: ColumnDef<FinanceColumn>[] = [
  {
    accessorKey: "fullName",
    header: "Nome"
  },
  {
    accessorKey: "value",
    header: "Valor"
  },
  {
    accessorKey: "method",
    header: "Método",
  },
  {
    accessorKey: "instalmentNumber",
    header: "Parcela",
  },
  {
    accessorKey: "data",
    header: "Data do pagamento",
  },
  {
    accessorKey: "phone",
    header: "Telefone"
  },
  {
    accessorKey: "isPaid",
    header: "Pago",
    cell: ({ row }) => {
      const isPaid = row.original.isPaid;
      return (
        <Badge variant={isPaid ? "default" : "destructive"}>
          {isPaid ? "Pago" : "Pendente"}
        </Badge>
      );
    }
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original}/>
  },
]
