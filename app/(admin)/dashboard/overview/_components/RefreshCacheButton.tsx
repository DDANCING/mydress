"use client";

import { useFormStatus } from "react-dom";
import { UpdateIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

export function RefreshCacheButton({ className }: { className?: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      title={pending ? "Atualizando..." : "Atualizar cache agora"}
      className={cn(
        "inline-flex items-center justify-center rounded transition-colors disabled:opacity-60",
        className
      )}
      disabled={pending}
      aria-disabled={pending}
    >
      <UpdateIcon className={cn(pending && "animate-spin")} />
    </button>
  );
}
