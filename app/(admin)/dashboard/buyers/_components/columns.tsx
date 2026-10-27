"use client"

import { ColumnDef } from "@tanstack/react-table"

import { CellAction } from "./cell-action"
import { Badge } from "@/components/ui/badge";

export type BuyerColumn = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  createdAt: string;
}

export const columns: ColumnDef<BuyerColumn>[] = [
  {
    accessorKey: "fullName",
    header: "Nome"
  },
  {
    accessorKey: "email",
    header: "Email"
  },
  {
    accessorKey: "phone",
    header: "Telefone"
  },
  {
    accessorKey: "createdAt",
    header: "Data",
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original}/>
  },
]
