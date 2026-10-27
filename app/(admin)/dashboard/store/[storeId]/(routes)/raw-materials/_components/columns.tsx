"use client"

import { ColumnDef } from "@tanstack/react-table"
import { CellAction } from "./cell-action"

export type RawMaterialColumn = {
  id: string;
  name: string;
  category: string;
  color: string;
  quantity: string; // Ex: "10 KG"
  isLowStock: boolean;
  pricePerUnit: string;
  supplier: string;
  createdAt: string;
}

export const columns: ColumnDef<RawMaterialColumn>[] = [
  {
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }) => {
        const name = row.getValue("name") as string;
        return <span className="font-medium">{name}</span>
    }
  },
  {
    accessorKey: "category",
    header: "Categoria",
  },
  {
    accessorKey: "quantity",
    header: "Quantidade",
    cell: ({ row }) => {
        const isLow = row.original.isLowStock;
        return (
            <div className={isLow ? "text-red-600 font-bold" : ""}>
                {row.getValue("quantity")}
                {isLow && <span className="ml-2 text-xs text-red-500">(Baixo)</span>}
            </div>
        )
    }
  },
  {
    accessorKey: "pricePerUnit",
    header: "Preço/Un",
  },
  {
    accessorKey: "supplier",
    header: "Fornecedor",
  },
  {
    accessorKey: "color",
    header: "Cor/Detalhe",
    cell: ({ row }) => (
      <div className="flex items-center gap-x-2">
        {row.original.color}
        {/* Se quiser tentar renderizar uma bolinha de cor caso seja um hex code válido, 
            você pode adicionar uma lógica aqui, mas deixei apenas texto por segurança */}
      </div>
    )
  },
  {
    accessorKey: "createdAt",
    header: "Data Cadastro",
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original}/>
  },
]