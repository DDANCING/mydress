"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, ArrowLeftRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ImportXmlComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [emitenteIE, setEmitenteIE] = useState("");
  const [emitenteIsIsento, setEmitenteIsIsento] = useState(false);
  
  // Estados para o modal de progresso
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.toLowerCase().endsWith('.xml')) {
        setSelectedFile(file);
      } else {
        toast.error("Por favor, selecione um arquivo XML válido");
        event.target.value = '';
      }
    }
  };

  const handleImportXml = async () => {
    if (!selectedFile) {
      toast.error("Por favor, selecione um arquivo XML");
      return;
    }

    setIsLoading(true);
    setShowProgressModal(true);
    setProgressValue(0);
    setProgressMessage("Iniciando processamento do XML...");

    try {
      // Etapa 1: Processar XML e criar lançamento financeiro
      setProgressValue(10);
      setProgressMessage("Processando arquivo XML...");

      const formData = new FormData();
      formData.append('xmlFile', selectedFile);
      
      // Adicionar informações da IE do emitente se fornecidas
      if (emitenteIsIsento) {
        formData.append('emitenteIE', 'ISENTO');
      } else if (emitenteIE.trim()) {
        formData.append('emitenteIE', emitenteIE.trim());
      }

      setProgressValue(30);
      setProgressMessage("Criando lançamento financeiro...");

      const entryResponse = await fetch('/api/invoices/entry', {
        method: 'POST',
        body: formData,
      });

      const entryData = await entryResponse.json();

      if (!entryResponse.ok || !entryData.success) {
        throw new Error(entryData.message || "Erro ao processar XML");
      }

      setProgressValue(50);
      setProgressMessage("Lançamento criado! Preparando dados para FocusNFe...");

      // Etapa 2: Enviar para FocusNFe usando os dados do XML processado
      if (entryData.data && entryData.data.invoiceData) {
        setProgressValue(60);
        setProgressMessage("Enviando nota fiscal para a SEFAZ via FocusNFe...");

        const generateResponse = await fetch('/api/invoices/entry/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entryData.data.invoiceData),
        });

        const generateData = await generateResponse.json();

        setProgressValue(80);
        setProgressMessage("Processando resposta da SEFAZ...");

        if (!generateResponse.ok || !generateData.success) {
          // Se falhou na FocusNFe, mas o lançamento foi criado, mostrar aviso
          if (generateData.error) {
            setProgressValue(100);
            setProgressMessage("Lançamento criado, mas houve erro ao enviar para SEFAZ");
            
            setTimeout(() => {
              setShowProgressModal(false);
              toast.warning(`Lançamento financeiro criado, mas erro na SEFAZ: ${generateData.error}`);
              
              // Reset form
              setSelectedFile(null);
              setEmitenteIE("");
              setEmitenteIsIsento(false);
              const fileInput = document.getElementById('xmlFile') as HTMLInputElement;
              if (fileInput) fileInput.value = '';
              
              window.location.reload();
            }, 2000);
            return;
          } else {
            throw new Error(generateData.error || "Erro ao enviar para FocusNFe");
          }
        }

        setProgressValue(95);
        setProgressMessage("Nota fiscal processada com sucesso!");

        // Sucesso completo
        setTimeout(() => {
          setProgressValue(100);
          setProgressMessage("Processo concluído com sucesso!");
          
          setTimeout(() => {
            setShowProgressModal(false);
            toast.success("Lançamento financeiro criado e nota fiscal enviada para SEFAZ com sucesso!");
            
            // Reset form
            setSelectedFile(null);
            setEmitenteIE("");
            setEmitenteIsIsento(false);
            const fileInput = document.getElementById('xmlFile') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
            
            window.location.reload();
          }, 1500);
        }, 1000);

      } else {
        // Se não tem dados para enviar para FocusNFe, só mostra sucesso do lançamento
        setProgressValue(100);
        setProgressMessage("Lançamento financeiro criado com sucesso!");
        
        setTimeout(() => {
          setShowProgressModal(false);
          toast.success("Lançamento financeiro criado com sucesso!");
          
          // Reset form
          setSelectedFile(null);
          setEmitenteIE("");
          setEmitenteIsIsento(false);
          const fileInput = document.getElementById('xmlFile') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
          
          window.location.reload();
        }, 2000);
      }

    } catch (error: any) {
      console.error('Erro no processo de importação:', error);
      setProgressValue(0);
      setProgressMessage("Erro no processamento");
      
      setTimeout(() => {
        setShowProgressModal(false);
        toast.error(error.message || "Erro interno. Tente novamente.");
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Importar XML de NF-e
        </CardTitle>
        <CardDescription>
          Faça upload de um arquivo XML de Nota Fiscal Eletrônica para criar um lançamento financeiro automaticamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="xmlFile">Arquivo XML da NF-e</Label>
          <Input
            id="xmlFile"
            type="file"
            accept=".xml"
            onChange={handleFileSelect}
            disabled={isLoading}
          />
          {selectedFile && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Arquivo selecionado: {selectedFile.name}
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        {/* Campos para ajustar IE do Emitente */}
        <div className="space-y-3 border-t pt-4">
          <Label className="text-base font-medium">Configuração IE do Emitente</Label>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="emitenteIsento"
              checked={emitenteIsIsento}
              onCheckedChange={(checked) => {
                setEmitenteIsIsento(checked as boolean);
                if (checked) {
                  setEmitenteIE("");
                }
              }}
              disabled={isLoading}
            />
            <Label htmlFor="emitenteIsento" className="text-sm font-normal">
              Marcar emitente como ISENTO de IE
            </Label>
          </div>
          
          {!emitenteIsIsento && (
            <div className="space-y-2">
              <Label htmlFor="emitenteIE">IE do Emitente (opcional)</Label>
              <Input
                id="emitenteIE"
                value={emitenteIE}
                onChange={(e) => setEmitenteIE(e.target.value)}
                placeholder="Informe a IE correta do emitente"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco para usar a IE do XML. Preencha para sobrescrever.
              </p>
            </div>
          )}
        </div>
        
        <Button
          onClick={handleImportXml}
          disabled={!selectedFile || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando XML...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Importar e Criar Lançamento
            </>
          )}
        </Button>
      </CardContent>
    </Card>

    {/* Modal de Progresso */}
    {showProgressModal && (
      <div className="fixed inset-0 bg-muted/50 backdrop-blur-lg flex items-center justify-center z-50">
        <div className="bg-background border rounded-lg p-6 w-96 max-w-[90vw]">
          <div className="flex items-center space-x-3 mb-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <h3 className="text-lg font-semibold">Processando XML</h3>
          </div>
          
          <div className="space-y-4">
            <Progress value={progressValue} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              {progressMessage}
            </p>
            <div className="text-center text-sm font-medium">
              {progressValue}% concluído
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
  );
}
