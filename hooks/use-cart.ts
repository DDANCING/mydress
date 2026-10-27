import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { StoreProduct, CartItem } from "@/app/types";
import { toast } from "sonner";
import { redirect } from "next/navigation";

interface CartItemData {
  product: StoreProduct;
  contractType: "SALE" | "RENTAL";
  eventDate?: Date;
  cep?: string;
  shippingPrice?: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (data: CartItemData) => void;
  removeItem: (id: string, contractType?: "SALE" | "RENTAL") => void;
  removeAll: () => void;
  updateItemDate: (id: string, contractType: "SALE" | "RENTAL", eventDate: Date) => void;
};

const useCart = create(
  persist<CartStore>((set, get) => ({
    items: [],
    addItem: (data: CartItemData) => {
      const currentItems = get().items;
      
      // Se o produto é apenas para aluguel, forçar contractType para RENTAL
      const finalContractType = data.product.isOnlyRental === true ? "RENTAL" : data.contractType;
      
      // Crie uma chave única baseada no ID do produto e tipo de contrato
      const itemKey = `${data.product.id}-${finalContractType}`;
      const existingItem = currentItems.find((item) => `${item.id}-${item.contractType}` === itemKey);

      if (existingItem) {
        return toast.info("O item já foi adicionado ao carrinho.", {
          action: {
            label: "Ver carrinho ",
            onClick: () => redirect("/cart"),
          },
        });
      }

      // NOVA LÓGICA: Se for aluguel e produto tiver rentalValue, use rentalValue
      let cartPrice: number;
      if (finalContractType === "RENTAL") {
        cartPrice =
          data.product.rentalValue !== null && data.product.rentalValue !== undefined
            ? Number(data.product.rentalValue)
            : Number(data.product.price) / 2;
      } else {
        cartPrice = Number(data.product.price);
      }

      // Calcule o preço total (produto + frete)
      const shippingPrice = data.shippingPrice || 0;
      const totalPrice = cartPrice + shippingPrice;

      // Crie o item do carrinho
      const cartItem: CartItem = {
        ...data.product,
        contractType: finalContractType, // Usar o tipo final (pode ter sido alterado)
        cartPrice,
        eventDate: data.eventDate,
        cep: data.cep,
        shippingPrice,
        totalPrice
      };

      set({ items: [...get().items, cartItem]});
      return toast.info("O item foi adicionado ao carrinho.", {
        action: {
          label: "Ver carrinho ",
          onClick: () => redirect("/cart"),
        },
      });
    },
    removeItem: (id: string, contractType: "SALE" | "RENTAL" = "SALE") => {
      const itemKey = `${id}-${contractType}`;
      set({
        items: [...get().items.filter((item) => `${item.id}-${item.contractType}` !== itemKey)]
      });
      toast.success("O item foi removido do carrinho.", {
        action: {
          label: "Ver carrinho ",
          onClick: () => redirect("/cart"),
        },
      });
    },
    removeAll: () => set({ items: []}),
    updateItemDate: (id: string, contractType: "SALE" | "RENTAL", eventDate: Date) => {
      const itemKey = `${id}-${contractType}`;
      const currentItems = get().items;
      const updatedItems = currentItems.map(item => {
        if (`${item.id}-${item.contractType}` === itemKey) {
          return {
            ...item,
            eventDate
          };
        }
        return item;
      });
      set({ items: updatedItems });
    },
  }), {
    name: "cart-storage",
    storage: createJSONStorage(() => localStorage)
  })
);

export default useCart;