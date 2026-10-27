"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { InvoiceCellAction } from "./invoice-cell-action"


export type InvoiceColumn = {
  id: string
  invoiceNumber: number
  type: 'NFE' | 'DEVOLUCAO' | 'CANCELAMENTO' | 'ENTRADA'
  status: string
  clientName: string
  amount: string
  chaveNfe?: string
  focusNfeRef?: string
  focusNfeStatus?: string
  createdAt: string
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'NFE': return 'bg-blue-100 text-blue-800'
    case 'DEVOLUCAO': return 'bg-orange-100 text-orange-800'
    case 'CANCELAMENTO': return 'bg-red-100 text-red-800'
    case 'ENTRADA': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'bg-green-100 text-green-800'
    case 'CANCELLED': return 'bg-red-100 text-red-800'
    case 'PROCESSING': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getFocusNfeStatusColor = (status: string) => {
  switch (status) {
    case 'autorizado': return 'bg-green-100 text-green-800'
    case 'cancelado': return 'bg-red-100 text-red-800'
    case 'processando_autorizacao': return 'bg-yellow-100 text-yellow-800'
    case 'erro_autorizacao': return 'bg-red-100 text-red-800'
    case 'denegado': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export const invoiceColumns: ColumnDef<InvoiceColumn>[] = [
  {
    accessorKey: "invoiceNumber",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Número
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {row.getValue("invoiceNumber")}
        </div>
      )
    }
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => {
      const type = row.getValue("type") as string
      return (
        <Badge className={getTypeColor(type)}>
          {type === 'NFE' ? 'NFe' : 
           type === 'DEVOLUCAO' ? 'Devolução' : 
           type === 'ENTRADA' ? 'Entrada' :
           type === 'CANCELAMENTO' ? 'Cancelamento' :
           type}
        </Badge>
      )
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge className={getStatusColor(status)}>
          {status === 'ACTIVE' ? 'Ativa' :
           status === 'CANCELLED' ? 'Cancelada' :
           status || 'Desconhecido'}
        </Badge>
      )
    }
  },
  {
    accessorKey: "clientName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Cliente/Fornecedor
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    }
  },
  {
    accessorKey: "amount",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Valor
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {row.getValue("amount")}
        </div>
      )
    }
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Data
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    }
  },
  {
    accessorKey: "focusNfeStatus",
    header: "Status NFe",
    cell: ({ row }) => {
      const focusNfeStatus = row.getValue("focusNfeStatus") as string
      const chaveNfe = row.original.chaveNfe
      
      if (!focusNfeStatus && !chaveNfe) {
        return (
          <Badge className="bg-gray-100 text-gray-800">
            Não consultado
          </Badge>
        )
      }
      
      if (chaveNfe && !focusNfeStatus) {
        return (
          <Badge className="bg-green-100 text-green-800">
            Autorizada
          </Badge>
        )
      }
      
      const statusText = {
        'autorizado': 'Autorizada',
        'cancelado': 'Cancelada',
        'processando_autorizacao': 'Processando',
        'erro_autorizacao': 'Erro',
        'denegado': 'Denegada'
      }[focusNfeStatus] || focusNfeStatus || 'Desconhecido'
      
      return (
        <Badge className={getFocusNfeStatusColor(focusNfeStatus)}>
          {statusText}
        </Badge>
      )
    }
  },
  {
    id: "actions",
    header: "Ações",
    cell: ({ row }) => <InvoiceCellAction data={row.original} />
  }

]
