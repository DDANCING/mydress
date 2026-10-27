"use client";

import { StoreModal } from "@/components/modals/store-modal";
import { useStoreModal } from "@/hooks/use-store-modal";
import { useEffect } from "react";

const AdminPage = () => {
    const onOpen = useStoreModal((state) => state.onOpen);
    const isOpen = useStoreModal((state) => state.isOpen);

    useEffect(() => {
        if (!isOpen) {
            onOpen();
        }
    }, [isOpen, onOpen ])
  return (
    <div className="flex  m-20">
      <StoreModal/>
    </div>
  );
}

export default AdminPage;