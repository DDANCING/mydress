"use client"

import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { CategoriesColumn, columns } from "./columns"
import { DataTable } from "@/components/ui/data-table"

import { PlusIcon } from "lucide-react"
import { useParams, useRouter } from "next/navigation"


interface CategoryClientProps {
  data: CategoriesColumn[],
}

export const CategoryClient: React.FC<CategoryClientProps> = ({ 
  data
}) => {
  const router = useRouter();
  const params = useParams();

  return (
    <>
    <div className="flex items-center justify-between">
      <Heading
      title={`Categorias (${data.length})`}
      description="Gerencie categorias para sua loja"
      />
      <Button onClick={() => router.push(`/dashboard/store/${params.storeId}/categories/new`)}>
        <PlusIcon className="mr-2 h-4 w-4"/>
         <h1 className="hidden md:block">Nova categoria</h1>
      </Button>
    </div>
    <Separator/>
    <DataTable placeholder="Buscar por Categorias..." searchKey="name" columns={columns} data={data}/>
    </>
  )
}

