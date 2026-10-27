"use client"

import { useState } from "react"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { DataTable } from "@/components/ui/data-table"
import { invoiceColumns, InvoiceColumn } from "./invoiceColumns"

interface InvoiceClientProps {
  data: InvoiceColumn[]
}

export const InvoiceClient: React.FC<InvoiceClientProps> = ({
  data: initialData
}) => {
  const [data, setData] = useState<InvoiceColumn[]>(initialData)

  const handleUpdateInvoice = (invoiceId: string, updatedFields: Partial<InvoiceColumn>) => {
    setData(prevData => 
      prevData.map(invoice => 
        invoice.id === invoiceId 
          ? { ...invoice, ...updatedFields }
          : invoice
      )
    )
  }

  // Criar uma versão das colunas com o callback onUpdate
  const columnsWithUpdate = invoiceColumns.map(column => {
    if (column.id === 'actions') {
      return {
        ...column,
        cell: ({ row }: any) => {
          const InvoiceCellAction = require('./invoice-cell-action').InvoiceCellAction
          return (
            <InvoiceCellAction 
              data={row.original} 
              onUpdate={(updatedFields: Partial<InvoiceColumn>) => 
                handleUpdateInvoice(row.original.id, updatedFields)
              }
            />
          )
        }
      }
    }
    return column
  })

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Notas Fiscais (${data.length})`}
          description="Notas fiscais emitidas (NFe, Entrada, Devoluções, Cancelamentos)"
        />
      </div>
      <Separator/>
      <DataTable 
        placeholder="Buscar por cliente, número ou chave..." 
        searchKey="clientName" 
        columns={columnsWithUpdate} 
        data={data}
      />
    </>
  )
}
