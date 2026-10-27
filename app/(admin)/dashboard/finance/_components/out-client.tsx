"use client"

import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { DataTable } from "@/components/ui/data-table"

import { PlusIcon } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { outColumns } from "./outColumns"
import { OutFinanceColumn } from "./outColumns"



interface FinanceClientProps {
  data: OutFinanceColumn[],
}

export const OutFinanceClient: React.FC<FinanceClientProps> = ({
  data
}) => {
  const router = useRouter();
  const params = useParams();

  return (
    <>
    <div className="flex items-center justify-between">
      <Heading
      title={`Saídas (${data.length})`}
      description="Valor total de saídas financeiras registradas"
      />
      <Button onClick={() => router.push(`/dashboard/finance/new`)}>
        <PlusIcon className="mr-2 h-4 w-4"/>
        Nova saída
      </Button>
    </div>
    <Separator/>
    <DataTable placeholder="Buscar..." searchKey="name" columns={outColumns} data={data}/>
   
    </>
  )
}

