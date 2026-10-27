"use client"

import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { columns, FinanceColumn } from "./entryColumns"
import { DataTable } from "@/components/ui/data-table"

import { PlusIcon } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { ApiList } from "@/components/ui/api-list"
import { RoleGateNoMessage } from "@/components/auth/role-gate"
import { UserRole } from "@prisma/client"



interface FinanceClientProps {
  data: FinanceColumn[],
}

export const FinanceClient: React.FC<FinanceClientProps> = ({
  data
}) => {
  const router = useRouter();
  const params = useParams();

  return (
    <>
    <div className="flex items-center justify-between">
      <Heading
      title={`Entradas futuras (${data.length})`}
      description="Valores de entradas futuras"
      />
      
    </div>
    <Separator/>
    <DataTable placeholder="Buscar por Cliente..." searchKey="fullName" columns={columns} data={data}/>
   
    </>
  )
}

