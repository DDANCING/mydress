"use server";

import { assertStaff } from "@/lib/auth";
import { db } from "@/lib/db";

interface GetContractsByIdInput {
  contractId: string;
}

// Função auxiliar para converter todos Decimals para string
function serializeContract(contract: any): any {
  if (!contract) return contract;

  const decimalFields = [
    "totalAmount", "discount", "downPayment"
  ];
  const contractCopy = { ...contract };

  // Contrato principal
  decimalFields.forEach(field => {
    if (contractCopy[field]?.toString) contractCopy[field] = contractCopy[field].toString();
  });

  // Itens do contrato
  if (contractCopy.contractItems) {
    contractCopy.contractItems = contractCopy.contractItems.map((item: any) => {
      return {
        ...item,
        unitPrice: item.unitPrice?.toString?.() ?? item.unitPrice,
        subtotal: item.subtotal?.toString?.() ?? item.subtotal,
        product: item.product
          ? {
              ...item.product,
              price: item.product.price?.toString?.() ?? item.product.price,
              originalPrice: item.product.originalPrice?.toString?.() ?? item.product.originalPrice,
              rentalValue: item.product.rentalValue?.toString?.() ?? item.product.rentalValue,
            }
          : item.product,
      };
    });
  }

  // Pagamentos do contrato
  if (contractCopy.contractPayments) {
    contractCopy.contractPayments = contractCopy.contractPayments.map((payment: any) => ({
      ...payment,
      amount: payment.amount?.toString?.() ?? payment.amount,
    }));
  }

  return contractCopy;
}

export async function getContractsById({ contractId }: GetContractsByIdInput) {
  try {
    await assertStaff();
    if (!contractId) {
      return { error: "ID do contrato é obrigatório." };
    }

    const contract = await db.contract.findUnique({
      where: { id: contractId },
      include: {
        buyer: true,
        seller: true,
        paymentMethod: true,
        contractItems: {
          include: {
            product: true,
          },
        },
        contractPayments: true,
        schedules: true,
      },
    });

    if (!contract) {
      return { error: "Contrato não encontrado." };
    }

    return { contract: serializeContract(contract) };
  } catch (error: any) {
    return { error: "Erro interno do servidor ao buscar contrato." };
  }
}