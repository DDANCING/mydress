-- CreateTable
CREATE TABLE "ContractPayment" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "installmentNumber" INTEGER,
    "dueDate" TIMESTAMP(3),
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContractPayment_contractId_idx" ON "ContractPayment"("contractId");

-- CreateIndex
CREATE INDEX "ContractPayment_paymentMethodId_idx" ON "ContractPayment"("paymentMethodId");

-- CreateIndex
CREATE INDEX "ContractPayment_paymentDate_idx" ON "ContractPayment"("paymentDate");

-- AddForeignKey
ALTER TABLE "ContractPayment" ADD CONSTRAINT "ContractPayment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractPayment" ADD CONSTRAINT "ContractPayment_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
