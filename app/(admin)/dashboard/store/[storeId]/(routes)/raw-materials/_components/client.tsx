"use client"

import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { RawMaterialColumn, columns } from "./columns"
import { DataTable } from "@/components/ui/data-table"

import { PlusIcon } from "lucide-react"
import { useParams, useRouter } from "next/navigation"

interface RawMaterialClientProps {
  data: RawMaterialColumn[],
}

export const RawMaterialClient: React.FC<RawMaterialClientProps> = ({ 
  data
}) => {
  const router = useRouter();
  const params = useParams();

  return (
    <>
    <div className="flex items-center justify-between">
      <Heading
      title={`Matérias-Primas (${data.length})`}
      description="Gerencie o estoque de insumos da sua confecção"
      />
      <Button onClick={() => router.push(`/dashboard/store/${params.storeId}/raw-materials/new`)}>
        <PlusIcon className="mr-2 h-4 w-4"/>
        <h1 className="hidden md:block">Nova Matéria-prima</h1>
      </Button>
    </div>
    <Separator/>
    {/* Alterado searchKey para 'name' para facilitar a busca de materiais */}
    <DataTable placeholder="Buscar pelo nome..." searchKey="name" columns={columns} data={data}/>
    </>
  )
}