import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { checkProductAvailability, archiveProduct } from "@/lib/product-availability";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET(request: NextRequest) {
  try {
    const user = await auth();
    const userId = user?.user?.id;
    
    if (!userId) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    const contracts = await db.contract.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        buyer: {
          select: {
            fullName: true,
            email: true,
            phone: true,
          },
        },
        contractItems: {
          include: {
            product: {
              select: {
                name: true,
                price: true,
              },
            },
          },
        },
        paymentMethod: {
          select: {
            name: true,
          },
        },
        contractPayments: {
          include: {
            paymentMethod: {
              select: {
                name: true,
              },
            },
          },
        },
        seller: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Converter Decimals para numbers antes de retornar
    const serializedContracts = contracts.map(contract => ({
      ...contract,
      totalAmount: contract.totalAmount.toNumber(),
      contractItems: contract.contractItems.map(item => ({
        ...item,
        unitPrice: item.unitPrice.toNumber(),
        subtotal: item.subtotal.toNumber(),
        product: item.product ? {
          ...item.product,
          price: item.product.price.toNumber(),
        } : null,
      })),
      contractPayments: contract.contractPayments.map(payment => ({
        ...payment,
        amount: payment.amount.toNumber(),
      })),
    }));

    return NextResponse.json(serializedContracts);
  } catch (error) {
    console.log("[CONTRACTS_GET]", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await auth();
    const userId = user?.user?.id;

    if (!userId) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      status,
      totalAmount,
      downPayment,
      discount,
      deliveryDate,
      eventDate,
      returnDate,
      notes,
      terms,
      buyerId,
      contractItems, // Array de {productId, quantity, unitPrice}
      contractPayments, // Array de pagamentos múltiplos
      paymentMethodId,
      sellerId,
    } = body;

    const buyer = await db.buyer.findUnique({
      where: { id: buyerId }
    });

    if (!buyer) {
      return new NextResponse(
        JSON.stringify({ message: "Comprador não encontrado" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

     if (!buyer.document) {
      return new NextResponse(
        JSON.stringify({ message: "Comprador não possui documento" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

     if (!buyer.phone) {
      return new NextResponse(
        JSON.stringify({ message: "Comprador não possui telefone" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!totalAmount || isNaN(Number(totalAmount))) {
      return new NextResponse(
        JSON.stringify({ message: "Valor total obrigatório e deve ser numérico" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (Number(totalAmount) <= 0) {
      return new NextResponse(
        JSON.stringify({ message: "Valor total deve ser maior que zero" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (discount && (isNaN(Number(discount)) || Number(discount) < 0)) {
      return new NextResponse(
        JSON.stringify({ message: "Desconto inválido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (discount && Number(discount) >= Number(totalAmount)) {
      return new NextResponse(
        JSON.stringify({ message: "Desconto não pode ser maior ou igual ao valor total" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!deliveryDate || isNaN(Date.parse(deliveryDate))) {
      return new NextResponse(
        JSON.stringify({ message: "Data de entrega obrigatória e válida" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (eventDate && isNaN(Date.parse(eventDate))) {
      return new NextResponse(
        JSON.stringify({ message: "Data do evento inválida" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (returnDate && isNaN(Date.parse(returnDate))) {
      return new NextResponse(
        JSON.stringify({ message: "Data de retorno inválida" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (returnDate && new Date(returnDate) < new Date(deliveryDate)) {
      return new NextResponse(
        JSON.stringify({ message: "Data de retorno não pode ser antes da entrega" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!buyerId || typeof buyerId !== 'string') {
      return new NextResponse(
        JSON.stringify({ message: "Comprador obrigatório" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!contractItems || !Array.isArray(contractItems) || contractItems.length === 0) {
      return new NextResponse(
        JSON.stringify({ message: "Itens do contrato obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    for (const item of contractItems) {
      if (!item.productId || typeof item.productId !== 'string') {
        return new NextResponse(
          JSON.stringify({ message: "Produto obrigatório em cada item" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      if (!item.unitPrice || isNaN(Number(item.unitPrice)) || Number(item.unitPrice) <= 0) {
        return new NextResponse(
          JSON.stringify({ message: "Preço unitário obrigatório e válido em cada item" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      if (item.quantity && (isNaN(Number(item.quantity)) || Number(item.quantity) <= 0)) {
        return new NextResponse(
          JSON.stringify({ message: "Quantidade inválida em item" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }
    if (contractPayments && Array.isArray(contractPayments)) {
      for (const payment of contractPayments) {
        if (!payment.paymentMethodId || typeof payment.paymentMethodId !== 'string') {
          return new NextResponse(
            JSON.stringify({ message: "Método de pagamento obrigatório em cada pagamento" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        if (!payment.amount || isNaN(Number(payment.amount)) || Number(payment.amount) <= 0) {
          return new NextResponse(
            JSON.stringify({ message: "Valor do pagamento obrigatório e válido" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        if (payment.paymentDate && isNaN(Date.parse(payment.paymentDate))) {
          return new NextResponse(
            JSON.stringify({ message: "Data de pagamento inválida" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        if (payment.dueDate && isNaN(Date.parse(payment.dueDate))) {
          return new NextResponse(
            JSON.stringify({ message: "Data de vencimento inválida" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Verificar disponibilidade de todos os produtos para o período solicitado
    const deliveryDateObj = new Date(deliveryDate);
    const returnDateObj = returnDate ? new Date(returnDate) : deliveryDateObj;
    
    for (const item of contractItems) {
      const availabilityCheck = await checkProductAvailability(
        item.productId,
        deliveryDateObj,
        returnDateObj
      );

      if (!availabilityCheck.isAvailable && availabilityCheck.conflictingContract) {
        const conflict = availabilityCheck.conflictingContract;
        return new NextResponse(
          JSON.stringify({
            error: "PRODUCT_UNAVAILABLE",
            message: `O produto ${item.productId} já está em uso no período solicitado. Conflito com: ${conflict.buyerName} (${conflict.type}) de ${conflict.deliveryDate.toLocaleDateString()} até ${conflict.returnDate?.toLocaleDateString() || 'indefinido'}`,
            conflictingContract: conflict,
          }),
          { 
            status: 409,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
    }

    // Usar o seller fornecido ou buscar o do usuário atual como fallback
    let finalSellerId = sellerId;
    if (!finalSellerId) {
      const seller = await db.seller.findUnique({
        where: { userId },
      });

      if (!seller) {
        return new NextResponse("Vendedor não encontrado", { status: 404 });
      }
      finalSellerId = seller.id;
    }

    // Resolver paymentMethodId obrigatório (schema exige String não nulo)
    // Regra: se não vier paymentMethodId e não houver pagamentos, usar um método padrão
    let effectivePaymentMethodId: string | null = paymentMethodId || (contractPayments && contractPayments[0]?.paymentMethodId) || null;
    if (!effectivePaymentMethodId) {
      // Tentar encontrar um método padrão existente por nome
      const fallbackNames = [
        'PENDENTE', 'PENDING', 'SEM PAGAMENTO', 'N/A', 'OUTROS', 'OUTRO', 'DEFAULT'
      ];
      const existing = await db.paymentMethod.findFirst({
        where: { name: { in: fallbackNames } },
        orderBy: { createdAt: 'asc' }
      });
      if (existing) {
        effectivePaymentMethodId = existing.id;
      } else {
        // Criar um método padrão
        const created = await db.paymentMethod.create({
          data: { name: 'PENDING', description: 'Método padrão para contratos pendentes sem pagamento' }
        });
        effectivePaymentMethodId = created.id;
      }
    }
    if (!effectivePaymentMethodId) {
      return new NextResponse(
        JSON.stringify({ message: 'Método de pagamento padrão não encontrado e não pôde ser criado.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

  // Calcular totalAmount e downPayment baseado nos pagamentos se existirem
    let calculatedTotalAmount = parseFloat(totalAmount);
    let calculatedDownPayment = downPayment ? parseFloat(downPayment) : 0;
    const appliedDiscount = discount ? parseFloat(discount) : 0;
    
    if (contractPayments && contractPayments.length > 0) {
      const totalFromPayments = contractPayments.reduce((sum: number, payment: any) => {
        return sum + parseFloat(payment.amount);
      }, 0);
      
      // O downPayment (valor restante) = (totalAmount - desconto) - soma dos pagamentos
      const totalAfterDiscount = calculatedTotalAmount - appliedDiscount;
      calculatedDownPayment = totalAfterDiscount - totalFromPayments;
      
      // Garantir que downPayment não seja negativo
      if (calculatedDownPayment < 0) {
        calculatedDownPayment = 0;
      }
    }

    // Criar contrato sem includes para evitar conflitos
    const contract = await db.contract.create({
      data: {
        type,
        status: status || "PENDING",
        totalAmount: calculatedTotalAmount,
        downPayment: calculatedDownPayment,
        discount: discount ? parseFloat(discount) : 0,
        deliveryDate: new Date(deliveryDate),
        eventDate: eventDate ? new Date(eventDate) : null,
        returnDate: returnDate ? new Date(returnDate) : null,
        notes,
        terms,
  buyerId,
  sellerId: finalSellerId,
  paymentMethodId: effectivePaymentMethodId,
        contractItems: {
          create: contractItems.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity || 1,
            unitPrice: parseFloat(item.unitPrice),
            subtotal: parseFloat(item.unitPrice) * (item.quantity || 1),
          })),
        },
        contractPayments: contractPayments && contractPayments.length > 0 ? {
          create: contractPayments.map((payment: any) => ({
            paymentMethodId: payment.paymentMethodId,
            amount: parseFloat(payment.amount),
            paymentDate: new Date(payment.paymentDate),
            description: payment.description || null,
            installmentNumber: payment.installmentNumber || 1,
            dueDate: payment.dueDate ? new Date(payment.dueDate) : null,
            isPaid: payment.isPaid !== undefined ? payment.isPaid : true,
          })),
        } : undefined,
      },
    });

    // Buscar dados completos do contrato criado
    const fullContract = await db.contract.findUnique({
      where: { id: contract.id },
      include: {
        buyer: true,
        contractItems: {
          include: {
            product: true,
          },
        },
        paymentMethod: true,
        contractPayments: {
          include: {
            paymentMethod: true,
          },
        },
        seller: {
          include: {
            user: true,
          },
        },
      },
    });

    // Verificar se o contrato completo foi encontrado
    if (!fullContract) {
      return new NextResponse("Erro ao buscar dados completos do contrato", { status: 500 });
    }

    // Garantir consistência: recalcular downPayment baseado nos pagamentos salvos
    if (fullContract.contractPayments && fullContract.contractPayments.length > 0) {
      const actualTotalFromPayments = fullContract.contractPayments.reduce((sum, payment) => {
        return sum + payment.amount.toNumber();
      }, 0);
      
      // Calcular valor restante: (totalAmount - desconto) - soma dos pagamentos
      const totalAfterDiscount = fullContract.totalAmount.toNumber() - (fullContract.discount?.toNumber() || 0);
      const calculatedRemainingAmount = totalAfterDiscount - actualTotalFromPayments;
      const safeRemainingAmount = calculatedRemainingAmount < 0 ? 0 : calculatedRemainingAmount;
      
      // Se há diferença no downPayment (valor restante), atualizar
      if (Math.abs(safeRemainingAmount - (fullContract.downPayment?.toNumber() || 0)) > 0.01) {
        await db.contract.update({
          where: { id: contract.id },
          data: { 
            downPayment: safeRemainingAmount // downPayment = valor restante
          }
        });
        
        // Atualizar o fullContract com o valor correto
        fullContract.downPayment = new Decimal(safeRemainingAmount);
      }
    }

    if (type === "SALE" || type === "ClothingSALE") {
      for (const item of contractItems) {
        const archiveResult = await archiveProduct(item.productId);
        if (!archiveResult.success) {
          console.warn(`Falha ao arquivar produto ${item.productId} após venda:`, archiveResult.error);
        }
      }
    }

    // Converter Decimals para numbers antes de retornar
    const serializedContract = {
      ...fullContract,
      totalAmount: fullContract.totalAmount.toNumber(),
      contractItems: fullContract.contractItems.map((item: any) => ({
        ...item,
        unitPrice: item.unitPrice.toNumber(),
        subtotal: item.subtotal.toNumber(),
        product: item.product ? {
          ...item.product,
          price: item.product.price.toNumber(),
          originalPrice: item.product.originalPrice?.toNumber() ?? null,
        } : null,
      })),
      contractPayments: fullContract.contractPayments.map((payment: any) => ({
        ...payment,
        amount: payment.amount.toNumber(),
      })),
    };

    return NextResponse.json(serializedContract);
  } catch (error) {
    console.log("[CONTRACTS_POST]", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}