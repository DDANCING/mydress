import { auth } from "@/auth";
import AddressForm from "../_components/AddressForm";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AddressPage() {
  const user = await auth();

  const userEmail = user?.user?.email;
  if (!userEmail) {
    return redirect("/login");
  }

  const buyerAdress = await db.buyer.findUnique({
    where: { email: userEmail },
    select: {
      fullName: true,
      address: true,
      number: true,
      complement: true,
      neighborhood: true,
      city: true,
      state: true,
      cep: true,
    },
  });

  if (!buyerAdress) {
    return redirect("/profile");
  }
  
  return (
    <div className="space-y-6">
      <AddressForm
        initialAddress={{
          fullName: buyerAdress.fullName ?? "",
          address: buyerAdress.address ?? "",
          number: buyerAdress.number ?? "",
          complement: buyerAdress.complement ?? "",
          neighborhood: buyerAdress.neighborhood ?? "",
          city: buyerAdress.city ?? "",
          state: buyerAdress.state ?? "",
          cep: buyerAdress.cep ?? "",
        }}
        userEmail={user.user.email!}
      />
    </div>
  );
}