"use client";
import { useState } from "react";
import { OrderCard } from "./order-card";
import { SafeOrder } from "@/app/types";

interface OrdersProps {
  orders: SafeOrder[];
  userName: string;
  userId: string;
}

const TAB_LIST = [
  { key: "current", label: "Atuais" },
  { key: "unpaid", label: "Não Pagos" },
  { key: "all", label: "Todos os Pedidos" },
];

export function Orders({ orders, userName, userId }: OrdersProps) {
  const [activeTab, setActiveTab] = useState("current");

  
  let filteredOrders: SafeOrder[] = [];
  if (activeTab === "current") {
    
    filteredOrders = orders.filter((order) => order.isPaid);
  } else if (activeTab === "unpaid") {
    
    filteredOrders = orders.filter((order) => !order.isPaid);
  } else {
    
    filteredOrders = orders;
  }

  return (
    <section className="">
      <div className="border-b mb-6 ">
        <div className="flex gap-1">
          {TAB_LIST.map((tab) => (
            <button
              key={tab.key}
              className={`px-5 py-2 text-base font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-muted text-background bg-foreground"
                  : "border-transparent text-muted-foreground hover:bg-muted-foreground hover:text-background"
              }`}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-6">
        {filteredOrders.length === 0 ? (
          <div className="text-muted-foreground text-center py-12">Nenhum pedido encontrado.</div>
        ) : (
          filteredOrders.map((order: SafeOrder) => (
            <OrderCard key={order.id} order={order} userName={userName} userId={userId} />
          ))
        )}
      </div>
    </section>
  );
}