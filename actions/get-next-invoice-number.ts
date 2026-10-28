"use server";

import { assertStaff } from "@/lib/auth";
import { db } from "@/lib/db";

// Helper function para extrair o documento correto do destinatário
function extractDocumentFromDestinatario(destinatario: any): string | null {
  try {

    const rawCpf = destinatario?.cpf ?? destinatario?.CPF ?? null;
    const rawCnpj = destinatario?.cnpj ?? destinatario?.CNPJ ?? null;
    const pick = rawCnpj ?? rawCpf;
    if (pick == null) return null;

    const str =
      typeof pick === 'string' ? pick :
      typeof pick === 'number' ? String(pick) :
      null;

    if (!str) return null;

    const digits = str.replace(/\D/g, '');
    if (!digits) {
      if (process.env.NODE_ENV !== 'production') console.log('Nenhum dígito de documento encontrado');
      return null;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(rawCnpj ? 'CNPJ encontrado' : 'CPF encontrado');
    }
    return digits;
  } catch (error) {
    console.error('Erro ao extrair documento do destinatário:', error);
    return null;
  }
}

export async function getNextInvoiceNumber() {
  try {
    await assertStaff();
    const lastInvoice = await db.invoice.findFirst({
      where: {
        NOT: {
          type: 'ENTRADA'
        },
      },
      orderBy: {
        invoiceNumber: 'desc'
      }
    });

    // Se não há nenhuma nota fiscal, começa com 1
    // Se há, pega o próximo número
    const nextNumber = lastInvoice ? lastInvoice.invoiceNumber + 1 : 1;
    
    return {
      success: true,
      nextNumber
    };
  } catch (error) {
    console.error("Erro ao buscar próximo número da nota fiscal:", error);
    return {
      success: false,
      error: "Erro ao buscar próximo número da nota fiscal"
    };
  }
}

export async function findOrCreateSupplierByDocument(document: string, supplierData?: {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}) {
  try {
    await assertStaff();
    
    // Limpar o documento (remover caracteres especiais)
    const cleanDocument = document.replace(/\D/g, '');

    // Primeiro tenta encontrar o supplier existente
    let supplier = await db.supplier.findFirst({
      where: {
        document: cleanDocument
      }
    });



    // Se não encontrar, cria um novo supplier
    if (!supplier && supplierData) {
      
      supplier = await db.supplier.create({
        data: {
          name: supplierData.name || 'Fornecedor Não Identificado',
          document: cleanDocument,
          email: supplierData.email || `fornecedor_${cleanDocument}@temp.com`,
          phone: supplierData.phone || null,
          address: supplierData.address || null,
        }
      });
      
    }

    return supplier;
  } catch (error) {
    console.error('Erro ao buscar/criar fornecedor por documento:', error);
    return null;
  }
}

export async function findOrCreateSupplierByOriginalInvoice(originalInvoiceData: any) {
  try {
    await assertStaff();

    const emitente = originalInvoiceData?.emitente;
    if (!emitente) {
      return null;
    }

    const document = extractDocumentFromDestinatario(emitente);
    if (!document) {
      return null;
    }
   

    const supplierData = {
      name: emitente?.razao_social || emitente?.nome || emitente?.xNome || 'Fornecedor Não Identificado',
      email: emitente?.email || undefined,
      phone: emitente?.telefone || emitente?.fone || undefined,
      address: emitente?.endereco
        ? `${emitente.endereco?.logradouro || ''} ${emitente.endereco?.numero || ''}, ${emitente.endereco?.bairro || ''}, ${emitente.endereco?.municipio || ''} - ${emitente.endereco?.uf || ''}`.trim()
        : undefined,
    };

    return await findOrCreateSupplierByDocument(document, supplierData);
  } catch (error) {
    return null;
  }
}

export async function findSupplierByDocument(document: string) {
  try {
    await assertStaff();
    const clean = String(document ?? '').replace(/\D/g, '');
    return await db.supplier.findFirst({ where: { document: clean } });
  } catch (error) {
    console.error('Erro ao buscar fornecedor por documento:', error);
    return null;
  }
}

export async function createInvoiceRecord(data: {
  type: 'NFE' | 'DEVOLUCAO' | 'CANCELAMENTO' | 'ENTRADA';
  invoiceNumber: number;
  invoiceCode: string;
  chaveNfe?: string;
  buyerId?: string;
  sellerId?: string;
  amount: number;
  focusNfeRef?: string;
  originalInvoiceId?: string;
}) {
  try {
    await assertStaff();
    return await db.invoice.create({
      data: {
        type: data.type,
        invoiceNumber: data.invoiceNumber,
        invoiceCode: data.invoiceCode,
        chaveNfe: data.chaveNfe,
        buyerId: data.buyerId,
        sellerId: data.sellerId,
        amount: data.amount,
        focusNfeRef: data.focusNfeRef,
        originalInvoiceId: data.originalInvoiceId,
        nfeStatus: 'ACTIVE'
      }
    });
  } catch (error) {
    console.error('Erro ao criar registro de invoice:', error);
    throw new Error('Falha ao salvar nota fiscal no banco de dados');
  }
}

export async function findInvoiceByChaveNfe(chaveNfe: string) {
  try {
    await assertStaff();
    return await db.invoice.findFirst({
      where: {
        chaveNfe: chaveNfe
      }
    });
  } catch (error) {
    console.error('Erro ao buscar invoice por chave NFe:', error);
    return null;
  }
}
