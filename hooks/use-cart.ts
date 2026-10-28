import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { StoreProduct, CartItem } from "@/app/types";
import { toast } from "sonner";
import { isSameEventDay } from "@/lib/booking-rules";

// Preço mostrado no carrinho. O valor cobrado é sempre recalculado no servidor ao criar o pedido.
export const getCartPrice = (product: StoreProduct, contractType: "SALE" | "RENTAL") => {
  if (contractType === "RENTAL") {
    const rental = Number(product.rentalValue);
    return rental > 0 ? rental : Number(product.price) / 2;
  }
  return Number(product.price);
};

interface CartItemData {
  product: StoreProduct;
  contractType: "SALE" | "RENTAL";
  eventDate?: Date;
  cep?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (data: CartItemData) => boolean;
  removeItem: (id: string, contractType?: "SALE" | "RENTAL") => void;
  removeAll: () => void;
  updateItemDate: (id: string, contractType: "SALE" | "RENTAL", eventDate: Date) => void;
};

const goToCart = { label: "Ver carrinho", onClick: () => { window.location.href = "/cart"; } };

const useCart = create(
  persist<CartStore>((set, get) => ({
    items: [],
    addItem: (data: CartItemData) => {
      const currentItems = get().items;

      // Se o produto é apenas para aluguel, forçar contractType para RENTAL
      const contractType = data.product.isOnlyRental === true ? "RENTAL" : data.contractType;

      if (currentItems.some((item) => item.id === data.product.id)) {
        toast.info("Este vestido já está no carrinho.", { action: goToCart });
        return false;
      }

      // Um pedido tem uma única data de evento/entrega
      const otherDate = currentItems.find((item) => item.eventDate && !isSameEventDay(item.eventDate, data.eventDate));
      if (data.eventDate && otherDate) {
        toast.error("O carrinho já tem um vestido para outra data.", {
          description: "Finalize aquele pedido primeiro ou ajuste as datas para o mesmo dia.",
          action: goToCart,
        });
        return false;
      }

      const cartItem: CartItem = {
        ...data.product,
        contractType,
        cartPrice: getCartPrice(data.product, contractType),
        eventDate: data.eventDate,
        cep: data.cep,
      };

      set({ items: [...currentItems, cartItem] });
      toast.success("Vestido adicionado ao carrinho.", { action: goToCart });
      return true;
    },
    removeItem: (id: string, contractType: "SALE" | "RENTAL" = "SALE") => {
      const itemKey = `${id}-${contractType}`;
      set({
        items: [...get().items.filter((item) => `${item.id}-${item.contractType}` !== itemKey)]
      });
      toast.success("O item foi removido do carrinho.");
    },
    removeAll: () => set({ items: []}),
    updateItemDate: (id: string, contractType: "SALE" | "RENTAL", eventDate: Date) => {
      const itemKey = `${id}-${contractType}`;
      set({
        items: get().items.map((item) =>
          `${item.id}-${item.contractType}` === itemKey ? { ...item, eventDate } : item
        ),
      });
    },
  }), {
    name: "cart-storage",
    storage: createJSONStorage(() => localStorage)
  })
);

export default useCart;
