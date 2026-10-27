"use client"

import { MouseEventHandler, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ShoppingCart, Star, Heart } from "lucide-react"
import { isMobile as detectMobile } from "react-device-detect"

import { StoreProduct } from "@/app/types"
import { formatter, cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  containerVariants,
  contentVariants,
  favoriteVariants,
  overlayVariants,
} from "@/lib/animations"
import { Badge } from "@/components/ui/badge"
import useCart from "@/hooks/use-cart"

interface ProductCardProps {
  product: StoreProduct
  size?: number 
  initialInWishlist?: boolean | null
}

const DEFAULT_CARD_WIDTH = 320 // largura em px (w-80 do tailwind)
const DEFAULT_IMAGE_WIDTH = 320
const DEFAULT_IMAGE_HEIGHT = 240

const ProductCard: React.FC<ProductCardProps> = ({ initialInWishlist = false, product, size = 1 }) => {
  const [isAdding, setIsAdding] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const cart = useCart();

  // Lógica corrigida para preço e tipo de contrato
  const isOnlyRental = product.isOnlyRental === true;
  const hasRentalValue = product.rentalValue !== undefined && product.rentalValue !== null && product.rentalValue > 0;
  
  // Determinar o preço a ser exibido - sempre garantindo um número válido
  const displayPrice: number = isOnlyRental 
    ? (hasRentalValue ? product.rentalValue! : product.price / 2)  // Se isOnlyRental=true, priorizar rentalValue, senão price/2
    : (hasRentalValue ? product.rentalValue! : product.price);      // Se isOnlyRental=false, priorizar rentalValue, senão price

  // Determinar o tipo de contrato
  const contractType = isOnlyRental || hasRentalValue ? "RENTAL" : "SALE";

  // Adiciona no carrinho com o tipo correto
  const onAddToCart: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();
    cart.addItem({
      product,
      contractType
    });
  }

  useEffect(() => {
    setIsClient(true)
    setIsMobile(detectMobile)
  }, [])

  const imageUrl = product.images[0]?.url ?? "/placeholder.svg"
  const price = formatter.format(displayPrice)

  // Calcule dimensões baseadas no size
  const cardWidth = DEFAULT_CARD_WIDTH * size
  const imageWidth = DEFAULT_IMAGE_WIDTH * size
  const imageHeight = DEFAULT_IMAGE_HEIGHT * size

  // estilo inline para a largura do card
  const cardStyle = {
    width: `${cardWidth}px`,
    fontSize: `${size}em`,
  }

  const imageVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.1 },
  }

  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      animate="rest"
      variants={containerVariants}
      style={cardStyle}
      className={cn(
        "relative rounded-2xl border border-border/50 bg-card text-card-foreground overflow-hidden",
        "shadow-lg shadow-black/5 cursor-pointer group"
      )}
    >
      {isClient && isMobile && (
        <Link
          href={`/product/${product.id}`}
          className="absolute inset-0 z-50"
          aria-label={`Ver detalhes de ${product.name}`}
        >
          <span className="sr-only">Ver detalhes do produto</span>
        </Link>
      )}

      {/* Imagem e botão de favorito */}
      <div className="relative overflow-hidden">
        {product.originalPrice && product.isOnlyRental === false && (
          <Badge className="absolute bg-rose-500 left-4 top-4 rounded-full text-white font-bold">
            {Math.round(
              ((product.originalPrice - product.price) / product.originalPrice) *
                100
            )}
            %
          </Badge>
        )}
        {product.originalPrice && product.isOnlyRental === true && (
          <Badge className="absolute bg-rose-500 left-4 top-4 rounded-full text-white font-bold">
            {Math.round(
              ((product.originalPrice - product.rentalValue) / product.originalPrice) *
                100
            )}
            %
          </Badge>
        )}
        <motion.div variants={imageVariants}>
          <Image
            src={imageUrl}
            alt={product.name}
            width={imageWidth}
            height={imageHeight}
            className="w-full object-cover"
            style={{
              height: `${imageHeight}px`,
              minHeight: `${imageHeight}px`,
              maxHeight: `${imageHeight}px`,
            }}
          />
        </motion.div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        <motion.button
          variants={favoriteVariants}
          animate={initialInWishlist ? "favorite" : "rest"}
          className={cn(
            "absolute top-4 right-4 p-2 rounded-full backdrop-blur-sm border border-white/20",
            initialInWishlist
              ? "bg-muted-foreground text-muted-foreground"
              : "bg-muted/20 text-muted hover:bg-muted/30"
          )}
        >
          <Heart
            className={cn("w-4 h-4", initialInWishlist && " fill-red-500")}
            style={{
              width: `${16 * size}px`,
              height: `${16 * size}px`,
            }}
          />
        </motion.button>
      </div>

      {/* Conteúdo principal */}
      <div className="p-6 space-y-3">
        <h3 className="text-xl font-bold" style={{ fontSize: `${1.25 * size}rem` }}>{product.name}</h3>

        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-primary" style={{ fontSize: `${1.5 * size}rem` }}>{price}</span>
          {product.originalPrice && (
            <span className="text-lg line-through text-muted-foreground" style={{ fontSize: `${1.125 * size}rem` }}>
              {formatter.format(product.originalPrice)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-4 h-4",
                  i < Math.floor(product.rating ?? 0)
                    ? "text-yellow-400 fill-current"
                    : "text-muted-foreground"
                )}
                style={{
                  width: `${16 * size}px`,
                  height: `${16 * size}px`,
                }}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground" style={{ fontSize: `${0.875 * size}rem` }}>
            {product.rating ?? 0} ({product.reviewCount ?? 0})
          </span>
        </div>
      </div>

      {/* Overlay com descrição e ações */}
      <motion.div
        variants={overlayVariants}
        className="absolute inset-0 bg-background/95 backdrop-blur-xl flex flex-col justify-end text-start"
      >
        <div className="p-6">
          <motion.div variants={contentVariants}>
            <h4 className="font-semibold" style={{ fontSize: `${1.1 * size}rem` }}>Cor</h4>
            <div
              className="h-6 w-6 rounded-full border"
              style={{
                backgroundColor: product.color.value,
                width: `${24 * size}px`,
                height: `${24 * size}px`,
              }}
            />
            <p className="text-sm text-muted-foreground mb-4" style={{ fontSize: `${0.875 * size}rem` }}>
              {product.color.name}
            </p>

            <h4 className="font-semibold" style={{ fontSize: `${1.1 * size}rem` }}>Detalhes</h4>
            <p className="text-sm text-muted-foreground mb-4" style={{ fontSize: `${0.875 * size}rem` }}>
              {product.description 
                ? product.description.length > 150 
                  ? product.description.slice(0, 150) + "..."
                  : product.description
                : "Sem descrição disponível."
              }
            </p>
          </motion.div>

          <motion.div variants={contentVariants} className="space-y-3">
            <motion.button
              onClick={onAddToCart}
              disabled={isAdding}
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full h-12 font-medium",
                "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary",
                "shadow-lg shadow-primary/25 disabled:opacity-60"
              )}
              style={{ height: `${48 * size}px`, fontSize: `${1 * size}rem` }}
            >
              <ShoppingCart className="w-4 h-4 mr-2" style={{
                width: `${16 * size}px`,
                height: `${16 * size}px`,
              }} />
              {isAdding ? "Adicionado!" : "Adicionar ao Carrinho"}
            </motion.button>

            <Link
              href={`/product/${product.id}`}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full h-10 font-medium text-center block"
              )}
              style={{ height: `${40 * size}px`, fontSize: `${1 * size}rem` }}
            >
              Ver Detalhes
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ProductCard