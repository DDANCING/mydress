"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import fs from "fs";
import path from "path";

interface QuickStatData {
  title: string;
  value: string;
  change: number;
  changeType: "increase" | "decrease";
  iconType: "dollar" | "package" | "calendar" | "users";
  progress?: number;
  target?: string;
}

interface HistoricalData {
  avgRevenue: number;
  avgOrders: number;
  avgContracts: number;
  avgSchedules: number;
}

const CACHE_PATH = path.join(process.cwd(), "historical-data-cache.json");

// Cache apenas para dados históricos (não mudam durante o dia)
function loadHistoricalCache(): { date: string; timestamp: number; data: HistoricalData } | null {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      const raw = fs.readFileSync(CACHE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      
      // Verificar se o cache é do mesmo dia
      const today = new Date().toDateString();
      if (parsed.date === today && parsed.timestamp && parsed.data) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn("Erro ao carregar cache histórico:", error);
  }
  return null;
}

function saveHistoricalCache(data: HistoricalData) {
  try {
    const cacheData = {
      date: new Date().toDateString(),
      timestamp: Date.now(),
      data
    };
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cacheData, null, 2));
  } catch (error) {
    console.warn("Erro ao salvar cache histórico:", error);
  }
}

export async function getQuickStats(): Promise<QuickStatData[]> {
  try {
    const session = await auth();
    if (!session?.user?.id) return getDefaultStats();

    // Datas base (sem modificar o objeto original)
    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const tenDaysAgo = new Date(today);
    tenDaysAgo.setDate(today.getDate() - 10);
    tenDaysAgo.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    // --- CACHE CHECK para dados históricos apenas ---
    const historicalCache = loadHistoricalCache();
    let avgLast10DaysRevenue: number;
    let avgLast10DaysOrders: number;
    let avgLast10DaysContracts: number;
    let avgLast10DaysSchedules: number;

    if (historicalCache && historicalCache.date === new Date().toDateString()) {
      avgLast10DaysRevenue = historicalCache.data.avgRevenue;
      avgLast10DaysOrders = historicalCache.data.avgOrders;
      avgLast10DaysContracts = historicalCache.data.avgContracts;
      avgLast10DaysSchedules = historicalCache.data.avgSchedules;
    } else {
      // Buscar apenas dados históricos
      const [
        last10DaysRevenue,
        last10DaysOrders,
        last10DaysContracts,
        last10DaysSchedules,
      ] = await db.$transaction([
        db.contractPayment.aggregate({
          where: { paymentDate: { gte: tenDaysAgo, lte: yesterday }, isPaid: true },
          _sum: { amount: true },
        }),
        db.order.count({
          where: {
            orderItems: { some: { product: { store: { userId: session.user.id } } } },
            createdAt: { gte: tenDaysAgo, lte: yesterday },
          },
        }),
        db.contract.count({ where: { createdAt: { gte: tenDaysAgo, lte: yesterday } } }),
        db.schedule.count({ where: { startDate: { gte: tenDaysAgo, lte: yesterday } } }),
      ]);

      // Calcular médias
      avgLast10DaysRevenue = Number(last10DaysRevenue._sum.amount || 0) / 10;
      avgLast10DaysOrders = last10DaysOrders / 10;
      avgLast10DaysContracts = last10DaysContracts / 10;
      avgLast10DaysSchedules = last10DaysSchedules / 10;

      // Salvar no cache histórico
      saveHistoricalCache({
        avgRevenue: avgLast10DaysRevenue,
        avgOrders: avgLast10DaysOrders,
        avgContracts: avgLast10DaysContracts,
        avgSchedules: avgLast10DaysSchedules,
      });
    }

    const [
      todayRevenue,
      todayOrders,
      todayContracts,
      todaySchedules,
    ] = await db.$transaction([
      db.contractPayment.aggregate({
        where: { paymentDate: { gte: startOfToday, lte: endOfToday }, isPaid: true },
        _sum: { amount: true },
      }),
      db.order.count({
        where: {
          orderItems: { some: { product: { store: { userId: session.user.id } } } },
          createdAt: { gte: startOfToday, lte: endOfToday },
        },
      }),
      db.contract.count({ where: { createdAt: { gte: startOfToday, lte: endOfToday } } }),
      db.schedule.count({ where: { startDate: { gte: startOfToday, lte: endOfToday } } }),
    ]);

    // --- Valores de hoje (sempre frescos) ---
    const todayRevenueValue = Number(todayRevenue._sum.amount || 0);

    // --- Cálculos auxiliares
    const calculateChange = (current: number, average: number): number => {
      if (average === 0 && current === 0) return 0;
      if (average === 0 && current > 0) return 100; // crescimento quando não havia média
      if (current === 0 && average > 0) return -100; // queda total
      return ((current - average) / average) * 100;
    };

    const calculateProgress = (current: number, average: number): number => {
      // Se não há média histórica e atual é 0, mostrar 0% (não 50%)
      if (average === 0 && current === 0) return 0;
      // Se não há média histórica mas há valor atual, mostrar máximo
      if (average === 0 && current > 0) return 100;
      // Se há média histórica mas valor atual é 0, mostrar 0%
      if (current === 0 && average > 0) return 0;
      
      // Calcular baseado na meta EXIBIDA (arredondada para cima)
      const displayTarget = Math.ceil(average * 1.1);
      const progressRatio = current / displayTarget;
      
      // Converter para porcentagem e limitar entre 0% e 100%
      return Math.min(Math.max(progressRatio * 100, 0), 100);
    };

    const getTarget = (average: number, isRevenue = false): string => {
      if (average === 0) return isRevenue ? "R$ 100,00" : "1";
      // APENAS a meta EXIBIDA é arredondada para cima
      const target = Math.ceil(average * 1.1);
      return isRevenue
        ? `R$ ${target.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
        : target.toString();
    };

    // --- Monta cards
    const data: QuickStatData[] = [
      {
        title: "Receita do Dia",
        value: `R$ ${todayRevenueValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        change: Number(calculateChange(todayRevenueValue, avgLast10DaysRevenue).toFixed(2)),
        changeType: todayRevenueValue >= avgLast10DaysRevenue ? "increase" : "decrease",
        iconType: "dollar",
        progress: Math.round(calculateProgress(todayRevenueValue, avgLast10DaysRevenue)),
        target: getTarget(avgLast10DaysRevenue, true),
      },
      {
        title: "Pedidos do Dia",
        value: todayOrders.toString(),
        change: Number(calculateChange(todayOrders, avgLast10DaysOrders).toFixed(2)),
        changeType: todayOrders >= avgLast10DaysOrders ? "increase" : "decrease",
        iconType: "package",
        progress: Math.round(calculateProgress(todayOrders, avgLast10DaysOrders)),
        target: getTarget(avgLast10DaysOrders),
      },
      {
        title: "Contratos do Dia",
        value: todayContracts.toString(),
        change: Number(calculateChange(todayContracts, avgLast10DaysContracts).toFixed(2)),
        changeType: todayContracts >= avgLast10DaysContracts ? "increase" : "decrease",
        iconType: "calendar",
        progress: Math.round(calculateProgress(todayContracts, avgLast10DaysContracts)),
        target: getTarget(avgLast10DaysContracts),
      },
      {
        title: "Agendamentos do Dia",
        value: todaySchedules.toString(),
        change: Number(calculateChange(todaySchedules, avgLast10DaysSchedules).toFixed(2)),
        changeType: todaySchedules >= avgLast10DaysSchedules ? "increase" : "decrease",
        iconType: "users",
        progress: Math.round(calculateProgress(todaySchedules, avgLast10DaysSchedules)),
        target: getTarget(avgLast10DaysSchedules),
      },
    ];

    return data;
  } catch (error) {
    console.error("Erro ao buscar estatísticas rápidas:", error);
    return getDefaultStats();
  }
}

function getDefaultStats(): QuickStatData[] {
  return [
    {
      title: "Receita do Dia",
      value: "R$ 0,00",
      change: 0,
      changeType: "increase",
      iconType: "dollar",
      progress: 0,
      target: "R$ 100,00",
    },
    {
      title: "Pedidos do Dia",
      value: "0",
      change: 0,
      changeType: "increase",
      iconType: "package",
      progress: 0,
      target: "1",
    },
    {
      title: "Contratos do Dia",
      value: "0",
      change: 0,
      changeType: "increase",
      iconType: "calendar",
      progress: 0,
      target: "1",
    },
    {
      title: "Agendamentos do Dia",
      value: "0",
      change: 0,
      changeType: "increase",
      iconType: "users",
      progress: 0,
      target: "1",
    },
  ];
}
