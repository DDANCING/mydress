import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { formatCurrency } from '@/lib/currency-utils';
import { siteConfig } from '@/lib/site-config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentId, isDualCopy = false } = body;

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID é obrigatório' }, { status: 400 });
    }

    // Buscar dados do pagamento
    const payment = await db.contractPayment.findUnique({
      where: { id: paymentId },
      include: {
        contract: {
          include: {
            buyer: true,
            contractItems: { include: { product: true } }
          }
        },
        paymentMethod: true
      }
    });

    if (!payment) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
    }

    const { contract } = payment;
    const { buyer } = contract;

    // Carregar logo
    const logoPath = path.join(process.cwd(), 'public', 'logo-contract.png');
    const logoImg = fs.readFileSync(logoPath).toString('base64');

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;

    const drawReceipt = (yOffset: number) => {
      let y = yOffset;
      const boxHeight = 80; // Altura do retângulo

      // Caixa com borda arredondada
      pdf.setDrawColor(0);
      pdf.roundedRect(margin, y, contentWidth, boxHeight, 3, 3);

      // Logo
      // logo-contract.png tem proporção 360x335
      pdf.addImage(`data:image/png;base64,${logoImg}`, 'PNG', pageWidth / 2 - 5.5, y + 3, 11, 10.2, undefined, 'FAST');

      // Título
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('Recibo de Pagamento', pageWidth / 2, y + 20, { align: 'center' });

      // Valor
      pdf.setFontSize(10);
      const valorStr = `R$ ${Number(payment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      pdf.setDrawColor(0);
      pdf.roundedRect(pageWidth - margin - 30, y + 12, 25, 8, 1, 1);
      pdf.text(valorStr, pageWidth - margin - 15, y + 17, { align: 'center' });

      // Texto principal
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      const valorPorExtenso = formatCurrency(Number(payment.amount));
      const produtos = contract.contractItems.map(i => i.product.name).join(', ');
      const texto = `Recebi de ${buyer.fullName}${buyer.document ? ` - CPF ${buyer.document}` : ''}, a importância de ${valorPorExtenso}, referente à ${produtos}.\n\nPara maior clareza, firmo o presente recibo, que comprova o recebimento integral do valor mencionado, concedendo quitação plena, geral e irrevogável pela quantia recebida.`;
      pdf.text(pdf.splitTextToSize(texto, contentWidth - 10), margin + 5, y + 30);

      // Data e local
      const hoje = new Date();
      const dataStr = hoje.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
      pdf.text(`${siteConfig.address.city}, ${dataStr}`, pageWidth - margin - 5, y + 55, { align: 'right' });

      // Assinatura
      pdf.line(pageWidth / 2 - 30, y + 65, pageWidth / 2 + 30, y + 65);
      pdf.setFont('helvetica', 'bold');
      pdf.text(siteConfig.legalName, pageWidth / 2, y + 70, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.text(`CNPJ ${siteConfig.cnpj}`, pageWidth / 2, y + 75, { align: 'center' });

      return y + boxHeight + 10;
    };

    if (isDualCopy) {
      let y = 10;
      y = drawReceipt(y);
      drawReceipt(y);
    } else {
      drawReceipt(10);
    }

    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="recibo-pagamento-${payment.id}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Erro ao gerar recibo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
