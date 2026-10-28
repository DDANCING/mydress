import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";


interface OrderItemPayload {
  productId: string;
  quantity: number;
  type?: "SALE" | "RENTAL"; // Opcional, default será "SALE"
  unitPrice?: number;       // Opcional, será buscado do produto
  subtotal?: number;        // Opcional, será calculado
}

export async function POST(req: Request) {
  try {
    console.log('[ORDER_POST] Starting order creation...');
    
    // Rota do painel. A loja cria pedidos por /api/store/orders, que calcula os valores no servidor.
    const denied = await requireStaff();
    if (denied) return denied;

    const body = await req.json();
    console.log('[ORDER_POST] Received payload:', JSON.stringify(body, null, 2));

    const {
      buyer: buyerData,
      order: orderData,
      orderItems,
    } = body;

    if (!buyerData) {
        console.log('[ORDER_POST] Missing buyer data');
        return new NextResponse(JSON.stringify({ error: "Buyer data is required", details: "buyerData is null or undefined" }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }
    if (!orderData) {
        console.log('[ORDER_POST] Missing order data');
        return new NextResponse(JSON.stringify({ error: "Order data is required", details: "orderData is null or undefined" }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }
    if (!orderItems || orderItems.length === 0) {
      console.log('[ORDER_POST] Missing or empty order items:', orderItems);
      return new NextResponse(JSON.stringify({ error: "Order items are required", details: "orderItems is empty or null" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar dados do buyer
    if (!buyerData.email) {
        console.log('[ORDER_POST] Missing buyer email:', buyerData);
        return new NextResponse(JSON.stringify({ error: "Buyer email is required", details: "buyerData.email is missing" }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }

    // Validar orderItems
    for (let i = 0; i < orderItems.length; i++) {
        const item = orderItems[i];
        console.log(`[ORDER_POST] Validating item ${i}:`, item);
        
        if (!item.productId) {
            return new NextResponse(JSON.stringify({ 
              error: "Product ID is required for all order items", 
              details: `Item at index ${i} is missing productId`,
              item: item
            }), { 
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
        }
        if (!item.quantity || item.quantity <= 0) {
            return new NextResponse(JSON.stringify({ 
              error: "Valid quantity is required for all order items", 
              details: `Item at index ${i} has invalid quantity: ${item.quantity}`,
              item: item
            }), { 
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
        }
        // unitPrice é opcional - será buscado do produto se não fornecido
        if (item.unitPrice !== undefined && item.unitPrice < 0) {
            return new NextResponse(JSON.stringify({ 
              error: "Valid unit price is required for all order items", 
              details: `Item at index ${i} has invalid unitPrice: ${item.unitPrice}`,
              item: item
            }), { 
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    // Primeiro, tentar encontrar buyer por email ou documento
    console.log('[ORDER_POST] Processing buyer data:', buyerData);
    let buyer;
    
    try {
      // Tentar buscar buyer existente por email
      buyer = await db.buyer.findUnique({
        where: { email: buyerData.email }
      });
      console.log('[ORDER_POST] Found buyer by email:', buyer ? 'YES' : 'NO');
      
      // Se não encontrar por email, tentar por documento (se fornecido)
      if (!buyer && buyerData.document) {
        buyer = await db.buyer.findUnique({
          where: { document: buyerData.document }
        });
        console.log('[ORDER_POST] Found buyer by document:', buyer ? 'YES' : 'NO');
      }
      
      if (buyer) {
        // Atualizar buyer existente
        console.log('[ORDER_POST] Updating existing buyer with ID:', buyer.id);
        buyer = await db.buyer.update({
          where: { id: buyer.id },
          data: buyerData
        });
      } else {
        // Criar novo buyer
        console.log('[ORDER_POST] Creating new buyer');
        buyer = await db.buyer.create({
          data: buyerData
        });
      }
      console.log('[ORDER_POST] Buyer processed successfully, ID:', buyer.id);
    } catch (error: any) {
      console.log('[ORDER_POST] Error processing buyer:', error);
      if (error.code === 'P2002') {
        return new NextResponse(JSON.stringify({
          error: `Já existe um cliente com este ${error.meta?.target?.includes('document') ? 'documento' : 'email'}`,
          details: `Prisma constraint violation on field: ${error.meta?.target}`,
          code: 'P2002'
        }), { 
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw error;
    }


    const productIds = orderItems.map((item: OrderItemPayload) => item.productId);
    console.log('[ORDER_POST] Product IDs:', productIds);

    const productsInDb = await db.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    });
    console.log('[ORDER_POST] Found products in DB:', productsInDb.length);
    
    if (productsInDb.length !== productIds.length) {
        const foundIds = productsInDb.map(p => p.id);
        const missingIds = productIds.filter((id: string) => !foundIds.includes(id));
        console.log('[ORDER_POST] Missing products:', missingIds);
        
        return new NextResponse(JSON.stringify({
          error: "One or more products not found",
          details: `Missing product IDs: ${missingIds.join(', ')}`,
          foundProducts: foundIds,
          missingProducts: missingIds
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
    }

    console.log('[ORDER_POST] Starting transaction...');
    console.log('[ORDER_POST] Order data:', orderData);
    
    const newOrder = await db.$transaction(async (prisma) => {
        console.log('[ORDER_POST] Creating order with buyerId:', buyer.id);
        
        const createdOrder = await prisma.order.create({
            data: {
                buyerId: buyer.id,
                isPaid: orderData.isPaid,
                paymentMethod: orderData.paymentMethod,
                installments: orderData.installments,
                status: orderData.status,
                totalAmount: orderData.totalAmount,
                shippingMethod: orderData.shippingMethod || "N/S", 
                shippingCost: orderData.shippingCost || 0,
                shippingTime: orderData.shippingTime || null,
                eventDate: orderData.eventDate ? new Date(orderData.eventDate) : null,
                couponId: orderData.couponId || null,
            },
        });
        console.log('[ORDER_POST] Order created with ID:', createdOrder.id);

        console.log('[ORDER_POST] Processing order items...');
        const orderItemsToCreate = orderItems.map((item: OrderItemPayload, index: number) => {
            console.log(`[ORDER_POST] Processing item ${index}:`, item);
            
            const product = productsInDb.find(p => p.id === item.productId);
            if (!product) {
                throw new Error(`Product with ID ${item.productId} not found during transaction.`);
            }
            
            // Usar unitPrice do item ou do produto da base de dados
            const unitPrice = item.unitPrice !== undefined 
              ? item.unitPrice 
              : product.price?.toNumber() || 0;
              
            const quantity = item.quantity || 1;
            
            // Calcular subtotal se não fornecido
            const subtotal = item.subtotal !== undefined 
              ? item.subtotal 
              : unitPrice * quantity;
            
            console.log(`[ORDER_POST] Item ${index} calculations:`, { 
              unitPrice, 
              quantity, 
              subtotal,
              productPrice: product.price?.toNumber(),
              itemUnitPrice: item.unitPrice
            });
            
            // Validar se subtotal é um número válido
            if (isNaN(subtotal) || subtotal < 0) {
                throw new Error(`Invalid subtotal for product ${item.productId}: ${subtotal}`);
            }
            
            return {
                orderId: createdOrder.id,
                productId: item.productId,
                quantity: quantity,
                unitPrice: unitPrice,
                type: item.type || "SALE",
                subtotal: new Prisma.Decimal(subtotal),
            };
        });

        console.log('[ORDER_POST] Creating order items:', orderItemsToCreate.length);
        await prisma.orderItem.createMany({
            data: orderItemsToCreate,
        });
        
        console.log('[ORDER_POST] Transaction completed successfully');
        return createdOrder;
    });
    
    // Serializar Decimals para números
    const serializedOrder = {
      ...newOrder,
      totalAmount: newOrder.totalAmount?.toNumber() || 0,
      shippingCost: newOrder.shippingCost?.toNumber() || 0
    };

    console.log('[ORDER_POST] Success! Order created:', serializedOrder.id);
    return NextResponse.json(serializedOrder, { status: 201 });

  } catch (error: any) {
    console.log('[ORDER_POST] Error:', error);
    console.log('[ORDER_POST] Error stack:', error.stack);
    
    // Se for um erro do Prisma
    if (error.code) {
      return new NextResponse(JSON.stringify({
        error: "Database error",
        details: error.message,
        code: error.code,
        prismaError: true
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Se for um erro customizado
    if (error.message) {
      return new NextResponse(JSON.stringify({
        error: "Internal error",
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Erro genérico
    return new NextResponse(JSON.stringify({
      error: "Internal error",
      details: "An unexpected error occurred"
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}