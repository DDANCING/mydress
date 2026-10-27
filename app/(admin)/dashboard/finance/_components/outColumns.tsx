"use client"

import { ColumnDef } from "@tanstack/react-table"
import { OutCellAction } from "./out-cell-action";


export type OutFinanceColumn = {
  id: string;
  name: string;
  data: string;
  store: string;
  method: string;
  value: string;
  createdAt: string;
}

export const outColumns: ColumnDef<OutFinanceColumn>[] = [
  {
    accessorKey: "name",
    header: "Nome"
  },
  {
    accessorKey: "data",
    header: "Data do pagamento",
  },
  {
    accessorKey: "store",
    header: "Loja"
  },
  {
    accessorKey: "value",
    header: "Valor",
  },
  {
    accessorKey: "createdAt",
    header: "Data de criação",
  },
  {
    id: "actions",
    cell: ({ row }) => <OutCellAction data={row.original}/>
  },

]
