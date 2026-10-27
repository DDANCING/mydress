import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { MaterialCategory, MaterialUnit } from "@prisma/client";

export async function GET(
  req: Request,
  context: { params: Promise<{ materialsId: string }> }
) {
  try {
    const { materialsId } = await context.params;

    if (!materialsId) {
      return new NextResponse("Material ID is required", { status: 400 });
    }

    const rawMaterial = await db.rawMaterial.findUnique({
      where: {
        id: materialsId,
      },
    });

    if (!rawMaterial) {
      return new NextResponse("Raw material not found", { status: 404 });
    }

    // Converter Decimal para number
    const serializedMaterial = {
      ...rawMaterial,
      pricePerUnit: rawMaterial.pricePerUnit ? rawMaterial.pricePerUnit.toNumber() : null,
    };

    return NextResponse.json(serializedMaterial);
  } catch (error) {
    console.log("[RAW_MATERIAL_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ storeId: string; materialsId: string }> }
) {
  try {
    const user = await auth();
    const userId = user?.user.id;
    const body = await req.json();
    const { storeId, materialsId } = await context.params;

    const {
      name,
      category,
      color,
      quantity,
      unit,
      minStock,
      pricePerUnit,
      supplier,
      imageUrl,
    } = body;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!storeId) {
      return new NextResponse("Store ID is required", { status: 400 });
    }

    if (!materialsId) {
      return new NextResponse("Material ID is required", { status: 400 });
    }

    // Validações de campos obrigatórios básicos se fornecidos (Partial Update)
    if (name === "") {
        return new NextResponse("Name cannot be empty", { status: 400 });
    }

    // Validação de Enums e Números apenas se eles estiverem presentes no body
    if (category && !Object.values(MaterialCategory).includes(category)) {
      return new NextResponse("Invalid Category", { status: 400 });
    }

    if (unit && !Object.values(MaterialUnit).includes(unit)) {
      return new NextResponse("Invalid Unit", { status: 400 });
    }

    if (quantity !== undefined && quantity < 0) {
      return new NextResponse("Quantity must be positive", { status: 400 });
    }

    if (pricePerUnit !== undefined && pricePerUnit < 0) {
      return new NextResponse("Price must be positive", { status: 400 });
    }

    // Verificar propriedade da loja
    const storeByUserId = await db.store.findFirst({
      where: {
        id: storeId,
        // userId, // Descomente se sua Store tiver relação direta com userId
      },
    });

    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Atualização
    const rawMaterial = await db.rawMaterial.update({
      where: {
        id: materialsId,
        // Garante que só edita se pertencer à loja (se houver storeId no model RawMaterial)
        // storeId: storeId, 
      },
      data: {
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(color !== undefined && { color }),
        ...(quantity !== undefined && { quantity }),
        ...(unit !== undefined && { unit }),
        ...(minStock !== undefined && { minStock }),
        ...(pricePerUnit !== undefined && { pricePerUnit }),
        ...(supplier !== undefined && { supplier }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
    });

    // Converter Decimal para number
    const serializedMaterial = {
      ...rawMaterial,
      pricePerUnit: rawMaterial.pricePerUnit ? rawMaterial.pricePerUnit.toNumber() : null,
    };

    return NextResponse.json(serializedMaterial);
  } catch (error) {
    console.log("[RAW_MATERIAL_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ storeId: string; materialsId: string }> }
) {
  try {
    const user = await auth();
    const userId = user?.user.id;
    const { storeId, materialsId } = await context.params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!materialsId) {
      return new NextResponse("Material ID is required", { status: 400 });
    }

    const storeByUserId = await db.store.findFirst({
      where: {
        id: storeId,
        // userId, // Descomente se sua Store tiver relação direta com userId
      },
    });

    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const rawMaterial = await db.rawMaterial.delete({
      where: {
        id: materialsId,
        // storeId: storeId, // Boa prática: garantir que deleta apenas se pertencer à loja da rota
      },
    });

    // Para o delete, geralmente retornamos o objeto deletado ou null/success message
    // Como o rawMaterial pode ter decimal, convertemos para garantir segurança no retorno JSON
    const serializedMaterial = {
        ...rawMaterial,
        pricePerUnit: rawMaterial.pricePerUnit ? rawMaterial.pricePerUnit.toNumber() : null,
    };

    return NextResponse.json(serializedMaterial);
  } catch (error) {
    console.log("[RAW_MATERIAL_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}