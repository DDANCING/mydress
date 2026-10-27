import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { MaterialCategory, MaterialUnit } from "@prisma/client"; // Certifique-se de importar os enums gerados

export async function POST(
  req: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  try {
    const user = await auth();
    const userId = user?.user?.id;
    const body = await req.json();
    const { storeId } = await context.params;

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

    // Validações de Autenticação
    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }
    if (!storeId) {
      return new NextResponse("Store id is required", { status: 400 });
    }

    // Validações dos Campos Obrigatórios
    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }
    if (!category || !Object.values(MaterialCategory).includes(category)) {
      return new NextResponse("Valid Category is required", { status: 400 });
    }
    if (!color) {
      return new NextResponse("Color is required", { status: 400 });
    }
    if (quantity === undefined || quantity === null || quantity < 0) {
      return new NextResponse("Quantity is required and must be positive", { status: 400 });
    }
    if (!unit || !Object.values(MaterialUnit).includes(unit)) {
      return new NextResponse("Valid Unit is required", { status: 400 });
    }
    if (pricePerUnit !== undefined && pricePerUnit !== null && pricePerUnit < 0) {
      return new NextResponse("Price per unit must be positive", { status: 400 });
    }

    // Verifica se a loja pertence ao usuário logado
    const storeByUserId = await db.store.findFirst({
      where: {
        id: storeId,
        // userId: userId, // Descomente se sua Store tiver relação direta com userId, ou ajuste conforme seu schema
      },
    });

    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    /* Nota: O modelo RawMaterial fornecido não tinha 'storeId', 
      mas como a rota é /[storeId]/... assumi que você deve adicionar 
      o relacionamento no schema.prisma ou ajustar conforme necessário.
      Aqui estou assumindo que você adicionou storeId ao modelo RawMaterial.
    */
    const rawMaterial = await db.rawMaterial.create({
      data: {
        name,
        category, // O Prisma valida automaticamente se a string bate com o Enum
        color,
        quantity,
        unit,
        minStock: minStock || 0,
        pricePerUnit,
        supplier,
        imageUrl,
        // storeId, // Adicione este campo se você adicionou a relação no Schema
      },
    });

    // Converter Decimal para number para evitar erro de serialização do JSON
    const serializedMaterial = {
      ...rawMaterial,
      pricePerUnit: rawMaterial.pricePerUnit ? rawMaterial.pricePerUnit.toNumber() : null,
    };

    return NextResponse.json(serializedMaterial);
  } catch (error) {
    console.log("[RAW_MATERIALS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const { storeId } = await context.params;

    // Filtros opcionais via query params
    const category = searchParams.get("category") as MaterialCategory | undefined;
    const supplier = searchParams.get("supplier") || undefined;
    const lowStock = searchParams.get("lowStock"); // Ex: ?lowStock=true

    if (!storeId) {
      return new NextResponse("Store id is required", { status: 400 });
    }

    // Lógica para filtrar estoque baixo (se solicitado)
    // Nota: Filtrar colunas comparativas (quantity <= minStock) diretamente no where 
    // pode depender do banco de dados ou precisar de raw query, 
    // mas aqui faremos o filtro básico.

    const rawMaterials = await db.rawMaterial.findMany({
      where: {
        // storeId: storeId, // Assumindo relação com Store
        category: category || undefined,
        supplier: {
            contains: supplier, // Busca flexível por fornecedor
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Se houver filtro de estoque baixo, filtramos no JS (pois comparar duas colunas no `where` do Prisma é complexo)
    let filteredMaterials = rawMaterials;
    if (lowStock === "true") {
        filteredMaterials = rawMaterials.filter(m => m.quantity <= m.minStock);
    }

    // Converter Decimals
    const serializedMaterials = filteredMaterials.map((item) => ({
      ...item,
      pricePerUnit: item.pricePerUnit ? item.pricePerUnit.toNumber() : null,
    }));

    return NextResponse.json(serializedMaterials);
  } catch (error) {
    console.log("[RAW_MATERIALS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}