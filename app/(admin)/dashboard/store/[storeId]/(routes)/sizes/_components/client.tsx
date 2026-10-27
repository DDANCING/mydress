"use client"

import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { SizeColumn, columns } from "./columns"
import { DataTable } from "@/components/ui/data-table"

import { PlusIcon } from "lucide-react"
import { useParams, useRouter } from "next/navigation"

interface SizesClientProps {
  data: SizeColumn[],
}

export const SizesClient: React.FC<SizesClientProps> = ({ 
  data
}) => {
  const router = useRouter();
  const params = useParams();

  return (
    <>
    <div className="flex items-center justify-between">
      <Heading
      title={`Tamanhos (${data.length})`}
      description="Gerencie tamanhos para seus produtos"
      />
      <Button onClick={() => router.push(`/dashboard/store/${params.storeId}/sizes/new`)}>
        <PlusIcon className="mr-2 h-4 w-4"/>
         <h1 className="hidden md:block">Novo tamanho</h1>
      </Button>
    </div>
    <Separator/>
    <DataTable placeholder="Buscar por Tamanhos..." searchKey="name" columns={columns} data={data}/>
    </>
  )
}

