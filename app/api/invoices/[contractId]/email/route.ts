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
  req: Request,
  context: { params: Promise<{ contractId: string }> }
) {
  try {
    const body = await req.json();
    const { emails } = body;
    const { contractId } = await context.params;

    if (!contractId) {
      return NextResponse.json({ error: 'ID do contrato é obrigatório' }, { status: 400 });
    }

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'Lista de emails é obrigatória' }, { status: 400 });
    }

    if (emails.length > 10) {
      return NextResponse.json({ error: 'Máximo de 10 emails por vez' }, { status: 400 });
    }

    // Validar formato dos emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return NextResponse.json({ 
        error: `Emails inválidos: ${invalidEmails.join(', ')}` 
      }, { status: 400 });
    }

    // Buscar o contrato no banco de dados
    const contract = await db.contract.findUnique({
      where: { id: contractId },
      select: {
        id: true,
        haveNfe: true,
      }
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 });
    }

    if (!contract.haveNfe) {
      return NextResponse.json({ 
        error: 'Este contrato não possui NFe gerada' 
      }, { status: 400 });
    }

    // Configuração do Focus NFe
    const focusConfig = getFocusConfig(ambiente);
    
    if (!focusConfig.token) {
      return NextResponse.json({ 
        error: `Token do Focus NFe para o ambiente ${ambiente} não configurado` 
      }, { status: 500 });
    }

    // Preparar a requisição para o Focus NFe
    const url = `${focusConfig.baseUrl}/v2/nfe/${contractId}/email`;
    
    const requestData = {
      emails: emails
    };

    // Fazer a requisição para o Focus NFe
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${focusConfig.token}:`).toString('base64')}`
      },
      body: JSON.stringify(requestData)
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('Erro na API Focus NFe:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
      
      return NextResponse.json({ 
        error: 'Erro ao enviar emails através do Focus NFe',
        details: responseText
      }, { status: response.status });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Emails enviados com sucesso',
      emails: emails,
    });

  } catch (error) {
    console.error('Erro ao reenviar email da NFe:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}
