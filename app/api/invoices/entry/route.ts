import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseStringPromise } from 'xml2js';
import { getNextInvoiceNumber, findOrCreateSupplierByDocument } from '@/actions/get-next-invoice-number';

// Mapeamento de códigos de forma de pagamento (tPag) para descrições
const PAYMENT_METHOD_MAP: { [key: string]: string } = {
  '01': 'Dinheiro',
  '02': 'Cheque',
  '03': 'Cartão de Crédito',
  '04': 'Cartão de Débito',
  '05': 'Crédito Loja',
  '10': 'Vale Alimentação',
  '11': 'Vale Refeição',
  '12': 'Vale Presente',
  '13': 'Vale Combustível',
  '14': 'Duplicata Mercantil',
  '15': 'Boleto Bancário',
  '16': 'Depósito Bancário',
  '17': 'PIX',
  '18': 'Transferência Bancária',
  '19': 'Programa de Fidelidade',
  '90': 'Sem Pagamento',
  '99': 'Outros'
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const xmlFile = formData.get('xmlFile') as File;
    const emitenteIEOverride = formData.get('emitenteIE') as string | null;

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

    // Extrair dados do emitente
    const emit = infNFe.emit?.[0];
    if (!emit) {
      return NextResponse.json(
        { message: 'Dados do emitente não encontrados no XML' },
        { status: 400 }
      );
    }

    // Extrair dados de identificação
    const ide = infNFe.ide?.[0];
    if (!ide) {
      return NextResponse.json(
        { message: 'Dados de identificação não encontrados no XML' },
        { status: 400 }
      );
    }

    // Extrair dados dos totais
    const total = infNFe.total?.[0];
    const icmsTot = total?.ICMSTot?.[0];
    if (!icmsTot) {
      return NextResponse.json(
        { message: 'Dados de totais não encontrados no XML' },
        { status: 400 }
      );
    }

    // Extrair forma de pagamento
    const pag = infNFe.pag;
    let paymentMethod = 'Não identificado';
    
    if (pag && pag.length > 0) {
      const detPag = pag[0].detPag;
      if (detPag && detPag.length > 0) {
        const tPag = detPag[0].tPag?.[0];
        if (tPag && PAYMENT_METHOD_MAP[tPag]) {
          paymentMethod = PAYMENT_METHOD_MAP[tPag];
        }
      }
    }

    // Extrair dados necessários
    const emitenteName = emit.xNome?.[0] || 'Nome não informado';
    const emitenteDocument = emit.CNPJ?.[0] || emit.CPF?.[0] || '';
    const emissionDate = ide.dhEmi?.[0] || ide.dEmi?.[0];
    const fantasyName = emit.xFant?.[0] || emitenteName;
    const totalValue = parseFloat(icmsTot.vNF?.[0] || '0');
    const nfeNumber = parseInt(ide.nNF?.[0] || '0');
    const nfeSerie = parseInt(ide.serie?.[0] || '1');
    
    // Extrair chave da NFe
    const chaveNfe = infNFe.$.Id?.replace('NFe', '') || '';

    // Determinar IE do emitente - usar override se fornecido, senão usar do XML
    let emitenteIE = emit.IE?.[0] || '';
    if (emitenteIEOverride && emitenteIEOverride.trim()) {
      emitenteIE = emitenteIEOverride.trim();

    } 
    if (!emissionDate) {
      return NextResponse.json(
        { message: 'Data de emissão não encontrada no XML' },
        { status: 400 }
      );
    }

    // Converter data para o formato DateTime
    let parsedDate: Date;
    try {
      parsedDate = new Date(emissionDate);
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Data inválida');
      }
    } catch (error) {
      return NextResponse.json(
        { message: 'Formato de data inválido no XML' },
        { status: 400 }
      );
    }

    // Salvar no banco de dados usando transação
    const result = await db.$transaction(async (tx) => {
      // 1. Criar o lançamento financeiro
      const outFinanceEntry = await tx.outFinanceColumn.create({
        data: {
          name: emitenteName,
          data: parsedDate,
          store: fantasyName,
          method: paymentMethod,
          value: totalValue,
        },
      });

      // 2. Buscar/criar o fornecedor
      let supplierId: string | undefined = undefined;
      if (emitenteDocument) {
  
        
        const supplierData = {
          name: emitenteName,
          email: emit.email?.[0] || undefined,
          phone: emit.fone?.[0] || undefined,
          address: emit.enderEmit?.[0] ? 
            `${emit.enderEmit[0].xLgr?.[0] || ''}, ${emit.enderEmit[0].nro?.[0] || ''}, ${emit.enderEmit[0].xBairro?.[0] || ''}, ${emit.enderEmit[0].xMun?.[0] || ''}/${emit.enderEmit[0].UF?.[0] || ''}` 
            : undefined
        };
        
        const supplier = await findOrCreateSupplierByDocument(emitenteDocument, supplierData);
        if (supplier) {
          supplierId = supplier.id;
        }
      }

      // 3. Gerar próximo número de invoice se não tiver número da NFe
      let invoiceNumber = nfeNumber;
      if (!invoiceNumber || invoiceNumber === 0) {
        const nextInvoiceResult = await getNextInvoiceNumber();
        if (nextInvoiceResult.success && nextInvoiceResult.nextNumber) {
          invoiceNumber = nextInvoiceResult.nextNumber;
        } else {
          throw new Error('Falha ao gerar número da invoice');
        }
      }

      // 4. Criar a nota de entrada na tabela Invoice
      const invoiceCode = `ENTRY_XML_${Date.now()}_${chaveNfe.substring(0, 8)}`;
      
      const invoice = await tx.invoice.create({
        data: {
          type: 'ENTRADA',
          invoiceNumber: invoiceNumber,
          invoiceCode: invoiceCode,
          chaveNfe: chaveNfe || undefined,
          buyerId: undefined, // Para entrada, o destinatário somos nós (não registramos)
          sellerId: supplierId,
          amount: totalValue,
          nfeStatus: 'ACTIVE',
          focusNfeRef: `XML_IMPORT_${Date.now()}`,
        }
      });

      console.log('Nota de entrada criada com sucesso:', invoice.id);

      return { outFinanceEntry, invoice };
    });

    return NextResponse.json({
      success: true,
      message: 'Nota de entrada criada com sucesso a partir do XML',
      data: {
        // Dados do lançamento financeiro
        financeEntry: {
          id: result.outFinanceEntry.id,
          name: result.outFinanceEntry.name,
          data: result.outFinanceEntry.data,
          store: result.outFinanceEntry.store,
          method: result.outFinanceEntry.method,
          value: result.outFinanceEntry.value.toNumber(),
          createdAt: result.outFinanceEntry.createdAt,
        },
        // Dados da nota fiscal
        invoice: {
          id: result.invoice.id,
          invoiceNumber: result.invoice.invoiceNumber,
          invoiceCode: result.invoice.invoiceCode,
          chaveNfe: result.invoice.chaveNfe,
          amount: result.invoice.amount.toNumber(),
          type: result.invoice.type,
          nfeStatus: result.invoice.nfeStatus,
          createdAt: result.invoice.createdAt,
        },
        // Dados extraídos do XML
        xmlData: {
          emitenteName,
          emitenteDocument,
          emitenteIE,
          totalValue,
          nfeNumber,
          nfeSerie,
          chaveNfe,
          paymentMethod,
        }
      },
    });

  } catch (error: any) {
    console.error('Erro ao processar XML:', error);
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

