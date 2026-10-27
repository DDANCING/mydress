import Image from "next/image";
import Link from "next/link";

import { StoreProduct } from "@/app/types";
import { cn } from "@/lib/utils";
import { getDisplayPrice } from "../product-price";

interface ProductTileProps {
  product: StoreProduct;
  className?: string;
  priority?: boolean;
}

export const ProductTile = ({ product, className, priority }: ProductTileProps) => {
  const image = product.images?.find((img) => !!img?.url)?.url;
  const price = getDisplayPrice(product);

  return (
    <Link href={`/product/${product.id}`} className={cn("group block", className)}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 70vw"
            className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Foto em breve
          </div>
        )}
        {price.isRental && (
          <span className="absolute left-3 top-3 rounded-full bg-card/90 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
            Aluguel
          </span>
        )}
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-medium text-foreground group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {product.color?.value && (
              <span
                aria-hidden
                className="size-3 rounded-full ring-1 ring-foreground/15"
                style={{ backgroundColor: product.color.value }}
              />
            )}
            <span className="truncate">
              {[product.color?.name, product.size?.name && `Tam. ${product.size.name}`]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </p>
        </div>
        <p className="shrink-0 text-[15px] font-semibold text-foreground tabular-nums">{price.formatted}</p>
      </div>
    </Link>
  );
};
