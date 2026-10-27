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
import { Trash, ChevronsUpDown, Check, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { SafeProduct } from "@/app/types";

interface ProductSelectorFormFieldProps {
  products: SafeProduct[];
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
  setPrice: (total: number) => void;
  contractType?: string; // Adicionar tipo de contrato
  onEditProduct?: (product: SafeProduct) => void;
  onCreateProduct?: (index: number) => void;
}

export function ProductSelectorFormField({
  products,
  control,
  setValue,
  getValues,
  setPrice,
  contractType,
  onEditProduct,
  onCreateProduct,
}: ProductSelectorFormFieldProps) {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "product",
  });

  const formatProduct = (p: SafeProduct) =>
    `${p.sku} - ${p.name}`;

  // Atualiza o valor total automaticamente
  const updateTotalPrice = useCallback(() => {
    const current = getValues("product") || [];
    
    const total = current.reduce((acc: number, curr: any, index: number) => {
      // Verificar se o produto tem ID válido
      if (!curr?.id || curr.id === "") {
        return acc;
      }
      
      const product = products.find((p) => p.id === curr.id);
      if (!product) {
        return acc;
      }
      
      // Determinar qual preço usar baseado no tipo de contrato
      let priceToUse = 0;
      if (contractType === "RENTAL" || contractType === "clothingRENTAL") {
        // Para locação, usar rentalValue se disponível, senão usar price
        priceToUse = Number(product.rentalValue || product.price);
      } else {
        // Para venda, usar price normal
        priceToUse = Number(product.price);
      }
      
      // Garantir que temos uma quantidade válida
      const quantity = Number(curr.quantity) || 1;
      const itemTotal = priceToUse * quantity;
      
      return acc + itemTotal;
    }, 0);
    
    setPrice(total);
  }, [products, getValues, setPrice, contractType]);

  // Recalcular preços quando a lista de produtos mudar
  useEffect(() => {
    updateTotalPrice();
  }, [products, updateTotalPrice]);

  // Recalcular quando o tipo de contrato mudar
  useEffect(() => {
    updateTotalPrice();
  }, [contractType, updateTotalPrice]);

  return (
    <div className="flex flex-col gap-4 w-40 md:w-full">
      <FormLabel>Produtos</FormLabel>

      {fields.map((field, index) => (
        <FormField
          key={field.id}
          control={control}
          name={`product.${index}.id`}
          render={({ field: f }) => {
            const selectedProduct = products.find((p) => p.id === f.value);

            return (
              <FormItem className="flex items-center  gap-2 sm:gap-4">
                {selectedProduct && onEditProduct && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditProduct(selectedProduct)}
                    className="h-8 w-4 sm:w-8"
                  >
                    <Pencil className="h-4 w-4 text-primary" />
                  </Button>
                )}
                <div className="flex-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="max-w-36 md:max-w-4xl w-full justify-between truncate"
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
                          <CommandEmpty>
                            <div className="p-4 text-center">
                              <p className="text-sm text-muted-foreground mb-2">
                                Nenhum produto encontrado.
                              </p>
                              {onCreateProduct && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => onCreateProduct(index)}
                                  className="w-full"
                                >
                                  Criar Produto
                                </Button>
                              )}
                            </div>
                          </CommandEmpty>
                          <CommandGroup>
                            {onCreateProduct && (
                              <CommandItem
                                onSelect={() => onCreateProduct(index)}
                                className="font-medium text-primary cursor-pointer"
                              >
                                + Criar Produto
                              </CommandItem>
                            )}
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
        // Se o produto está arquivado, abrir para edição
        if (product.isArchived && onEditProduct) {
          onEditProduct(product);
          return;
        }
        
        // Se não está arquivado mas já está selecionado, não fazer nada
        if (isAlreadySelected) return;
        
        f.onChange(product.id);
        const currentQuantity = getValues(`product.${index}.quantity`) || 1;
        
        update(index, {
          id: product.id,
          quantity: currentQuantity,
        });
        
        setTimeout(() => {
          updateTotalPrice();
        }, 0);
      }}
      disabled={isAlreadySelected && !product.isArchived}
      className={cn(
        product.isArchived && "bg-muted cursor-pointer",
        isAlreadySelected && !product.isArchived && "opacity-50 cursor-not-allowed"
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
            (Arquivado - clique para editar)
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
                    className="w-8 md:w-20 "
                    value={getValues(`product.${index}.quantity`) || 1}
                    onChange={(e) => {
                      const quantity = parseInt(e.target.value) || 1;
                      
                      update(index, {
                        id: f.value,
                        quantity,
                      });
                      
                      // Aguardar um tick do event loop para garantir que o estado foi atualizado
                      setTimeout(() => {
                        updateTotalPrice();
                      }, 0);
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
                      // Aguardar um tick do event loop para garantir que o estado foi atualizado
                      setTimeout(() => {
                        updateTotalPrice();
                      }, 0);
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
          // Recalcular após adicionar um novo campo (mesmo que vazio)
          setTimeout(() => {
            updateTotalPrice();
          }, 0);
        }}
        variant="ghost"
        className="flex justify-start hover:underline max-w-56"
      >
        + Adicionar mais produtos
      </Button>
    </div>
  );
}
