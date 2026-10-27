import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { checkProductAvailability, archiveProduct } from "@/lib/product-availability";
import { sendTestimonialsForContract } from "@/actions/send-testemonias-email";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{  contractId: string }> }
  
) {
  try {
    const { contractId } = await context.params;
    const user = await auth();
    const userId = user?.user?.id;

    if (!userId) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    const contract = await db.contract.findUnique({
      where: {
        id: contractId,
      },
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

    if (!contract) {
      return new NextResponse("Contrato não encontrado", { status: 404 });
    }



    // Converter Decimals para numbers antes de retornar
    const serializedContract = {
      ...contract,
      totalAmount: contract.totalAmount.toNumber(),
      contractItems: contract.contractItems.map(item => ({
        ...item,
        unitPrice: item.unitPrice.toNumber(),
        subtotal: item.subtotal.toNumber(),
        product: item.product ? {
          ...item.product,
          price: item.product.price.toNumber(),
          originalPrice: item.product.originalPrice?.toNumber() ?? null,
        } : null,
      })),
      contractPayments: contract.contractPayments.map(payment => ({
        ...payment,
        amount: payment.amount.toNumber(),
      })),
    };

    return NextResponse.json(serializedContract);
  } catch (error) {
    console.log("[CONTRACT_GET]", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{  contractId: string }> }
) {
  try {
    const { contractId } = await context.params;
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
      contractItems, 
      contractPayments, // Array de pagamentos múltiplos
      paymentMethodId,
      sellerId,
    } = body;


    if (!type || !totalAmount || !deliveryDate || !buyerId || !contractItems || !Array.isArray(contractItems) || contractItems.length === 0 || !sellerId) {
      return new NextResponse("Campos obrigatórios não preenchidos", { status: 400 });
    }

    // Buscar contrato existente para validar mudanças de status
    const existingContract = await db.contract.findUnique({
      where: { id: contractId },
    });

    if (!existingContract) {
      return new NextResponse("Contrato não encontrado", { status: 404 });
    }

    // Validar mudança de status: não permitir mudar de CONFIRMED para PENDING, exceto ADMIN ou OWNER
    const isAttemptingDowngrade = existingContract.status === "CONFIRMED" && status === "PENDING";
    if (isAttemptingDowngrade) {
      const userRole = user?.user?.role;
      // Apenas ADMIN e OWNER podem fazer downgrade de CONFIRMED para PENDING
      const canDowngrade = userRole === "ADMIN" || userRole === "OWNER";
      
      if (!canDowngrade) {
        return new NextResponse(
          JSON.stringify({ 
            message: "Não é permitido alterar um contrato confirmado para pendente. Apenas administradores podem fazer isso." 
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Verificar disponibilidade de todos os produtos para o período solicitado (excluindo o contrato atual)
    const deliveryDateObj = new Date(deliveryDate);
    const returnDateObj = returnDate ? new Date(returnDate) : deliveryDateObj;
    
    for (const item of contractItems) {
      const availabilityCheck = await checkProductAvailability(
        item.productId,
        deliveryDateObj,
        returnDateObj,
        contractId
      );

      if (!availabilityCheck.isAvailable && availabilityCheck.conflictingContract) {
        const conflict = availabilityCheck.conflictingContract;
        
        if (conflict.id !== contractId) {
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

    // Preparar dados para atualização
    const updateData: any = {
      type,
      status,
      totalAmount: calculatedTotalAmount,
      downPayment: calculatedDownPayment,
      discount: discount ? parseFloat(discount) : 0,
      deliveryDate: new Date(deliveryDate),
      eventDate: eventDate ? new Date(eventDate) : null,
      returnDate: returnDate ? new Date(returnDate) : null,
      notes,
      terms,
      buyerId,
      paymentMethodId: paymentMethodId || (contractPayments && contractPayments[0]?.paymentMethodId),
      sellerId,
    };

    // Se mudando de PENDING para CONFIRMED, atualizar createdAt para now
    const isConfirmingPending = existingContract.status === "PENDING" && status === "CONFIRMED";
    if (isConfirmingPending) {
      updateData.createdAt = new Date();
    }

    const contract = await db.contract.update({
      where: {
        id: contractId,
      },
      data: {
        ...updateData,
        contractItems: {
          deleteMany: {}, // Remove todos os itens existentes
          create: contractItems.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity || 1,
            unitPrice: parseFloat(item.unitPrice),
            subtotal: parseFloat(item.unitPrice) * (item.quantity || 1),
          })),
        },
        contractPayments: {
          deleteMany: {}, // Remove todos os pagamentos existentes
          create: contractPayments && contractPayments.length > 0 ? contractPayments.map((payment: any) => ({
            paymentMethodId: payment.paymentMethodId,
            amount: parseFloat(payment.amount),
            paymentDate: new Date(payment.paymentDate),
            description: payment.description || null,
            installmentNumber: payment.installmentNumber || 1,
            dueDate: payment.dueDate ? new Date(payment.dueDate) : null,
            isPaid: payment.isPaid !== undefined ? payment.isPaid : true,
          })) : [],
        },
      },
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

    // Garantir consistência: recalcular downPayment baseado nos pagamentos salvos
    if (contract.contractPayments && contract.contractPayments.length > 0) {
      const actualTotalFromPayments = contract.contractPayments.reduce((sum, payment) => {
        return sum + payment.amount.toNumber();
      }, 0);
      
      // Calcular valor restante: (totalAmount - desconto) - soma dos pagamentos
      const totalAfterDiscount = contract.totalAmount.toNumber() - (contract.discount?.toNumber() || 0);
      const calculatedRemainingAmount = totalAfterDiscount - actualTotalFromPayments;
      const safeRemainingAmount = calculatedRemainingAmount < 0 ? 0 : calculatedRemainingAmount;
      
      // Se há diferença no downPayment (valor restante), atualizar
      if (Math.abs(safeRemainingAmount - (contract.downPayment?.toNumber() || 0)) > 0.01) {
        await db.contract.update({
          where: { id: contractId },
          data: { 
            downPayment: safeRemainingAmount // downPayment = valor restante
          }
        });
        
        // Atualizar o contract com o valor correto
        contract.downPayment = new Decimal(safeRemainingAmount);
      }
    }

if (status === "RETURNED") {
  if (contract.buyer.email) {
    await sendTestimonialsForContract(contractId, contract.buyer.email);
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
      ...contract,
      totalAmount: contract.totalAmount.toNumber(),
      contractItems: contract.contractItems.map(item => ({
        ...item,
        unitPrice: item.unitPrice.toNumber(),
        subtotal: item.subtotal.toNumber(),
        product: item.product ? {
          ...item.product,
          price: item.product.price.toNumber(),
          originalPrice: item.product.originalPrice?.toNumber() ?? null,
        } : null,
      })),
      contractPayments: contract.contractPayments.map(payment => ({
        ...payment,
        amount: payment.amount.toNumber(),
      })),
    };

    return NextResponse.json(serializedContract);
  } catch (error) {
    console.log("[CONTRACT_PATCH]", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{  contractId: string }> }
) {
  try {
    const { contractId } = await context.params;
    const user = await auth();
    const userId = user?.user?.id;

    if (!userId) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    const contract = await db.contract.delete({
      where: {
        id: contractId,
      },
    });

    return NextResponse.json(contract);
  } catch (error) {
    console.log("[CONTRACT_DELETE]", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}