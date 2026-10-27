/*
  Warnings:

  - You are about to drop the column `birthDate` on the `Buyer` table. All the data in the column will be lost.
  - You are about to drop the column `documentType` on the `Buyer` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Buyer` table. All the data in the column will be lost.
  - You are about to drop the column `contractNumber` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `downPayment` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `remainingAmount` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `terms` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[document]` on the table `Seller` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `Seller` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Contract" DROP CONSTRAINT "Contract_productId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_contractId_fkey";

-- DropIndex
DROP INDEX "Contract_contractNumber_idx";

-- DropIndex
DROP INDEX "Contract_contractNumber_key";

-- DropIndex
DROP INDEX "Contract_productId_idx";

-- AlterTable
ALTER TABLE "Buyer" DROP COLUMN "birthDate",
DROP COLUMN "documentType",
DROP COLUMN "notes";

-- AlterTable
ALTER TABLE "Contract" DROP COLUMN "contractNumber",
DROP COLUMN "downPayment",
DROP COLUMN "notes",
DROP COLUMN "paymentStatus",
DROP COLUMN "productId",
DROP COLUMN "remainingAmount",
DROP COLUMN "terms";

-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "color" TEXT DEFAULT 'sky';

-- AlterTable
ALTER TABLE "Seller" ADD COLUMN     "document" VARCHAR(18),
ADD COLUMN     "name" TEXT NOT NULL;

-- DropTable
DROP TABLE "Payment";

-- DropEnum
DROP TYPE "DocumentType";

-- DropEnum
DROP TYPE "PaymentStatus";

-- CreateTable
CREATE TABLE "ContractItem" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "ContractItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContractItem_contractId_idx" ON "ContractItem"("contractId");

-- CreateIndex
CREATE INDEX "ContractItem_productId_idx" ON "ContractItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ContractItem_contractId_productId_key" ON "ContractItem"("contractId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Seller_document_key" ON "Seller"("document");

-- AddForeignKey
ALTER TABLE "ContractItem" ADD CONSTRAINT "ContractItem_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractItem" ADD CONSTRAINT "ContractItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
