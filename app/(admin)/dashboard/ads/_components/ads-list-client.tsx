"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, ArrowLeft, Plus, Loader2 } from "lucide-react";
import { getMarketingExpenses, deleteMarketingExpense } from "@/actions/marketing-expense";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MarketingExpenseData {
  id: string;
  duration: number;
  amount: number;
  platform: string;
  campaign: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function AdsListClient() {
  const [expenses, setExpenses] = useState<MarketingExpenseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    try {
      setLoading(true);
      const data = await getMarketingExpenses();
      setExpenses(data);
    } catch (error) {
      console.error("Erro ao carregar publicidades:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setDeletingId(id);
      await deleteMarketingExpense(id);
      setExpenses(expenses.filter((e) => e.id !== id));
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Erro ao deletar:", error);
    } finally {
      setDeletingId(null);
    }
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const totalSpent = expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gerenciar Publicidades</h1>
          <p className="text-sm text-muted-foreground">
            Controle seus investimentos em publicidade
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/overview">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <Link href="/dashboard/ads/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Publicidade
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total de Publicidades</p>
              <p className="text-2xl font-bold">{expenses.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gasto Total</p>
              <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gasto Médio por Dia</p>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  expenses.length > 0
                    ? expenses.reduce((sum, e) => sum + (e.amount ?? 0) / e.duration, 0) / expenses.length
                    : 0
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Publicidades Ativas</CardTitle>
          <CardDescription>
            Lista de todas as suas campanhas de publicidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma publicidade cadastrada ainda</p>
              <Link href="/dashboard/ads/new">
                <Button className="mt-4">Adicionar Primeira Publicidade</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plataforma</TableHead>
                    <TableHead>Campanha</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Duração (dias)</TableHead>
                    <TableHead className="text-right">Valor/Dia</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">
                        {expense.platform}
                      </TableCell>
                      <TableCell>
                        {expense.campaign || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(expense.amount ?? 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {expense.duration}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency((expense.amount ?? 0) / expense.duration)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(expense.createdAt), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeletingId(expense.id);
                            setShowDeleteDialog(true);
                          }}
                          disabled={deletingId === expense.id}
                        >
                          {deletingId === expense.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Publicidade</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta publicidade? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
