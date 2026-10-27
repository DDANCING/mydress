-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
