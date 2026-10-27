"use client"

import { InvoiceColumn } from "./invoiceColumns";
import { Button } from "@/components/ui/button";
import { Mail, FileEdit, Trash2, Download, FileDown, FileType, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface InvoiceCellActionProps {
    data: InvoiceColumn;
    onUpdate?: (updatedData: Partial<InvoiceColumn>) => void;
}

export const InvoiceCellAction: React.FC<InvoiceCellActionProps> = ({
    data,
    onUpdate,
}) => {
    const [loading, setLoading] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [cartaCorrecaoDialogOpen, setCartaCorrecaoDialogOpen] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [emails, setEmails] = useState('');
    const [correcao, setCorrecao] = useState('');
    const [justificativa, setJustificativa] = useState('');

    const handleUpdateStatus = async () => {
        try {
            setUpdateLoading(true);
            
            const response = await axios.post(`/api/invoices/${data.id}/update-status`);
            
            if (response.data.status === 'já_autorizada') {
                toast.info(response.data.message);
                return;
            }
            
            if (response.data.status === 'autorizada' && response.data.chaveNfe) {
                toast.success("NFe autorizada! Chave salva com sucesso.");
                
                // Atualizar dados localmente se callback fornecido
                if (onUpdate) {
                    onUpdate({
                        chaveNfe: response.data.chaveNfe,
                        focusNfeStatus: response.data.focusNfeStatus
                    });
                } else {
                    // Fallback: recarregar página
                    window.location.reload();
                }
            } else if (response.data.status === 'processando') {
                toast.info(response.data.message);
            } else if (response.data.status === 'erro') {
                toast.error(response.data.message);
            } else if (response.data.status === 'cancelada') {
                toast.warning("Esta NFe foi cancelada");
                if (onUpdate && response.data.chaveNfe) {
                    onUpdate({
                        chaveNfe: response.data.chaveNfe,
                        focusNfeStatus: response.data.focusNfeStatus
                    });
                }
            } else if (response.data.status === 'denegada') {
                toast.error(response.data.message);
                if (onUpdate && response.data.chaveNfe) {
                    onUpdate({
                        chaveNfe: response.data.chaveNfe,
                        focusNfeStatus: response.data.focusNfeStatus
                    });
                }
            } else {
                toast.warning(response.data.message || "Status atualizado");
            }
            
        } catch (error: any) {
            console.error('Erro ao atualizar status:', error);
            
            if (error.response?.status === 404) {
                toast.error("NFe não encontrada na FocusNFe");
            } else if (error.response?.status === 400) {
                toast.error(error.response.data?.error || "Esta invoice não pode ser consultada");
            } else {
                toast.error(error.response?.data?.error || "Erro ao consultar status da NFe");
            }
        } finally {
            setUpdateLoading(false);
        }
    };

    const handleSendEmail = async () => {
        try {
            setLoading(true);
            const emailList = emails.split(',').map(email => email.trim()).filter(email => email);
            
            if (emailList.length === 0) {
                toast.error("Digite pelo menos um email");
                return;
            }

            await axios.post(`/api/invoices/${data.focusNfeRef}/email`, {
                emails: emailList
            });
            
            toast.success("Email enviado com sucesso!");
            setEmailDialogOpen(false);
            setEmails('');
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Erro ao enviar email");
        } finally {
            setLoading(false);
        }
    };

    const handleCartaCorrecao = async () => {
        try {
            setLoading(true);
            
            if (!correcao || correcao.length < 15 || correcao.length > 1000) {
                toast.error("Correção deve ter entre 15 e 1000 caracteres");
                return;
            }

            await axios.post(`/api/invoices/${data.focusNfeRef}/carta-correcao`, {
                correcao,
                data_evento: new Date().toISOString().split('T')[0]
            });
            
            toast.success("Carta de correção enviada com sucesso!");
            setCartaCorrecaoDialogOpen(false);
            setCorrecao('');
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Erro ao enviar carta de correção");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        try {
            setLoading(true);
            
            if (!justificativa || justificativa.length < 15 || justificativa.length > 255) {
                toast.error("Justificativa deve ter entre 15 e 255 caracteres");
                return;
            }

            await axios.delete(`/api/invoices/${data.focusNfeRef}/cancel`, {
                data: { justificativa }
            });
            
            toast.success("Nota fiscal cancelada com sucesso!");
            setCancelDialogOpen(false);
            setJustificativa('');
            // Refresh page to update status
            window.location.reload();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Erro ao cancelar nota fiscal");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (format: 'xml' | 'json' | 'pdf', type: 'nfe' | 'cancelamento' | 'carta_correcao' = 'nfe') => {
        try {
            setLoading(true);
            
            const response = await axios.get(`/api/invoices/${data.id}/download`, {
                params: { format, type },
                responseType: 'blob'
            });
            
            // Criar URL do blob e fazer download
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            // Definir nome do arquivo baseado no formato e tipo
            let filename = `nfe_${data.invoiceNumber}`;
            if (type === 'cancelamento') filename += '_cancelamento';
            if (type === 'carta_correcao') filename += '_carta_correcao';
            filename += `.${format}`;
            
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            toast.success(`${format.toUpperCase()} baixado com sucesso!`);
        } catch (error: any) {
            if (error.response?.status === 404) {
                toast.error("NFe não encontrada para download");
            } else {
                toast.error(error.response?.data?.error || "Erro ao fazer download");
            }
        } finally {
            setLoading(false);
        }
    };

    // Only show actions for NFE type and ACTIVE status
    const canPerformActions = data.type === 'NFE' && data.status === 'ACTIVE';
    const canDownload = data.chaveNfe && data.type !== 'ENTRADA'; // Pode baixar se tem chave NFe
    const canUpdate = data.type === 'NFE'; // Pode atualizar se tem ref mas não tem chave

    return (
        <>
            <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Enviar NFe por Email</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="emails">Emails (separados por vírgula)</Label>
                            <Input
                                id="emails"
                                value={emails}
                                onChange={(e) => setEmails(e.target.value)}
                                placeholder="email1@exemplo.com, email2@exemplo.com"
                                disabled={loading}
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                                Máximo 10 emails
                            </p>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setEmailDialogOpen(false)} disabled={loading}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSendEmail} disabled={loading}>
                                {loading ? "Enviando..." : "Enviar"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={cartaCorrecaoDialogOpen} onOpenChange={setCartaCorrecaoDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Carta de Correção</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="correcao">Texto da Correção</Label>
                            <Textarea
                                id="correcao"
                                value={correcao}
                                onChange={(e) => setCorrecao(e.target.value)}
                                placeholder="Descreva a correção que precisa ser feita..."
                                disabled={loading}
                                rows={4}
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                                Entre 15 e 1000 caracteres ({correcao.length}/1000)
                            </p>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setCartaCorrecaoDialogOpen(false)} disabled={loading}>
                                Cancelar
                            </Button>
                            <Button onClick={handleCartaCorrecao} disabled={loading}>
                                {loading ? "Enviando..." : "Enviar Correção"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancelar Nota Fiscal</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Esta ação não pode ser desfeita. A nota fiscal será cancelada permanentemente.
                        </p>
                        <div>
                            <Label htmlFor="justificativa">Justificativa do Cancelamento</Label>
                            <Textarea
                                id="justificativa"
                                value={justificativa}
                                onChange={(e) => setJustificativa(e.target.value)}
                                placeholder="Digite a justificativa para o cancelamento..."
                                disabled={loading}
                                rows={3}
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                                Entre 15 e 255 caracteres ({justificativa.length}/255)
                            </p>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={loading}>
                                Cancelar
                            </Button>
                            <Button variant="destructive" onClick={handleCancel} disabled={loading}>
                                {loading ? "Cancelando..." : "Confirmar Cancelamento"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <TooltipProvider>
                <div className="flex items-center gap-1">
                    {/* Botão Atualizar Status */}
                    {canUpdate && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={handleUpdateStatus}
                                    disabled={updateLoading}
                                >
                                    <RefreshCw className={`h-4 w-4 ${updateLoading ? 'animate-spin' : ''}`} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{updateLoading ? 'Consultando...' : 'Atualizar Status'}</p>
                            </TooltipContent>
                        </Tooltip>
                    )}

                    {/* Botões de Download */}
                    {canDownload && (
                        <>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => handleDownload('xml')}
                                        disabled={loading}
                                    >
                                        <FileType className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Download XML</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => handleDownload('json')}
                                        disabled={loading}
                                    >
                                        <FileDown className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Download JSON</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => handleDownload('pdf')}
                                        disabled={loading}
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Download PDF</p>
                                </TooltipContent>
                            </Tooltip>
                        </>
                    )}

                    {/* Ações para NFE ativas */}
                    {canPerformActions && (
                        <>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => setEmailDialogOpen(true)}
                                        disabled={loading}
                                    >
                                        <Mail className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Enviar por Email</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => setCartaCorrecaoDialogOpen(true)}
                                        disabled={loading}
                                    >
                                        <FileEdit className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Carta de Correção</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                        onClick={() => setCancelDialogOpen(true)}
                                        disabled={loading}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Cancelar NFe</p>
                                </TooltipContent>
                            </Tooltip>
                        </>
                    )}

                    {/* Mensagem quando não há ações disponíveis */}
                    {!canDownload && !canPerformActions && !canUpdate && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    disabled
                                >
                                    <span className="text-xs">-</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Nenhuma ação disponível</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </TooltipProvider>
        </>
    );
};