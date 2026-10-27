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

  
  if (!user) {
    return null;
  }

  return (
    <CartClient 
      user={{ name: user.user?.name ?? "", email: user.user?.email ?? "" }}
      searchParams={params}
    />
  );
};

export default CartPage;