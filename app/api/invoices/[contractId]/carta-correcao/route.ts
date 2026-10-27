import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ contractId: string }> }
) {
  try {
    const { contractId } = await context.params;
    const body = await req.json();
    const { correcao, data_evento } = body;

    if (!contractId) {
      return NextResponse.json({ error: 'contractId é obrigatório' }, { status: 400 });
    }

    if (!correcao || correcao.length < 15 || correcao.length > 1000) {
      return NextResponse.json({ 
        error: 'Correção deve ter entre 15 e 1000 caracteres' 
      }, { status: 400 });
    }

    const focusConfig = getFocusConfig(ambiente);
    if (!focusConfig.token) {
      return NextResponse.json({ 
        error: `Token do Focus NFe para o ambiente ${ambiente} não configurado` 
      }, { status: 500 });
    }

    // Verificar se o contrato existe e tem NFe
    const contract = await db.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 });
    }

    if (!contract.haveNfe) {
      return NextResponse.json({ error: 'Contrato não possui NFe' }, { status: 400 });
    }

    const referencia = contractId;
    const endpoint = `${focusConfig.baseUrl}/v2/nfe/${referencia}/carta_correcao`;

    const payload: any = { correcao };
    if (data_evento) {
      payload.data_evento = data_evento;
    }

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

    if (res.ok) {
      return NextResponse.json({
        success: true,
        status: resData.status,
        status_sefaz: resData.status_sefaz,
        mensagem_sefaz: resData.mensagem_sefaz,
        caminho_xml_carta_correcao: resData.caminho_xml_carta_correcao,
        caminho_pdf_carta_correcao: resData.caminho_pdf_carta_correcao,
        numero_carta_correcao: resData.numero_carta_correcao
      });
    } else {
      console.error('Erro da API FocusNFe:', res.status, resData);
      
      let errorMessage = 'Erro ao enviar carta de correção';
      if (typeof resData === 'object' && resData !== null) {
        if ('mensagem' in resData) {
          errorMessage = resData.mensagem;
        } else if ('error' in resData) {
          errorMessage = resData.error;
        }
      }
      
      return NextResponse.json({
        success: false,
        error: errorMessage,
        details: resData
      }, { status: res.status });
    }
  } catch (error: any) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error?.message },
      { status: 500 }
    );
  }
}
