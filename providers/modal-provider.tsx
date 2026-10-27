"use client";

import { StoreModal } from "@/components/modals/store-modal";
import { BuyerModal } from "@/components/modals/buyer-modal";
import { ReceiptModal } from "@/components/modals/receipt-modal";

import { useEffect, useState } from "react";


export const ModalProvider = () => {
    const [isMounted, setIsMounted] = useState(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        setIsMounted(true);
    })

    if (!isMounted) {
        return null;
    }

    return (
        <>
            <StoreModal/>
            <BuyerModal/>
            <ReceiptModal/>
        </>
    );
};