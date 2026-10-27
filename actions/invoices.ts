"use server";

import { db } from "@/lib/db";

export async function getInvoices(filters?: {
  type?: 'NFE' | 'DEVOLUCAO' | 'CANCELAMENTO' | 'ENTRADA';
  startDate?: Date;
  endDate?: Date;
  status?: string;
}) {
  try {
    const where: any = {};
    
    if (filters?.type) {
      where.type = filters.type;
    }
    
    if (filters?.startDate && filters?.endDate) {
      where.createdAt = {
        gte: filters.startDate,
        lte: filters.endDate
      };
    }
    
    if (filters?.status) {
      where.nfeStatus = filters.status;
    }

    const invoices = await db.invoice.findMany({
      where,
      include: {
        buyer: {
          select: {
            id: true,
            fullName: true,
            document: true,
            email: true
          }
        },
        supplier: {
          select: {
            id: true,
            name: true,
            document: true,
            email: true
          }
        },
        originalInvoice: {
          select: {
            id: true,
            invoiceNumber: true,
            chaveNfe: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      success: true,
      invoices
    };
  } catch (error) {
    console.error('Erro ao buscar invoices:', error);
    return {
      success: false,
      error: 'Erro ao buscar notas fiscais',
      invoices: []
    };
  }
}

export async function getInvoiceStats() {
  try {
    const stats = await db.invoice.groupBy({
      by: ['type', 'nfeStatus'],
      _count: {
        id: true
      },
      _sum: {
        amount: true
      }
    });

    const totalCount = await db.invoice.count();
    const totalAmount = await db.invoice.aggregate({
      _sum: {
        amount: true
      }
    });

    return {
      success: true,
      stats,
      totalCount,
      totalAmount: totalAmount._sum.amount || 0
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas das invoices:', error);
    return {
      success: false,
      error: 'Erro ao buscar estatísticas'
    };
  }
}
