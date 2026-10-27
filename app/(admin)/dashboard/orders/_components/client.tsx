"use client"

import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { OrderColumn, columns } from "./columns"
import { DataTable } from "@/components/ui/data-table"

import { PlusIcon } from "lucide-react"
import { useRouter } from "next/navigation"



interface OrderClientProps {
  data: OrderColumn[],
}

export const OrderClient: React.FC<OrderClientProps> = ({ 
  data
}) => {
  const router = useRouter();

  return (
    <>
    <div className="flex items-center justify-between">
      <Heading
      title={`Pedidos (${data.length})`}
      description="Pedidos de venda online"
      />
      <Button onClick={() => router.push(`/dashboard/orders/new`)}>
        <PlusIcon className="mr-2 h-4 w-4"/>
        Novo pedido
      </Button>
    </div>
    <Separator/>
    <DataTable placeholder="Buscar por Pedido..." searchKey="fullName" columns={columns} data={data}/>
   
    </>
  )
}

