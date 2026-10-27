export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getNextInvoiceNumber, createInvoiceRecord, findInvoiceByChaveNfe, findOrCreateSupplierByDocument, findOrCreateSupplierByOriginalInvoice } from '@/actions/get-next-invoice-number';
import { db } from '@/lib/db';
import { toast } from 'sonner';

const FOCUS_TOKEN_HOMOLOGACAO = process.env.FOCUS_TOKEN_HOMOLOGACAO;
const FOCUS_TOKEN_PRODUCAO = process.env.FOCUS_TOKEN_PRODUCAO;

type Ambiente = "homologacao" | "producao";
const ambiente = process.env.AMBIENTE as Ambiente ?? "homologacao";

function getFocusConfig(ambiente: Ambiente) {
  if (ambiente === "producao") {
    return {
      baseUrl: "https://api.focusnfe.com.br",
      token: FOCUS_TOKEN_PRODUCAO,
    };
  }
  return {
    baseUrl: "https://homologacao.focusnfe.com.br",
    token: FOCUS_TOKEN_HOMOLOGACAO,
  };
}


const CFOP_DEVOLUCAO_MAP: { [key: string]: string } = {
  // Operações internas (mesmo estado)
  '5101': '1201', // Venda de produção -> Devolução de venda de produção
  '5102': '1202', // Venda de mercadoria -> Devolução de venda de mercadoria
  '5103': '1203', // Venda fora do estabelecimento -> Devolução fora do estabelecimento
  '5104': '1204', // Venda de mercadoria fora do estabelecimento -> Devolução
  '5109': '1209', // Venda sem transitar pelo vendedor -> Devolução
  '5110': '1410', // Venda de consignação industrial -> Devolução
  '5111': '1411', // Venda em consignação industrial -> Devolução
  '5112': '1414', // Venda de terceiros em consignação -> Devolução
  '5113': '1415', // Venda em consignação de terceiros -> Devolução
  '5114': '1660', // Venda de encomenda futura -> Devolução
  '5115': '1661', // Venda em entrega futura -> Devolução
  '5116': '1662', // Venda de produção encomenda futura -> Devolução
  '5117': '1663', // Venda de produção entrega futura -> Devolução
  '5118': '1664', // Venda à ordem -> Devolução
  '5119': '1665', // Venda de terceiros à ordem -> Devolução
  '5120': '1666', // Venda por conta de terceiros -> Devolução
  '5122': '1667', // Venda de produção por terceiros -> Devolução
  '5123': '1251', // Venda de energia elétrica -> Devolução
  
  // Operações interestaduais (estados diferentes) - devolução de compra usa série 6000
  '6101': '6202', // Venda de produção interestadual -> Devolução de compra interestadual
  '6102': '6202', // Venda de mercadoria interestadual -> Devolução de compra interestadual
  '6103': '6202', // Venda fora do estabelecimento interestadual -> Devolução de compra interestadual
  '6104': '6202', // Venda de mercadoria fora interestadual -> Devolução de compra interestadual
  '6107': '6202', // Venda de produção para não contribuinte -> Devolução de compra 
  '6108': '6202', // Venda de mercadoria para não contribuinte -> Devolução de compra
  '6109': '6202', // Venda sem transitar interestadual -> Devolução de compra interestadual
  '6110': '6202', // Venda de consignação interestadual -> Devolução de compra interestadual
  '6111': '6202', // Venda em consignação interestadual -> Devolução de compra interestadual
  '6112': '6202', // Venda de terceiros consignação interestadual -> Devolução de compra interestadual
  '6113': '6202', // Venda consignação terceiros interestadual -> Devolução de compra interestadual
  '6114': '6202', // Venda encomenda futura interestadual -> Devolução de compra interestadual
  '6115': '6202', // Venda entrega futura interestadual -> Devolução de compra interestadual
  '6116': '6202', // Venda produção encomenda interestadual -> Devolução de compra interestadual
  '6117': '6202', // Venda produção entrega interestadual -> Devolução de compra interestadual
  '6118': '6202', // Venda à ordem interestadual -> Devolução de compra interestadual
  '6119': '6202', // Venda terceiros ordem interestadual -> Devolução de compra interestadual
  '6120': '6202', // Venda por terceiros interestadual -> Devolução de compra interestadual
  '6122': '6202', // Venda produção por terceiros interestadual -> Devolução de compra interestadual
  '6123': '6202', // Venda energia elétrica interestadual -> Devolução de compra interestadual
  
  // Devoluções de compra (quando estamos devolvendo algo que compramos)
  '1102': '6202', // Compra interna -> Devolução de compra interestadual
  '2102': '6202', // Compra interestadual -> Devolução de compra interestadual
  '1101': '6202', // Compra produção interna -> Devolução de compra interestadual (corrigido)
  '2101': '6202', // Compra produção interestadual -> Devolução de compra interestadual (corrigido)
};

function sanitizeDocument(document?: string): string | undefined {
  if (!document) return undefined;
  return document.replace(/\D/g, '');
}

function fixStr(str: any, fallback: string = '') {
  if (typeof str === 'string') return str.trim();
  if (str == null) return fallback;
  return String(str).trim();
}

// Função para calcular impostos de devolução de compra
function calculateReturnTaxes(valorBruto: number, isInterstate: boolean, isSimpleNacional: boolean = false) {
  if (isSimpleNacional) {
    // Para Simples Nacional com CSOSN, o ICMS não é destacado
    // O valor já está incluso no preço dos produtos
    const icmsBase = valorBruto;
    const icmsAliquota = 0; // Não destacar alíquota para CSOSN
    const icmsValor = 0; // Não destacar valor para CSOSN
    
    // Para Simples Nacional, PIS e COFINS são isentos
    const pisCofinBase = 0;
    const pisAliquota = 0;
    const cofinsAliquota = 0;
    const pisValor = 0;
    const cofinsValor = 0;
    
    return {
      icmsBase,
      icmsAliquota,
      icmsValor,
      pisCofinBase,
      pisAliquota,
      cofinsAliquota,
      pisValor,
      cofinsValor,
      totalImpostos: 0 // Para CSOSN, impostos estão inclusos no valor
    };
  }
  
  // Para devolução de compra interestadual (regime normal)
  if (isInterstate) {
    // Base do ICMS é o valor bruto
    const icmsBase = valorBruto;
    const icmsAliquota = 12; // 12% para interestadual
    const icmsValor = (icmsBase * icmsAliquota) / 100;
    
    // Base PIS/COFINS é valor bruto - ICMS
    const pisCofinBase = valorBruto - icmsValor;
    const pisAliquota = 0.65; // 0,65%
    const cofinsAliquota = 3; // 3%
    const pisValor = (pisCofinBase * pisAliquota) / 100;
    const cofinsValor = (pisCofinBase * cofinsAliquota) / 100;
    
    return {
      icmsBase,
      icmsAliquota,
      icmsValor,
      pisCofinBase,
      pisAliquota,
      cofinsAliquota,
      pisValor,
      cofinsValor,
      totalImpostos: icmsValor + pisValor + cofinsValor
    };
  } else {
    // Para operações internas, aplicar ICMS interno
    const icmsBase = valorBruto;
    const icmsAliquota = 18; // 18% para operações internas (ajustar conforme estado)
    const icmsValor = (icmsBase * icmsAliquota) / 100;
    
    const pisCofinBase = valorBruto - icmsValor;
    const pisAliquota = 0.65;
    const cofinsAliquota = 3;
    const pisValor = (pisCofinBase * pisAliquota) / 100;
    const cofinsValor = (pisCofinBase * cofinsAliquota) / 100;
    
    return {
      icmsBase,
      icmsAliquota,
      icmsValor,
      pisCofinBase,
      pisAliquota,
      cofinsAliquota,
      pisValor,
      cofinsValor,
      totalImpostos: icmsValor + pisValor + cofinsValor
    };
  }
}

// Função para determinar se a operação é interestadual
function isInterstateOperation(ufOrigem: string, ufDestino: string): boolean {
  return ufOrigem.toUpperCase() !== ufDestino.toUpperCase();
}

// Função para obter CFOP de devolução correto
function getDevolucaoCfop(cfopOriginal: string, ufEmitente: string, ufDestinatario: string, type: InvoiceType = 'devolucao'): string {
  const isInterstate = isInterstateOperation(ufEmitente, ufDestinatario);

  // Para remessa de conserto, usar CFOP específico
  if (type === 'conserto') {
    return isInterstate ? '6915' : '5915';
  }
  
  // Para devolução de compra, usamos CFOPs específicos conforme o mapeamento
  let cfopDevolucao = CFOP_DEVOLUCAO_MAP[cfopOriginal];
  if (!cfopDevolucao) {
    // Se não encontrar mapeamento específico, usar CFOPs padrão para devolução de compra
    if (isInterstate) {
      cfopDevolucao = '6202'; // Devolução de compra interestadual padrão
    } else {
      cfopDevolucao = '1202'; // Devolução de compra interna padrão
    }
  }
  
  // Para devolução de compra interestadual, sempre usar série 6000 (saída)
  // Para devolução de compra interna, sempre usar série 1000 (entrada local)
  if (isInterstate && !cfopDevolucao.startsWith('6')) {
    // Se for interestadual mas não está na série 6000, forçar para 6202
    cfopDevolucao = '6202';
  } else if (!isInterstate && !cfopDevolucao.startsWith('1')) {
    // Se for interna mas não está na série 1000, forçar para 1202
    cfopDevolucao = '1202';
  }
  
  return cfopDevolucao;
}

// Interface para item selecionado pelo usuário
interface SelectedItem {
  codigo: string;
  quantidade: number;
  index: number; // Índice do produto no array original
}

// Interface para dados da nota original (mesma do analyze)
interface OriginalInvoiceData {
  chaveNfe: string;
  emitente: any;
  destinatario: any;
  produtos: any[];
  dataEmissao: string;
  valorTotal: number;
}

type InvoiceType = 'devolucao' | 'conserto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { originalInvoiceData, selectedItems, additionalData, type = 'devolucao' }: {
      originalInvoiceData: OriginalInvoiceData;
      selectedItems: SelectedItem[];
      additionalData?: any;
      type?: InvoiceType;
    } = body;

    if (!originalInvoiceData || !selectedItems || selectedItems.length === 0) {
      return NextResponse.json(
        { message: 'Dados da nota original e itens selecionados são obrigatórios' },
        { status: 400 }
      );
    }

 
    if (!originalInvoiceData.chaveNfe || originalInvoiceData.chaveNfe.length !== 44) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Chave da NFe inválida. Deve ter 44 dígitos. Recebida: "${originalInvoiceData.chaveNfe}" (${originalInvoiceData.chaveNfe?.length || 0} dígitos)`
        },
        { status: 400 }
      );
    }

    const focusConfig = getFocusConfig(ambiente);
    if (!focusConfig.token || focusConfig.token === "*********" || focusConfig.token.length < 10) {
      return NextResponse.json({ error: `Token do Focus NFe para o ambiente ${ambiente} não configurado ou inválido` }, { status: 500 });
    }

    // Filtrar e calcular produtos a serem devolvidos
    const produtosDevolucao = selectedItems.map((selected, index) => {
      const produtoOriginal = originalInvoiceData.produtos[selected.index];
      if (!produtoOriginal) {
        throw new Error(`Produto no índice ${selected.index} não encontrado na nota original`);
      }

      if (!Number.isFinite(selected.quantidade) || selected.quantidade < 1) {
        throw new Error(`Quantidade inválida (${selected.quantidade}) para o produto ${selected.codigo}. Deve ser >= 1.`);
      }
      if (selected.quantidade > produtoOriginal.quantidade) {
        throw new Error(`Quantidade selecionada (${selected.quantidade}) é maior que a quantidade original (${produtoOriginal.quantidade}) para o produto ${selected.codigo}`);
      }

      const valorUnitario = produtoOriginal.valorUnitario;
      const valorTotal = valorUnitario * selected.quantidade;

      const ufEmitente = originalInvoiceData.destinatario.endereco.uf; // quem envia/devolve
      const ufDestinatario = originalInvoiceData.emitente.endereco.uf; // destinatário

      const cfopOriginal = String(produtoOriginal.cfop || '').padStart(4, '0');
      const cfopDevolucao = getDevolucaoCfop(cfopOriginal, ufEmitente, ufDestinatario, type);
      
      // Determinar se é operação interestadual para cálculo de impostos
      const isInterstate = isInterstateOperation(ufEmitente, ufDestinatario);
      
      // Para devolução de compra interestadual, sempre usar regime normal para calcular impostos
      // Devolução de compra sempre tem impostos destacados independente do regime original
    const isDevolucaoCompraInterestadual = type === 'devolucao' && isInterstate && cfopDevolucao.startsWith('6');
    const isSimpleNacional = isDevolucaoCompraInterestadual ? false : (additionalData?.regime_tributario_emitente === 1 || additionalData?.regime_tributario_emitente === 4);      // Calcular impostos conforme especificação
      // Para remessa de conserto, não há destaque de impostos
      const taxes = type === 'conserto' ? {
        icmsBase: 0,
        icmsAliquota: 0,
        icmsValor: 0,
        pisCofinBase: 0,
        pisAliquota: 0,
        cofinsAliquota: 0,
        pisValor: 0,
        cofinsValor: 0,
        totalImpostos: 0
      } : calculateReturnTaxes(valorTotal, isInterstate, isSimpleNacional);
      
      // Montar item base
      const itemBase: any = {
        numero_item: index + 1,
        codigo_produto: produtoOriginal.codigo,
        descricao: produtoOriginal.descricao,
        cfop: cfopDevolucao,
        unidade_comercial: produtoOriginal.unidade,
        quantidade_comercial: selected.quantidade,
        valor_unitario_comercial: valorUnitario,
        valor_unitario_tributavel: valorUnitario,
        unidade_tributavel: produtoOriginal.unidade,
        codigo_ncm: String(produtoOriginal.ncm || '').padStart(8, '0'),
        quantidade_tributavel: selected.quantidade,
        valor_bruto: valorTotal,
        valor_desconto: 0,
        icms_origem: 0,
      };

      // Definir situação tributária com base no tipo de operação
      if (type === 'conserto') {
        // Para remessa de conserto: CST 90 - Outras
        itemBase.icms_situacao_tributaria = '90';
        itemBase.icms_modalidade_base_calculo = 3;
        itemBase.icms_base_calculo = 0;
        itemBase.icms_aliquota = 0;
        itemBase.icms_valor = 0;
        itemBase.pis_situacao_tributaria = '49';  // Outras operações de saída
        itemBase.pis_base_calculo = 0;
        itemBase.pis_aliquota = 0;
        itemBase.pis_valor = 0;
        itemBase.cofins_situacao_tributaria = '49';  // Outras operações de saída
        itemBase.cofins_base_calculo = 0;
        itemBase.cofins_aliquota = 0;
        itemBase.cofins_valor = 0;
      } else if (isSimpleNacional) {
        // Para Simples Nacional: usar icms_situacao_tributaria (não CSOSN) conforme API que funciona
        itemBase.icms_situacao_tributaria = 102; // Number, não string
        itemBase.pis_situacao_tributaria = '49';
        itemBase.cofins_situacao_tributaria = '49';
      } else {
        // Regime normal: informar CST e campos de ICMS com valores calculados
        itemBase.icms_situacao_tributaria = '00'; // '00' = Tributada integralmente
        itemBase.icms_modalidade_base_calculo = 3; // Valor da operação
        itemBase.icms_base_calculo = taxes.icmsBase;
        itemBase.icms_aliquota = taxes.icmsAliquota;
        itemBase.icms_valor = taxes.icmsValor;
        itemBase.pis_situacao_tributaria = '01'; // Operação tributável
        itemBase.pis_base_calculo = taxes.pisCofinBase;
        itemBase.pis_aliquota = taxes.pisAliquota;
        itemBase.pis_valor = taxes.pisValor;
        itemBase.cofins_situacao_tributaria = '01'; // Operação tributável
        itemBase.cofins_base_calculo = taxes.pisCofinBase;
        itemBase.cofins_aliquota = taxes.cofinsAliquota;
        itemBase.cofins_valor = taxes.cofinsValor;
      }

      

      return itemBase;
    });

    // Calcular totais incluindo impostos
    const valorProdutos = produtosDevolucao.reduce((sum, item) => sum + item.valor_bruto, 0);
    const totalIcms = produtosDevolucao.reduce((sum, item) => sum + (item.icms_valor || 0), 0);
    const totalPis = produtosDevolucao.reduce((sum, item) => sum + (item.pis_valor || 0), 0);
    const totalCofins = produtosDevolucao.reduce((sum, item) => sum + (item.cofins_valor || 0), 0);
    const totalImpostos = totalIcms + totalPis + totalCofins;
    const valorTotal = valorProdutos;

    // Para devolução de compra interestadual, sempre destacar impostos independente do regime original
    const isDevolucaoCompraInterestadual = produtosDevolucao.some(p => p.cfop.startsWith('6'));
    
    // Forçar lógica baseada na operação, não no regime original
    const icmsTotalParaEnvio = isDevolucaoCompraInterestadual ? totalIcms : 0;
    const pisTotalParaEnvio = isDevolucaoCompraInterestadual ? totalPis : 0;
    const cofinsTotalParaEnvio = isDevolucaoCompraInterestadual ? totalCofins : 0;


    // Data atual para emissão
    const nowISO = new Date().toISOString();

    // Inverter emitente e destinatário para devolução
    const emitenteOriginal = originalInvoiceData.emitente;
    const destinatarioOriginal = originalInvoiceData.destinatario;

    // Determinar se é operação interestadual
    const ufEmitente = destinatarioOriginal.endereco.uf;
    const ufDestinatario = emitenteOriginal.endereco.uf;
    const isInterstate = isInterstateOperation(ufEmitente, ufDestinatario);
    
    
    // Local de destino: 1-Interna, 2-Interestadual, 3-Exterior
    const localDestino = isInterstate ? 2 : 1;

    // Gerar próximo número de nota fiscal
    const nextInvoiceResult = await getNextInvoiceNumber();
    if (!nextInvoiceResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: nextInvoiceResult.error
        },
        { status: 500 }
      );
    }

    const invoiceNumber = nextInvoiceResult.nextNumber;

    // Na devolução, quem comprou (destinatário original) agora é o emitente
    // E quem vendeu (emitente original) agora é o destinatário
    // Para devolução de compra, a natureza da operação deve indicar que é uma saída (devolução)
    let naturezaOperacao: string;
    let finalidadeEmissao: number;

    if (type === 'conserto') {
      naturezaOperacao = isInterstate ? "REMESSA PARA CONSERTO OU REPARO INTERESTADUAL" : "REMESSA PARA CONSERTO OU REPARO";
      finalidadeEmissao = 1; // Normal
    } else {
      naturezaOperacao = isInterstate ? "Devolução de compra interestadual" : "Devolução de compra";
      finalidadeEmissao = 4; // Devolução
    }
    
    const payload = {
      natureza_operacao: naturezaOperacao,
      data_emissao: nowISO,
      data_entrada_saida: nowISO,
      tipo_documento: 1, // Nota Fiscal de Saída (devolução/conserto são saídas)
      finalidade_emissao: finalidadeEmissao,
      local_destino: localDestino,
      consumidor_final: 0,
      presenca_comprador: 0,
      
      // Série e número da nota fiscal de devolução
      serie: Math.max(1, Math.min(Number(additionalData?.serie) || 1, 999)),
      numero: invoiceNumber,
      
      // Informações complementares
      informacoes_adicionais_contribuinte: type === 'conserto' 
        ? `Remessa para conserto. NFe referência: ${originalInvoiceData.chaveNfe}. ${additionalData?.meio_envio ? `Meio de envio: ${additionalData.meio_envio}.` : ''} ${additionalData?.peso_total ? `Peso total: ${additionalData.peso_total}kg.` : ''}`
        : `Devolução referente à NFe chave: ${originalInvoiceData.chaveNfe}`,

      // Referência correta para devolução conforme orientação do suporte Focus NFe
      notas_referenciadas: [
        {
          chave_nfe: originalInvoiceData.chaveNfe
        }
      ],

      // Emitente da devolução (era o destinatário na nota original)
      ...(destinatarioOriginal.cnpj ? { cnpj_emitente: sanitizeDocument(destinatarioOriginal.cnpj) } : {}),
      ...(destinatarioOriginal.cpf ? { cpf_emitente: sanitizeDocument(destinatarioOriginal.cpf) } : {}),
      nome_emitente: fixStr(destinatarioOriginal.nome),
      nome_fantasia_emitente: fixStr(destinatarioOriginal.fantasia || destinatarioOriginal.nome),
      logradouro_emitente: fixStr(destinatarioOriginal.endereco.logradouro),
      numero_emitente: Number(destinatarioOriginal.endereco.numero) || 1,
      bairro_emitente: fixStr(destinatarioOriginal.endereco.bairro),
      municipio_emitente: fixStr(destinatarioOriginal.endereco.municipio),
      uf_emitente: fixStr(destinatarioOriginal.endereco.uf).toUpperCase(),
      cep_emitente: sanitizeDocument(destinatarioOriginal.endereco.cep || ''),
      telefone_emitente: sanitizeDocument(destinatarioOriginal.telefone || ''),
      email_emitente: fixStr(destinatarioOriginal.email || ''),
      
      // Configuração da IE do emitente - usar dados do additionalData ou padrão
      inscricao_estadual_emitente: fixStr(additionalData?.inscricao_estadual_emitente || destinatarioOriginal.inscricaoEstadual || 'ISENTO'),
      // Para devolução de compra interestadual, sempre usar regime normal (3) para destacar impostos
      regime_tributario_emitente: (isDevolucaoCompraInterestadual ? 3 : Number(additionalData?.regime_tributario_emitente ?? 1)),

      // Destinatário da devolução (era o emitente na nota original)
      ...(emitenteOriginal.cnpj ? { cnpj_destinatario: sanitizeDocument(emitenteOriginal.cnpj) } : {}),
      ...(emitenteOriginal.cpf ? { cpf_destinatario: sanitizeDocument(emitenteOriginal.cpf) } : {}),
      nome_destinatario: fixStr(emitenteOriginal.nome),
      telefone_destinatario: sanitizeDocument(emitenteOriginal.telefone || ''),
      email_destinatario: fixStr(emitenteOriginal.email || ''),
      logradouro_destinatario: fixStr(emitenteOriginal.endereco.logradouro),
      numero_destinatario: Number(emitenteOriginal.endereco.numero) || 1,
      bairro_destinatario: fixStr(emitenteOriginal.endereco.bairro),
      municipio_destinatario: fixStr(emitenteOriginal.endereco.municipio),
      uf_destinatario: fixStr(emitenteOriginal.endereco.uf).toUpperCase(),
      pais_destinatario: 'Brasil',
      cep_destinatario: sanitizeDocument(emitenteOriginal.endereco.cep || ''),
      
      // Configuração da IE do destinatário
      ...(emitenteOriginal.inscricaoEstadual && emitenteOriginal.inscricaoEstadual !== 'ISENTO' ? {
        inscricao_estadual_destinatario: fixStr(emitenteOriginal.inscricaoEstadual),
        indicador_inscricao_estadual_destinatario: 1 // Contribuinte ICMS
      } : {
        indicador_inscricao_estadual_destinatario: 2 // Isento de IE
      }),

      // Valores
      valor_frete: 0,
      valor_seguro: 0,
      valor_produtos: valorProdutos,
      valor_desconto: 0,
      valor_total: valorTotal,
      modalidade_frete: 9, // Sem frete
      valor_outras_despesas: 0,
      
      // Totais de impostos conforme documentação Focus NFe
         
   icms_valor_total: icmsTotalParaEnvio,
   icms_base_calculo: (isDevolucaoCompraInterestadual && type !== 'conserto') ? valorProdutos : 0,  // Alterado: força 0 para conserto
   pis_valor: pisTotalParaEnvio,
   cofins_valor: cofinsTotalParaEnvio,
   
   // Campos adicionais obrigatórios para impostos
   ...((isDevolucaoCompraInterestadual && type !== 'conserto') && {  // Alterado: adiciona condição para excluir conserto
     // Campos PIS/COFINS específicos
     pis_base_calculo: valorProdutos - icmsTotalParaEnvio,
     cofins_base_calculo: valorProdutos - icmsTotalParaEnvio,
     
     // Campos ICMS adicionais
     icms_substituicao_valor: 0,
     icms_desonerado_valor: 0,
     icms_deson_outros: 0,
     icms_fcp_valor: 0,
     icms_fcp_st_valor: 0,
     icms_fcp_st_retido_valor: 0,
     icms_base_calculo_st: 0,
     icms_valor_total_st: 0,
     
     // IPI
     ipi_valor: 0
   }),
   


      // Itens
      items: produtosDevolucao,
    };

    // Gerar referência única para a devolução
    const referencia = `DEV_${invoiceNumber}_${originalInvoiceData.chaveNfe.substring(0, 8)}_${Date.now()}`;

    

    const endpoint = `${focusConfig.baseUrl}/v2/nfe?ref=${referencia}`;

    const basicAuth = Buffer.from(`${focusConfig.token}:`).toString('base64');
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    let resData;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      resData = await res.json();
    } else {
      resData = await res.text();
    }

    if (res.ok || res.status === 202) {
     
      
      // Salvar no banco para status 200 (concluído) ou 202 (processando)
      try {
        // Buscar a NFe original no banco para obter o ID
        const originalInvoice = await findInvoiceByChaveNfe(originalInvoiceData.chaveNfe);
    
        
        // Buscar/criar o emitente (que será o destinatário na devolução) usando dados da nota original
        let supplierId: string | undefined = undefined;
      
        
        const supplier = await findOrCreateSupplierByOriginalInvoice(originalInvoiceData);
        
        if (supplier) {
          supplierId = supplier.id;
          
        } else {
          console.log('Não foi possível encontrar/criar supplier com os dados da nota original');
        }

      

        const newInvoice = await createInvoiceRecord({
          type: 'DEVOLUCAO', // Mantém como devolução para compatibilidade com o banco
          invoiceNumber: invoiceNumber!,
          invoiceCode: referencia,
          chaveNfe: resData?.chave_nfe || undefined,
          buyerId: undefined, // Para devolução/conserto, buyer pode ser undefined
          sellerId: supplierId,
          amount: Number(payload.valor_total),
          focusNfeRef: referencia,
          originalInvoiceId: originalInvoice?.id || undefined
        });

  

      } catch (dbError) {
        console.log('Erro ao salvar invoice no banco:', dbError);
      }

      return NextResponse.json(
        { 
          success: true,
          status: res.status === 202 ? 'processing' : 'completed',
          message: type === 'conserto' 
            ? 'Nota de remessa para conserto gerada com sucesso'
            : 'Nota de devolução gerada com sucesso',
          result: resData, 
          invoiceNumber: invoiceNumber,
          referencia 
        }, 
        { status: 200 }
      );
    } else {
      let errorMessage = 'Erro ao processar nota de devolução';
      let specificError = '';
      
      if (typeof resData === 'object' && resData !== null) {
        if ('erro' in resData) {
          errorMessage = resData.erro;
        } else if ('message' in resData) {
          errorMessage = resData.message;
        } else if ('errors' in resData && Array.isArray(resData.errors) && resData.errors.length > 0) {
          errorMessage = resData.errors[0];
        }
        
        // Tratamento específico para erro 773 (UF diferentes)
        if (errorMessage.includes('773') || errorMessage.includes('UF de destino difere da UF de origem')) {
          specificError = 'Erro de configuração fiscal: As UFs de origem e destino são diferentes, mas o CFOP indica operação interna. Verifique os dados da nota original.';
        }
        
        // Tratamento específico para erro 728 (IE do destinatário)
        if (errorMessage.includes('728') || errorMessage.includes('IE do destinatario') || errorMessage.includes('informacao da IE')) {
          specificError = 'Erro: Inscrição Estadual do destinatário não informada ou inválida. Verifique se o emitente da nota original possui IE válida.';
        }
      } else if (typeof resData === 'string') {
        errorMessage = resData;
      }
      
      return NextResponse.json(
        { 
          success: false,
          error: specificError || errorMessage,
          status: res.status,
          details: resData,
          debugInfo: {
            ufEmitente: payload.uf_emitente,
            ufDestinatario: payload.uf_destinatario,
            localDestino: payload.local_destino,
            naturezaOperacao: payload.natureza_operacao,
            cfops: produtosDevolucao.map(p => p.cfop),
            ieEmitente: payload.inscricao_estadual_emitente,
            indicadorIeDestinatario: payload.indicador_inscricao_estadual_destinatario,
            temCnpjDestinatario: !!payload.cnpj_destinatario,
            temCpfDestinatario: !!payload.cpf_destinatario
          }
        }, 
        { status: res.status }
        
      );
    
    }

    

  } catch (error: any) {
    console.log(`Erro ao gerar nota de devolução: ${error}`);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor',
        details: error?.message 
      },
      { status: 500 }
    );
  }
}
