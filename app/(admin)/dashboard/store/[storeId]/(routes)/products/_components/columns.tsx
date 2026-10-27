"use client"

import { ColumnDef } from "@tanstack/react-table"

import { CellAction } from "./cell-action"

export type ProductColumn = {
  id: string;
  name: string;
  price: string;
  size: string;
  category: string;
  color: string;
  colorName: string;
  isFeatured: boolean;
  isArchived: boolean;
  createdAt: string;
  sku?: string;
}

export const columns: ColumnDef<ProductColumn>[] = [
  {
    accessorKey: "sku",
    header: "Código SKU",
  },
  {
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }) => {
      const productName = row.getValue("name") as string;
      if (productName && productName.length > 40) {
        return productName.substring(0, 40) + "...";
      }
      return productName;
    },
  },
  {
    accessorKey: "isArchived",
    header: "Arquivado",
  },
  {
    accessorKey: "isFeatured",
    header: "Destacado",
  },
  {
    accessorKey: "price",
    header: "Preço",
  },
  {
    accessorKey: "category",
    header: "Categoria",
  },
  {
    accessorKey: "size",
    header: "Tamanho",
  },
  {
    accessorKey: "color",
    header: "Cor",
    cell: ({ row }) => (
      <div className="flex items-center gap-x-2">
        {row.original.colorName}
        <div 
          className="h-6 w-6 rounded-full border" 
          style={{backgroundColor: row.original.color}}
        />
      </div>
    )
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
