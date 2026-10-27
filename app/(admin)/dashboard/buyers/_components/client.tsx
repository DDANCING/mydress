"use client"

import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { BuyerColumn, columns } from "./columns"
import { DataTable } from "@/components/ui/data-table"

import { PlusIcon } from "lucide-react"
import { useParams, useRouter } from "next/navigation"


interface BuyerClientProps {
  data: BuyerColumn[],
}

export const BuyerClient: React.FC<BuyerClientProps> = ({ 
  data
}) => {
  const router = useRouter();

  return (
    <>
    <div className="flex items-center justify-between">
      <Heading
      title={`Clientes (${data.length})`}
      description=""
      />
      <Button onClick={() => router.push(`/dashboard/buyers/new`)}>
        <PlusIcon className="mr-2 h-4 w-4"/>
        Novo cliente
      </Button>
    </div>
    <Separator/>
    <DataTable placeholder="Buscar por Cliente..." searchKey="fullName" columns={columns} data={data}/>
  
    </>
  )
}

