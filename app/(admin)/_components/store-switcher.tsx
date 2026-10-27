"use client";

import { ArrowLeft, Check, ChevronsUpDown, PlusCircle, Store as StoreIcon } from "lucide-react"
 
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Store } from "@prisma/client";
import { useStoreModal } from "@/hooks/use-store-modal";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { CommandSeparator } from "cmdk";
import Link from "next/link";
import { ChevronLeft } from "@/public/animated/icons/ChevronLeft";

type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>

interface StoreSwitcherProps extends PopoverTriggerProps {
    items: Store[]
};
 

export default function StoreSwitcher({
    className,
    items = []
}: StoreSwitcherProps) {
const storeModal = useStoreModal();
const params = useParams();
const router = useRouter();
const pathname = usePathname();

const formattedItems = items.map((item) => ({
    label: item.name,
    value: item.id,
}));

const currentStore = formattedItems.find((item) => item.value === params.storeId);

const [open, setOpen] = useState(false)


const onStoreSelect = (store: { value: string, label: string}) => {
    setOpen(false)
    router.push(`/dashboard/store/${store.value}/products`)
}

    return (
        <>
        {pathname?.startsWith("/dashboard/store") ? (
        <Link
        href="/dashboard"
        >
        <ChevronLeft className="md:mx-5"/> 
        </Link>
        ) : (
        <Link
        href="/"
        >
        <ChevronLeft className="md:mx-5"/> 
        </Link>  
        )
        }
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                role="combobox"
                aria-expanded={open}
                aria-label="Escolha a loja"
                className={cn("w-[200px] justify-between", className)}
              >
                <StoreIcon className="mr-2 h-4 w-4" />
                {currentStore?.label || "Selecione uma loja"}
                <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandList>
                        <CommandInput placeholder="Buscar lojas..."/>
                        <CommandEmpty>
                            Nenhuma loja encontrada.
                        </CommandEmpty>
                        <CommandGroup heading="stores">
                            {formattedItems.map((store) => (
                                <CommandItem key={store.value} onSelect={() => onStoreSelect(store)}>
                                    <StoreIcon className="mr-2 h-4 w-4"/>
                                    {store.label}
                                    <Check className={cn("ml-auto h-4 w-4",
                                    currentStore?.value === store.value
                                        ? "opacity-100" : "opacity-0"
                                    )}/>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                    <CommandSeparator/>
                    <CommandList>
                        <CommandGroup>
                            <CommandItem onSelect={() => {setOpen(false); storeModal.onOpen()}}>
                                <PlusCircle className="mr-2 h-5 w-5"/>
                                Criar loja
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>            
        </Popover>
        </>
    );
};