import { NextRequest, NextResponse } from 'next/server';
import { parseStringPromise } from 'xml2js';

// Estrutura de um produto extraído do XML
interface ProductFromXML {
  codigo: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  ncm: string;
  cfop: string;
  unidade: string;
}

// Interface para dados do emitente/destinatário
interface CompanyData {
  cnpj?: string;
  cpf?: string;
  nome: string;
  fantasia?: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
  };
  telefone?: string;
  email?: string;
  inscricaoEstadual?: string;
}

// Interface para dados da nota original
interface OriginalInvoiceData {
  chaveNfe: string;
  emitente: CompanyData;
  destinatario: CompanyData;
  produtos: ProductFromXML[];
  dataEmissao: string;
  valorTotal: number;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const xmlFile = formData.get('xmlFile') as File;

    if (!xmlFile) {
      return NextResponse.json(
        { message: 'Arquivo XML é obrigatório' },
        { status: 400 }
      );
    }

    // Ler o conteúdo do arquivo XML
    const xmlContent = await xmlFile.text();

    // Parsear o XML
    let parsedXml;
    try {
      parsedXml = await parseStringPromise(xmlContent);
    } catch (error) {
      return NextResponse.json(
        { message: 'Arquivo XML inválido ou corrompido' },
        { status: 400 }
      );
    }

    // Navegar na estrutura do XML da NF-e
    const nfeProc = parsedXml.nfeProc || parsedXml.NFe || parsedXml;
    const infNFe = nfeProc.NFe?.[0]?.infNFe?.[0] || nfeProc.infNFe?.[0];

    if (!infNFe) {
      return NextResponse.json(
        { message: 'Estrutura XML da NF-e não reconhecida' },
        { status: 400 }
      );
    }

    // Extrair chave da NF-e
    const chaveNfe = infNFe.$.Id?.replace('NFe', '') || '';
    
    console.log('DEBUG Análise XML:', {
      chaveNfeExtraida: chaveNfe,
      idCompleto: infNFe.$.Id,
      tamanhoChave: chaveNfe.length
    });

    // Extrair dados do emitente
    const emit = infNFe.emit?.[0];
    const enderEmit = emit?.enderEmit?.[0];
    
    const emitente: CompanyData = {
      cnpj: emit?.CNPJ?.[0],
      cpf: emit?.CPF?.[0],
      nome: emit?.xNome?.[0] || '',
      fantasia: emit?.xFant?.[0],
      endereco: {
        logradouro: enderEmit?.xLgr?.[0] || '',
        numero: enderEmit?.nro?.[0] || '',
        complemento: enderEmit?.xCpl?.[0],
        bairro: enderEmit?.xBairro?.[0] || '',
        municipio: enderEmit?.xMun?.[0] || '',
        uf: enderEmit?.UF?.[0] || '',
        cep: enderEmit?.CEP?.[0] || '',
      },
      telefone: enderEmit?.fone?.[0],
      email: emit?.email?.[0],
      inscricaoEstadual: emit?.IE?.[0],
    };

    // Extrair dados do destinatário
    const dest = infNFe.dest?.[0];
    const enderDest = dest?.enderDest?.[0];
    
    const destinatario: CompanyData = {
      cnpj: dest?.CNPJ?.[0],
      cpf: dest?.CPF?.[0],
      nome: dest?.xNome?.[0] || '',
      fantasia: dest?.xFant?.[0],
      endereco: {
        logradouro: enderDest?.xLgr?.[0] || '',
        numero: enderDest?.nro?.[0] || '',
        complemento: enderDest?.xCpl?.[0],
        bairro: enderDest?.xBairro?.[0] || '',
        municipio: enderDest?.xMun?.[0] || '',
        uf: enderDest?.UF?.[0] || '',
        cep: enderDest?.CEP?.[0] || '',
      },
      telefone: enderDest?.fone?.[0],
      email: dest?.email?.[0],
      inscricaoEstadual: dest?.IE?.[0],
    };

    // Extrair produtos
    const detalhes = infNFe.det || [];
    const produtos: ProductFromXML[] = detalhes.map((det: any, index: number) => {
      const prod = det.prod?.[0];
      const imposto = det.imposto?.[0];
      const icms = imposto?.ICMS?.[0];
      
      // Pegar o primeiro elemento do ICMS (pode ser ICMS00, ICMS10, etc.)
      const icmsData = Object.values(icms || {})[0] as any;
      const cfop = prod?.CFOP?.[0] || '5102';

      return {
        codigo: prod?.cProd?.[0] || `ITEM_${index + 1}`,
        descricao: prod?.xProd?.[0] || '',
        quantidade: parseFloat(prod?.qCom?.[0] || '0'),
        valorUnitario: parseFloat(prod?.vUnCom?.[0] || '0'),
        valorTotal: parseFloat(prod?.vProd?.[0] || '0'),
        ncm: prod?.NCM?.[0] || '',
        cfop: cfop,
        unidade: prod?.uCom?.[0] || 'UN',
      };
    });

    // Extrair dados de identificação
    const ide = infNFe.ide?.[0];
    const dataEmissao = ide?.dhEmi?.[0] || ide?.dEmi?.[0] || '';

    // Extrair valor total
    const total = infNFe.total?.[0];
    const icmsTot = total?.ICMSTot?.[0];
    const valorTotal = parseFloat(icmsTot?.vNF?.[0] || '0');

    const dadosNota: OriginalInvoiceData = {
      chaveNfe,
      emitente,
      destinatario,
      produtos,
      dataEmissao,
      valorTotal,
    };

    return NextResponse.json({
      success: true,
      message: 'XML analisado com sucesso',
      data: dadosNota,
    });

  } catch (error: any) {
    console.error('Erro ao analisar XML:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Erro interno do servidor',
        details: error?.message 
      },
      { status: 500 }
    );
  }
}

