"use client";



import { 
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "./ui/dialog";

interface ModalProps {
    title: string;
    description: string;
    isOpen: boolean;
    onClose: () => void;
    children?: React.ReactNode;
};

export const Modal: React.FC<ModalProps> = ({description, isOpen, onClose, title, children}) => {
    const onChange = (open: boolean) => {
        if(!open) {
            onClose();
        }
    };
    return (
        <Dialog open={isOpen} onOpenChange={onChange} > 
            <DialogContent className="overflow-y-auto overflow-x-hidden overscroll-contain max-w-screen max-h-[100dvh]">
                <DialogHeader>
                    <DialogTitle>
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <div>
                    {children}
                </div>
            </DialogContent>
        </Dialog>
    );
};