import { db } from "@/lib/db";
import { ContractStatus } from "@prisma/client";

export interface ProductAvailabilityCheck {
  isAvailable: boolean;
  conflictingContract?: {
    id: string;
    type: string;
    buyerName: string;
    deliveryDate: Date;
    returnDate?: Date;
  };
}

export async function checkProductAvailability(
  productId: string,
  startDate: Date,
  endDate: Date,
  excludeContractId?: string
): Promise<ProductAvailabilityCheck> {
  try {
    // Buscar contratos que podem causar conflito através dos itens do contrato
    const conflictingContracts = await db.contract.findMany({
      where: {
        contractItems: {
          some: {
            productId,
          },
        },
        status: {
          in: [ContractStatus.CONFIRMED, ContractStatus.DELIVERED, ContractStatus.PENDING],
        },
        ...(excludeContractId && {
          id: { not: excludeContractId }
        }),
        OR: [
          // Caso 1: Delivery date está dentro do período solicitado
          {
            deliveryDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          // Caso 2: Return date está dentro do período solicitado
          {
            returnDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          // Caso 3: Período solicitado está completamente dentro do contrato existente
          {
            AND: [
              { deliveryDate: { lte: startDate } },
              { returnDate: { gte: endDate } },
            ],
          },
          // Caso 4: Contrato existente está completamente dentro do período solicitado
          {
            AND: [
              { deliveryDate: { gte: startDate } },
              { returnDate: { lte: endDate } },
            ],
          },
        ],
      },
      include: {
        buyer: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        deliveryDate: "asc",
      },
    });

    // Verificar schedules/bloqueios que podem causar conflito
    const conflictingSchedules = await db.schedule.findMany({
      where: {
        productId,
        ...(excludeContractId && {
          contractId: { not: excludeContractId }
        }),
        OR: [
          // Schedule que se sobrepõe ao período solicitado
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: startDate } },
            ],
          },
        ],
      },
      include: {
        buyer: {
          select: {
            fullName: true,
          },
        },
        contract: true,
      },
    });

    // Se há conflitos, retornar o primeiro
    if (conflictingContracts.length > 0) {
      const conflict = conflictingContracts[0];
      
      return {
        isAvailable: false,
        conflictingContract: {
          id: conflict.id,
          type: conflict.type,
          buyerName: conflict.buyer.fullName,
          deliveryDate: conflict.deliveryDate,
          returnDate: conflict.returnDate ? conflict.returnDate : undefined,
        },
      };
    }

    if (conflictingSchedules.length > 0) {
      const schedule = conflictingSchedules[0];
      return {
        isAvailable: false,
        conflictingContract: {
          id: schedule.id,
          type: "SCHEDULE_BLOCK",
          buyerName: schedule.buyer?.fullName || "Bloqueio do sistema",
          deliveryDate: schedule.startDate,
          returnDate: schedule.endDate,
        },
      };
    }

    return { isAvailable: true };
  } catch (error) {
    console.error("Erro ao verificar disponibilidade do produto:", error);
    return { isAvailable: false };
  }
}

export async function archiveProduct(productId: string) {
  try {
    await db.product.update({
      where: { id: productId },
      data: { isArchived: false },
    });
    return { success: true };
  } catch (error) {
    console.error("Erro ao arquivar produto:", error);
    return { success: false, error: "Erro ao arquivar produto" };
  }
}

