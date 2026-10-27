-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('SALE', 'RENTAL');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DELIVERED', 'RETURNED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('PRODUCT_BLOCK', 'CLIENT_APPOINTMENT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'REFUNDED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CPF', 'CNPJ', 'RG', 'PASSPORT');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'OWNER';

-- CreateTable
CREATE TABLE "Seller" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Seller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Buyer" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "document" VARCHAR(18),
    "documentType" "DocumentType",
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "cep" VARCHAR(9),
    "birthDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Buyer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "contractNumber" TEXT,
    "type" "ContractType" NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "downPayment" DECIMAL(65,30),
    "remainingAmount" DECIMAL(65,30),
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "eventDate" TIMESTAMP(3),
    "returnDate" TIMESTAMP(3),
    "notes" TEXT,
    "terms" TEXT,
    "productId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "type" "ScheduleType" NOT NULL,
    "productId" TEXT,
    "buyerId" TEXT,
    "sellerId" TEXT,
    "contractId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Billboard" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "subtitle" TEXT,
    "category" TEXT,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "callToActionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Billboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallToAction" (
    "id" TEXT NOT NULL,
    "text" TEXT,
    "href" TEXT,

    CONSTRAINT "CallToAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "billboardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Size" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Size_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Color" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Color_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sku" INTEGER,
    "storeId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "originalPrice" DECIMAL(65,30),
    "rating" INTEGER,
    "description" TEXT,
    "reviewCount" INTEGER,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "sizeId" TEXT NOT NULL,
    "colorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "couponId" TEXT,
    "shippingMethod" TEXT,
    "shippingCost" DECIMAL(65,30) DEFAULT 0,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paymentMethod" TEXT,
    "installments" INTEGER,
    "status" TEXT,
    "totalAmount" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountType" TEXT NOT NULL,
    "discountValue" DECIMAL(65,30) NOT NULL,
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wishlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visitor" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "mobile" INTEGER NOT NULL DEFAULT 0,
    "web" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "contractId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Seller_userId_key" ON "Seller"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Buyer_document_key" ON "Buyer"("document");

-- CreateIndex
CREATE UNIQUE INDEX "Buyer_email_key" ON "Buyer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_contractNumber_key" ON "Contract"("contractNumber");

-- CreateIndex
CREATE INDEX "Contract_type_idx" ON "Contract"("type");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE INDEX "Contract_productId_idx" ON "Contract"("productId");

-- CreateIndex
CREATE INDEX "Contract_buyerId_idx" ON "Contract"("buyerId");

-- CreateIndex
CREATE INDEX "Contract_sellerId_idx" ON "Contract"("sellerId");

-- CreateIndex
CREATE INDEX "Contract_paymentMethodId_idx" ON "Contract"("paymentMethodId");

-- CreateIndex
CREATE INDEX "Contract_contractNumber_idx" ON "Contract"("contractNumber");

-- CreateIndex
CREATE INDEX "Schedule_startDate_endDate_idx" ON "Schedule"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "Schedule_type_idx" ON "Schedule"("type");

-- CreateIndex
CREATE INDEX "Schedule_productId_idx" ON "Schedule"("productId");

-- CreateIndex
CREATE INDEX "Schedule_buyerId_idx" ON "Schedule"("buyerId");

-- CreateIndex
CREATE INDEX "Schedule_sellerId_idx" ON "Schedule"("sellerId");

-- CreateIndex
CREATE INDEX "Schedule_contractId_idx" ON "Schedule"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "Billboard_callToActionId_key" ON "Billboard"("callToActionId");

-- CreateIndex
CREATE INDEX "Billboard_storeId_idx" ON "Billboard"("storeId");

-- CreateIndex
CREATE INDEX "Category_storeId_idx" ON "Category"("storeId");

-- CreateIndex
CREATE INDEX "Category_billboardId_idx" ON "Category"("billboardId");

-- CreateIndex
CREATE INDEX "Size_storeId_idx" ON "Size"("storeId");

-- CreateIndex
CREATE INDEX "Color_storeId_idx" ON "Color"("storeId");

-- CreateIndex
CREATE INDEX "Product_storeId_idx" ON "Product"("storeId");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_sizeId_idx" ON "Product"("sizeId");

-- CreateIndex
CREATE INDEX "Product_colorId_idx" ON "Product"("colorId");

-- CreateIndex
CREATE INDEX "Image_productId_idx" ON "Image"("productId");

-- CreateIndex
CREATE INDEX "Order_buyerId_idx" ON "Order"("buyerId");

-- CreateIndex
CREATE INDEX "Order_couponId_idx" ON "Order"("couponId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_orderId_productId_key" ON "OrderItem"("orderId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Wishlist_userId_idx" ON "Wishlist"("userId");

-- CreateIndex
CREATE INDEX "Wishlist_productId_idx" ON "Wishlist"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_userId_productId_key" ON "Wishlist"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Visitor_date_key" ON "Visitor"("date");

-- CreateIndex
CREATE INDEX "Payment_contractId_idx" ON "Payment"("contractId");

-- CreateIndex
CREATE INDEX "Payment_paymentDate_idx" ON "Payment"("paymentDate");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- AddForeignKey
ALTER TABLE "Seller" ADD CONSTRAINT "Seller_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Billboard" ADD CONSTRAINT "Billboard_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Billboard" ADD CONSTRAINT "Billboard_callToActionId_fkey" FOREIGN KEY ("callToActionId") REFERENCES "CallToAction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_billboardId_fkey" FOREIGN KEY ("billboardId") REFERENCES "Billboard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Size" ADD CONSTRAINT "Size_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Color" ADD CONSTRAINT "Color_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "Size"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
