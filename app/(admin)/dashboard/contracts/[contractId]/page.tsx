import { db } from "@/lib/db";
import { ContractForm } from "./_components/contract-form";

// Função para serializar Decimals e Dates em objetos/arrays
function serializeDecimals(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(serializeDecimals);

  if (typeof obj === "object") {
    // Se é uma Date, verificar se é válida
    if (obj instanceof Date) {
      return isNaN(obj.getTime()) ? null : obj.toISOString();
    }

    const newObj: any = {};
    for (const key in obj) {
      const value = obj[key];
      
      // Detecta objetos Decimal do Prisma
      if (value && typeof value === "object" && "toNumber" in value) {
        newObj[key] = value.toNumber();
      } 
      // Detecta Dates e serializa corretamente
      else if (value instanceof Date) {
        newObj[key] = isNaN(value.getTime()) ? null : value.toISOString();
      } 
      else {
        newObj[key] = serializeDecimals(value);
      }
    }
    return newObj;
  }
  return obj;
}

const ContractPage = async ({
  params
}: {
  params: Promise<{ contractId: string }>
}) => {
  const { contractId } = await params;
  let contract = null;
  
  if (contractId !== "new") {
    contract = await db.contract.findUnique({
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
        seller: true,
      },
    });
  }

  const buyers = await db.buyer.findMany({
    orderBy: {
      fullName: "asc",
    },
  });

  const products = await db.product.findMany({
    include: {
      color: true,
      size: true,
      category: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const paymentMethods = await db.paymentMethod.findMany({
    orderBy: {
      name: "asc",
    },
  });

  const sellers = await db.seller.findMany({
    where: {
      isActive: true,
    },
    include: {
      user: true,
    },
    orderBy: {
      user: {
        name: "asc",
      },
    },
  });

  // Serializar todos possíveis Decimal dos arrays/objetos
  const serializedProducts = serializeDecimals(products);
  const serializedBuyers = serializeDecimals(buyers);
  const serializedPaymentMethods = serializeDecimals(paymentMethods);
  const serializedSellers = serializeDecimals(sellers);

  // Serializar Decimals do contrato (se existir)
  const serializedContract = contract ? serializeDecimals(contract) : null;

  return ( 
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ContractForm 
          initialData={serializedContract} 
          buyers={serializedBuyers}
          products={serializedProducts}
          paymentMethods={serializedPaymentMethods}
          sellers={serializedSellers}
          contractId={contractId}
        />
      </div>
    </div>
  );
}

export default ContractPage;