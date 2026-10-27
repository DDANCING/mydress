import { db } from "@/lib/db";
import { formatDateForDisplay } from "@/lib/date-utils";
import { FinanceClient } from "./_components/entry-client";
import { OutFinanceClient } from "./_components/out-client";
import { InvoiceClient } from "./_components/invoice-client";
import { FinanceColumn } from "./_components/entryColumns";
import { formatter } from "@/lib/utils";
import { OutFinanceColumn } from "./_components/outColumns";
import { InvoiceColumn } from "./_components/invoiceColumns";
import { Separator } from "@/components/ui/separator";
import { ImportXmlComponent } from "./_components/import-xml";
import { ReturnNfeComponent } from "./_components/return-nfe";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BuyersPage = async () => {
  const financialEntries = await db.contractPayment.findMany({
    where: {
      isPaid: false,
    },
    orderBy: {
      paymentDate: "asc",
    },
    include: {
      contract: {
        include: {
          buyer: true,
          seller: true,
          contractPayments: true,
        },
      },
      paymentMethod: true,
    },
  });

  const formatedEntries: FinanceColumn[] = financialEntries.map((item) => {
    return {
      id: item.id,
      contractId: item.contract.id,
      fullName: item.contract.buyer.fullName,
      phone: item.contract.buyer.phone ?? "",
      email: item.contract.buyer.email ?? "",
      data: item.paymentDate ? formatDateForDisplay(item.paymentDate) : "",
      method: item.paymentMethod.name,
      isPaid: item.isPaid,
      value: formatter.format(item.amount.toNumber()),
      instalmentNumber: item.installmentNumber ?? 0,
    };
  });

  const financialOut = await db.outFinanceColumn.findMany({
    orderBy: {
      data: "desc",
    },
  });

  const formatedOut: OutFinanceColumn[] = financialOut.map((item) => {
    return {
      id: item.id,
      name: item.name,
      data: formatDateForDisplay(item.data),
      store: item.store,
      method: item.method,
      value: formatter.format(item.value.toNumber()),
      createdAt: formatDateForDisplay(item.createdAt),
    };
  });

  // Buscar invoices
  const invoices = await db.invoice.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      buyer: true,
      supplier: true,
    },
    take: 50, // Limitando a 50 registros para performance
  });

  const formatedInvoices: InvoiceColumn[] = invoices.map((item) => {
    return {
      id: item.id,
      invoiceNumber: item.invoiceNumber,
      type: item.type as 'NFE' | 'DEVOLUCAO' | 'CANCELAMENTO' | 'ENTRADA',
      status: item.nfeStatus || 'UNKNOWN',
      clientName: item.buyer?.fullName || item.supplier?.name || 'N/A',
      amount: formatter.format(item.amount.toNumber()),
      chaveNfe: item.chaveNfe || undefined,
      focusNfeRef: item.focusNfeRef || undefined,
      focusNfeStatus: item.focusNfeStatus || undefined,
      createdAt: formatDateForDisplay(item.createdAt),
    };
  });

  return (
    <div className="flex flex-1 flex-col ">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4  md:gap-6 ">
        
          
          {/* Abas principais */}
          <Tabs defaultValue="finance" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="finance">Financeiro</TabsTrigger>
              <TabsTrigger value="import">Importar</TabsTrigger>
              <TabsTrigger value="return">Devolução</TabsTrigger>
            </TabsList>
            
            <TabsContent value="finance" className="space-y-4">
              <div className=" md:flex gap-4 px-4 lg:px-6">
                <div className="w-full px-4 lg:px-6">
                  <FinanceClient data={formatedEntries} />
                </div>
                <Separator orientation="vertical" className="h-auto self-stretch hidden md:block" />
                <div className="w-full px-4 lg:px-6">
                  <OutFinanceClient data={formatedOut} />
                </div>
              </div>
              
              <Separator />
              <div className="px-4 lg:px-6">
                <InvoiceClient data={formatedInvoices} />
              </div>
            </TabsContent>
            
            <TabsContent value="import" className="space-y-4">
              <div className="px-4 lg:px-6">
                <ImportXmlComponent />
              </div>
            </TabsContent>
    
            <TabsContent value="return" className="space-y-4">
              <div className="px-4 lg:px-6">
                <ReturnNfeComponent />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default BuyersPage;