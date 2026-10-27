"use server";

import { db } from "@/lib/db";
import { testimonialsEmail } from "@/lib/mail";
export async function sendTestimonialsForContract(contractId: string, email: string) {
  if (!contractId || !email) {
    throw new Error("Contract ID e email são obrigatórios.");
  }

  const contract = await db.contract.findUnique({
    where: { id: contractId },
    include: {
      contractItems: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!contract) {
    throw new Error("Contrato não encontrado.");
  }

  if (!contract.contractItems.length) {
    throw new Error("Nenhum produto encontrado para este contrato.");
  }

const items = contract.contractItems.filter((i) => i.product?.id);
 const results = await Promise.allSettled(
   items.map((item) => testimonialsEmail(email, item.product!.id))
 );

 const succeeded = results.filter((r) => r.status === "fulfilled").length;
 const failed = results.length - succeeded;
 if (failed > 0) {
   console.warn(
     `Envio de testimonials parcialmente concluído: success=${succeeded}, failed=${failed}, contractId=${contractId}, email=${email}`
   );
 }
 return {
   success: failed === 0,
   message: `Emails enviados: sucesso=${succeeded}, falha=${failed}`,
 };
}
