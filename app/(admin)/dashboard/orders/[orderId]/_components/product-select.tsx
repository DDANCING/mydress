"use client";

import {
  Control,
  useFieldArray,
  UseFormSetValue,
  UseFormGetValues,
} from "react-hook-form";
import { useEffect, useCallback } from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SafeProduct } from "@/app/types";

interface ProductSelectorFormFieldProps {
  products: SafeProduct[];
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
  setPrice: (total: number) => void;
}

export function ProductSelectorFormField({
  products,
  control,
  setValue,
  getValues,
  setPrice,
}: ProductSelectorFormFieldProps) {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "product",
  });

  const formatProduct = (p: SafeProduct) =>
    `${p.name} - ${p.color.name} - ${p.size.name}`;

  // Atualiza o valor total automaticamente
  const updateTotalPrice = useCallback(() => {
    const current = getValues("product") || [];
    const total = current.reduce((acc: number, curr: any) => {
      const product = products.find((p) => p.id === curr.id);
      if (!product) return acc;
      return acc + Number(product.price) * (curr.quantity || 1);
    }, 0);
    setPrice(total);
  }, [getValues, products, setPrice]);

  // Chama updateTotalPrice sempre que os campos mudarem
  useEffect(() => {
    updateTotalPrice();
  }, [fields, updateTotalPrice]);

  return (
    <div className="flex flex-col gap-4">
      <FormLabel>Produtos</FormLabel>

      {fields.map((field, index) => (
        <FormField
          key={field.id}
          control={control}
          name={`product.${index}.id`}
          render={({ field: f }) => {
            const selectedProduct = products.find((p) => p.id === f.value);

            return (
              <FormItem className="flex items-center gap-4">
                <div className="flex-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                          {selectedProduct
                            ? formatProduct(selectedProduct)
                            : "Selecione um produto"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[300px]">
                      <Command>
                        <CommandInput placeholder="Buscar produto..." />
                        <CommandList>
                          <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                          <CommandGroup>
                           {products.map((product) => {
  const isAlreadySelected =
    getValues("product").some(
      (item: any, i: number) => item.id === product.id && i !== index
    );

  const isDisabled = isAlreadySelected || product.isArchived;

  return (
    <CommandItem
      key={product.id}
      onSelect={() => {
        if (isDisabled) return; 
        f.onChange(product.id);
        update(index, {
          id: product.id,
          quantity: getValues(`product.${index}.quantity`) || 1,
        });
        updateTotalPrice();
      }}
      disabled={isDisabled}
      className={cn(
        product.isArchived && "bg-muted opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex flex-col flex-1">
        <span className={cn(
          product.isArchived && "line-through text-muted-foreground"
        )}>
          {formatProduct(product)}
        </span>
        {product.isArchived && (
          <span className="text-xs text-muted-foreground">
            (Produto arquivado)
          </span>
        )}
      </div>
      <Check
        className={cn(
          "ml-auto h-4 w-4",
          product.id === f.value ? "opacity-100" : "opacity-0"
        )}
      />
    </CommandItem>
  );
})}

                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </div>

                <div>
                  <Input
                    type="number"
                    min={1}
                    className="w-20"
                    value={getValues(`product.${index}.quantity`) || 1}
                    onChange={(e) => {
                      const quantity = parseInt(e.target.value) || 1;
                      update(index, {
                        id: f.value,
                        quantity,
                      });
                      updateTotalPrice();
                    }}
                  />
                </div>

                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      remove(index);
                      updateTotalPrice();
                    }}
                  >
                    <Trash className="h-4 w-4 text-rose-500" />
                  </Button>
                )}
              </FormItem>
            );
          }}
        />
      ))}

      <Button
        type="button"
        onClick={() => {
          append({ id: "", quantity: 1 });
        }}
        variant="ghost"
        className="flex justify-start hover:underline max-w-56"
      >
        + Adicionar mais produtos
      </Button>
    </div>
  );
}
