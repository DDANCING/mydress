"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getContractsById } from "@/actions/get-contracts-by-id";
import { getNextInvoiceNumber } from "@/actions/get-next-invoice-number";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { ResendNfeEmail } from "./resend-nfe-email";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { IconInvoice } from "@tabler/icons-react";
import { CartaCorrecaoNfe } from "./carta-correcao-nfe";
import { CancelNfe } from "./cancel-nfe";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdditionalData {
  operationNature: string;
  serie: number;
  number?: number;
  itemsTaxDetails?: {
    productId: string;
    sku: string;
    cfop: number;
    ncm: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
  }[];
}

interface NFECellProps {
  contractId: string;
  haveNfe?: boolean;
  nfeKey?: string;
  buyerEmail?: string;
}

export const CellActionNFE: React.FC<NFECellProps> = ({ contractId, haveNfe, nfeKey, buyerEmail }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [buyer, setBuyer] = useState<any>(null);
  const [contractItems, setContractItems] = useState<any[]>([]);
  const [contractDiscount, setContractDiscount] = useState<number>(0);
  const [contractTotal, setContractTotal] = useState<number>(0);
  const [contractType, setContractType] = useState<string>("");

  const [operationNature, setOperationNature] = useState("");
  const [serie, setSerie] = useState(1);
  const [number, setNumber] = useState<number | undefined>(undefined);
  const [isNumberLoading, setIsNumberLoading] = useState(false);
  const [itemsTaxDetails, setItemsTaxDetails] = useState<
    {
      productId: string;
      sku: string;
      cfop: number;
      ncm: string;
      quantity: number;
      unitPrice: number;
      discount: number;
      subtotal: number;
    }[]
  >([]);

  const router = useRouter();

  const handleOpenModal = async () => {
    setOpen(true);
    setLoading(true);
    setIsNumberLoading(true);
    
    try {
      // Buscar próximo número da nota fiscal
      const invoiceNumberResult = await getNextInvoiceNumber();
      if (invoiceNumberResult.success) {
        setNumber(invoiceNumberResult.nextNumber);
      } else {
        toast.error(invoiceNumberResult.error || "Erro ao buscar próximo número da nota fiscal");
      }
      
      const res = await getContractsById({ contractId });

      if (res?.contract) {
        setBuyer(res.contract.buyer);
        setContractItems(res.contract.contractItems);
        setContractType(res.contract.type);
        
        // Auto-preencher campos baseado no tipo do contrato
        const contractType = res.contract.type;
        if (contractType === "RENTAL" || contractType === "clothingRENTAL") {
          setOperationNature("Remessa para locação");
        } else if (contractType === "SALE" || contractType === "ClothingSALE") {
          setOperationNature("Venda de mercadoria");
        }
        
        // Store contract discount for reference
        const contractDiscount = Number(res.contract.discount) || 0;
        setContractDiscount(contractDiscount);
        
        // Calculate contract total before discount
        const items = res.contract.contractItems;
        const itemsWithCalculatedValues = items.map((item: any) => {
          // Use rentalValue for rental contracts, unitPrice for sale contracts
          const unitPrice = res.contract.type === 'RENTAL' || res.contract.type === 'clothingRENTAL'
            ? Number(item.product.rentalValue || 0)
            : Number(item.unitPrice);
          
          return {
            ...item,
            calculatedQuantity: Number(item.quantity),
            calculatedUnitPrice: unitPrice,
            calculatedSubtotal: Number(item.quantity) * unitPrice,
          };
        });
        
        // Calculate total subtotal of all items (before discount)
        const totalBeforeDiscount = itemsWithCalculatedValues.reduce(
          (sum: number, item: any) => sum + item.calculatedSubtotal, 
          0
        );
        
        setContractTotal(totalBeforeDiscount);
        
        // Apply proportional discount to each item
        setItemsTaxDetails(
          itemsWithCalculatedValues.map((item: any) => {
            // Calculate percentage of this item in the total
            const itemPercentage = totalBeforeDiscount > 0 
              ? item.calculatedSubtotal / totalBeforeDiscount 
              : 0;
            
            // Calculate proportional discount for this item
            const itemDiscount = contractDiscount > 0
              ? Number((itemPercentage * contractDiscount).toFixed(2))
              : 0;
            
            // Calculate subtotal after discount
            const subtotalAfterDiscount = item.calculatedSubtotal - itemDiscount;
            
            // Use rentalValue for rental contracts, price for sale contracts
            const unitPrice = res.contract.type === 'RENTAL' || res.contract.type === 'clothingRENTAL'
              ? Number(item.product.rentalValue || 0)
              : Number(item.unitPrice);
            
            // Define CFOP baseado no tipo do contrato
            const cfop = res.contract.type === 'RENTAL' || res.contract.type === 'clothingRENTAL' ? 5949 : 5102;

            return {
              productId: item.product.id,
              sku: item.product.sku ?? "",
              cfop: cfop,
              ncm: "",
              quantity: item.calculatedQuantity,
              unitPrice: unitPrice,
              discount: itemDiscount,
              subtotal: subtotalAfterDiscount,
            };
          })
        );
      } else {
        toast.error(res?.error ?? "Erro ao buscar dados do contrato.");
        setOpen(false);
      }
    } catch (err) {
      toast.error("Falha ao buscar contrato.");
      setOpen(false);
    } finally {
      setLoading(false);
      setIsNumberLoading(false);
    }
  };

  const handleItemTaxChange = (
    index: number,
    field: "cfop" | "ncm" | "quantity" | "unitPrice" | "discount",
    value: string | number
  ) => {
    setItemsTaxDetails((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          let updatedItem = { ...item, [field]: value };
          if (
            field === "quantity" ||
            field === "unitPrice" ||
            field === "discount"
          ) {
            updatedItem.subtotal =
              Number(updatedItem.quantity) * Number(updatedItem.unitPrice) -
              Number(updatedItem.discount ?? 0);
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const onIssueNfe = async () => {
    setLoading(true);
    const additionalData: AdditionalData = {
      operationNature,
      serie,
      number,
      itemsTaxDetails,
    };

    try {
      const response = await axios.post("/api/invoices", {
        contractId,
        additionalData,
      });

      if (response.status >= 200 && response.status < 300) {
        toast.success("Nota fiscal solicitada!");
        setOpen(false);
        router.refresh();
      } else {
        throw new Error("Erro ao solicitar nota fiscal.");
      }
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as any).response?.status === 422
      ) {
        toast.error("A nota fiscal já foi autorizada.");
      } else if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as any).response?.data?.error
      ) {
        const errorMessage = (error as any).response.data.error;
        if (errorMessage.includes("Duplicidade de NF-e") || errorMessage.includes("539")) {
          toast.error("Número da nota fiscal já existe. Tente usar um número diferente ou deixe em branco para autogeração.");
        } else {
          toast.error(`Erro: ${errorMessage}`);
        }
      } else {
        toast.error("Não foi possível emitir nota fiscal.");
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate total values for the summary
  const totalQuantity = itemsTaxDetails.reduce((sum, item) => sum + Number(item.quantity), 0);
  const totalAmount = itemsTaxDetails.reduce((sum, item) => sum + Number(item.subtotal), 0);
  const totalDiscount = itemsTaxDetails.reduce((sum, item) => sum + Number(item.discount), 0);

  if (haveNfe) {
     return (
       <DropdownMenu>
         <DropdownMenuTrigger  asChild>
           <Button variant="ghost" className="mx-4" >
             <IconInvoice className="h-4 w-4" />
             <span>Ações da NF-e</span>
           </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent className="flex flex-col items-start">
           
             <ResendNfeEmail
               contractId={contractId}
               haveNfe={haveNfe}
               buyerEmail={buyerEmail}
             />
          
           
              <CartaCorrecaoNfe
                contractId={contractId}
              />
            
              <CancelNfe
                contractId={contractId}
              />
    
         </DropdownMenuContent>
       </DropdownMenu>
    );
  }
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleOpenModal}
        disabled={loading}
        className="mx-4"
      >
        Emitir Nota Fiscal
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl lg:max-w-4xl p-3 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg sm:text-xl">Emitir Nota Fiscal</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Informe os dados fiscais complementares para emitir a nota fiscal.
            </DialogDescription>
            {contractType && (
              <div className="mt-3">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Tipo: <span className="font-semibold">
                    {contractType === "RENTAL" ? "Aluguel" : contractType === "clothingRENTAL" ? "Aluguel de confecção" : contractType === "ClothingSALE" ? "Venda de confecção" : contractType === "SALE" ? "Venda" : contractType}
                  </span>
                </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(contractType === "RENTAL" || contractType === "clothingRENTAL") && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      CFOP: 5949
                    </span>
                  )}
                  {(contractType === "SALE" || contractType === "ClothingSALE") && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      CFOP: 5102
                    </span>
                  )}
                </div>
              </div>
            )}
          </DialogHeader>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general" className="text-xs sm:text-sm">Geral</TabsTrigger>
              <TabsTrigger value="items" className="text-xs sm:text-sm">Itens</TabsTrigger>
            </TabsList>

            {/* TAB 1: Dados Gerais */}
            <TabsContent value="general" className="space-y-4 mt-4">
              <h3 className="text-base sm:text-lg font-medium">Dados Gerais da Nota</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="operation-nature" className="text-xs sm:text-sm">Natureza da Operação</Label>
                  <Input
                    id="operation-nature"
                    value={operationNature}
                    onChange={(e) => setOperationNature(e.target.value)}
                    placeholder="Ex: Venda"
                    required
                    className="h-11 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serie" className="text-xs sm:text-sm">Série</Label>
                  <Input
                    id="serie"
                    type="number"
                    value={serie}
                    onChange={(e) => setSerie(Number(e.target.value))}
                    required
                    className="h-11 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number" className="text-xs sm:text-sm">Número NF-e</Label>
                  <Input
                    id="number"
                    type="number"
                    value={number ?? ""}
                    disabled={true}
                    className="h-11 sm:h-10 text-xs sm:text-sm bg-muted"
                    placeholder={isNumberLoading ? "Carregando..." : "Automático"}
                  />
                  <p className="text-xs text-muted-foreground">
                    📋 Gerado automaticamente
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: Itens */}
            <TabsContent value="items" className="space-y-4 mt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-base sm:text-lg font-medium">Dados Fiscais dos Itens</h3>
                {contractDiscount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Desconto: R$ {contractDiscount.toFixed(2)}
                  </p>
                )}
              </div>
              
              {/* Mobile: Cards */}
              <div className="block lg:hidden space-y-3">
                {contractItems.map((item, idx) => (
                  <Card key={item.id} className="bg-card p-3 space-y-3">
                    <div className="flex flex-col gap-2 border-b pb-2">
                      <p className="text-xs sm:text-sm font-semibold line-clamp-2">
                        {`${item.product.sku} - ${item.product.name.substring(0, 10)}${item.product.name.length > 20 ? '...' : ''}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Subtotal: R$ {itemsTaxDetails[idx]?.subtotal?.toFixed(2) ?? "0.00"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">CFOP</Label>
                        <Input
                          type="number"
                          value={itemsTaxDetails[idx]?.cfop ?? ""}
                          onChange={(e) => handleItemTaxChange(idx, "cfop", Number(e.target.value))}
                          placeholder="CFOP"
                          className="h-11 text-xs"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">NCM</Label>
                        <Input
                          value={itemsTaxDetails[idx]?.ncm ?? ""}
                          onChange={(e) => handleItemTaxChange(idx, "ncm", e.target.value)}
                          placeholder="NCM"
                          className="h-11 text-xs w-24"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Qtd</Label>
                        <Input
                          type="number"
                          value={itemsTaxDetails[idx]?.quantity ?? ""}
                          onChange={(e) => handleItemTaxChange(idx, "quantity", Number(e.target.value))}
                          placeholder="Qtd"
                          className="h-11 text-xs text-right"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Preço</Label>
                        <Input
                          type="number"
                          value={itemsTaxDetails[idx]?.unitPrice ?? ""}
                          onChange={(e) => handleItemTaxChange(idx, "unitPrice", Number(e.target.value))}
                          placeholder="Preço"
                          className="h-11 text-xs text-right"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Desc</Label>
                        <Input
                          type="number"
                          value={itemsTaxDetails[idx]?.discount ?? 0}
                          onChange={(e) => handleItemTaxChange(idx, "discount", Number(e.target.value))}
                          placeholder="Desc"
                          min={0}
                          step={0.01}
                          className="h-11 text-xs text-right"
                        />
                      </div>
                    </div>
                  </Card>
                ))}

                {/* Summary Cards */}
                <Card className="bg-muted/50 p-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Qtd</p>
                      <p className="text-sm font-semibold">{totalQuantity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Desconto</p>
                      <p className="text-sm font-semibold">R$ {totalDiscount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-sm font-semibold">R$ {totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Desktop: Table */}
              <div className="hidden lg:block overflow-x-auto">
                <Card className="bg-background p-2">
                  <CardContent className="p-0">
                    <Table className="text-xs">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[25%]">Produto</TableHead>
                          <TableHead>CFOP</TableHead>
                          <TableHead>NCM</TableHead>
                          <TableHead className="text-right">Qtd</TableHead>
                          <TableHead className="text-right">Preço Unit.</TableHead>
                          <TableHead className="text-right">Desconto</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contractItems.map((item, idx) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {`${item.product.sku} - ${item.product.name.substring(0, 20)}${item.product.name.length > 20 ? '...' : ''}`}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={itemsTaxDetails[idx]?.cfop ?? ""}
                                onChange={(e) => handleItemTaxChange(idx, "cfop", Number(e.target.value))}
                                placeholder="CFOP"
                                className="w-20 h-9 text-xs"
                                required
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={itemsTaxDetails[idx]?.ncm ?? ""}
                                onChange={(e) => handleItemTaxChange(idx, "ncm", e.target.value)}
                                placeholder="NCM"
                                className="w-32 h-9 text-xs"
                                required
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                value={itemsTaxDetails[idx]?.quantity ?? ""}
                                onChange={(e) => handleItemTaxChange(idx, "quantity", Number(e.target.value))}
                                placeholder="Qtd"
                                className="w-16 h-9 text-right text-xs"
                                required
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                value={itemsTaxDetails[idx]?.unitPrice ?? ""}
                                onChange={(e) => handleItemTaxChange(idx, "unitPrice", Number(e.target.value))}
                                placeholder="Preço"
                                className="w-24 h-9 text-right text-xs"
                                required
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                value={itemsTaxDetails[idx]?.discount ?? 0}
                                onChange={(e) => handleItemTaxChange(idx, "discount", Number(e.target.value))}
                                placeholder="Desconto"
                                min={0}
                                step={0.01}
                                className="w-20 h-9 text-right text-xs"
                              />
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              R$ {itemsTaxDetails[idx]?.subtotal?.toFixed(2) ?? "0.00"}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50">
                          <TableCell colSpan={3} className="font-medium text-xs">Total</TableCell>
                          <TableCell className="text-right font-medium text-xs">{totalQuantity}</TableCell>
                          <TableCell className="text-right"></TableCell>
                          <TableCell className="text-right font-medium text-xs">R$ {totalDiscount.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium text-xs">R$ {totalAmount.toFixed(2)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button onClick={onIssueNfe} disabled={loading} className="w-full sm:w-auto h-11 sm:h-10">
              {loading ? "Emitindo..." : "Emitir Nota Fiscal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};