"use server";

import { db } from "@/lib/db";
import { startOfMonth, subMonths } from "date-fns";

type DashboardCardProps = {
  titulo: string;
  valor: string;
  percentual: string;
  tendencia: "up" | "down";
  destaque: string;
  subtitulo: string;
};

export async function getDashboardCards(): Promise<DashboardCardProps[]> {
  const now = new Date();

  // Datas de referência até o mesmo dia
  const inicioMesAtual = startOfMonth(now);
  const fimMesAtual = now;

  const inicioMesAnterior = startOfMonth(subMonths(now, 1));
  const fimMesAnterior = subMonths(now, 1);

  const inicioDoisMesesAtras = startOfMonth(subMonths(now, 2));
  const fimDoisMesesAtras = subMonths(now, 2);

  // --- Consultas paralelas ---
  const [
    receitaAtual,
    receitaMesAnterior,
    receitaDoisMesesAtras,
    pedidosAtual,
    pedidosMesAnterior,
    pedidosDoisMesesAtras,
    novosClientesAtual,
    novosClientesMesAnterior,
    novosClientesDoisMesesAtras,
    produtosAtivos,
    novosProdutosAtual,
    novosProdutosMesAnterior,
    novosProdutosDoisMesesAtras,
    // Contratos - Receita
    contratosReceitaAtual,
    contratosReceitaMesAnterior,
    contratosReceitaDoisMesesAtras,
    // Contratos - Quantidade
    contratosAtual,
    contratosMesAnterior,
    contratosDoisMesesAtras,
    // Contratos confirmados
    contratosConfirmadosAtual,
    contratosConfirmadosMesAnterior,
    contratosConfirmadosDoisMesesAtras,
    // Contratos entregues
    contratosEntreguesAtual,
    contratosEntreguesMesAnterior,
    contratosEntreguesDoisMesesAtras,
    // Contratos por tipo
    contratosSaleAtual,
    contratosRentAtual,
    contratosSaleMesAnterior,
    contratosRentMesAnterior,
    // Contratos devolvidos no prazo
    contratosDevolvidos,
    // Faturamento futuro (contratos confirmados)
    faturamentoFuturo,
    // Faturamento futuro mês anterior
    faturamentoFuturoMesAnterior,
    // Contratos vencidos (não devolvidos)
    contratosVencidos,
     contratosCancelados,
  ] = await Promise.all([
    // Receita mês atual
    db.order.aggregate({
      where: {
        isPaid: true,
        createdAt: {
          gte: inicioMesAtual,
          lte: fimMesAtual,
        },
      },
      _sum: { totalAmount: true },
    }),

    // Receita mês anterior até o mesmo dia
    db.order.aggregate({
      where: {
        isPaid: true,
        createdAt: {
          gte: inicioMesAnterior,
          lte: fimMesAnterior,
        },
      },
      _sum: { totalAmount: true },
    }),

    // Receita dois meses atrás até o mesmo dia
    db.order.aggregate({
      where: {
        isPaid: true,
        createdAt: {
          gte: inicioDoisMesesAtras,
          lte: fimDoisMesesAtras,
        },
      },
      _sum: { totalAmount: true },
    }),

    // Pedidos mês atual
    db.order.count({
      where: {
        isPaid: true,
        createdAt: {
          gte: inicioMesAtual,
          lte: fimMesAtual,
        },
      },
    }),

    db.order.count({
      where: {
        isPaid: true,
        createdAt: {
          gte: inicioMesAnterior,
          lte: fimMesAnterior,
        },
      },
    }),

    db.order.count({
      where: {
        isPaid: true,
        createdAt: {
          gte: inicioDoisMesesAtras,
          lte: fimDoisMesesAtras,
        },
      },
    }),

    // Clientes atuais
    db.buyer.count({
      where: {
        createdAt: {
          gte: inicioMesAtual,
          lte: fimMesAtual,
        },
      },
    }),

    db.buyer.count({
      where: {
        createdAt: {
          gte: inicioMesAnterior,
          lte: fimMesAnterior,
        },
      },
    }),

    db.buyer.count({
      where: {
        createdAt: {
          gte: inicioDoisMesesAtras,
          lte: fimDoisMesesAtras,
        },
      },
    }),

    // Produtos ativos
    db.product.count({
      where: {
        isArchived: false,
        siteVisible: true,
      },
    }),

    db.product.count({
      where: {
        isArchived: false,
        createdAt: {
          gte: inicioMesAtual,
          lte: fimMesAtual,
        },
      },
    }),

    db.product.count({
      where: {
        createdAt: {
          gte: inicioMesAnterior,
          lte: fimMesAnterior,
        },
      },
    }),

    db.product.count({
      where: {
        createdAt: {
          gte: inicioDoisMesesAtras,
          lte: fimDoisMesesAtras,
        },
      },
    }),

    // Contratos - Receita mês atual
    db.contract.findMany({
      where: {
        status: {
          in: ["CONFIRMED", "DELIVERED", "RETURNED"]
        },
        createdAt: {
          gte: inicioMesAtual,
          lte: fimMesAtual,
        },
      },
      select: { 
        totalAmount: true,
        discount: true,
      },
    }),

    // Contratos - Receita mês anterior
    db.contract.findMany({
      where: {
        status: {
          in: ["CONFIRMED", "DELIVERED", "RETURNED"]
        },
        createdAt: {
          gte: inicioMesAnterior,
          lte: fimMesAnterior,
        },
      },
      select: { 
        totalAmount: true,
        discount: true,
      },
    }),

    // Contratos - Receita dois meses atrás
    db.contract.findMany({
      where: {
        status: {
          in: ["CONFIRMED", "DELIVERED", "RETURNED"]
        },
        createdAt: {
          gte: inicioDoisMesesAtras,
          lte: fimDoisMesesAtras,
        },
      },
      select: { 
        totalAmount: true,
        discount: true,
      },
    }),

    // Contratos - Quantidade mês atual
    db.contract.count({
      where: {
        status: {
          in: ["CONFIRMED", "DELIVERED", "RETURNED"]
        },
        createdAt: {
          gte: inicioMesAtual,
          lte: fimMesAtual,
        },
      },
    }),

    // Contratos - Quantidade mês anterior
    db.contract.count({
      where: {
        status: {
          in: ["CONFIRMED", "DELIVERED", "RETURNED"]
        },
        createdAt: {
          gte: inicioMesAnterior,
          lte: fimMesAnterior,
        },
      },
    }),

    // Contratos - Quantidade dois meses atrás
    db.contract.count({
      where: {
        status: {
          in: ["CONFIRMED", "DELIVERED", "RETURNED"]
        },
        createdAt: {
          gte: inicioDoisMesesAtras,
          lte: fimDoisMesesAtras,
        },
      },
    }),

    // Contratos confirmados mês atual
    db.contract.count({
      where: {
        status: "CONFIRMED",
        createdAt: {
          gte: inicioMesAtual,
          lte: fimMesAtual,
        },
      },
    }),

    // Contratos confirmados mês anterior
    db.contract.count({
      where: {
        status: "CONFIRMED",
        createdAt: {
          gte: inicioMesAnterior,
          lte: fimMesAnterior,
        },
      },
    }),

    // Contratos confirmados dois meses atrás
    db.contract.count({
      where: {
        status: "CONFIRMED",
        createdAt: {
          gte: inicioDoisMesesAtras,
          lte: fimDoisMesesAtras,
        },
      },
    }),

    // Contratos entregues mês atual
    db.contract.count({
      where: {
        status: {
          in: ["DELIVERED", "RETURNED"]
        },
        deliveryDate: {
          gte: inicioMesAtual,
          lte: fimMesAtual,
        },
      },
    }),

    // Contratos entregues mês anterior
    db.contract.count({
      where: {
         status: {
          in: ["DELIVERED", "RETURNED"]
        },
        deliveryDate: {
          gte: inicioMesAnterior,
          lte: fimMesAnterior,
        },
      },
    }),

    // Contratos entregues dois meses atrás
    db.contract.count({
      where: {
         status: {
          in: ["DELIVERED", "RETURNED"]
        },
        deliveryDate: {
          gte: inicioDoisMesesAtras,
          lte: fimDoisMesesAtras,
        },
      },
    }),

    // Contratos de venda mês atual
    db.contract.count({
      where: {
        type: {
          in: ["SALE", "ClothingSALE"]
        },
        status: {
          in: ["CONFIRMED", "DELIVERED", "RETURNED"]
        },
        createdAt: {
          gte: inicioMesAtual,
          lte: fimMesAtual,
        },
      },
    }),

    // Contratos de aluguel mês atual
    db.contract.count({
      where: {
         type: {
          in: ["RENTAL", "clothingRENTAL"]
        },
        status: {
          in: ["CONFIRMED", "DELIVERED", "RETURNED"]
        },
        createdAt: {
          gte: inicioMesAtual,
          lte: fimMesAtual,
        },
      },
    }),

    // Contratos de venda mês anterior
    db.contract.count({
      where: {
        type: {
          in: ["SALE", "ClothingSALE"]
        },
        status: {
          in: ["CONFIRMED", "DELIVERED", "RETURNED"]
        },
        createdAt: {
          gte: inicioMesAnterior,
          lte: fimMesAnterior,
        },
      },
    }),

    // Contratos de aluguel mês anterior
    db.contract.count({
      where: {
        type: {
          in: ["RENTAL", "clothingRENTAL"]
        },
        status: {
          in: ["CONFIRMED", "DELIVERED", "RETURNED"]
        },
        createdAt: {
          gte: inicioMesAnterior,
          lte: fimMesAnterior,
        },
      },
    }),

    // Contratos devolvidos no prazo
    db.contract.count({
      where: {
        status: "RETURNED",
        returnDate: {
          not: null,
        },
      },
    }),

    // Faturamento futuro (contratos confirmados - valores já pagos)
    db.contract.aggregate({
      where: {
        status: "CONFIRMED",
      },
      _sum: { 
        downPayment: true,
      },
    }),

    // Faturamento futuro mês anterior
    db.contract.aggregate({
      where: {
        status: "CONFIRMED",
        createdAt: {
          gte: inicioMesAnterior,
          lte: fimMesAnterior,
        },
      },
      _sum: {
        downPayment: true 
      },
    }),

    // Contratos vencidos (não devolvidos)
    db.contract.count({
      where: {
        status: "DELIVERED",
        returnDate: {
          lt: now,
        },
      },
    }),
    // Contratos cancelados
    db.contract.count({
      where: {
        status: "CANCELED",
      },
    }),
  ]);

  const cards: DashboardCardProps[] = [];

  // === Receita Total (Orders + Contratos) ===
  const receitaOrdersAtual = receitaAtual._sum.totalAmount?.toNumber() ?? 0;
  const receitaContratosAtual = contratosReceitaAtual.reduce((total, contract) => {
    const totalAmount = contract.totalAmount?.toNumber() ?? 0;
    const discount = contract.discount?.toNumber() ?? 0;
    return total + (totalAmount - discount);
  }, 0);
  const valorReceitaAtual = receitaOrdersAtual + receitaContratosAtual;

  const receitaOrdersAnterior = receitaMesAnterior._sum.totalAmount?.toNumber() ?? 0;
  const receitaContratosAnterior = contratosReceitaMesAnterior.reduce((total, contract) => {
    const totalAmount = contract.totalAmount?.toNumber() ?? 0;
    const discount = contract.discount?.toNumber() ?? 0;
    return total + (totalAmount - discount);
  }, 0);
  const receitaOrdersDoisMeses = receitaDoisMesesAtras._sum.totalAmount?.toNumber() ?? 0;
  const receitaContratosDoisMeses = contratosReceitaDoisMesesAtras.reduce((total, contract) => {
    const totalAmount = contract.totalAmount?.toNumber() ?? 0;
    const discount = contract.discount?.toNumber() ?? 0;
    return total + (totalAmount - discount);
  }, 0);

  const mediaReceitaAnterior = ((receitaOrdersAnterior + receitaContratosAnterior) +
    (receitaOrdersDoisMeses + receitaContratosDoisMeses)) / 2;

  const crescimentoReceita = mediaReceitaAnterior === 0 ? 100 : ((valorReceitaAtual - mediaReceitaAnterior) / mediaReceitaAnterior) * 100;
  const tendenciaReceita = crescimentoReceita >= 0 ? "up" : "down";

  cards.push({
    titulo: "Contratos confirmados",
    valor: `R$ ${valorReceitaAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    percentual: `${crescimentoReceita.toFixed(1)}%`,
    tendencia: tendenciaReceita,
    destaque: crescimentoReceita >= 0 ? "Receita em alta" : "Receita em queda",
    subtitulo: "Site + Contratos vs média anterior",
  });

  // === Novos Clientes ===
  const mediaClientesAnterior = (novosClientesMesAnterior + novosClientesDoisMesesAtras) / 2;
  const crescimentoClientes = mediaClientesAnterior === 0 ? 100 : ((novosClientesAtual - mediaClientesAnterior) / mediaClientesAnterior) * 100;
  const tendenciaClientes = crescimentoClientes >= 0 ? "up" : "down";

  cards.push({
    titulo: "Novos Clientes",
    valor: `${novosClientesAtual}`,
    percentual: `${crescimentoClientes.toFixed(1)}%`,
    tendencia: tendenciaClientes,
    destaque: "Novos registros no mês",
    subtitulo: "Comparado à média anterior",
  });

  // === Produtos Ativos ===
  cards.push({
    titulo: "Produtos Ativos",
    valor: `${produtosAtivos}`,
    percentual: "",
    tendencia: "up",
    destaque: "Catálogo disponível",
    subtitulo: "Produtos prontos para venda",
  });

  // === Novos Produtos ===
  const mediaProdutosAnterior = (novosProdutosMesAnterior + novosProdutosDoisMesesAtras) / 2;
  const crescimentoProdutos = mediaProdutosAnterior === 0 ? 100 : ((novosProdutosAtual - mediaProdutosAnterior) / mediaProdutosAnterior) * 100;
  const tendenciaProdutos = crescimentoProdutos >= 0 ? "up" : "down";

  cards.push({
    titulo: "Novos Produtos",
    valor: `${novosProdutosAtual}`,
    percentual: `${crescimentoProdutos.toFixed(1)}%`,
    tendencia: tendenciaProdutos,
    destaque: "Expansão do catálogo",
    subtitulo: "Novos produtos adicionados",
  });

  // === Ticket Médio (Orders + Contratos) ===
  const totalTransacoesAtual = pedidosAtual + contratosAtual;
  const ticketMedioAtual = totalTransacoesAtual === 0 ? 0 : valorReceitaAtual / totalTransacoesAtual;
  
  const totalTransacoesAnterior = (pedidosMesAnterior + contratosMesAnterior) + (pedidosDoisMesesAtras + contratosDoisMesesAtras);
  const ticketMedioAnterior = totalTransacoesAnterior === 0 ? 0 : mediaReceitaAnterior / (totalTransacoesAnterior / 2);

  const crescimentoTicket =
    ticketMedioAnterior === 0 ? 100 : ((ticketMedioAtual - ticketMedioAnterior) / ticketMedioAnterior) * 100;
  const tendenciaTicket = crescimentoTicket >= 0 ? "up" : "down";

  cards.push({
    titulo: "Ticket Médio",
    valor: `R$ ${ticketMedioAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    percentual: `${crescimentoTicket.toFixed(1)}%`,
    tendencia: tendenciaTicket,
    destaque: "Valor médio por transação",
    subtitulo: "Site + Contratos vs média anterior",
  });

  // === Contratos Confirmados ===
  const mediaContratosConfirmadosAnterior = (contratosConfirmadosMesAnterior + contratosConfirmadosDoisMesesAtras) / 2;
  const crescimentoContratosConfirmados = mediaContratosConfirmadosAnterior === 0 ? 100 : 
    ((contratosConfirmadosAtual - mediaContratosConfirmadosAnterior) / mediaContratosConfirmadosAnterior) * 100;
  const tendenciaContratosConfirmados = crescimentoContratosConfirmados >= 0 ? "up" : "down";

  cards.push({
    titulo: "Contratos Confirmados",
    valor: `${contratosConfirmadosAtual}`,
    percentual: `${crescimentoContratosConfirmados.toFixed(1)}%`,
    tendencia: tendenciaContratosConfirmados,
    destaque: "Aguardando entrega",
    subtitulo: "Comparado à média anterior",
  });

  // === Contratos Entregues ===
  const mediaContratosEntreguesAnterior = (contratosEntreguesMesAnterior + contratosEntreguesDoisMesesAtras) / 2;
  const crescimentoContratosEntregues = mediaContratosEntreguesAnterior === 0 ? 100 : 
    ((contratosEntreguesAtual - mediaContratosEntreguesAnterior) / mediaContratosEntreguesAnterior) * 100;
  const tendenciaContratosEntregues = crescimentoContratosEntregues >= 0 ? "up" : "down";

  cards.push({
    titulo: "Contratos Entregues",
    valor: `${contratosEntreguesAtual}`,
    percentual: `${crescimentoContratosEntregues.toFixed(1)}%`,
    tendencia: tendenciaContratosEntregues,
    destaque: "Entregas realizadas",
    subtitulo: "Comparado à média anterior",
  });

  // === Vendas vs Aluguéis ===
  const totalContratosAtual = contratosSaleAtual + contratosRentAtual;
  const percentualVendas = totalContratosAtual === 0 ? 0 : (contratosSaleAtual / totalContratosAtual) * 100;
  const totalContratosAnterior = contratosSaleMesAnterior + contratosRentMesAnterior;
  const percentualVendasAnterior = totalContratosAnterior === 0 ? 0 : (contratosSaleMesAnterior / totalContratosAnterior) * 100;
  const tendenciaVendas = percentualVendas >= percentualVendasAnterior ? "up" : "down";

  cards.push({
    titulo: "Vendas vs Aluguéis",
    valor: `${contratosSaleAtual}/${contratosRentAtual}`,
    percentual: `${percentualVendas.toFixed(1)}%`,
    tendencia: tendenciaVendas,
    destaque: "Proporção de vendas",
    subtitulo: `${percentualVendas.toFixed(1)}% vendas, ${(100 - percentualVendas).toFixed(1)}% aluguéis`,
  });

  // === Faturamento Futuro ===
  const valorFaturamentoFuturo = faturamentoFuturo._sum.downPayment?.toNumber() ?? 0;
  
  // Faturamento futuro mês anterior
  const valorFaturamentoFuturoAnterior = faturamentoFuturoMesAnterior._sum.downPayment?.toNumber() ?? 0;
  
  const crescimentoFaturamentoFuturo = valorFaturamentoFuturoAnterior === 0 ? 100 : 
    ((valorFaturamentoFuturo - valorFaturamentoFuturoAnterior) / valorFaturamentoFuturoAnterior) * 100;
  const tendenciaFaturamentoFuturo = crescimentoFaturamentoFuturo >= 0 ? "up" : "down";
  
  cards.push({
    titulo: "Faturamento Futuro",
    valor: `R$ ${valorFaturamentoFuturo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    percentual: `${crescimentoFaturamentoFuturo.toFixed(1)}%`,
    tendencia: tendenciaFaturamentoFuturo,
    destaque: "Contratos confirmados",
    subtitulo: "Valor a receber vs mês anterior",
  });

  // === Taxa de Cancelamento ===
  const totalContratosGeral = contratosAtual + contratosCancelados;
  const taxaCancelamento = totalContratosGeral === 0 ? 0 : (contratosCancelados / totalContratosGeral) * 100;
  const tendenciaCancelamento = contratosCancelados === 0 ? "up" : "down";

  cards.push({
    titulo: "Taxa de Cancelamento",
    valor: `${taxaCancelamento.toFixed(1)}%`,
    percentual: contratosCancelados === 0 ? "Sem cancelamentos" : `${contratosCancelados} cancelados`,
    tendencia: tendenciaCancelamento,
    destaque: "Cancelamentos de contratos",
    subtitulo: `${contratosCancelados} cancelados de ${totalContratosGeral} contratos totais`,
  });

  return cards;
}
