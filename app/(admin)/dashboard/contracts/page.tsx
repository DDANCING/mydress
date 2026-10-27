import { db } from "@/lib/db";
import { ContractClient } from "./_components/client";
import { ContractColumn } from "./_components/columns";
import { formatter } from "@/lib/utils";
import { formatDateForDisplay } from "@/lib/date-utils";

const ContractsPage = async () => {
  const contracts = await db.contract.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      buyer: {
        select: {
          fullName: true,
          email: true,
        },
      },
      contractItems: {
        include: {
          product: {
            select: {
              name: true,
              sku: true,
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      seller: {
        include: {
          user: true,
        },
      },
      paymentMethod: {
        select: {
          name: true,
        },
      },
      contractPayments: {
        select: {
          amount: true,
          isPaid: true,
        },
      },
    },
  });

  // Não filtra por data, mostra todos os contratos
  const formattedContracts: ContractColumn[] = contracts.map((item) => {
    const getTypeLabel = (type: string) => {
      switch (type) {
        case "SALE":
          return "Venda";
        case "RENTAL":
          return "Locação";
        case "ClothingSALE":
          return "Confecção - Venda";
        case "clothingRENTAL":
          return "Confecção - Aluguel";
        default:
          return type;
      }
    };

    // Calcular o total pago (soma dos pagamentos que foram realizados)
    const totalPaidAmount = item.contractPayments
      .filter(payment => payment.isPaid)
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

    return {
      id: item.id,
      type: getTypeLabel(item.type),
      typeRaw: item.type,
      status: item.status,
      buyerName: item.buyer.fullName,
      totalPaid: formatter.format(totalPaidAmount),
      sku: item.contractItems
        .map(ci => ci.product?.sku)
        .filter(Boolean)
        .join(", ") || undefined,
      productName: item.contractItems.map(ci => ci.product.name).join(", "),
      sellerName: item.seller?.user?.name || "N/A",
      paymentMethod: item.paymentMethod?.name || "N/A",
      totalAmount: formatter.format(Number(item.totalAmount) - Number(item.discount || 0)),
      deliveryDate: typeof item.deliveryDate === 'string' ? item.deliveryDate : new Date(item.deliveryDate).toISOString(),
      deliveryDateRaw: typeof item.deliveryDate === 'string' ? new Date(item.deliveryDate) : new Date(item.deliveryDate),
      createdAt: formatDateForDisplay(item.createdAt),
      createdAtRaw: new Date(item.createdAt),
      haveNfe: item.haveNfe || false,
      buyerEmail: item.buyer.email || undefined,
      productCategories: item.contractItems
        .map(ci => ci.product?.category?.name)
        .filter(Boolean),
    };
  });

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ContractClient data={formattedContracts} />
      </div>
    </div>
  );
};

export default ContractsPage;