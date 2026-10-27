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

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ contractId: string }> }
) {
  try {
    const { contractId } = await context.params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'xml'; // xml, json, pdf
    const type = searchParams.get('type') || 'nfe'; // nfe, cancelamento, carta_correcao

    console.log(`[DOWNLOAD] Iniciando download para contractId: ${contractId}, format: ${format}, type: ${type}`);

    if (!contractId) {
      return NextResponse.json({ error: 'ID da invoice é obrigatório' }, { status: 400 });
    }

    const focusConfig = getFocusConfig(ambiente);
    if (!focusConfig.token) {
      return NextResponse.json({ 
        error: `Token do Focus NFe para o ambiente ${ambiente} não configurado` 
      }, { status: 500 });
    }

    // Para NFe criadas por contrato, usar o contractId diretamente como referência
    // Para outras invoices, buscar por ID
    let invoice;
    let chaveToUse = contractId; // Por padrão, usar o contractId como chave/referência

    // Se parece com um UUID, pode ser ID de invoice
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(contractId);
    
    if (isUUID) {
      // Tentar buscar por ID primeiro
      invoice = await db.invoice.findUnique({
        where: { id: contractId },
        select: { 
          id: true, 
          chaveNfe: true,
          type: true,
          nfeStatus: true,
          invoiceNumber: true,
          focusNfeRef: true
        }
      });

      if (invoice) {
        // Para FocusNFe, usar SEMPRE a referência (focusNfeRef), não a chave NFe
        chaveToUse = invoice.focusNfeRef || contractId;
     
      }
    }

    // Se não encontrou por ID ou não é UUID, buscar por focusNfeRef
    if (!invoice) {
      (`[DOWNLOAD] Buscando por focusNfeRef: ${contractId}`);
      invoice = await db.invoice.findFirst({
        where: { focusNfeRef: contractId },
        select: { 
          id: true, 
          chaveNfe: true,
          type: true,
          nfeStatus: true,
          invoiceNumber: true,
          focusNfeRef: true
        }
      });

      if (invoice) {
        chaveToUse = invoice.focusNfeRef || contractId;
        
      }
    }

    // Se ainda não encontrou, usar o contractId diretamente (pode ser uma referência do FocusNFe)
    if (!invoice) {
      return NextResponse.json({ error: `Não encontrou invoice no banco, usando contractId diretamente como referência: ${contractId}` });
    }

    // Construir URL baseada no tipo e formato
    // Usar o endpoint correto baseado na documentação do FocusNFe
    // Para download, primeiro consultar a NFe para obter os caminhos
    let url: string;
    
    if (format === 'json') {
      // Para JSON, usar consulta completa
      url = `${focusConfig.baseUrl}/v2/nfe/${encodeURIComponent(chaveToUse)}?completa=1`;
    } else {
      // Para XML e PDF, precisamos primeiro consultar para obter os caminhos
      // Primeiro fazer consulta
      const consultaUrl = `${focusConfig.baseUrl}/v2/nfe/${encodeURIComponent(chaveToUse)}?completa=1`;
      
      const consultaResponse = await fetch(consultaUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${focusConfig.token}:`).toString('base64')}`,
        },
      });

      if (!consultaResponse.ok) {
        const errorText = await consultaResponse.text();
      
        return NextResponse.json({ 
          error: `Erro ao consultar NFe: ${consultaResponse.status} - ${errorText}` 
        }, { status: consultaResponse.status });
      }

      const nfeData = await consultaResponse.json();
      
      if (nfeData.status !== 'autorizado') {
        return NextResponse.json({ 
          error: `NFe não está autorizada. Status: ${nfeData.status}` 
        }, { status: 400 });
      }

      // Determinar o caminho correto baseado no tipo e formato
      let caminhoArquivo: string | null = null;
      
      switch (type) {
        case 'cancelamento':
          caminhoArquivo = nfeData.caminho_xml_cancelamento;
          break;
        case 'carta_correcao':
          if (format === 'xml') {
            caminhoArquivo = nfeData.caminho_xml_carta_correcao;
          } else if (format === 'pdf') {
            caminhoArquivo = nfeData.caminho_pdf_carta_correcao;
          }
          break;
        case 'nfe':
        default:
          if (format === 'xml') {
            caminhoArquivo = nfeData.caminho_xml_nota_fiscal;
          } else if (format === 'pdf') {
            caminhoArquivo = nfeData.caminho_danfe;
          }
          break;
      }

      if (!caminhoArquivo) {
        return NextResponse.json({ 
          error: `Caminho do arquivo ${format} não encontrado para tipo ${type}` 
        }, { status: 404 });
      }

      // Construir URL final para download
      url = `${focusConfig.baseUrl}${caminhoArquivo}`;
    }


    // Fazer requisição para o FocusNFe
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${focusConfig.token}:`).toString('base64')}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro do FocusNFe (${response.status}):`, errorText);
      
      if (response.status === 404) {
        return NextResponse.json({ 
          error: 'NFe não encontrada no FocusNFe' 
        }, { status: 404 });
      }
      
      return NextResponse.json({ 
        error: `Erro ao buscar NFe: ${response.status} - ${errorText}` 
      }, { status: response.status });
    }

    const data = await response.arrayBuffer();
    
    // Determinar content-type baseado no formato
    let contentType: string;
    let filename: string;
    
    // Usar número da invoice se disponível, senão usar a chave/referência
    const fileIdentifier = invoice?.invoiceNumber ? invoice.invoiceNumber.toString() : chaveToUse.substring(0, 8);
    
    switch (format) {
      case 'json':
        contentType = 'application/json';
        filename = `nfe_${fileIdentifier}.json`;
        break;
      case 'pdf':
        contentType = 'application/pdf';
        filename = `nfe_${fileIdentifier}.pdf`;
        break;
      case 'xml':
      default:
        contentType = 'application/xml';
        filename = `nfe_${fileIdentifier}.xml`;
        break;
    }

    // Ajustar filename baseado no tipo
    if (type === 'cancelamento') {
      filename = filename.replace('.', `_cancelamento.`);
    } else if (type === 'carta_correcao') {
      filename = filename.replace('.', `_carta_correcao.`);
    }

    // Retornar arquivo para download
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': data.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Erro no download da NFe:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}
