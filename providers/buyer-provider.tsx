"use client";




import { BuyerModal } from "@/components/modals/buyer-modal";
import { useEffect, useState } from "react";


export const BuyerModalProvider = () => {
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
          <BuyerModal/>
        </>
    );
};