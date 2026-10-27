-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ContractType" ADD VALUE 'ClothingSALE';
ALTER TYPE "ContractType" ADD VALUE 'clothingRENTAL';

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "discount" DECIMAL(65,30) DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "siteVisible" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "sku" SET DATA TYPE TEXT;
