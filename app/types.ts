import { Color, Product, Size } from "@prisma/client";

export type SafeProduct = Omit<Product, "price" | "originalPrice"> & {
  images?: { id: string; url: string }[];
  price: number;
  originalPrice?: number | null;
  color: Color;
  size: Size;
};

export interface CartItem extends StoreProduct {
  contractType: "SALE" | "RENTAL";
  cartPrice: number; // Preço específico para o carrinho (pode ser diferente do preço original)
  eventDate?: Date; // Data do evento (para aluguel) ou entrega (para venda)
  cep?: string; // CEP de entrega
  shippingPrice?: number; // Preço do frete
  totalPrice: number; // Preço total incluindo frete
}

export type SafeOrder = {
  id: string;
  buyerId: string;
  createdAt: Date;
  updatedAt: Date;
  isPaid: boolean;
  status: string | null;
  paymentMethod: string | null;
  installments: number | null;
  totalAmount: number;
  shippingCost?: number;
  trackingCode?: string | null;
  trackingUrl?: string | null;
  eventDate?: Date | null;
  product: { id: string }[];
  orderItems: {
    product: SafeProduct;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
};

export interface StoreProduct {
  id: string;
  name: string;
  price: number;
  isFeatured: boolean;
  isArchived: boolean;
  siteVisible: boolean;
  originalPrice?: number | null; 
  rating?: number;
  description?: string;
  reviewCount?: number;
  onAdd?: () => void;
  onFavorite?: () => void;
  enableAnimations?: boolean;
  sku?: string;
  contractType?: "SALE" | "RENTAL";
  rentalValue: number;
  isOnlyRental: boolean;
  category: {
    id: string;
    name: string;
  }
  size: {
    id: string;
    name: string;
    value: string;
  };
  color: {
    id: string;
    name: string;
    value: string;
  };
  images: {
    id: string;
    url: string;
  }[];
}

export interface Billboard {
  id?: string;
  title: string;
  subtitle?: string;
  category?: {
    id: string;
    name: string;
    products: StoreProduct[];
  };
  description?: string;
  imageUrl: string;
  callToAction?: {
    text?: string;
    href?: string;
  };
  storeId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}


export interface Category { 
  id: string;
  name: string;
  billboard: Billboard;
}
