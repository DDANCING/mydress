import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { siteConfig } from '@/lib/site-config';

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

function sanitizeDocument(document?: string): string | undefined {
  if (!document) return undefined;
  return document.replace(/\D/g, '');
}

function sanitizeTotals(prodTotal: number, discountTotal: number) {
  if (discountTotal > prodTotal) {
    return [prodTotal, prodTotal];
  }
  return [
    Math.max(0, prodTotal),
    Math.max(0, discountTotal)
  ];
}

function fixStr(str: any, fallback: string = '') {
  if (typeof str === 'string') return str.trim();
  if (str == null) return fallback;
  return String(str).trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contractId, additionalData, debug } = body;
    if (!contractId) {
      return NextResponse.json({ error: 'contractId is required' }, { status: 400 });
    }

    const focusConfig = getFocusConfig(ambiente);
    if (!focusConfig.token || focusConfig.token === "*********" || focusConfig.token.length < 10) {
      return NextResponse.json({ error: `Token do Focus NFe para o ambiente ${ambiente} não configurado ou inválido` }, { status: 500 });
    }

    const contract = await db.contract.findUnique({
      where: { id: contractId },
      include: {
        buyer: true,
        seller: true,
        contractItems: { include: { product: true } },
        contractPayments: { include: { paymentMethod: true } },
        paymentMethod: true,
      }
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const buyer = contract.buyer;
    const seller = contract.seller;
    const itemsTaxDetails = additionalData?.itemsTaxDetails;

  

    // Regime tributário
    const regimeTributario = Number(additionalData?.regime_tributario_emitente ?? 1);

    // Monta os itens usando os dados vindos do front-end
const items = (itemsTaxDetails ?? []).map((taxDetails: any, idx: number) => {
  const subtotal = Number(taxDetails.subtotal ?? (taxDetails.quantity * taxDetails.unitPrice));
  // Simples Nacional (CRT=1 ou 4) — só envie CSOSN!
  if (regimeTributario === 1 || regimeTributario === 4) {
    return {
      numero_item: idx + 1,
      codigo_produto: String(taxDetails.sku || taxDetails.productId),
      descricao: fixStr(contract.contractItems[idx]?.product?.name ?? ''),
      cfop: Number(taxDetails.cfop ?? 5102),
      unidade_comercial: "UN",
      quantidade_comercial: Number(taxDetails.quantity),
      valor_unitario_comercial: Number(taxDetails.unitPrice),
      valor_unitario_tributavel: Number(taxDetails.unitPrice),
      unidade_tributavel: "UN",
      codigo_ncm: String(taxDetails.ncm ?? "63090010").padStart(8, "0"),
      quantidade_tributavel: Number(taxDetails.quantity),
      valor_bruto: Number(taxDetails.unitPrice) * Number(taxDetails.quantity), // SEM desconto!
      valor_desconto: Number(taxDetails.discount ?? 0), // desconto separado
      icms_origem: Number(taxDetails.icms_origem ?? 0),
      pis_situacao_tributaria: fixStr(taxDetails.pis_situacao_tributaria ?? "07"),
      cofins_situacao_tributaria: fixStr(taxDetails.cofins_situacao_tributaria ?? "07"),
      icms_situacao_tributaria: Number(taxDetails.icms_situacao_tributaria ?? 102)
    };
  } else {
    // Regime normal — só envie CST!
    return {
      numero_item: idx + 1,
      codigo_produto: String(taxDetails.productId),
      descricao: fixStr(contract.contractItems[idx]?.product?.name ?? ''),
      cfop: Number(taxDetails.cfop ?? 5102),
      unidade_comercial: "UN",
      quantidade_comercial: Number(taxDetails.quantity),
      valor_unitario_comercial: Number(taxDetails.unitPrice),
      valor_unitario_tributavel: Number(taxDetails.unitPrice),
      unidade_tributavel: "UN",
      codigo_ncm: String(taxDetails.ncm ?? "63090010").padStart(8, "0"),
      quantidade_tributavel: Number(taxDetails.quantity),
      valor_bruto: Number(taxDetails.unitPrice) * Number(taxDetails.quantity), // SEM desconto!
      valor_desconto: Number(taxDetails.discount ?? 0), // desconto separado
      icms_origem: Number(taxDetails.icms_origem ?? 0),
      pis_situacao_tributaria: fixStr(taxDetails.pis_situacao_tributaria ?? "07"),
      cofins_situacao_tributaria: fixStr(taxDetails.cofins_situacao_tributaria ?? "07"),
     
      icms_situacao_tributaria: Number(taxDetails.icms_situacao_tributaria ?? 41)
    };
  }
});
    // Totais
    const valor_produtos = items.reduce((sum: number, item: any) => sum + Number(item.valor_bruto), 0);
    const valor_desconto = items.reduce((sum: number, item: any) => sum + Number(item.valor_desconto || 0), 0);
    const [safe_produtos, safe_desconto] = sanitizeTotals(valor_produtos, valor_desconto);

    // Validação extra
    if (safe_produtos !== valor_produtos) {
      console.warn(`WARNING: valor_produtos (${safe_produtos}) difere da soma dos itens (${valor_produtos})`);
    }

    // Datas
    const nowISO = new Date().toISOString();

    if (!siteConfig.stateRegistration) {
      return NextResponse.json(
        { error: "Inscrição estadual do emitente não configurada. Preencha stateRegistration em lib/site-config.ts antes de emitir notas." },
        { status: 500 }
      );
    }

    const cnpj_emitente = sanitizeDocument(siteConfig.cnpj);

    const sanitizedBuyerDoc = sanitizeDocument(buyer.document || '');
    const cnpj_destinatario = sanitizedBuyerDoc && sanitizedBuyerDoc.length === 14 ? sanitizedBuyerDoc : undefined;
    const cpf_destinatario = sanitizedBuyerDoc && sanitizedBuyerDoc.length === 11 ? sanitizedBuyerDoc : undefined;

    const indicadorIE = Number(additionalData?.indicador_inscricao_estadual_destinatario ?? 9);

    let consumidor_final: number;
    if (indicadorIE === 9) {
      consumidor_final = 1;
    } else {
      consumidor_final = 0;
    }

    const payload = {
      natureza_operacao: fixStr(additionalData?.operationNature || "Venda de mercadoria"),
      data_emissao: nowISO,
      data_entrada_saida: nowISO,
      tipo_documento: 1,
      finalidade_emissao: Number(additionalData?.finalidade_emissao ?? 1),
      local_destino: Number(additionalData?.local_destino ?? 1),
      consumidor_final,
      presenca_comprador: Number(additionalData?.presenca_comprador ?? 0),
      // Série e número da nota fiscal
      serie: Number(additionalData?.serie ?? 1),
      ...(additionalData?.number ? { numero: Number(additionalData.number) } : {}),
      cnpj_emitente,
      nome_emitente: fixStr(siteConfig.legalName),
      nome_fantasia_emitente: fixStr(siteConfig.fullName),
      logradouro_emitente: fixStr("Rua Senador Milton Campos"),
      numero_emitente: Number(265),
      complemento_emitente: fixStr("Casa"),
      bairro_emitente: fixStr(siteConfig.address.district),
      municipio_emitente: fixStr(siteConfig.address.city),
      uf_emitente: fixStr(siteConfig.address.state).toUpperCase(),
      cep_emitente: sanitizeDocument(siteConfig.address.zip),
      inscricao_estadual_emitente: fixStr(siteConfig.stateRegistration),
      regime_tributario_emitente: regimeTributario,
      nome_destinatario: fixStr(buyer.fullName),
      cnpj_destinatario,
      cpf_destinatario,
      
      telefone_destinatario: sanitizeDocument(buyer.phone || ''),
      logradouro_destinatario: fixStr(buyer.address),
      numero_destinatario: Number(buyer.number) || 1,
      bairro_destinatario: fixStr(buyer.neighborhood),
      municipio_destinatario: fixStr(buyer.city),
      uf_destinatario: fixStr(buyer.state).toUpperCase(),
      pais_destinatario: fixStr('Brasil'),
      cep_destinatario: sanitizeDocument(buyer.cep || ''),
      indicador_inscricao_estadual_destinatario: indicadorIE,
      valor_frete: Number(additionalData?.valor_frete ?? 0),
      valor_seguro: Number(additionalData?.valor_seguro ?? 0),
      valor_produtos: safe_produtos,
      email_destinatario: fixStr(buyer.email || ''),
      valor_desconto: safe_desconto,
      valor_total: safe_produtos - safe_desconto,
      modalidade_frete: Number(additionalData?.modalidade_frete ?? 0),
      valor_outras_despesas: Number(additionalData?.valor_outras_despesas ?? 0),
      valor_total_tributos: Number(additionalData?.valor_total_tributos ?? 0),
      items,
    };

    const referencia = contract.id || Math.random().toString(36).substring(2, 15);

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

    // For HTTP 200 OK or 202 Accepted (which indicates async processing)
    if (res.ok || res.status === 202) {

      // Always update the contract for both 200 and 202 responses
      try {
        await db.contract.update({
          where: { id: contractId },
          data: { 
            haveNfe: true,
           }
        });
        if ((additionalData.number || resData.numero) && (contract.totalAmount || resData.valor_total) && (contract.id || resData.ref) && contract.buyerId) {
          await db.invoice.create({
            data: {
              invoiceNumber: additionalData.number || resData.numero,
              invoiceCode: contract.id || resData.ref,
              buyer: {
              connect: { id: contract.buyerId }
            },
            amount: contract.totalAmount || resData.valor_total,
            focusNfeRef: contract.id || resData.ref,
          }
        });
      } else {
        console.error('Dados da nota fiscal incompletos:', resData);
      }
      } catch (err) {
        console.error('Erro ao atualizar haveNfe no contrato:', err);
        // Continue processing even if update fails - we should still return the API response
      }
      
     
      // Return a successful response with appropriate data
      return NextResponse.json(
        { 
          success: true,
          status: res.status === 202 ? 'processing' : 'completed',
          result: resData, 
          payload,
          updated: true 
        }, 
        { status: 200 } 
      );
    } else {
      // Handle API errors from FocusNFe
      console.error('FocusNFe API error:', res.status, resData);
      
      // Extract error message from FocusNFe response
      let errorMessage = 'Erro ao processar nota fiscal';
      if (typeof resData === 'object' && resData !== null) {
        if ('erro' in resData) {
          errorMessage = resData.erro;
        } else if ('message' in resData) {
          errorMessage = resData.message;
        } else if ('errors' in resData && Array.isArray(resData.errors) && resData.errors.length > 0) {
          errorMessage = resData.errors[0];
        }
      } else if (typeof resData === 'string') {
        errorMessage = resData;
      }
      
      return NextResponse.json(
        { 
          success: false,
          error: errorMessage,
          status: res.status,
          details: resData
        }, 
        { status: res.status }
      );
    }
  } catch (error: any) {
    console.error('Internal error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    );
  }
}