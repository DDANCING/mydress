import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import jsPDF from "jspdf";
import fs from "fs";
import path from "path";
import autoTable from "jspdf-autotable";
import { formatter } from "@/lib/utils";
import { siteConfig, companyLegalDescription } from "@/lib/site-config";

// Helper to get public logo file as base64
function getLogoBase64(): string | null {
  try {
    const logoPath = path.resolve(process.cwd(), "public/logo-contract.png");
    const logoData = fs.readFileSync(logoPath);
    return "data:image/png;base64," + logoData.toString("base64");
  } catch (err) {
    console.error("[LOGO_BASE64]", err);
    return null;
  }
}
// Remove acentos de uma string para uso seguro em headers HTTP
function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ contractId: string }> }
) {
  try {
    const { contractId } = await context.params;
    const user = await auth();
    const userId = user?.user?.id;

    if (!userId) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

   const contract = await db.contract.findUnique({
  where: { id: contractId },
  include: {
    buyer: true,
    contractItems: {
      include: { product: { include: { category: { include: { billboard: true } } } } },
    },
    paymentMethod: true, // pode manter se quiser mostrar o antigo
    seller: {
      include: { user: true },
    },
    contractPayments: { // <-- ADICIONE ISSO
      include: { paymentMethod: true },
    },
  },
});

    if (!contract) {
      return new NextResponse("Contrato não encontrado", { status: 404 });
    }

    // Generate PDF based on contract type/model
    const pdf = await generateContractPDF(contract);
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Contrato_${removeAccents(contract.buyer.fullName.replace(/\s+/g, ''))}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.pdf"`,
      },
    });

  } catch (error) {
    console.log("[CONTRACT_PDF_GENERATION]", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}

async function generateContractPDF(contract: any): Promise<jsPDF> {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  let pageHeight = pdf.internal.pageSize.height;

  // Add logo
  const logoBase64 = getLogoBase64();
  if (logoBase64) {
    // logo-contract.png tem proporção 360x335
    pdf.addImage(logoBase64, "PNG", 257, 18, 81, 75, undefined, "FAST");
  }
  let y = 110;

  // Title and header
  const contractTitles: Record<string, string> = {
    SALE: "CONTRATO DE COMPRA E VENDA DE TRAJE",
    RENTAL: "CONTRATO DE LOCAÇÃO DE TRAJE",
    ClothingSALE: "CONTRATO DE VENDA DE CONFECÇÃO DE TRAJE",
    clothingRENTAL: "CONTRATO DE LOCAÇÃO E CONFECCAO DE VESTIDO ",
  };
  const typeKey = contract.type as keyof typeof contractTitles;
  const title = contractTitles[typeKey] || "CONTRATO";

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text(title, 297.5, y, { align: "center" });
  y += 40;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);

  // Parties intro (varies by type)
  y = writePartiesBlock(pdf, contract, y, typeKey);

  // Event info (if needed)
  if (typeKey === "RENTAL" || typeKey === "clothingRENTAL") {
    y = writeEventInfoBlock(pdf, contract, y);
  }

  // Table of products (autoTable)
  y = writeContractItemsTable(pdf, contract, y, pageHeight);

  // Contract clauses
  y = writeContractClauses(pdf, contract, y, pageHeight);

  // Add terms and notes if they exist
  y = writeTermsAndNotes(pdf, contract, y, pageHeight);

  // Add signature boxes in last page
  addSignatureSection(pdf, contract, typeKey);

  // Add "rubrica" (initials) rectangle at bottom of each page
  addRubricaToAllPages(pdf);

  return pdf;
}

// Escreve a identificação da empresa e avança y conforme o número real de linhas
function writeCompanyParagraph(pdf: jsPDF, y: number): number {
  const lines = pdf.splitTextToSize(companyLegalDescription(), 520);
  pdf.text(lines, 40, y);
  const lineHeight = pdf.getFontSize() * pdf.getLineHeightFactor();
  return y + lines.length * lineHeight + 10;
}

function writePartiesBlock(pdf: jsPDF, contract: any, y: number, typeKey: string): number {
  let buyerName = contract.buyer.fullName;
  let buyerDoc = contract.buyer.document || "__________________";
  let buyerAddress = `${contract.buyer.address || ''} ${contract.buyer.number || ''} ${contract.buyer.complement || ''}`.trim();

  if (typeKey === "RENTAL" || typeKey === "clothingRENTAL") {
    pdf.text(
      `Pelo presente instrumento particular, de um lado, denominada CONTRATADA:`,
      40, y
    );
    y += 20;
    y = writeCompanyParagraph(pdf, y);

    pdf.text(
      `E de outro lado, denominada CONTRATANTE: ${buyerName}, inscrito(a) no CPF no ${buyerDoc}, residente e domiciliado(a) na ${buyerAddress || '__________________'}.`,
      40, y, { maxWidth: 520 }
    );
    y += 30;
    pdf.text(
      `As partes identificadas acima tem, entre si, justo e acertado o presente Contrato de prestação de serviço de LOCAÇÃO de traje de festa, que se regerá pelas cláusulas seguintes.`,
      40, y, { maxWidth: 520 }
    );
    y += 40;
  } else if (typeKey === "ClothingSALE" || typeKey === "SALE") {
    y = writeCompanyParagraph(pdf, y);
    pdf.text(
      `Comprador(a): ${buyerName}, inscrito(a) no CPF no ${buyerDoc}, residente e domiciliado(a) na ${buyerAddress || '__________________'}.`,
      40, y, { maxWidth: 520 }
    );
    y += 40;
  }
  return y;
}

function writeEventInfoBlock(pdf: jsPDF, contract: any, y: number): number {
  pdf.setFont("helvetica", "bold");
  pdf.text("INFORMAÇÕES SOBRE O EVENTO:", 40, y);
  pdf.setFont("helvetica", "normal");
  y += 16;
  pdf.text(`Data de Entrega: ${formatDate(contract.deliveryDate)}`, 40, y);
  y += 14;
  if (contract.eventDate) {
    pdf.text(`Data de Evento: ${formatDate(contract.eventDate)}`, 40, y);
    y += 14;
  }
  if (contract.returnDate) {
    pdf.text(`Data de Devolução: ${formatDate(contract.returnDate)}`, 40, y);
    y += 14;
  }
  return y + 4;
}

function writeContractItemsTable(pdf: jsPDF, contract: any, y: number, pageHeight: number): number {
  // Check if we need a new page
  if (y > pageHeight - 100) {
    pdf.addPage();
    y = 60;
  }

  // For all contract types, we don't show products table here as they are in clauses
  if (contract.type === "RENTAL" || contract.type === "clothingRENTAL" || contract.type === "ClothingSALE" || contract.type === "SALE") {
    return y;
  }

  // Table columns for SALE only
  let columns: any[] = [
    { header: "Id", dataKey: "id" },
    { header: "Descrição", dataKey: "desc" },
    { header: "Valor", dataKey: "sale" }
  ];

  // Table data
  let data = contract.contractItems.map((item: any) => ({
    id: item.product.sku || item.product.id,
    desc: item.product.name,
    sale: item.subtotal ? formatter.format(item.subtotal) : '',
  })); 

  // Table title
  pdf.setFont("helvetica", "bold");
  pdf.text("Produtos:", 40, y);
  pdf.setFont("helvetica", "normal");
  y += 10;

  // Table
  (autoTable as any)(pdf, {
    startY: y,
    head: [columns.map((c: any) => c.header)],
    body: data.map((row: any) => columns.map((c: any) => row[c.dataKey] || '')),
    theme: "grid",
    styles: { font: "helvetica", fontSize: 10, valign: "middle", halign: "center" },
    headStyles: { fillColor: [200, 200, 200], textColor: 50, font: "helvetica", fontStyle: "bold" },
    bodyStyles: {},
    margin: { left: 40, right: 40 },
    didDrawPage: function (data: any) {
      // leave bottom margin for rubrica, avoid overlapping
    },
  });
  let finalY = (pdf as any).lastAutoTable.finalY || y + 40;
  return finalY + 40;
}

function writeContractClauses(pdf: jsPDF, contract: any, y: number, pageHeight: number): number {
  let typeKey = contract.type as string;
  
  // Check if we need a new page for clauses
  if (y > pageHeight - 200) {
    pdf.addPage();
    y = 60;
  }

  // Write products section for each contract type 
  if (typeKey === "RENTAL") {
    y = writeRentalClauses(pdf, contract, y, pageHeight);
  } else if (typeKey === "SALE") {
    y = writeSaleClauses(pdf, contract, y, pageHeight);
  } else if (typeKey === "clothingRENTAL") {
    y = writeClothingRentalClauses(pdf, contract, y, pageHeight);
  } else if (typeKey === "ClothingSALE") {
    y = writeClothingSaleClauses(pdf, contract, y, pageHeight);
  }

  return y;
}

function writeRentalClauses(pdf: jsPDF, contract: any, y: number, pageHeight: number): number {
  // Cláusula Primeira - Descrição dos serviços contratados
  y = checkPageBreak(pdf, y, pageHeight);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("Cláusula Primeira - Descrição dos serviços contratados", 40, y);
  y += 30;
  
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  let columns: any[] = [
    { header: "Id", dataKey: "id" },
    { header: "Descrição", dataKey: "desc" },
    { header: "Valor do Aluguel", dataKey: "sale" }
  ];

  // Table data - For rental contracts, use product.rentalValue or half of unitPrice if rentalValue doesn't exist
  let data = contract.contractItems.map((item: any) => {
    const rentalValue = item.product.rentalValue || (item.unitPrice / 2);
    return {
      id: item.product.sku || item.product.id,
      desc: item.product.name,
      sale: rentalValue ? formatter.format(rentalValue) : 'Valor não definido',
    };
  });

  // Table
  (autoTable as any)(pdf, {
    startY: y,
    head: [columns.map((c: any) => c.header)],
    body: data.map((row: any) => columns.map((c: any) => row[c.dataKey] || '')),
    theme: "grid",
    styles: { font: "helvetica", fontSize: 10, valign: "middle", halign: "center" },
    headStyles: { fillColor: [200, 200, 200], textColor: 50, font: "helvetica", fontStyle: "bold" },
    bodyStyles: {},
    margin: { left: 40, right: 40 },
    didDrawPage: function (data: any) {
      // leave bottom margin for rubrica, avoid overlapping
    },
  });
  y = (pdf as any).lastAutoTable.finalY || y + 40;
  y += 20; // Space before summary table
  
  // Add value summary table
  const totalAmount = contract.totalAmount || 0;
  const discountAmount = contract.discount || 0;
  const finalValue = totalAmount - discountAmount;
  
  // Create summary table data with only 2 columns
  let summaryData = [
    ['Valor Total de Locação:', formatter.format(totalAmount)]
  ];
  
  if (discountAmount > 0) {
    summaryData.push([
      'Desconto:', 
      `- ${formatter.format(discountAmount)}`
    ]);
  }
  
  summaryData.push([
    'Valor Final:', 
    formatter.format(finalValue)
  ]);

  // Summary table with 2 columns only
  (autoTable as any)(pdf, {
    startY: y,
    head: [],
    body: summaryData,
    theme: "grid",
    styles: { font: "helvetica", fontSize: 10, valign: "middle" },
    bodyStyles: { fontStyle: "bold" },
    margin: { left: 40, right: 40 },
    columnStyles: {
      0: { halign: "left", cellWidth: 342 },
      1: { halign: "center", cellWidth: 172 }
    },
    didDrawPage: function (data: any) {
      // leave bottom margin for rubrica, avoid overlapping
    },
  });
  y = (pdf as any).lastAutoTable.finalY || y + 40;
  y += 30;

  // Cláusula Segunda - Do ajuste
  y = checkPageBreak(pdf, y, pageHeight);
  pdf.setFont("helvetica", "bold");
  pdf.text("Cláusula Segunda - Do ajuste (se houver)", 40, y);
  y += 30;
  
  pdf.setFont("helvetica", "normal");
  pdf.text(`Os ajustes de vestido realizados pela ${siteConfig.fullName} têm uma agenda de produção, que funciona da seguinte forma:`, 40, y, { maxWidth: 520 });
  y += 40;
  pdf.text("2.1 - Escolha do vestido e marcação de ajustes.", 40, y);
  y += 15;
  pdf.text("2.2 - Prova do traje para conferência de ajuste.", 40, y);
  y += 15;
  pdf.text("2.3 - Terceira e última prova para aprovação final, caso necessite de mais ajustes, nossa equipe agendará mais uma prova.", 40, y, { maxWidth: 520 });
  y += 40;
  pdf.text("2.4 - A entrega do vestido será feita na semana do evento.", 40, y);
  y += 15;
  pdf.text("O uso do salto alto é obrigatório desde a primeira prova do vestido.", 40, y);
  y += 25;

  // Cláusula Terceira - De ajustes extras (só para vestidos da coleção Prisma)
  const isPrisma = contract.contractItems.some((item: any) =>
    item.product.category?.billboard?.label?.toLowerCase().includes("prisma")
  );
  if (isPrisma) {
    y = checkPageBreak(pdf, y, pageHeight);
    pdf.setFont("helvetica", "bold");
    pdf.text("Cláusula Terceira - De ajustes extras", 40, y);
    y += 30;

    pdf.setFont("helvetica", "normal");
    pdf.text("3.2 - Adicionais de materiais como brilhos, bordados e tecidos extras serão cobrados como um serviço extra.", 40, y, { maxWidth: 520 });
    y += 25;
  }

  // Cláusula Quarta - Da autenticidade
  y = checkPageBreak(pdf, y, pageHeight);
  pdf.setFont("helvetica", "bold");
  pdf.text("Cláusula Quarta - Da autenticidade do vestido", 40, y);
  y += 30;
  
  pdf.setFont("helvetica", "normal");
  pdf.text(`A contratante está ciente de que o trabalho realizado pela ${siteConfig.fullName} é exclusivo, por isso, não serão realizadas cópias de outras marcas e modelos.`, 40, y, { maxWidth: 520 });
  y += 40;

  // Cláusula Quinta - Da entrega
  y = checkPageBreak(pdf, y, pageHeight);
  pdf.setFont("helvetica", "bold");
  pdf.text("Cláusula Quinta - Da entrega", 40, y);
  y += 30;
  
  pdf.setFont("helvetica", "normal");
  pdf.text("5.1 - O vestido só será entregue após uma última prova.", 40, y);
  y += 15;
  pdf.text("5.2 - Caso o contratado não entregue o traje dentro do prazo o contratado se responsabilizara em devolver todo o valor pago ou a locação de outro traje.", 40, y, { maxWidth: 520 });
  y += 30;
  pdf.text("5.3 - Caso seja constatada alguma danificação no traje no momento da entrega, o contratado se compromete a efetuar a substituição, ou troca, do traje, ou a devida devolução do valor pago.", 40, y, { maxWidth: 520 });
  y += 40;

  // Cláusula Sexta - Da Devolução
  y = checkPageBreak(pdf, y, pageHeight);
  pdf.setFont("helvetica", "bold");
  pdf.text("Cláusula Sexta - Da Devolução", 40, y);
  y += 30;
  
  pdf.setFont("helvetica", "normal");
  pdf.text("6.1 - O traje alugado deverá ser devolvido até as 18:00h da data estabelecida.", 40, y);
  y += 15;
  pdf.text("6.2 - Caso o objeto seja devolvido com excesso de sujeira ou mancha, será cobrada uma taxa de 10% (dez por cento) do valor de venda do vestido.", 40, y, { maxWidth: 520 });
  y += 30;
  pdf.text("6.3 - A não devolução no prazo de 10 (dez) dias será considerado EXTRAVIO ou ROUBO, sendo que o contratante terá que pagar 03 (três) vezes o valor do aluguel de cada peça.", 40, y, { maxWidth: 520 });
  y += 40;

  // Cláusula Sétima - Da Desistência
  y = checkPageBreak(pdf, y, pageHeight);
  pdf.setFont("helvetica", "bold");
  pdf.text("Cláusula Sétima - Da Desistência", 40, y);
  y += 30;
  
  pdf.setFont("helvetica", "normal");
  pdf.text("7.1 - Caso haja DESISTÊNCIA por parte do Contratante, o mesmo perderá o valor TOTAL pago.", 40, y);
  y += 25;

  // Cláusula Oitava - Do Valor
  y = checkPageBreak(pdf, y, pageHeight);
  pdf.setFont("helvetica", "bold");
  pdf.text("Cláusula Oitava - Do Valor", 40, y);
  y += 30;
  
  pdf.setFont("helvetica", "normal");

if (contract.contractPayments && contract.contractPayments.length > 0) {
  const discountAmountMain = contract.discount || 0;
  const finalValueMain = contract.totalAmount - discountAmountMain;
  const finalValueFormatted = formatter.format(finalValueMain);

  pdf.text(
    `8.1 - O valor dos serviços é de ${finalValueFormatted} e deverá ser pago da seguinte forma:`,
    40,
    y,
    { maxWidth: 520 }
  );
  y += 10;

  // Agrupar parcelas por descrição (ex: "Pix")
  const groupedPayments: Record<
    string,
    { count: number; total: number; dueDates: string[] }
  > = {};

  contract.contractPayments.forEach((payment: any) => {
    const amount = Number(payment.amount) || 0;
    const desc = payment.description || payment.paymentMethod?.description || '';
    const key = desc;

    const dueDate = payment.dueDate
      ? new Date(payment.dueDate).toLocaleDateString('pt-BR')
      : '';

    if (!groupedPayments[key]) {
      groupedPayments[key] = { count: 0, total: 0, dueDates: [] };
    }

    groupedPayments[key].count += 1;
    groupedPayments[key].total += amount;
    groupedPayments[key].dueDates.push(dueDate);
  });

  // Colunas e dados da tabela
  const columns = [
    { header: 'Descrição', dataKey: 'description' },
    { header: 'Qtd.', dataKey: 'count' },
    { header: 'Valor Unitário', dataKey: 'unit' },
    { header: 'Total', dataKey: 'total' },
    { header: 'Vencimentos', dataKey: 'dueDates' },
  ];

  const data = Object.entries(groupedPayments).map(([desc, info]) => {
    const unit = info.total / info.count;
    return {
      description: `${info.count}x ${desc}`,
      count: info.count,
      unit: formatter.format(unit),
      total: formatter.format(info.total),
      dueDates: info.dueDates.join(', '),
    };
  });

  // Renderiza a tabela
  (autoTable as any)(pdf, {
    startY: y,
    head: [columns.map(c => c.header)],
    body: data.map(row => columns.map(c => row[c.dataKey as keyof typeof row] || '')),
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 10,
      valign: 'middle',
      halign: 'center',
    },
    headStyles: {
      fillColor: [200, 200, 200],
      textColor: 50,
      font: 'helvetica',
      fontStyle: 'bold',
    },
    margin: { left: 40, right: 40 },
  });

  y = (pdf as any).lastAutoTable.finalY || y + 40;
  y += 20;

  // Soma os valores totais
  const totalPayments = Object.values(groupedPayments).reduce(
    (sum, g) => sum + g.total,
    0
  );

  // Verifica se ainda há valor a pagar
  if (totalPayments < finalValueMain) {
    const missingValue = finalValueMain - totalPayments;
    const missingValueFormatted = formatter.format(missingValue);
    pdf.text(
      `Faltando ao contratante concluir o pagamento de ${missingValueFormatted}.`,
      50,
      y,
      { maxWidth: 510 }
    );
    y += 30;
  }
} else {
  // fallback para mostrar o método antigo se não houver pagamentos relacionados
  const discountAmountMain = contract.discount || 0;
  const finalValueMain = contract.totalAmount - discountAmountMain;
  const finalValueFormatted = formatter.format(finalValueMain);
  pdf.text(`8.1 - O valor dos serviços é de ${finalValueFormatted} e deverá ser pago da seguinte forma: ${contract.paymentMethod.description}.`, 40, y, { maxWidth: 520 });
  y += 30;
}
  // Closing
  pdf.text("E por estarem justos e acordados, firma o presente contrato em duas vias de igual teor e forma, ficando eleito o Fórum desta Comarca.", 40, y, { maxWidth: 520 });
  y += 30;

  return y;
}

function writeSaleClauses(pdf: jsPDF, contract: any, y: number, pageHeight: number): number {
  // Cláusula Primeira - Do Objeto da Venda
  y = checkPageBreak(pdf, y, pageHeight);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("Cláusula Primeira - Do Objeto da Venda", 40, y);
  y += 30;
  
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.text("O objeto do presente contrato é a venda do seguinte produto:", 40, y);
  y += 20;
  
// Add products table here
  let columns: any[] = [
    { header: "Id", dataKey: "id" },
    { header: "Descrição", dataKey: "desc" },
    { header: "Valor", dataKey: "sale" }
  ];

  // Table data
  let data = contract.contractItems.map((item: any) => ({
    id: item.product.sku || item.product.id,
    desc: item.product.name,
    sale: item.subtotal ? `${formatter.format(item.subtotal)}` : '',
  }));

  // Table
  (autoTable as any)(pdf, {
    startY: y,
    head: [columns.map((c: any) => c.header)],
    body: data.map((row: any) => columns.map((c: any) => row[c.dataKey] || '')),
    theme: "grid",
    styles: { font: "helvetica", fontSize: 10, valign: "middle", halign: "center" },
    headStyles: { fillColor: [200, 200, 200], textColor: 50, font: "helvetica", fontStyle: "bold" },
    bodyStyles: {},
    margin: { left: 40, right: 40 },
    didDrawPage: function (data: any) {
      // leave bottom margin for rubrica, avoid overlapping
    },
  });
  y = (pdf as any).lastAutoTable.finalY || y + 40;
  y += 20; // Space before summary table
  
  // Add value summary table
  const totalAmount = contract.totalAmount || 0;
  const discountAmount = contract.discount || 0;
  const finalValue = totalAmount - discountAmount;
  
  // Create summary table data with only 2 columns
  let summaryData = [
    ['Valor Total:', formatter.format(totalAmount)]
  ];
  
  if (discountAmount > 0) {
    summaryData.push([
      'Desconto:', 
      `- ${formatter.format(discountAmount)}`
    ]);
  }
  
  summaryData.push([
    'Valor Final:', 
    formatter.format(finalValue)
  ]);

  // Summary table with 2 columns only
  (autoTable as any)(pdf, {
    startY: y,
    head: [],
    body: summaryData,
    theme: "grid",
    styles: { font: "helvetica", fontSize: 10, valign: "middle" },
    bodyStyles: { fontStyle: "bold" },
    margin: { left: 40, right: 40 },
    columnStyles: {
      0: { halign: "left", cellWidth: 342 },
      1: { halign: "center", cellWidth: 172 }
    },
    didDrawPage: function (data: any) {
      // leave bottom margin for rubrica, avoid overlapping
    },
  });
  y = (pdf as any).lastAutoTable.finalY || y + 40;
  y += 30;
  
  // Cláusula Segunda - Do Valor e da Forma de Pagamento
  y = checkPageBreak(pdf, y, pageHeight);
  pdf.setFont("helvetica", "bold");
  pdf.text("Cláusula Segunda - Do Valor e da Forma de Pagamento", 40, y);
  y += 30;
  
  pdf.setFont("helvetica", "normal");
  const finalValueFormatted = formatter.format(finalValue);
  pdf.text(`O valor total da venda do produto é de  ${finalValueFormatted} e deverá ser pago da seguinte forma: ${contract.paymentMethod.description}.`, 40, y, { maxWidth: 520 });
  y += 40;

  // Cláusula Terceira - Da Entrega do Produto
  y = checkPageBreak(pdf, y, pageHeight);
  pdf.setFont("helvetica", "bold");
  pdf.text("Cláusula Terceira - Da Entrega do Produto", 40, y);
  y += 30;
  
  pdf.setFont("helvetica", "normal");
  const deliveryDate = formatDate(contract.deliveryDate);
  pdf.text(`3.1 A entrega do traje será realizada em ${deliveryDate}, após a quitação total do valor.`, 40, y, { maxWidth: 520 });
  y += 30;
  pdf.text("3.2 O traje será inspecionado pela COMPRADORA no ato da entrega. Caso seja constatada alguma avaria pré-existente, a VENDEDORA se compromete a efetuar a substituição ou a devolução do valor pago.", 40, y, { maxWidth: 520 });
  y += 40;
  pdf.text("3.3 Após a entrega, a responsabilidade sobre o traje é transferida integralmente para a COMPRADORA.", 40, y, { maxWidth: 520 });
  y += 25;

  // Cláusula Quarta - Da Autenticidade do Traje
  y = checkPageBreak(pdf, y, pageHeight);
  pdf.setFont("helvetica", "bold");
  pdf.text("Cláusula Quarta - Da Autenticidade do Traje", 40, y);
  y += 30;
  
  pdf.setFont("helvetica", "normal");
  pdf.text(`A COMPRADORA está ciente de que o trabalho realizado pela ${siteConfig.fullName} é exclusivo, por isso, não será realizado cópias de outras marcas e modelos.`, 40, y, { maxWidth: 520 });
  y += 40;

  // Cláusula Quinta - Da Desistência
  pdf.addPage(); // Force new page for better spacing
  y = 60; // Start from top of new page
  pdf.setFont("helvetica", "bold");
  pdf.text("Cláusula Quinta - Da Desistência", 40, y);
  y += 30;
  
  pdf.setFont("helvetica", "normal");
  pdf.text("Em caso de desistência da compra por parte do(a) COMPRADOR(A), esta perderá o valor já pago a título de sinal ou multa contratual.", 40, y, { maxWidth: 520 });
  y += 40;

  // Cláusula Sexta - Do Foro
  y = checkPageBreak(pdf, y, pageHeight);
  pdf.setFont("helvetica", "bold");
  pdf.text("Cláusula Sexta - Do Foro", 40, y);
  y += 30;
  
  pdf.setFont("helvetica", "normal");
  pdf.text(`Fica eleito o Foro da Comarca de ${siteConfig.address.city}-${siteConfig.address.state} para dirimir quaisquer dúvidas.`, 40, y, { maxWidth: 520 });
  y += 40;

  return y;
}

function writeClothingRentalClauses(pdf: jsPDF, contract: any, y: number, pageHeight: number): number {
  // Cláusula Primeira - Descrição dos Serviços Contratados
  y = checkPageBreak(pdf, y, pageHeight);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("Cláusula Primeira - Descrição dos Serviços Contratados", 40, y);
  y += 40;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);

  // Add products table here
  let columns: any[] = [
    { header: "Id", dataKey: "id" },
    { header: "Descrição", dataKey: "desc" },
    { header: "Valor do Aluguel", dataKey: "sale" }
  ];

  // Table data - For rental contracts, use product.rentalValue or half of unitPrice if rentalValue doesn't exist
  let data = contract.contractItems.map((item: any) => {
    const rentalValue = item.product.rentalValue || (item.unitPrice / 2);
    return {
      id: item.product.sku || item.product.id,
      desc: item.product.name,
      sale: rentalValue ? formatter.format(rentalValue) : 'Valor não definido',
    };
  });

  // Table
  (autoTable as any)(pdf, {
    startY: y,
    head: [columns.map((c: any) => c.header)],
    body: data.map((row: any) => columns.map((c: any) => row[c.dataKey] || '')),
    theme: "grid",
    styles: { font: "helvetica", fontSize: 10, valign: "middle", halign: "center" },
    headStyles: { fillColor: [200, 200, 200], textColor: 50, font: "helvetica", fontStyle: "bold" },
    bodyStyles: {},
    margin: { left: 40, right: 40 },
    didDrawPage: function (data: any) {
      // leave bottom margin for rubrica, avoid overlapping
    },
  });
  y = (pdf as any).lastAutoTable.finalY || y + 40;
  y += 20; // Space before summary table

  // Add value summary table
  const totalAmountRental = contract.totalAmount || 0;
  const discountAmountRental = contract.discount || 0;
  const finalValueRental = totalAmountRental - discountAmountRental;

  // Create summary table data with only 2 columns
  let summaryData = [
    ['Valor Total de Locação:', formatter.format(totalAmountRental)]
  ];

  if (discountAmountRental > 0) {
    summaryData.push([
      'Desconto:',
      `- ${formatter.format(discountAmountRental)}`
    ]);
  }

  summaryData.push([
    'Valor Final:',
    formatter.format(finalValueRental)
  ]);

  // Summary table with 2 columns only
  (autoTable as any)(pdf, {
    startY: y,
    head: [],
    body: summaryData,
    theme: "grid",
    styles: { font: "helvetica", fontSize: 10, valign: "middle" },
    bodyStyles: { fontStyle: "bold" },
    margin: { left: 40, right: 40 },
    columnStyles: {
      0: { halign: "left", cellWidth: 342 },
      1: { halign: "center", cellWidth: 172 }
    },
    didDrawPage: function (data: any) {
      // leave bottom margin for rubrica, avoid overlapping
    },
  });
  y = (pdf as any).lastAutoTable.finalY || y + 40;
  y += 30;

  // Cláusula Segunda - Da Produção
  y = checkPageBreak(pdf, y, pageHeight);
  pdf.setFont("helvetica", "bold");
  pdf.text("Cláusula Segunda - Da Produção", 40, y);
  y += 20;

  pdf.setFont("helvetica", "normal");
  pdf.text("O processo de confecção funciona da seguinte forma:", 40, y);
  y += 20;
  pdf.text("2.1 - Aprovação de croqui.", 40, y);
  y += 15;
  pdf.text("2.2 - Escolha de tecidos e bordados.", 40, y);
  y += 15;
  pdf.text("2.3 - Primeira prova (modelagem). Após a aprovação da modelagem, a cliente está ciente de que não pode ser feita alteração.", 40, y, { maxWidth: 520 });
  y += 40;
  pdf.text("2.4 - Segunda prova para aprovação de rendas, bordados e ajustes.", 40, y);
  y += 15;
  pdf.text("2.5 - Terceira e última prova para aprovação final.", 40, y);
  y += 15;
  pdf.text("A entrega do vestido será feita na semana do evento.", 40, y);
  y += 15;
  pdf.text("O uso do salto alto é obrigatório desde a primeira prova do vestido.", 40, y);
  y += 25;

  // Cláusula Terceira - De Ajustes Extras
  y = checkPageBreak(pdf, y, pageHeight);
  pdf.setFont("helvetica", "bold");
  pdf.text("Cláusula Terceira - De Ajustes Extras", 40, y);
  y += 40;

  pdf.setFont("helvetica", "normal");
  pdf.text("3.1 - Alterações na modelagem após a aprovação da primeira prova serão cobradas como valor adicional.", 40, y, { maxWidth: 520 });
  y += 15;
  pdf.text("3.2 - Adicionais de materiais como brilhos, bordados e tecidos extras serão cobrados como serviço extra.", 40, y, { maxWidth: 520 });
  y += 25;

  // Cláusula Quarta - Da autenticidade
  y = checkPageBreak(pdf, y, pageHeight);
  pdf.setFont("helvetica", "bold");
  pdf.text("Cláusula Quarta - Da autenticidade do vestido", 40, y);
  y += 30;
  
  pdf.setFont("helvetica", "normal");
  pdf.text(`A contratante está ciente de que o trabalho realizado pela ${siteConfig.fullName} é exclusivo, por isso, não serão realizadas cópias de outras marcas e modelos.`, 40, y, { maxWidth: 520 });
  y += 40;

  // Cláusula Quinta - Da entrega
  y = checkPageBreak(pdf, y, pageHeight);
  pdf.setFont("helvetica", "bold");
  pdf.text("Cláusula Quinta - Da entrega", 40, y);
  y += 30;
  
  pdf.setFont("helvetica", "normal");
  pdf.text("5.1 - O vestido só será entregue após uma última prova.", 40, y);
  y += 15;
  pdf.text("5.2 - Caso o contratado não entregue o traje dentro do prazo o contratado se responsabilizara em devolver todo o valor pago ou a locação de outro traje.", 40, y, { maxWidth: 520 });
  y += 30;
  pdf.text("5.3 - Caso seja constatada alguma danificação no traje no momento da entrega, o contratado se compromete a efetuar a substituição, ou troca, do traje, ou a devida devolução do valor pago.", 40, y, { maxWidth: 520 });
  y += 40;

  // Cláusula Sexta - Da Devolução
  y = checkPageBreak(pdf, y, pageHeight);
  pdf.setFont("helvetica", "bold");
  pdf.text("Cláusula Sexta - Da Devolução", 40, y);
  y += 30;

  pdf.setFont("helvetica", "normal");
  pdf.text("6.1 - O traje alugado deverá ser devolvido até as 18:00h da data estabelecida.", 40, y);
  y += 15;
  pdf.text("6.2 - Caso o objeto seja devolvido com excesso de sujeira ou mancha, será cobrada uma taxa de 10% (dez por cento) do valor de venda do vestido.", 40, y, { maxWidth: 520 });
  y += 40;
  pdf.text("A não devolução no prazo de 10 dias será considerada EXTRAVIO, e o contratante terá que pagar 03 vezes o valor do aluguel.", 40, y, { maxWidth: 520 });
  y += 40;

  // Cláusula Sétima - Da Desistência
  y = checkPageBreak(pdf, y, pageHeight);
  pdf.setFont("helvetica", "bold");
  pdf.text("Cláusula Sétima - Da Desistência", 40, y);
  y += 25;

  pdf.setFont("helvetica", "normal");
  pdf.text("7.1 - Caso haja DESISTÊNCIA por parte do Contratante, o mesmo perderá o valor TOTAL pago.", 40, y);
  y += 25;

  // Cláusula Oitava - Do Valor
  y = checkPageBreak(pdf, y, pageHeight);
  pdf.setFont("helvetica", "bold");
  pdf.text("Cláusula Oitava - Do Valor", 40, y);
  y += 30;

  pdf.setFont("helvetica", "normal");

  // Listar todos os pagamentos vinculados ao contrato
if (contract.contractPayments && contract.contractPayments.length > 0) {
  const discountAmountMain = contract.discount || 0;
  const finalValueMain = contract.totalAmount - discountAmountMain;
  const finalValueFormatted = formatter.format(finalValueMain);

  pdf.text(
    `8.1 - O valor dos produtos é de ${finalValueFormatted} e deverá ser pago da seguinte forma:`,
    40,
    y,
    { maxWidth: 520 }
  );
  y += 10;

  // Agrupar pagamentos por tipo
  const groupedPayments: Record<
    string,
    { count: number; total: number; dueDates: string[] }
  > = {};

  contract.contractPayments.forEach((payment: any) => {
    const amount = Number(payment.amount) || 0;
    const desc = payment.description || payment.paymentMethod?.description || '';
    const key = desc;

    const dueDate = payment.dueDate
      ? new Date(payment.dueDate).toLocaleDateString('pt-BR')
      : '';

    if (!groupedPayments[key]) {
      groupedPayments[key] = { count: 0, total: 0, dueDates: [] };
    }

    groupedPayments[key].count += 1;
    groupedPayments[key].total += amount;
    groupedPayments[key].dueDates.push(dueDate);
  });

  // Tabela de pagamentos
  const columns = [
    { header: 'Descrição', dataKey: 'description' },
    { header: 'Qtd.', dataKey: 'count' },
    { header: 'Valor Unitário', dataKey: 'unit' },
    { header: 'Total', dataKey: 'total' },
    { header: 'Vencimentos', dataKey: 'dueDates' },
  ];

  const data = Object.entries(groupedPayments).map(([desc, info]) => {
    const unit = info.total / info.count;
    return {
      description: `${info.count}x ${desc}`,
      count: info.count,
      unit: formatter.format(unit),
      total: formatter.format(info.total),
      dueDates: info.dueDates.join(', '),
    };
  });

  // Renderiza a tabela com autoTable
  (autoTable as any)(pdf, {
    startY: y,
    head: [columns.map(c => c.header)],
    body: data.map(row => columns.map(c => row[c.dataKey as keyof typeof row] || '')),
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 10,
      valign: 'middle',
      halign: 'center',
    },
    headStyles: {
      fillColor: [200, 200, 200],
      textColor: 50,
      font: 'helvetica',
      fontStyle: 'bold',
    },
    margin: { left: 40, right: 40 },
  });

  y = (pdf as any).lastAutoTable.finalY || y + 40;
  y += 20;

  // Soma os valores totais
  const totalPayments = Object.values(groupedPayments).reduce(
    (sum, g) => sum + g.total,
    0
  );

  // Checar se está faltando algo a ser pago
  if (totalPayments < finalValueMain) {
    const missingValue = finalValueMain - totalPayments;
    const missingValueFormatted = formatter.format(missingValue);
    pdf.text(
      `Faltando ao contratante concluir o pagamento de ${missingValueFormatted}.`,
      50,
      y,
      { maxWidth: 510 }
    );
    y += 30;
  }
}
 else {
  // fallback para mostrar o método antigo se não houver pagamentos relacionados
  const discountAmountMain = contract.discount || 0;
  const finalValueMain = contract.totalAmount - discountAmountMain;
  const finalValueFormatted = formatter.format(finalValueMain);
  pdf.text(`8.1 - O valor dos produtos é de ${finalValueFormatted} e deverá ser pago da seguinte forma: ${contract.paymentMethod.description}.`, 40, y, { maxWidth: 520 });
  y += 30;
}


  // Closing
  pdf.text("E por estarem justos e acordados, firmam o presente contrato em 02 (duas) vias de igual teor e forma, ficando eleito o Fórum desta Comarca para dirimir quaisquer dúvidas que possam surgir.", 40, y, { maxWidth: 520 });
  y += 30;

  return y;
}

function writeClothingSaleClauses(pdf: jsPDF, contract: any, y: number, pageHeight: number): number {
  // Cláusula Primeira - Do Objeto do Contrato
  y = checkPageBreak(pdf, y, pageHeight);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("Cláusula Primeira - Do Objeto do Contrato", 40, y);
  y += 30;
  
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.text("O objeto deste contrato é a confecção e venda dos seguintes trajes:", 40, y);
  y += 30;
  
  // Add products table here
  let columns: any[] = [
    { header: "Id", dataKey: "id" },
    { header: "Descrição", dataKey: "desc" },
    { header: "Valor", dataKey: "sale" }
  ];

  // Table data
  let data = contract.contractItems.map((item: any) => ({
    id: item.product.sku || item.product.id,
    desc: item.product.name,
    sale: item.subtotal ? formatter.format(item.subtotal) : '',
  }));

  // Table
  (autoTable as any)(pdf, {
    startY: y,
    head: [columns.map((c: any) => c.header)],
    body: data.map((row: any) => columns.map((c: any) => row[c.dataKey] || '')),
    theme: "grid",
    styles: { font: "helvetica", fontSize: 10, valign: "middle", halign: "center" },
    headStyles: { fillColor: [200, 200, 200], textColor: 50, font: "helvetica", fontStyle: "bold" },
    bodyStyles: {},
    margin: { left: 40, right: 40 },
    didDrawPage: function (data: any) {
      // leave bottom margin for rubrica, avoid overlapping
    },
  });
  y = (pdf as any).lastAutoTable.finalY || y + 40;
  y += 40; // Space before summary table
  
  // Add value summary table
  const totalAmountClothing = contract.totalAmount || 0;
  const discountAmountClothing = contract.discount || 0;
  const finalValueClothing = totalAmountClothing - discountAmountClothing;
  
  // Create summary table data with only 2 columns
  let summaryData = [
    ['Valor Total:', formatter.format(totalAmountClothing)]
  ];
  
  if (discountAmountClothing > 0) {
    summaryData.push([
      'Desconto:', 
      `- ${formatter.format(discountAmountClothing)}`
    ]);
  }
  
  summaryData.push([
    'Valor Final:', 
    formatter.format(finalValueClothing)
  ]);

  // Summary table with 2 columns only
  (autoTable as any)(pdf, {
    startY: y,
    head: [],
    body: summaryData,
    theme: "grid",
    styles: { font: "helvetica", fontSize: 10, valign: "middle" },
    bodyStyles: { fontStyle: "bold" },
    margin: { left: 40, right: 40 },
    columnStyles: {
      0: { halign: "left", cellWidth: 342 },
      1: { halign: "center", cellWidth: 172 }
    },
    didDrawPage: function (data: any) {
      // leave bottom margin for rubrica, avoid overlapping
    },
  });
  y = (pdf as any).lastAutoTable.finalY || y + 40;
  y += 30;

  // Cláusula Segunda - Do Processo de Confecção
  y = checkPageBreak(pdf, y, pageHeight);
  pdf.setFont("helvetica", "bold");
  pdf.text("Cláusula Segunda - Do Processo de Confecção", 40, y);
  y += 30;
  
  pdf.setFont("helvetica", "normal");
  pdf.text("O processo de confecção seguirá as seguintes etapas:", 40, y);
  y += 20;
  pdf.text("Aprovação do croqui.", 40, y);
  y += 15;
  pdf.text("Escolha dos tecidos.", 40, y);
  y += 15;
  pdf.text("Primeira prova de modelagem. A COMPRADORA está ciente de que a estrutura não poderá ser alterada após a aprovação.", 40, y, { maxWidth: 520 });
  y += 40;
  pdf.text("Segunda e terceira provas para ajustes e aprovações finais.", 40, y);
  y += 15;
  pdf.text("O uso do sapato de salto alto é obrigatório desde a primeira prova.", 40, y);
  y += 25;

  // Cláusula Terceira - De Custos Adicionais
  y = checkPageBreak(pdf, y, pageHeight);
  pdf.setFont("helvetica", "bold");
  pdf.text("Cláusula Terceira - De Custos Adicionais", 40, y);
  y += 30;
  
  pdf.setFont("helvetica", "normal");
  pdf.text("Alterações na modelagem após a primeira prova ou adição de materiais extras serão cobrados à parte.", 40, y, { maxWidth: 520 });
  y += 25;

  // Cláusula Quarta - Do Valor e Pagamento
  y = checkPageBreak(pdf, y, pageHeight);
  pdf.setFont("helvetica", "bold");
  pdf.text("Cláusula Quarta - Do Valor e Pagamento", 40, y);
  y += 30;
  
  pdf.setFont("helvetica", "normal");
  const discountAmount = contract.discount || 0;
  const finalValue = contract.totalAmount - discountAmount;
  const finalValueFormatted = formatter.format(finalValue);
  pdf.text(`O valor total da confecção e venda é de ${finalValueFormatted} , a ser pago via ${contract.paymentMethod.description}.`, 40, y, { maxWidth: 520 });
  y += 30;

  // Cláusula Quinta - Da Entrega
  y = checkPageBreak(pdf, y, pageHeight);
  pdf.setFont("helvetica", "bold");
  pdf.text("Cláusula Quinta - Da Entrega", 40, y);
  y += 30;
  
  pdf.setFont("helvetica", "normal");
  const deliveryDate = formatDate(contract.deliveryDate);
  pdf.text(`A data prevista para a entrega é ${deliveryDate}. A entrega será realizada após a prova final.`, 40, y, { maxWidth: 520 });
  y += 25;

  // Cláusula Sexta - Da Desistência
  y = checkPageBreak(pdf, y, pageHeight);
  pdf.setFont("helvetica", "bold");
  pdf.text("Cláusula Sexta - Da Desistência", 40, y);
  y += 30;
  
  pdf.setFont("helvetica", "normal");
  pdf.text("Caso haja desistência por parte da COMPRADORA, esta perderá o valor total pago.", 40, y, { maxWidth: 520 });
  y += 25;

  // Cláusula Sétima - Do Foro
  y = checkPageBreak(pdf, y, pageHeight);
  pdf.setFont("helvetica", "bold");
  pdf.text("Cláusula Sétima - Do Foro", 40, y);
  y += 30;
  
  pdf.setFont("helvetica", "normal");
  pdf.text(`Fica eleito o Foro da Comarca de ${siteConfig.address.city}-${siteConfig.address.state} para dirimir quaisquer dúvidas.`, 40, y, { maxWidth: 520 });
  y += 40;

  return y;
}

function writeTermsAndNotes(pdf: jsPDF, contract: any, y: number, pageHeight: number): number {
  // Check if we have terms or notes to display
  const hasTerms = contract.terms && contract.terms.trim().length > 0;
  const hasNotes = contract.notes && contract.notes.trim().length > 0;
  
  if (!hasTerms && !hasNotes) {
    return y; // Nothing to add
  }

  // Check if we need a new page
  if (y > pageHeight - 200) {
    pdf.addPage();
    y = 60;
  }

  // Add extra spacing before terms section
  y += 20;

  // Add terms section if exists
  if (hasTerms) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("TERMOS E CONDIÇÕES ADICIONAIS", 40, y);
    y += 20;
    
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.text(contract.terms, 40, y, { maxWidth: 520 });
    
    // Calculate how much space the text took
    const lines = pdf.splitTextToSize(contract.terms, 520);
    y += lines.length * 15 + 20;
  }

  // Add notes section if exists
  if (hasNotes) {
    // Check if we need space for notes
    if (y > pageHeight - 150) {
      pdf.addPage();
      y = 60;
    }
    
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("OBSERVAÇÕES", 40, y);
    y += 20;
    
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.text(contract.notes, 40, y, { maxWidth: 520 });
    
    // Calculate how much space the text took
    const lines = pdf.splitTextToSize(contract.notes, 520);
    y += lines.length * 15 + 20;
  }

  return y;
}

function checkPageBreak(pdf: jsPDF, y: number, pageHeight: number): number {
  if (y > pageHeight - 150) {
    pdf.addPage();
    return 60;
  }
  return y;
}

function addSignatureSection(pdf: jsPDF, contract: any, typeKey: string) {
  // Go to last page, add date/location and signature boxes
  pdf.setPage(pdf.getNumberOfPages());
  let pageHeight = pdf.internal.pageSize.height;
  let y = pageHeight - 180;

  // Check if we have enough space, if not add new page
  if (y < 100) {
    pdf.addPage();
    y = 100;
  }

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  
  // Current date
  const today = new Date();
  const day = today.getDate();
  const months = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ];
  const month = months[today.getMonth()];
  const year = today.getFullYear();
  
  pdf.text(`${siteConfig.address.city} - ${siteConfig.address.state}, ${day} de ${month} de ${year}`, 40, y);
  y += 60;

  // Signature lines
  pdf.setLineWidth(0.5);
  pdf.line(40, y, 250, y); // left signature line
  pdf.line(320, y, 530, y); // right signature line

  y += 40;
  
  // Signature labels based on contract type
  let signLabelBuyer, signLabelSeller;
  
  if (typeKey === "RENTAL" || typeKey === "clothingRENTAL") {
    signLabelBuyer = "Contratada";
    signLabelSeller = "Contratante";
  } else {
    signLabelBuyer = "Comprador(a)";
    signLabelSeller = "Vendedor(a)";
  }
  
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.text(signLabelSeller, 110, y);
  pdf.text(signLabelBuyer, 400, y);
}

function addRubricaToAllPages(pdf: jsPDF) {
  const pageCount = pdf.getNumberOfPages();
  // Don't add rubrica to the last page (signature page)
  for (let i = 1; i < pageCount; i++) {
    pdf.setPage(i);
    let pageHeight = pdf.internal.pageSize.height;
    // Rectangle at bottom right for initials ("Rubrica")
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.7);
    pdf.rect(480, pageHeight - 55, 60, 35);
    pdf.setFontSize(9);
    pdf.text("", 495, pageHeight - 35);
    pdf.text("Rubrica", 495, pageHeight - 10);
  }
}

function formatDate(date: string | Date) {
  if (!date) return "____/____/______";
  let d = new Date(date);
  return d.toLocaleDateString("pt-BR");
}
