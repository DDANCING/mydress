"use server";

import { assertStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface CreateMarketingExpenseInput {
  duration: number; // número de dias que a publicidade vai rodar
  amount: number; // valor total a ser gasto
  platform: string; // plataforma (ex: Google Ads, Facebook, Instagram, etc)
  campaign?: string; // nome da campanha (opcional)
}

export async function createMarketingExpense(
  input: CreateMarketingExpenseInput
) {
  try {
    await assertStaff();
    // Validação
    if (!input.duration || input.duration < 1) {
      throw new Error("Duration deve ser pelo menos 1 dia");
    }

    if (!input.amount || input.amount < 0) {
      throw new Error("Amount deve ser um valor positivo");
    }

    if (!input.platform || input.platform.trim().length === 0) {
      throw new Error("Platform é obrigatória");
    }

    const marketingExpense = await db.marketingExpense.create({
      data: {
        duration: input.duration,
        amount: parseFloat(input.amount.toString()),
        platform: input.platform.trim(),
        campaign: input.campaign?.trim() || null,
      },
    });

    // Revalidate the ads-sales comparison cache
    revalidatePath("/dashboard/overview");
    revalidatePath("/dashboard/ads");

    return {
      success: true,
      data: marketingExpense,
    };
  } catch (error) {
    console.error("Erro ao criar marketing expense:", error);
    throw error;
  }
}

export async function getMarketingExpenses() {
  try {
    await assertStaff();
    const expenses = await db.marketingExpense.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    // Serializar Decimal para number para passar ao Client Component
    return expenses.map(expense => ({
      ...expense,
      amount: expense.amount?.toNumber() ?? 0,
    }));
  } catch (error) {
    console.error("Erro ao buscar marketing expenses:", error);
    throw error;
  }
}

export async function deleteMarketingExpense(id: string) {
  try {
    await assertStaff();
    await db.marketingExpense.delete({
      where: { id },
    });

    // Revalidate the cache
    revalidatePath("/dashboard/overview");
    revalidatePath("/dashboard/ads");

    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar marketing expense:", error);
    throw error;
  }
}

export async function updateMarketingExpense(
  id: string,
  input: CreateMarketingExpenseInput
) {
  try {
    await assertStaff();
    // Validação
    if (!input.duration || input.duration < 1) {
      throw new Error("Duration deve ser pelo menos 1 dia");
    }

    if (!input.amount || input.amount < 0) {
      throw new Error("Amount deve ser um valor positivo");
    }

    if (!input.platform || input.platform.trim().length === 0) {
      throw new Error("Platform é obrigatória");
    }

    const marketingExpense = await db.marketingExpense.update({
      where: { id },
      data: {
        duration: input.duration,
        amount: parseFloat(input.amount.toString()),
        platform: input.platform.trim(),
        campaign: input.campaign?.trim() || null,
      },
    });

    // Revalidate the cache
    revalidatePath("/dashboard/overview");
    revalidatePath("/dashboard/ads");

    return {
      success: true,
      data: marketingExpense,
    };
  } catch (error) {
    console.error("Erro ao atualizar marketing expense:", error);
    throw error;
  }
}
