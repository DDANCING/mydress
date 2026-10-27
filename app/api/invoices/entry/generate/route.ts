export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getNextInvoiceNumber, createInvoiceRecord, findOrCreateSupplierByDocument } from '@/actions/get-next-invoice-number';
import { z } from 'zod';

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

// CFOP para notas de entrada (compra/aquisição)
const CFOP_ENTRADA_MAP: { [key: string]: string } = {
  // Operações internas (mesmo estado)
  'COMPRA_MERCADORIA_INTERNA': '1102', // Compra para comercialização
  'COMPRA_PRODUCAO_INTERNA': '1101', // Compra para industrialização/produção
  'COMPRA_USO_CONSUMO_INTERNA': '1556', // Compra para uso e consumo
  'COMPRA_ATIVO_IMOBILIZADO_INTERNA': '1551', // Compra de ativo imobilizado
  'TRANSFERENCIA_INTERNA': '1152', // Transferência para industrialização
  'DEVOLUCAO_COMPRA_INTERNA': '1201', // Devolução de compra para comercialização
  
  // Operações interestaduais (estados diferentes)
  'COMPRA_MERCADORIA_INTERESTADUAL': '2102', // Compra interestadual para comercialização
  'COMPRA_PRODUCAO_INTERESTADUAL': '2101', // Compra interestadual para industrialização
  'COMPRA_USO_CONSUMO_INTERESTADUAL': '2556', // Compra interestadual para uso e consumo
  'COMPRA_ATIVO_IMOBILIZADO_INTERESTADUAL': '2551', // Compra interestadual de ativo imobilizado
  'TRANSFERENCIA_INTERESTADUAL': '2152', // Transferência interestadual para industrialização
  'DEVOLUCAO_COMPRA_INTERESTADUAL': '2201', // Devolução de compra interestadual
};

// Schema de validação dos dados de entrada
const entryInvoiceSchema = z.object({
  supplier: z.object({
    document: z.string().min(11, 'Documento do fornecedor é obrigatório'),
    name: z.string().min(1, 'Nome do fornecedor é obrigatório'),
    fantasia: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    endereco: z.object({
      logradouro: z.string().min(1, 'Logradouro é obrigatório'),
      numero: z.string().min(1, 'Número é obrigatório'),
      bairro: z.string().min(1, 'Bairro é obrigatório'),
      municipio: z.string().min(1, 'Município é obrigatório'),
      uf: z.string().length(2, 'UF deve ter 2 caracteres'),
      cep: z.string().min(8, 'CEP é obrigatório'),
    }),
    inscricaoEstadual: z.string().optional(),
  }),
  destinatario: z.object({
    document: z.string().min(11, 'Documento do destinatário é obrigatório'),
    name: z.string().min(1, 'Nome do destinatário é obrigatório'),
    fantasia: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    endereco: z.object({
      logradouro: z.string().min(1, 'Logradouro é obrigatório'),
      numero: z.string().min(1, 'Número é obrigatório'),
      bairro: z.string().min(1, 'Bairro é obrigatório'),
      municipio: z.string().min(1, 'Município é obrigatório'),
      uf: z.string().length(2, 'UF deve ter 2 caracteres'),
      cep: z.string().min(8, 'CEP é obrigatório'),
    }),
    inscricaoEstadual: z.string().optional(),
    regimeTributario: z.number().min(1).max(3).optional().default(1),
  }),
  produtos: z.array(z.object({
    codigo: z.string().min(1, 'Código do produto é obrigatório'),
    descricao: z.string().min(1, 'Descrição é obrigatória'),
    ncm: z.string().min(8, 'NCM deve ter 8 dígitos'),
    cfop: z.string().min(4, 'CFOP é obrigatório'),
    unidade: z.string().min(1, 'Unidade é obrigatória'),
    quantidade: z.number().positive('Quantidade deve ser positiva'),
    valorUnitario: z.number().positive('Valor unitário deve ser positivo'),
    valorTotal: z.number().positive('Valor total deve ser positivo'),
  })).min(1, 'Pelo menos um produto é obrigatório'),
  operationType: z.enum([
    'COMPRA_MERCADORIA',
    'COMPRA_PRODUCAO',
    'COMPRA_USO_CONSUMO',
    'COMPRA_ATIVO_IMOBILIZADO',
    'TRANSFERENCIA',
    'DEVOLUCAO_COMPRA'
  ]),
  serie: z.number().min(1).max(999).optional().default(1),
  observacoes: z.string().optional(),
});

function sanitizeDocument(document?: string): string | undefined {
  if (!document) return undefined;
  return document.replace(/\D/g, '');
}

function fixStr(str: any, fallback: string = '') {
  if (typeof str === 'string') return str.trim();
  if (str == null) return fallback;
  return String(str).trim();
}

// Função para determinar se a operação é interestadual
function isInterstateOperation(ufOrigem: string, ufDestino: string): boolean {
  return ufOrigem.toUpperCase() !== ufDestino.toUpperCase();
}

// Função para obter CFOP de entrada correto
function getEntradaCfop(operationType: string, ufFornecedor: string, ufDestinatario: string): string {
  const isInterstate = isInterstateOperation(ufFornecedor, ufDestinatario);
  
  let cfopKey = operationType;
  if (isInterstate) {
    cfopKey += '_INTERESTADUAL';
  } else {
    cfopKey += '_INTERNA';
  }
  
  const cfop = CFOP_ENTRADA_MAP[cfopKey];
  
  if (!cfop) {
    // CFOPs padrão se não encontrar mapeamento específico
    if (isInterstate) {
      return '2102'; // Compra interestadual padrão
    } else {
      return '1102'; // Compra interna padrão
    }
  }
  
  
  return cfop;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validar dados de entrada
    const validationResult = entryInvoiceSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      
      return NextResponse.json(
        { 
          success: false,
          message: 'Dados inválidos',
          errors: errors
        },
        { status: 400 }
      );
    }

    const { supplier, destinatario, produtos, operationType, serie, observacoes } = validationResult.data;

    // Validar configuração do Focus NFe
    const focusConfig = getFocusConfig(ambiente);
    if (!focusConfig.token || focusConfig.token === "*********" || focusConfig.token.length < 10) {
      return NextResponse.json({ 
        success: false,
        error: `Token do Focus NFe para o ambiente ${ambiente} não configurado ou inválido` 
      }, { status: 500 });
    }

    // Calcular totais
    const valorProdutos = produtos.reduce((sum, item) => sum + item.valorTotal, 0);
    const valorTotal = valorProdutos;

    // Data atual para emissão
    const nowISO = new Date().toISOString();

    // Determinar se é operação interestadual
    const ufFornecedor = supplier.endereco.uf;
    const ufDestinatario = destinatario.endereco.uf;
    const isInterstate = isInterstateOperation(ufFornecedor, ufDestinatario);
    
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

    // Preparar produtos para a NFe
    const produtosNfe = produtos.map((produto, index) => {
      const cfop = getEntradaCfop(operationType, ufFornecedor, ufDestinatario);
      
      return {
        numero_item: index + 1,
        codigo_produto: produto.codigo,
        descricao: produto.descricao,
        cfop: cfop,
        unidade_comercial: produto.unidade,
        quantidade_comercial: produto.quantidade,
        valor_unitario_comercial: produto.valorUnitario,
        valor_unitario_tributavel: produto.valorUnitario,
        unidade_tributavel: produto.unidade,
        codigo_ncm: String(produto.ncm).padStart(8, '0'),
        quantidade_tributavel: produto.quantidade,
        valor_bruto: produto.valorTotal,
        valor_desconto: 0,
        icms_origem: 0,
        icms_situacao_tributaria: 102, // Simples Nacional - sem tributação
        pis_situacao_tributaria: "07",
        cofins_situacao_tributaria: "07",
      };
    });

    // Determinar natureza da operação
    const naturezaOperacaoMap: { [key: string]: string } = {
      'COMPRA_MERCADORIA': isInterstate ? "Compra para comercialização interestadual" : "Compra para comercialização",
      'COMPRA_PRODUCAO': isInterstate ? "Compra para industrialização interestadual" : "Compra para industrialização",
      'COMPRA_USO_CONSUMO': isInterstate ? "Compra para uso e consumo interestadual" : "Compra para uso e consumo",
      'COMPRA_ATIVO_IMOBILIZADO': isInterstate ? "Compra de ativo imobilizado interestadual" : "Compra de ativo imobilizado",
      'TRANSFERENCIA': isInterstate ? "Transferência interestadual" : "Transferência",
      'DEVOLUCAO_COMPRA': isInterstate ? "Devolução de compra interestadual" : "Devolução de compra",
    };
    
    const naturezaOperacao = naturezaOperacaoMap[operationType] || "Compra para comercialização";
    
    const payload = {
      natureza_operacao: naturezaOperacao,
      data_emissao: nowISO,
      data_entrada_saida: nowISO,
      tipo_documento: 1, // Nota Fiscal de Entrada
      finalidade_emissao: 1, // NFe normal
      local_destino: localDestino,
      consumidor_final: 0,
      presenca_comprador: 0,
      
      // Série e número da nota fiscal
      serie: serie,
      numero: invoiceNumber,
      
      // Informações complementares
      informacoes_adicionais_contribuinte: observacoes || `Nota de entrada - ${naturezaOperacao}`,

      // Emitente (fornecedor)
      ...(supplier.document.length === 14 ? { cnpj_emitente: sanitizeDocument(supplier.document) } : { cpf_emitente: sanitizeDocument(supplier.document) }),
      nome_emitente: fixStr(supplier.name),
      nome_fantasia_emitente: fixStr(supplier.fantasia || supplier.name),
      logradouro_emitente: fixStr(supplier.endereco.logradouro),
      numero_emitente: Number(supplier.endereco.numero) || 1,
      bairro_emitente: fixStr(supplier.endereco.bairro),
      municipio_emitente: fixStr(supplier.endereco.municipio),
      uf_emitente: fixStr(supplier.endereco.uf).toUpperCase(),
      cep_emitente: sanitizeDocument(supplier.endereco.cep || ''),
      telefone_emitente: sanitizeDocument(supplier.phone || ''),
      email_emitente: fixStr(supplier.email || ''),
      inscricao_estadual_emitente: fixStr(supplier.inscricaoEstadual || 'ISENTO'),
      regime_tributario_emitente: 1, // Simples Nacional

      // Destinatário (nossa empresa)
      ...(destinatario.document.length === 14 ? { cnpj_destinatario: sanitizeDocument(destinatario.document) } : { cpf_destinatario: sanitizeDocument(destinatario.document) }),
      nome_destinatario: fixStr(destinatario.name),
      telefone_destinatario: sanitizeDocument(destinatario.phone || ''),
      email_destinatario: fixStr(destinatario.email || ''),
      logradouro_destinatario: fixStr(destinatario.endereco.logradouro),
      numero_destinatario: Number(destinatario.endereco.numero) || 1,
      bairro_destinatario: fixStr(destinatario.endereco.bairro),
      municipio_destinatario: fixStr(destinatario.endereco.municipio),
      uf_destinatario: fixStr(destinatario.endereco.uf).toUpperCase(),
      pais_destinatario: 'Brasil',
      cep_destinatario: sanitizeDocument(destinatario.endereco.cep || ''),
      
      // Configuração da IE do destinatário
      ...(destinatario.inscricaoEstadual && destinatario.inscricaoEstadual !== 'ISENTO' ? {
        inscricao_estadual_destinatario: fixStr(destinatario.inscricaoEstadual),
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
      valor_total_tributos: 0,

      // Itens
      items: produtosNfe,
    };

    // Gerar referência única para a nota de entrada
    const referencia = `ENTRY_${invoiceNumber}_${Date.now()}`;


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
        // Buscar/criar o fornecedor
        let supplierId: string | undefined = undefined;
        
        const supplierData = {
          name: supplier.name,
          email: supplier.email,
          phone: supplier.phone,
          address: `${supplier.endereco.logradouro}, ${supplier.endereco.numero}, ${supplier.endereco.bairro}, ${supplier.endereco.municipio}/${supplier.endereco.uf}`
        };
        
        const supplierRecord = await findOrCreateSupplierByDocument(supplier.document, supplierData);
        
        if (supplierRecord) {
          supplierId = supplierRecord.id;
        } else {
          console.log('Não foi possível encontrar/criar supplier');
        }


        const newInvoice = await createInvoiceRecord({
          type: 'ENTRADA' as any, // Estendendo o tipo para incluir ENTRADA
          invoiceNumber: invoiceNumber!,
          invoiceCode: referencia,
          chaveNfe: resData?.chave_nfe || undefined,
          buyerId: undefined, // Para entrada, o destinatário somos nós
          sellerId: supplierId,
          amount: Number(payload.valor_total),
          focusNfeRef: referencia
        });

        console.log('Invoice de entrada criada com sucesso:', newInvoice.id);
        
      } catch (dbError) {
        console.error('Erro ao salvar invoice no banco:', dbError);
        // Não falhar a operação se o banco falhar, apenas logar
      }

      return NextResponse.json(
        { 
          success: true,
          status: res.status === 202 ? 'processing' : 'completed',
          message: 'Nota de entrada gerada com sucesso',
          result: resData, 
          invoiceNumber: invoiceNumber,
          referencia 
        }, 
        { status: 200 }
      );
    } else {
      console.error('FocusNFe API error:', res.status, resData);
      
      let errorMessage = 'Erro ao processar nota de entrada';
      let specificError = '';
      
      if (typeof resData === 'object' && resData !== null) {
        if ('erro' in resData) {
          errorMessage = resData.erro;
        } else if ('message' in resData) {
          errorMessage = resData.message;
        } else if ('errors' in resData && Array.isArray(resData.errors) && resData.errors.length > 0) {
          errorMessage = resData.errors[0];
        }
        
        // Tratamento específico para erros comuns
        if (errorMessage.includes('773') || errorMessage.includes('UF de destino difere da UF de origem')) {
          specificError = 'Erro de configuração fiscal: As UFs de origem e destino são diferentes, mas o CFOP indica operação interna. Verifique os dados informados.';
        }
        
        if (errorMessage.includes('728') || errorMessage.includes('IE do destinatario') || errorMessage.includes('informacao da IE')) {
          specificError = 'Erro: Inscrição Estadual do destinatário não informada ou inválida. Verifique se a IE foi informada corretamente.';
        }
      } else if (typeof resData === 'string') {
        errorMessage = resData;
      }

      // Extrair informações para debug de forma segura
      const cnpjEmitente = 'cnpj_emitente' in payload ? payload.cnpj_emitente : undefined;
      const cpfEmitente = 'cpf_emitente' in payload ? payload.cpf_emitente : undefined;
      const cnpjDestinatario = 'cnpj_destinatario' in payload ? payload.cnpj_destinatario : undefined;
      const cpfDestinatario = 'cpf_destinatario' in payload ? payload.cpf_destinatario : undefined;
      
      return NextResponse.json(
        { 
          success: false,
          error: specificError || errorMessage,
          status: res.status,
          details: resData,
          debugInfo: {
            ufFornecedor: payload.uf_emitente,
            ufDestinatario: payload.uf_destinatario,
            localDestino: payload.local_destino,
            naturezaOperacao: payload.natureza_operacao,
            cfops: produtosNfe.map(p => p.cfop),
            ieEmitente: payload.inscricao_estadual_emitente,
            indicadorIeDestinatario: payload.indicador_inscricao_estadual_destinatario,
            temCnpjEmitente: !!cnpjEmitente,
            temCpfEmitente: !!cpfEmitente,
            temCnpjDestinatario: !!cnpjDestinatario,
            temCpfDestinatario: !!cpfDestinatario
          }
        }, 
        { status: res.status }
      );
    }

  } catch (error: any) {
    console.error('Erro ao gerar nota de entrada:', error);
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
