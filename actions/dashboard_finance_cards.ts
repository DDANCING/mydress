"use server";

import { db } from "@/lib/db";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

type DashboardCardProps = {
  titulo: string;
  valor: string;
  percentual: string;
  tendencia: "up" | "down";
  destaque: string;
  subtitulo: string;
};

export async function getFinanceDashboardCards(): Promise<DashboardCardProps[]> {
  const now = new Date();
  const inicioMesAtual = startOfMonth(now);
  const fimMesAtual = endOfMonth(now);

  // --- Mês Atual ---
  const entradasMes = await db.contractPayment.aggregate({
    where: {
      paymentDate: { gte: inicioMesAtual, lte: fimMesAtual },
      isPaid: true,
    },
    _sum: { amount: true },
  });

  const saidasMes = await db.outFinanceColumn.aggregate({
    where: { data: { gte: inicioMesAtual, lte: fimMesAtual } },
    _sum: { value: true },
  });

  const nfeDoMes = await db.invoice.aggregate({
    where: {
      type: "NFE",
      nfeStatus: "ACTIVE",
      createdAt: { gte: inicioMesAtual, lte: fimMesAtual },
    },
    _sum: { amount: true },
  });

  // --- Histórico dos últimos 3 meses ---
  const historico = await Promise.all(
    [1, 2, 3].map(async (mesAtras) => {
      const data = subMonths(now, mesAtras);
      const inicioMes = startOfMonth(data);
      const fimMes = endOfMonth(data);

      const [entradas, saidas, nfe] = await Promise.all([
        db.contractPayment.aggregate({
          where: {
            paymentDate: { gte: inicioMes, lte: fimMes },
            isPaid: true,
          },
          _sum: { amount: true },
        }),
        db.outFinanceColumn.aggregate({
          where: { data: { gte: inicioMes, lte: fimMes } },
          _sum: { value: true },
        }),
        db.invoice.aggregate({
          where: {
            type: "NFE",
            createdAt: { gte: inicioMes, lte: fimMes },
          },
          _sum: { amount: true },
        }),
      ]);

      return {
        entradas: Number(entradas._sum.amount) || 0,
        saidas: Number(saidas._sum.value) || 0,
        nfe: Number(nfe._sum.amount) || 0,
      };
    })
  );

  // --- Média dos últimos 3 meses ---
  const mediaHistorico = {
    entradas: historico.reduce((acc, curr) => acc + curr.entradas, 0) / 3,
    saidas: historico.reduce((acc, curr) => acc + curr.saidas, 0) / 3,
    nfe: historico.reduce((acc, curr) => acc + curr.nfe, 0) / 3,
  };

  // --- Cálculo do Percentual de Crescimento ---
  const calcularCrescimento = (atual: number, media: number) => {
    if (media === 0) return { percentual: "N/A", tendencia: "up" as const };
    const percentual = ((atual - media) / media) * 100;
    return {
      percentual: `${percentual.toFixed(2)}%`,
      tendencia: percentual >= 0 ? ("up" as const) : ("down" as const),
    };
  };

  const crescimentoEntradas = calcularCrescimento(
    Number(entradasMes._sum.amount) || 0,
    mediaHistorico.entradas
  );
  const crescimentoSaidas = calcularCrescimento(
    Number(saidasMes._sum.value) || 0,
    mediaHistorico.saidas
  );
  const crescimentoNfe = calcularCrescimento(
    Number(nfeDoMes._sum.amount) || 0,
    mediaHistorico.nfe
  );

  // --- Formatação auxiliar ---
  const formatarMoeda = (valor: number) =>
    `R$ ${valor.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // --- Outros Cálculos (sem histórico) ---
  const entradasAEntrarMes = await db.contractPayment.aggregate({
    where: {
      isPaid: false,
      paymentDate: { gte: inicioMesAtual, lte: fimMesAtual },
    },
    _sum: { amount: true },
  });
  const totalSaidas = await db.outFinanceColumn.aggregate({
    _sum: { value: true },
  });

  // --- Cards do Dashboard ---
  const cards: DashboardCardProps[] = [
    {
      titulo: "Entradas do Mês",
      valor: formatarMoeda(Number(entradasMes._sum.amount) || 0),
      percentual: crescimentoEntradas.percentual,
      tendencia: crescimentoEntradas.tendencia,
      destaque: "Recebido este mês",
      subtitulo: "Pagamentos recebidos no mês",
    },
    {
      titulo: "Entradas a Receber no Mês",
      valor: formatarMoeda(Number(entradasAEntrarMes._sum.amount) || 0),
      percentual: "",
      tendencia: "up",
      destaque: "Previsto para entrar",
      subtitulo: "Pagamentos previstos para este mês",
    },
    {
      titulo: "Saídas do Mês",
      valor: formatarMoeda(Number(saidasMes._sum.value) || 0),
      percentual: crescimentoSaidas.percentual,
      tendencia: crescimentoSaidas.tendencia,
      destaque: "Pagamentos realizados",
      subtitulo: "Saídas financeiras do mês",
    },
    {
      titulo: "Total de Saídas",
      valor: formatarMoeda(Number(totalSaidas._sum.value) || 0),
      percentual: "",
      tendencia: "up",
      destaque: "Total pago",
      subtitulo: "Todas as saídas financeiras",
    },
    {
      titulo: "NFe geradas no mês",
      valor: formatarMoeda(Number(nfeDoMes._sum.amount) || 0),
      percentual: crescimentoNfe.percentual,
      tendencia: crescimentoNfe.tendencia,
      destaque: "Notas fiscais geradas",
      subtitulo: "Total em NFe geradas neste mês",
    },
  ];

  return cards;
}
