import { create } from 'zustand';

interface ReceiptModalStore {
  isOpen: boolean;
  paymentData: any;
  onOpen: (data: any) => void;
  onClose: () => void;
}

export const useReceiptModal = create<ReceiptModalStore>((set) => ({
  isOpen: false,
  paymentData: null,
  onOpen: (data) => set({ isOpen: true, paymentData: data }),
  onClose: () => set({ isOpen: false, paymentData: null }),
}));
