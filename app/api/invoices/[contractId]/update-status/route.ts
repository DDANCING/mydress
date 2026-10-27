import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const FOCUS_NFE_BASE_URL = process.env.AMBIENTE === 'producao' 
  ? 'https://api.focusnfe.com.br'
  : 'https://homologacao.focusnfe.com.br'

const FOCUS_NFE_TOKEN = process.env.AMBIENTE === 'producao'
  ? process.env.FOCUS_TOKEN_PRODUCAO
  : process.env.FOCUS_TOKEN_HOMOLOGACAO

interface FocusNfeResponse {
  status: string
  chave_nfe?: string
  status_sefaz?: string
  mensagem_sefaz?: string
  numero?: string
  serie?: string
  caminho_xml_nota_fiscal?: string
  caminho_danfe?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  try {
    const { contractId } = await params

    // Buscar a invoice no banco
    const invoice = await db.invoice.findUnique({
      where: { id: contractId },
      select: {
        id: true,
        focusNfeRef: true,
        chaveNfe: true,
        invoiceNumber: true
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice não encontrada' },
        { status: 404 }
      )
    }

    // Determinar referência para consulta na FocusNFe
    // Se não tem focusNfeRef, usar o próprio contractId como referência
    const focusReference = invoice.focusNfeRef || contractId
    
    
    const focusResponse = await fetch(
      `${FOCUS_NFE_BASE_URL}/v2/nfe/${focusReference}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${FOCUS_NFE_TOKEN}:`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!focusResponse.ok) {
      if (focusResponse.status === 404) {
        console.log(`[UPDATE-STATUS] NFe não encontrada na FocusNFe: ${invoice.focusNfeRef}`)
        return NextResponse.json(
          { error: 'NFe não encontrada na FocusNFe' },
          { status: 404 }
        )
      }
      
      const errorText = await focusResponse.text()
      console.error(`[UPDATE-STATUS] Erro FocusNFe:`, {
        status: focusResponse.status,
        response: errorText
      })
      
      return NextResponse.json(
        { error: `Erro na consulta FocusNFe: ${focusResponse.status}` },
        { status: 500 }
      )
    }

    const focusData: FocusNfeResponse = await focusResponse.json()

    // Preparar dados para atualização
    const updateData: any = {}
    let responseMessage = ''
    let responseStatus = ''

    // Sempre salvar o status da FocusNFe
    updateData.focusNfeStatus = focusData.status

    switch (focusData.status) {
      case 'autorizado':
        if (focusData.chave_nfe) {
          updateData.chaveNfe = focusData.chave_nfe
          responseMessage = 'NFe autorizada! Chave salva com sucesso.'
          responseStatus = 'autorizada'
        } else {
          responseMessage = 'NFe autorizada, mas chave não retornada pela FocusNFe'
          responseStatus = 'autorizada_sem_chave'
        }
        break
      
      case 'processando_autorizacao':
        responseMessage = 'NFe ainda está sendo processada. Tente novamente em alguns minutos.'
        responseStatus = 'processando'
        break
      
      case 'erro_autorizacao':
        responseMessage = `Erro na autorização: ${focusData.mensagem_sefaz || 'Erro desconhecido'}`
        responseStatus = 'erro'
        break
      
      case 'cancelado':
        responseMessage = 'NFe foi cancelada'
        responseStatus = 'cancelada'
        if (focusData.chave_nfe) {
          updateData.chaveNfe = focusData.chave_nfe
        }
        break
      
      case 'denegado':
        responseMessage = `NFe foi denegada: ${focusData.mensagem_sefaz || 'Motivo não especificado'}`
        responseStatus = 'denegada'
        if (focusData.chave_nfe) {
          updateData.chaveNfe = focusData.chave_nfe
        }
        break
      
      default:
        responseMessage = `Status desconhecido: ${focusData.status}`
        responseStatus = 'desconhecido'
    }

    // Atualizar no banco se houver dados para atualizar
    if (Object.keys(updateData).length > 0) {
      await db.invoice.update({
        where: { id: contractId },
        data: updateData
      })
      
    }

    return NextResponse.json({
      message: responseMessage,
      status: responseStatus,
      focusNfeStatus: focusData.status,
      chaveNfe: updateData.chaveNfe || null,
      statusSefaz: focusData.status_sefaz,
      mensagemSefaz: focusData.mensagem_sefaz,
      focusNfeData: {
        numero: focusData.numero,
        serie: focusData.serie,
        caminho_xml_nota_fiscal: focusData.caminho_xml_nota_fiscal,
        caminho_danfe: focusData.caminho_danfe
      }
    })

  } catch (error: any) {
    console.error('[UPDATE-STATUS] Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
