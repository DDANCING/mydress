"use client"

import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { ContractColumn, contractColumns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { CalendarIcon, FileText, PlusIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { DateRange } from "react-day-picker"
import { addDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "sonner"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface ContractClientProps {
  data: ContractColumn[],
}

export const ContractClient: React.FC<ContractClientProps> = ({
  data
}) => {
  const router = useRouter();
  
  // Extrair todas as categorias únicas dos produtos
  const allCategories = Array.from(
    new Set(
      data
        .flatMap(contract => contract.productCategories || [])
    )
  ).sort();

  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2024, 0, 1),
    to: addDays(new Date(), 0),
  })
  const [openPDFDialog, setOpenPDFDialog] = useState(false)
  const [reportType, setReportType] = useState<"sales" | "production">("sales")
  const [selectedCategories, setSelectedCategories] = useState<Record<string, boolean>>(
    allCategories.reduce((acc, category) => ({
      ...acc,
      [category]: true,
    }), {})
  )
  const [productionOptions, setProductionOptions] = useState({
    producao: true,
    ajuste: true,
  })

  // Filtrar contratos apenas por período, sem remover cancelados ou pendentes
  const filteredData = date?.from && date?.to
    ? data.filter(contract => {
      try {
        // Para relatório de produção, usar data de entrega; para vendas, usar data de criação
        let contractDate = contract.createdAtRaw
        if (reportType === "production" && contract.deliveryDateRaw) {
          contractDate = contract.deliveryDateRaw
        }
        
        if (!contractDate || isNaN(contractDate.getTime())) {
          return false
        }
        const contractDateOnly = new Date(contractDate.getFullYear(), contractDate.getMonth(), contractDate.getDate())
        const fromDateOnly = new Date(date.from!.getFullYear(), date.from!.getMonth(), date.from!.getDate())
        const toDateOnly = new Date(date.to!.getFullYear(), date.to!.getMonth(), date.to!.getDate())
        
        if (contractDateOnly < fromDateOnly || contractDateOnly > toDateOnly) {
          return false
        }
        
        // Filtro adicional para relatório de produção
        if (reportType === "production") {
          const typeRaw = contract.typeRaw?.toUpperCase() || ""
          const isProducao = typeRaw.includes("CLOTHING")
          const isAjuste = !typeRaw.includes("CLOTHING")
          
          const shouldIncludeProducao = productionOptions.producao && isProducao
          const shouldIncludeAjuste = productionOptions.ajuste && isAjuste
          
          if (!shouldIncludeProducao && !shouldIncludeAjuste) {
            return false
          }
        }
        
        // Filtro de categoria de produtos
        const contractCategories = contract.productCategories || []
        const hasSelectedCategory = contractCategories.some(category => selectedCategories[category])
        if (!hasSelectedCategory) {
          return false
        }
        
        return true
      } catch (error) {
        return false
      }
    })
    : data

  // Função para gerar PDF organizado
  const generatePDF = () => {
    try {
      const pdf = new jsPDF()
      require("jspdf-autotable")

      pdf.setFontSize(18)
      let periodoTxt = ""
      if (date?.from && date?.to) {
        periodoTxt = `Relatório de ${reportType === "sales" ? "Vendas" : "Produção"} ${format(date.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(date.to, "dd/MM/yyyy", { locale: ptBR })}`
      } else {
        periodoTxt = `Relatório de ${reportType === "sales" ? "Vendas" : "Produção"}`
      }
      pdf.text(periodoTxt, 20, 20)

      const tableHeaders = [
        { header: "Cliente", dataKey: "buyerName" },
        { header: "Produto", dataKey: "productName" },
        { header: "Tipo", dataKey: "type" },
        { header: "Vendedor", dataKey: "seller" },
        { header: "Valor", dataKey: "totalAmount" },
        { header: reportType === "sales" ? "Data Criação" : "Data Entrega", dataKey: "createdAt" },
        { header: "Status", dataKey: "status" }
      ];

      // Ordenar dados conforme o tipo de relatório
      const sortedData = [...filteredData].sort((a, b) => {
        let dateA = a.createdAtRaw
        let dateB = b.createdAtRaw
        
        if (reportType === "production") {
          dateA = a.deliveryDateRaw || a.createdAtRaw
          dateB = b.deliveryDateRaw || b.createdAtRaw
        }
        
        if (!dateA || !dateB) return 0
        return new Date(dateA).getTime() - new Date(dateB).getTime()
      })

      const tableRows = sortedData.map((contract) => {
        let formattedDate = "Data inválida"
        try {
          let dateToUse = contract.createdAtRaw
          if (reportType === "production" && contract.deliveryDateRaw) {
            dateToUse = contract.deliveryDateRaw
          }
          
          if (dateToUse && !isNaN(dateToUse.getTime())) {
            formattedDate = format(dateToUse, "dd/MM/yyyy")
          }
        } catch {
          formattedDate = contract.createdAt
        }
        // Traduzir status
        const getStatusTranslation = (status: string) => {
          switch (status?.toLowerCase()) {
            case 'pending': return 'Pendente'
            case 'confirmed': return 'Confirmado'
            case 'delivered': return 'Entregue'
            case 'returned': return 'Devolvido'
            case 'canceled': return 'Cancelado'
            default: return status
          }
        }
        
        return {
          buyerName: contract.buyerName,
          productName: contract.productName,
          type: contract.type === "SALE" ? "Venda" : contract.type === "RENT" ? "Aluguel" : contract.type,
          seller: contract.sellerName || contract.sellerName || contract.status,
          totalAmount: `${contract.totalAmount}`,
          createdAt: formattedDate,
          status: getStatusTranslation(contract.status)
        }
      })

      autoTable(pdf, {
        head: [tableHeaders.map(h => h.header)],
        body: tableRows.map(row => [
          row.buyerName,
          row.productName,
          row.type,
          row.seller,
          row.totalAmount,
          row.createdAt,
          row.status
        ]),
        startY: 30,
        styles: {
          fontSize: 10,
          cellWidth: 'auto',
        },
      })

      // Cálculo por vendedor (excluindo contratos pendentes e cancelados)
      const vendedorMap: Record<string, number> = {}
      filteredData.forEach(contract => {
        // Só incluir contratos confirmados, entregues ou devolvidos
        const status = contract.status?.toLowerCase()
        if (status !== 'pending' && status !== 'canceled' && status !== 'pendente' && status !== 'cancelado') {
          const vendedor = contract.sellerName || contract.sellerName || contract.status || "N/A"
          let valor = 0
          try {
            valor = parseFloat(contract.totalAmount.replace(/[^\d,]/g, '').replace(',', '.'))
          } catch {}
          vendedorMap[vendedor] = (vendedorMap[vendedor] || 0) + valor
        }
      })

      let yPos = (pdf as any).lastAutoTable?.finalY || 80
      pdf.setFontSize(12)
      const resumoTxt = reportType === "sales" 
        ? "Resumo por vendedor (apenas contratos confirmados)" 
        : "Resumo por vendedor (apenas contratos confirmados/entregues/devolvidos)"
      pdf.text(resumoTxt, 20, yPos + 10)
      
      autoTable(pdf, {
        head: [["Vendedor", "Valor total"]],
        body: Object.entries(vendedorMap).map(([vendedor, valor]) => [
          vendedor,
          `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        ]),
        startY: yPos + 15,
        theme: 'striped',
        styles: { fontSize: 10 }
      })

      // Total geral (excluindo contratos pendentes e cancelados)
      const totalValue = Object.values(vendedorMap).reduce((acc, valor) => acc + valor, 0)
      yPos = (pdf as any).lastAutoTable?.finalY || yPos + 40
      pdf.setFontSize(13)
      pdf.text(`Valor total: R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, yPos + 10)

      const fileName = `relatorio_${reportType === "sales" ? "vendas" : "producao"}_${format(new Date(), "yyyy-MM-dd_HH-mm")}.pdf`
      pdf.save(fileName)

      toast.success("PDF gerado com sucesso!")
      setOpenPDFDialog(false)
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      toast.error("Erro ao gerar o PDF")
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Contratos (${filteredData.length})`}
          description="Contratos de locação e venda"
        />
        <div className="grid md:flex items-center gap-2">
          {/* Filtro de Data */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-10 md:w-[280px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                 <div className="hidden md:flex">
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "dd/MM/yyyy")} -{" "}
                      {format(date.to, "dd/MM/yyyy")}
                    </>
                  ) : (
                    format(date.from, "dd/MM/yyyy")
                  )
                ) : (
                  <span>Selecione o período</span>
                )}
               </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Botão Gerar PDF */}
          <Button
            onClick={() => setOpenPDFDialog(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            <h1 className="hidden md:block">Gerar PDF</h1>
          </Button>

          {/* Botão Novo Contrato */}
          <Button className="w-10 md:w-[200px]" onClick={() => router.push(`/dashboard/contracts/new`)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            <h1 className="hidden md:block">Novo contrato</h1>
          </Button>
        </div>
      </div>
      <Separator />
      <DataTable
        placeholder="Buscar por Cliente, sku ou produto"
        searchKey={{ buyerName: "Cliente", sku: "SKU", productName: "Produto" }}
        columns={contractColumns}
        data={filteredData}
      />

      {/* Dialog para seleção de tipo de relatório */}
      <Dialog open={openPDFDialog} onOpenChange={setOpenPDFDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Gerar Relatório</DialogTitle>
            <DialogDescription>
              Escolha o tipo de relatório e as opções desejadas
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Radio Group para tipo de relatório */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Tipo de Relatório</Label>
              <RadioGroup value={reportType} onValueChange={(value) => setReportType(value as "sales" | "production")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sales" id="sales" />
                  <Label htmlFor="sales" className="font-normal cursor-pointer">Relatório de Vendas</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="production" id="production" />
                  <Label htmlFor="production" className="font-normal cursor-pointer">Relatório de Produção</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Checkboxes para produção (visíveis apenas quando "Relatório de Produção" é selecionado) */}
            {reportType === "production" && (
              <div className="space-y-3 pl-6 border-l-2 border-gray-200">
                <Label className="text-base font-semibold">Opções de Produção</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="producao"
                    checked={productionOptions.producao}
                    onCheckedChange={(checked) =>
                      setProductionOptions((prev) => ({
                        ...prev,
                        producao: checked === true,
                      }))
                    }
                  />
                  <Label htmlFor="producao" className="font-normal cursor-pointer">
                    Produção (Confecção Venda/Aluguel)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ajuste"
                    checked={productionOptions.ajuste}
                    onCheckedChange={(checked) =>
                      setProductionOptions((prev) => ({
                        ...prev,
                        ajuste: checked === true,
                      }))
                    }
                  />
                  <Label htmlFor="ajuste" className="font-normal cursor-pointer">
                    Ajuste (Contratos normais sem confecção)
                  </Label>
                </div>
              </div>
            )}

            {/* Checkboxes para categorias de produtos */}
            {allCategories.length > 0 && (
              <div className="space-y-3 pl-6 border-l-2 border-gray-200">
                <Label className="text-base font-semibold">Categorias de Produtos</Label>
                {allCategories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={selectedCategories[category] || false}
                      onCheckedChange={(checked) =>
                        setSelectedCategories((prev) => ({
                          ...prev,
                          [category]: checked === true,
                        }))
                      }
                    />
                    <Label htmlFor={`category-${category}`} className="font-normal cursor-pointer">
                      {category}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setOpenPDFDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={generatePDF}
              disabled={
                (reportType === "production" && !productionOptions.producao && !productionOptions.ajuste) ||
                !Object.values(selectedCategories).some(v => v)
              }
            >
              Gerar PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
   
    </>
  )
}