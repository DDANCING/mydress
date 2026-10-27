"use client"

import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { ColorColumn, columns } from "./columns"
import { DataTable } from "@/components/ui/data-table"

import { PlusIcon } from "lucide-react"
import { useParams, useRouter } from "next/navigation"


interface ColorsClientProps {
  data: ColorColumn[],
}

export const 
ColorsClient: React.FC<ColorsClientProps> = ({ 
  data
}) => {
  const router = useRouter();
  const params = useParams();

  return (
    <>
    <div className="flex items-center justify-between">
      <Heading
      title={`Cores (${data.length})`}
      description="Gerencie cores para seus produtos"
      />
      <Button onClick={() => router.push(`/dashboard/store/${params.storeId}/colors/new`)}>
        <PlusIcon className="mr-2 h-4 w-4"/>
         <h1 className="hidden md:block">Nova cor</h1>
      </Button>
    </div>
    <Separator/>
    <DataTable placeholder="Buscar por Cores..." searchKey="name" columns={columns} data={data}/>

    </>
  )
}

