"use client";

import { useEffect, useState } from "react";
import { Modal } from "../modal";
import { Button } from "../ui/button";
import { Trash2Icon } from "lucide-react";

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    loading: boolean;
}

export const AlertModal: React.FC<AlertModalProps> = ({
    isOpen,
    loading,
    onClose,
    onConfirm,
}) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, [])

    if(!isMounted) {
        return null
    }

    return (
        <Modal
        title="Você tem certeza?"
        description="essa ação não pode ser desfeita."
        isOpen={isOpen}
        onClose={onClose}
        >
            <div className="pt-6 space-x-2 flex items-center justify-end w-full">
                <Button disabled={loading} variant="outline" onClick={onClose}>
                    Cancelar
                </Button>
                <Button disabled={loading} variant="destructive" onClick={onConfirm}>
                   <Trash2Icon/> Continuar
                </Button>
            </div>
        </Modal>
    )
}