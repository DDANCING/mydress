import { create } from "zustand";
import { Buyer } from "@prisma/client";

interface useStoreModalBuyer {
    isOpen: boolean;
    initialData?: Buyer | null;
    onBuyerCreated?: (buyer: Buyer) => void;
    onOpen: (callback?: (buyer: Buyer) => void, initialData?: Buyer | null) => void;
    onClose: () => void;
};

export const useBuyerModal = create<useStoreModalBuyer>((set) => ({
    isOpen: false,
    initialData: null,
    onBuyerCreated: undefined,
    onOpen: (callback?: (buyer: Buyer) => void, initialData?: Buyer | null) => set({ 
        isOpen: true, 
        onBuyerCreated: callback,
        initialData: initialData || null
    }),
    onClose: () => set({ isOpen: false, onBuyerCreated: undefined, initialData: null }),
}));