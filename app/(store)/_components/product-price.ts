import { StoreProduct } from "@/app/types";
import { formatter } from "@/lib/utils";

type PriceFields = Pick<StoreProduct, "price" | "rentalValue" | "isOnlyRental">;

// Mesma regra do ProductCard: aluguel tem prioridade quando existe valor de locação
export const getDisplayPrice = (product: PriceFields) => {
  const hasRentalValue = typeof product.rentalValue === "number" && product.rentalValue > 0;
  const isRental = product.isOnlyRental === true || hasRentalValue;
  const value = hasRentalValue
    ? product.rentalValue
    : product.isOnlyRental
      ? product.price / 2
      : product.price;

  return {
    isRental,
    value,
    formatted: formatter.format(value),
  };
};
