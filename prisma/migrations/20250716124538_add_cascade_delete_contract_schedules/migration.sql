  Warnings:

  - You are about to drop the column `color` on the `Schedule` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Schedule" DROP CONSTRAINT "Schedule_contractId_fkey";

-- AlterTable
ALTER TABLE "Schedule" DROP COLUMN "color";

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
