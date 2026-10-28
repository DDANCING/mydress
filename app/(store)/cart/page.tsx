import { redirect } from "next/navigation";
import { auth } from "@/auth";
import CartClient from "./_components/cart-client-form";

interface CartPageProps {
  searchParams: Promise<{
    success?: string;
    canceled?: string;
    orderId?: string;
  }>;
}

const CartPage = async ({ searchParams }: CartPageProps) => {
  const user = await auth();
  const params = await searchParams;

  // Antes a página ficava em branco para quem não estava logado
  if (!user?.user) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent("/cart")}`);
  }

  return (
    <div className="mt-20">
      <CartClient
        user={{ name: user.user.name ?? "", email: user.user.email ?? "" }}
        searchParams={params}
      />
    </div>
  );
};

export default CartPage;
