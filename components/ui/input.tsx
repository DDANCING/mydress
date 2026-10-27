import * as React from "react"

import { cn, formatter } from "@/lib/utils"

interface InputProps extends Omit<React.ComponentProps<"input">, "type"> {
  type?: React.HTMLInputTypeAttribute | "amount"
  className?: string
}

function Input({ className, type, ...props }: InputProps) {
  // Handle NaN values for number inputs
  const value = props.value;
  const processedProps = {
    ...props,
    value: (type === "number" && value !== null && value !== undefined && isNaN(Number(value))) ? "" : value,
  };

  // Se for type="amount", renderizar com formatação de moeda
  if (type === "amount") {
    const numericValue = typeof value === 'string' ? parseFloat(value) : (typeof value === 'number' ? value : 0);
    const formattedValue = !isNaN(numericValue) && numericValue > 0 ? formatter.format(numericValue) : "R$ 0,00";
    
    return (
      <div className="relative flex items-center">
        <input
          type="number"
          step="0.01"
          min="0"
          data-slot="input"
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            "pr-32", // Espaço para o valor formatado
            "[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none", // Remove spinner no Chrome/Safari
            "[&[type=number]]:[-moz-appearance:textfield]", // Remove spinner no Firefox
            className
          )}
          {...processedProps}
        />
        
        {/* Valor formatado na lateral */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">
          <span className="text-xs text-muted-foreground font-medium bg-background px-2 py-1 rounded border border-border/50">
            {formattedValue}
          </span>
        </div>
      </div>
    );
  }

  // Input normal para outros tipos
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        // Remove spinner para todos os inputs tipo number
        type === "number" && "[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&[type=number]]:[-moz-appearance:textfield]",
        className
      )}
      {...processedProps}
    />
  )
}

export { Input }
