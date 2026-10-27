"use server";

import { db } from "@/lib/db";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { ContractStatus } from "@prisma/client";

const NUMBER_OF_MONTHS = 12;

export const getMonthlySales = async () => {
  const now = new Date();
  const data: { month: string; actual: number; projected: number }[] = [];

  // Coletar dados reais
  for (let i = NUMBER_OF_MONTHS - 1; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(subMonths(now, i));
    const monthLabel = format(monthStart, "MMM");

    // Vendas do site (orders)
    const orders = await db.order.findMany({
      where: {
        isPaid: true,
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      select: {
        totalAmount: true,
      },
    });

    const orderRevenue = orders.reduce((total, order) => {
      return total + (order.totalAmount?.toNumber() ?? 0);
    }, 0);

    // Contratos
    const contracts = await db.contract.findMany({
      where: {
        status: {
          in: [ContractStatus.CONFIRMED, ContractStatus.DELIVERED, ContractStatus.RETURNED],
        },
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      select: {
        totalAmount: true,
        discount: true,
      },
    });

    const contractRevenue = contracts.reduce((total, contract) => {
      const totalAmount = contract.totalAmount?.toNumber() ?? 0;
      const discount = contract.discount?.toNumber() ?? 0;
      return total + (totalAmount - discount);
    }, 0);

    // Total combinado
    const actual = orderRevenue + contractRevenue;

    data.push({
      month: monthLabel,
      actual,
      projected: 0, // será preenchido abaixo
    });
  }

  // Aplicar regressão linear sobre os dados reais
  const x = data.map((_, i) => i); // índices dos meses (0 a 11)
  const y = data.map((d) => d.actual); // valores reais

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, val, i) => acc + val * y[i], 0);
  const sumX2 = x.reduce((acc, val) => acc + val * val, 0);

  const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX); // coeficiente angular
  const b = (sumY - m * sumX) / n; // coeficiente linear

  // Calcular projeções com base na regressão
  const projectedData = x.map((xi) => Math.max(0, Math.round(m * xi + b)));

  for (let i = 0; i < data.length; i++) {
    data[i].projected = projectedData[i];
  }

  return data;
};

export async function getCurrentVsLastMonthSalesUntilToday() {
  const today = new Date();

  const startOfThisMonth = startOfMonth(today);
  const sameDayLastMonth = subMonths(today, 1);
  const startOfLastMonth = startOfMonth(sameDayLastMonth);

  const endOfThisPeriod = today;
  const endOfLastPeriod = new Date(
    startOfLastMonth.getFullYear(),
    startOfLastMonth.getMonth(),
    today.getDate()
  );

  // Vendas do site - mês atual
  const currentOrders = await db.order.aggregate({
    where: {
      isPaid: true,
      createdAt: {
        gte: startOfThisMonth,
        lte: endOfThisPeriod,
      },
    },
    _sum: {
      totalAmount: true,
    },
  });

  // Contratos - mês atual
  const currentContracts = await db.contract.findMany({
    where: {
      status: {
        in: [ContractStatus.CONFIRMED, ContractStatus.DELIVERED, ContractStatus.RETURNED],
      },
      createdAt: {
        gte: startOfThisMonth,
        lte: endOfThisPeriod,
      },
    },
    select: {
      totalAmount: true,
      discount: true,
    },
  });

  // Vendas do site - mês passado
  const lastOrders = await db.order.aggregate({
    where: {
      isPaid: true,
      createdAt: {
        gte: startOfLastMonth,
        lte: endOfLastPeriod,
      },
    },
    _sum: {
      totalAmount: true,
    },
  });

  // Contratos - mês passado
  const lastContracts = await db.contract.findMany({
    where: {
      status: {
        in: [ContractStatus.CONFIRMED, ContractStatus.DELIVERED, ContractStatus.RETURNED],
      },
      createdAt: {
        gte: startOfLastMonth,
        lte: endOfLastPeriod,
      },
    },
    select: {
      totalAmount: true,
      discount: true,
    },
  });

  const currentOrderRevenue = currentOrders._sum.totalAmount?.toNumber() || 0;
  const currentContractRevenue = currentContracts.reduce((total, contract) => {
    const totalAmount = contract.totalAmount?.toNumber() ?? 0;
    const discount = contract.discount?.toNumber() ?? 0;
    return total + (totalAmount - discount);
  }, 0);
  const lastOrderRevenue = lastOrders._sum.totalAmount?.toNumber() || 0;
  const lastContractRevenue = lastContracts.reduce((total, contract) => {
    const totalAmount = contract.totalAmount?.toNumber() ?? 0;
    const discount = contract.discount?.toNumber() ?? 0;
    return total + (totalAmount - discount);
  }, 0);

  const current = currentOrderRevenue + currentContractRevenue;
  const last = lastOrderRevenue + lastContractRevenue;

  const percentage =
    last > 0 ? ((current - last) / last) * 100 : current > 0 ? 100 : 0;

  return {
    current,
    last,
    percentage,
  };
}

export const getMonthlyBuyers = async () => {
  const now = new Date();
  const data: { month: string; actual: number; projected: number }[] = [];

  for (let i = NUMBER_OF_MONTHS - 1; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(subMonths(now, i));
    const monthLabel = format(monthStart, "MMM");

    const buyers = await db.buyer.count({
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    });

    data.push({
      month: monthLabel,
      actual: buyers,
      projected: 0,
    });
  }

  const x = data.map((_, i) => i);
  const y = data.map((d) => d.actual);

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, val, i) => acc + val * y[i], 0);
  const sumX2 = x.reduce((acc, val) => acc + val * val, 0);

  const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const b = (sumY - m * sumX) / n;

  const projectedData = x.map((xi) => Math.max(0, Math.round(m * xi + b)));

  for (let i = 0; i < data.length; i++) {
    data[i].projected = projectedData[i];
  }

  return data;
};

export async function getTopSellingProducts(limit = 10) {
  const data = await db.orderItem.groupBy({
    by: ["productId"],
    _sum: {
      quantity: true,
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: limit,
  });

  const productIds = data.map((item) => item.productId);

  const products = await db.product.findMany({
    where: {
      id: { in: productIds },
    },
    select: {
      id: true,
      name: true,
      color: {
        select: {
          value: true,
        },
      },
    },
  });

  return data.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return {
      name: product?.name ?? "Produto desconhecido",
      quantity: item._sum.quantity ?? 0,
      color: product?.color.value,
    };
  });
}

// Nova função: Receita por Produto
export async function getRevenueByProduct(
  startDate?: Date,
  endDate?: Date
) {
  const contractWhereClause: any = {
    status: {
      in: [ContractStatus.CONFIRMED, ContractStatus.DELIVERED, ContractStatus.RETURNED],
    },
    ...(startDate && endDate && {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    }),
  };

  // Buscar todos os contratos com seus valores totais corretos
  const contracts = await db.contract.findMany({
    where: contractWhereClause,
    select: {
      id: true,
      totalAmount: true,
      discount: true,
      contractItems: {
        select: {
          productId: true,
        }
      }
    },
  });

  // Agrupar por produto usando o valor total do contrato após desconto dividido pelo número de produtos
  const productRevenueMap = new Map<string, number>();

  contracts.forEach((contract) => {
    const totalAmount = contract.totalAmount?.toNumber() ?? 0;
    const discount = contract.discount?.toNumber() ?? 0;
    const finalAmount = totalAmount - discount;
    const numProducts = contract.contractItems.length;
    
    if (numProducts > 0 && finalAmount > 0) {
      const revenuePerProduct = finalAmount / numProducts;
      
      contract.contractItems.forEach((item) => {
        if (productRevenueMap.has(item.productId)) {
          productRevenueMap.set(item.productId, productRevenueMap.get(item.productId)! + revenuePerProduct);
        } else {
          productRevenueMap.set(item.productId, revenuePerProduct);
        }
      });
    }
  });

  // Ordenar por receita decrescente
  const sortedProducts = Array.from(productRevenueMap.entries())
    .sort((a, b) => b[1] - a[1])
    .filter(([_, revenue]) => revenue > 0);

  const productIds = sortedProducts.map(([productId]) => productId);

  const products = await db.product.findMany({
    where: {
      id: { in: productIds },
    },
    select: {
      id: true,
      name: true,
      color: {
        select: {
          value: true,
        },
      },
    },
  });

  return sortedProducts.map(([productId, revenue]) => {
    const product = products.find((p) => p.id === productId);
    return {
      name: product?.name ?? "Produto desconhecido",
      revenue: Math.round(revenue * 100) / 100,
      color: product?.color.value,
    };
  });
}

// Nova função: Evolução Mensal de Contratos
export async function getMonthlyContractsEvolution() {
  const now = new Date();
  const data: {
    month: string;
    saleCount: number;
    rentalCount: number;
    websiteCount: number;
    saleRevenue: number;
    rentalRevenue: number;
    websiteRevenue: number;
    totalCount: number;
    totalRevenue: number;
  }[] = [];

  for (let i = NUMBER_OF_MONTHS - 1; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(subMonths(now, i));
    const monthLabel = format(monthStart, "MMM");

    const salesData = await db.contract.findMany({
      where: {
        type: {
          in: ["SALE", "ClothingSALE"],
        },
        status: {
          in: [ContractStatus.CONFIRMED, ContractStatus.DELIVERED, ContractStatus.RETURNED],
        },
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      select: {
        totalAmount: true,
        discount: true,
      },
    });

    const rentalsData = await db.contract.findMany({
      where: {
        type: {
          in: ["RENTAL", "clothingRENTAL"],
        },

        status: {
          in: [ContractStatus.CONFIRMED, ContractStatus.DELIVERED, ContractStatus.RETURNED],
        },
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      select: {
        totalAmount: true,
        discount: true,
      },
    });

    // Vendas do site (orders)
    const websiteData = await db.order.aggregate({
      where: {
        isPaid: true,
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        totalAmount: true,
      },
    });

    const saleCount = salesData.length;
    const rentalCount = rentalsData.length;
    const websiteCount = websiteData._count.id;
    const saleRevenue = salesData.reduce((total, contract) => {
      const totalAmount = contract.totalAmount?.toNumber() ?? 0;
      const discount = contract.discount?.toNumber() ?? 0;
      return total + (totalAmount - discount);
    }, 0);
    const rentalRevenue = rentalsData.reduce((total, contract) => {
      const totalAmount = contract.totalAmount?.toNumber() ?? 0;
      const discount = contract.discount?.toNumber() ?? 0;
      return total + (totalAmount - discount);
    }, 0);
    const websiteRevenue = websiteData._sum.totalAmount?.toNumber() ?? 0;

    data.push({
      month: monthLabel,
      saleCount,
      rentalCount,
      websiteCount,
      saleRevenue,
      rentalRevenue,
      websiteRevenue,
      totalCount: saleCount + rentalCount + websiteCount,
      totalRevenue: saleRevenue + rentalRevenue + websiteRevenue,
    });
  }

  return data;
}

// Nova função: Mix de Métodos de Pagamento
export async function getPaymentMethodsMix() {
  // Buscar pagamentos de contratos reais (ContractPayment)
  const contractPayments = await db.contractPayment.groupBy({
    by: ["paymentMethodId"],
    where: {
      isPaid: true,
      contract: {
        status: {
          in: [ContractStatus.CONFIRMED, ContractStatus.DELIVERED, ContractStatus.RETURNED],
        },
      },
    },
    _sum: {
      amount: true,
    },
    _count: {
      id: true,
    },
    orderBy: {
      _sum: {
        amount: "desc",
      },
    },
  });

  const paymentMethodIds = contractPayments.map((item) => item.paymentMethodId);

  const paymentMethods = await db.paymentMethod.findMany({
    where: {
      id: { in: paymentMethodIds },
    },
    select: {
      id: true,
      name: true,
    },
  });

  const totalRevenue = contractPayments.reduce(
    (sum, item) => sum + (item._sum?.amount?.toNumber() ?? 0),
    0
  );

  return contractPayments.map((item) => {
    const paymentMethod = paymentMethods.find(
      (pm) => pm.id === item.paymentMethodId
    );
    const revenue = item._sum?.amount?.toNumber() ?? 0;
    return {
      name: paymentMethod?.name ?? "Método desconhecido",
      count: item._count?.id ?? 0,
      revenue,
      percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
    };
  });
}

// Nova função: Comparativo de Agendamentos x Receita
export async function getScheduleRevenueComparison() {
  const appointmentsData = await db.schedule.findMany({
    where: {
      type: "CLIENT_APPOINTMENT",
      contractId: {
        not: null,
      },
    },
    include: {
      contract: {
        where: {
          status: {
            in: [ContractStatus.CONFIRMED, ContractStatus.DELIVERED, ContractStatus.RETURNED],
          },
        },
        select: {
          totalAmount: true,
          discount: true,
        },
      },
    },
  });

  const blocksData = await db.schedule.findMany({
    where: {
      type: "PRODUCT_BLOCK",
      contractId: {
        not: null,
      },
    },
    include: {
      contract: {
        where: {
          status: {
            in: [ContractStatus.CONFIRMED, ContractStatus.DELIVERED, ContractStatus.RETURNED],
          },
        },
        select: {
          totalAmount: true,
          discount: true,
        },
      },
    },
  });

  const appointmentRevenue = appointmentsData.reduce(
    (sum, schedule) => {
      if (schedule.contract) {
        const totalAmount = schedule.contract.totalAmount?.toNumber() ?? 0;
        const discount = schedule.contract.discount?.toNumber() ?? 0;
        return sum + (totalAmount - discount);
      }
      return sum;
    },
    0
  );

  const blockRevenue = blocksData.reduce(
    (sum, schedule) => {
      if (schedule.contract) {
        const totalAmount = schedule.contract.totalAmount?.toNumber() ?? 0;
        const discount = schedule.contract.discount?.toNumber() ?? 0;
        return sum + (totalAmount - discount);
      }
      return sum;
    },
    0
  );

  return [
    {
      type: "Agendamentos",
      count: appointmentsData.length,
      revenue: appointmentRevenue,
    },
    {
      type: "Bloqueios",
      count: blocksData.length,
      revenue: blockRevenue,
    },
  ];
}

// Nova função: Receita por Categoria de Produto
export async function getRevenueByCategoryWithMetrics() {
  // Buscar todos os contratos com seus valores totais corretos
  const contracts = await db.contract.findMany({
    where: {
      status: {
        in: [ContractStatus.CONFIRMED, ContractStatus.DELIVERED, ContractStatus.RETURNED],
      },
    },
    select: {
      id: true,
      totalAmount: true,
      discount: true,
      contractItems: {
        select: {
          productId: true,
          product: {
            select: {
              id: true,
              name: true,
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Agrupar por categoria usando o valor total do contrato após desconto
  const categoryMap = new Map<
    string,
    {
      name: string;
      revenue: number;
      contracts: number;
      averageTicket: number;
    }
  >();

  contracts.forEach((contract) => {
    const totalAmount = contract.totalAmount?.toNumber() ?? 0;
    const discount = contract.discount?.toNumber() ?? 0;
    const finalAmount = totalAmount - discount;
    const numProducts = contract.contractItems.length;
    
    if (numProducts > 0 && finalAmount > 0) {
      const revenuePerProduct = finalAmount / numProducts;
      
      contract.contractItems.forEach((item) => {
        const categoryName = item.product.category.name;
        
        if (categoryMap.has(categoryName)) {
          const existing = categoryMap.get(categoryName)!;
          existing.revenue += revenuePerProduct;
          existing.contracts += 1 / numProducts; // Proporção do contrato para esta categoria
          existing.averageTicket = existing.contracts > 0 ? existing.revenue / existing.contracts : 0;
        } else {
          categoryMap.set(categoryName, {
            name: categoryName,
            revenue: revenuePerProduct,
            contracts: 1 / numProducts,
            averageTicket: revenuePerProduct / (1 / numProducts),
          });
        }
      });
    }
  });

  return Array.from(categoryMap.values())
    .filter(category => category.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .map(category => ({
      ...category,
      contracts: Math.round(category.contracts),
      averageTicket: category.contracts > 0 ? category.revenue / category.contracts : 0,
    }));
}

// Nova função: Performance de Vendas por Vendedor
export async function getSellerPerformance() {
  // Buscar contratos com vendedor e desconto
  const contracts = await db.contract.findMany({
    where: {
      status: {
        in: [ContractStatus.CONFIRMED, ContractStatus.DELIVERED, ContractStatus.RETURNED],
      },
    },
    select: {
      sellerId: true,
      totalAmount: true,
      discount: true,
      seller: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Agrupar por vendedor e calcular valores após desconto
  const sellerMap = new Map<string, { name: string; contracts: number; revenue: number }>();

  contracts.forEach((contract) => {
    const totalAmount = contract.totalAmount?.toNumber() ?? 0;
    const discount = contract.discount?.toNumber() ?? 0;
    const finalAmount = totalAmount - discount;
    const sellerId = contract.sellerId;
    const sellerName = contract.seller?.name ?? "Vendedor desconhecido";
    
    if (sellerMap.has(sellerId)) {
      const existing = sellerMap.get(sellerId)!;
      existing.contracts += 1;
      existing.revenue += finalAmount;
    } else {
      sellerMap.set(sellerId, {
        name: sellerName,
        contracts: 1,
        revenue: finalAmount,
      });
    }
  });

  return Array.from(sellerMap.values())
    .sort((a, b) => b.revenue - a.revenue);
}

// Nova função: Agendamentos Finalizados vs Vendas por Mês
export async function getMonthlyPayments() {
  const now = new Date();
  const data: {
    month: string;
    contractRevenue: number;
    orderRevenue: number;
    projectedContractRevenue: number;
    projectedOrderRevenue: number;
  }[] = [];

  // Coletar dados dos últimos 6 meses
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(subMonths(now, i));
    const monthLabel = format(monthStart, "MMM yyyy");

    // Pagamentos de contratos no mês (ContractPayment - valores reais pagos)
    const contractPayments = await db.contractPayment.findMany({
      where: {
        isPaid: true,
        contract: {
          status: {
            in: [ContractStatus.CONFIRMED, ContractStatus.DELIVERED, ContractStatus.RETURNED],
          },
        },
        paymentDate: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      select: {
        amount: true,
      },
    });

    // Pagamentos de pedidos online no mês
    const orderPayments = await db.order.findMany({
      where: {
        isPaid: true,
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      select: {
        totalAmount: true,
      },
    });

    // Calcular receitas
    const contractRevenue = contractPayments.reduce(
      (sum, payment) => sum + (payment.amount?.toNumber() ?? 0),
      0
    );

    const orderRevenue = orderPayments.reduce(
      (sum, order) => sum + (order.totalAmount?.toNumber() ?? 0),
      0
    );

    // Calcular projeções baseadas na média dos últimos 3 meses
    const isCurrentMonth = i === 0;
    const projectedContractRevenue = isCurrentMonth ? contractRevenue * 1.15 : contractRevenue;
    const projectedOrderRevenue = isCurrentMonth ? orderRevenue * 1.10 : orderRevenue;

    data.push({
      month: monthLabel,
      contractRevenue,
      orderRevenue,
      projectedContractRevenue,
      projectedOrderRevenue,
    });
  }

  return data;
}

export async function getAppointmentsVsSalesMonthly() {
  const now = new Date();
  const data: {
    month: string;
    completedAppointments: number;
    sales: number;
    appointmentRevenue: number;
    salesRevenue: number;
  }[] = [];

  // Coletar dados dos últimos 6 meses
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(subMonths(now, i));
    const monthLabel = format(monthStart, "MMM yyyy");

    // Agendamentos finalizados no mês (endDate passou e tem contrato confirmado)
    const completedAppointments = await db.schedule.findMany({
      where: {
        type: "CLIENT_APPOINTMENT",
        endDate: {
          gte: monthStart,
          lte: monthEnd,
          lt: now, // Data de fim já passou
        },
        contractId: {
          not: null,
        },
      },
      include: {
        contract: {
          where: {
            status: {
              in: [ContractStatus.CONFIRMED, ContractStatus.DELIVERED, ContractStatus.RETURNED],
            },
          },
          select: {
            totalAmount: true,
            discount: true,
          },
        },
      },
    });

    // Vendas (orders) do mês
    const monthSales = await db.order.findMany({
      where: {
        isPaid: true,
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      select: {
        totalAmount: true,
      },
    });

    // Calcular receitas
    const appointmentRevenue = completedAppointments.reduce(
      (sum, schedule) => {
        if (schedule.contract) {
          const totalAmount = schedule.contract.totalAmount?.toNumber() ?? 0;
          const discount = schedule.contract.discount?.toNumber() ?? 0;
          return sum + (totalAmount - discount);
        }
        return sum;
      },
      0
    );

    const salesRevenue = monthSales.reduce(
      (sum, order) => sum + (order.totalAmount?.toNumber() ?? 0),
      0
    );

    data.push({
      month: monthLabel,
      completedAppointments: completedAppointments.length,
      sales: monthSales.length,
      appointmentRevenue,
      salesRevenue,
    });
  }

  return data;
}

// Nova função: Relação entre investimento em ads e vendas por dia (últimos 30 dias)
export async function getAdsSalesComparison30Days() {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29); // 30 dias incluindo hoje
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const data: {
    date: string;
    dateObj: Date;
    salesAmount: number;
    adSpending: number;
  }[] = [];

  // Buscar todos os ads criados até hoje
  const allMarketingExpenses = await db.marketingExpense.findMany({
    where: {
      createdAt: {
        lte: today,
      },
    },
    select: {
      id: true,
      amount: true,
      duration: true,
      createdAt: true,
    },
  });

  // Iterar pelos últimos 30 dias
  for (let i = 29; i >= 0; i--) {
    const currentDate = new Date(today);
    currentDate.setDate(currentDate.getDate() - i);
    currentDate.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    nextDate.setHours(0, 0, 0, 0);

    const dateLabel = format(currentDate, "dd/MM");

    // Vendas do dia (orders + contracts)
    const ordersOfDay = await db.order.findMany({
      where: {
        isPaid: true,
        createdAt: {
          gte: currentDate,
          lt: nextDate,
        },
      },
      select: {
        totalAmount: true,
      },
    });

    const contractsOfDay = await db.contract.findMany({
      where: {
        status: {
          in: [ContractStatus.CONFIRMED, ContractStatus.DELIVERED, ContractStatus.RETURNED],
        },
        createdAt: {
          gte: currentDate,
          lt: nextDate,
        },
      },
      select: {
        totalAmount: true,
        discount: true,
      },
    });

    const orderRevenue = ordersOfDay.reduce((sum, order) => sum + (order.totalAmount?.toNumber() ?? 0), 0);
    const contractRevenue = contractsOfDay.reduce((sum, contract) => {
      const totalAmount = contract.totalAmount?.toNumber() ?? 0;
      const discount = contract.discount?.toNumber() ?? 0;
      return sum + (totalAmount - discount);
    }, 0);

    const totalSalesOfDay = orderRevenue + contractRevenue;

    // Calcular gasto em ads do dia
    // Para cada dia, verificar quais ads estavam ativos e distribuir o custo
    let dailyAdSpending = 0;
    
    for (const expense of allMarketingExpenses) {
      // Data de fim do ad (createdAt + duration dias)
      const adStartDate = new Date(expense.createdAt);
      adStartDate.setHours(0, 0, 0, 0);
      
      const adEndDate = new Date(adStartDate);
      adEndDate.setDate(adEndDate.getDate() + expense.duration);

      // Verificar se o ad estava ativo neste dia
      // O ad está ativo se: currentDate >= adStartDate E currentDate < adEndDate
      if (currentDate >= adStartDate && currentDate < adEndDate) {
        // Se o ad estava ativo, adicionar o custo diário (amount / duration)
        const dailyCost = (expense.amount?.toNumber() ?? 0) / expense.duration;
        dailyAdSpending += dailyCost;
      }
    }

    data.push({
      date: dateLabel,
      dateObj: currentDate,
      salesAmount: totalSalesOfDay,
      adSpending: dailyAdSpending,
    });
  }

  return data;
}