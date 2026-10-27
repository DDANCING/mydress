"use client";

import { useTransition, useState, useEffect } from "react";

import { toggleWishlist } from "@/actions/wishlist";
import { Heart } from "@/public/animated/icons/Heart";
import { Button } from "./button";

interface WishlistButtonProps {
  productId: string;
  initialInWishlist?: boolean;
}

export default function WishlistButton({ productId, initialInWishlist = false }: WishlistButtonProps) {
  const [inWishlist, setInWishlist] = useState(initialInWishlist);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setInWishlist(initialInWishlist);
  }, [initialInWishlist]);

  const handleClick = () => {
    startTransition(async () => {
      const res = await toggleWishlist(productId);
      setInWishlist(res.action === "added");
    });
  };

  return (
    <Button
      type="button"
      variant={"outline"}
      size={"icon"}
      onClick={handleClick}
      disabled={pending}
      aria-label={inWishlist ? "Remover da wishlist" : "Adicionar à wishlist"}
      className={`rounded-full transition ${inWishlist ? "text-rose-500" : "text-gray-400"} hover:text-rose-500`}
    >
      {inWishlist ? <Heart fill="currentColor" /> : <Heart />}
    </Button>
  );
}