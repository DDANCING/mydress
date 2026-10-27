"use client";

import { Modal } from "../modal";
import { useBuyerModal } from "@/hooks/use-buyer-modal";
import { BuyerForm } from "@/app/(admin)/dashboard/buyers/[buyerId]/_components/buyer-form"; // ou outro caminho
import { Buyer } from "@prisma/client";

export const BuyerModal = () => {
  const buyerModal = useBuyerModal();

  const handleBuyerCreated = (buyer: Buyer) => {
    // Chama o callback se existir
    if (buyerModal.onBuyerCreated) {
      buyerModal.onBuyerCreated(buyer);
    }
    // Fecha o modal
    buyerModal.onClose();
  };

  const title = buyerModal.initialData ? "Editar cliente" : "Novo cliente";

  return (
    <Modal
      title={title}
      description=""
      isOpen={buyerModal.isOpen}
      onClose={buyerModal.onClose}
    >
      <BuyerForm 
        initialData={buyerModal.initialData || null}
        buyerId={buyerModal.initialData?.id}
        isModal={true}
        onBuyerCreated={handleBuyerCreated}
      />
    </Modal>
  );
};