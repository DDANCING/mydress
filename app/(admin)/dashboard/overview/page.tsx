
import { SalesBarChart } from "@/app/(admin)/dashboard/overview/_components/chart-01";
import { NewBuyersChart } from "@/app/(admin)/dashboard/overview/_components/chart-02";
import { ProductRevenueChart } from "@/app/(admin)/dashboard/overview/_components/chart-03";
import { MonthlyContractsChart } from "@/app/(admin)/dashboard/overview/_components/chart-04";
import { PaymentMethodsChart } from "@/app/(admin)/dashboard/overview/_components/chart-05";
import { CategoryRevenueChart } from "@/app/(admin)/dashboard/overview/_components/chart-07";
import { SellerPerformanceChart } from "@/app/(admin)/dashboard/overview/_components/chart-08";
import { MonthlyPaymentsChart } from "@/app/(admin)/dashboard/overview/_components/chart-06";
import { cn, formatter } from "@/lib/utils";
import { ResponsiveResizableLayout, ResponsiveTripleLayout, ResponsiveVerticalLayout } from "@/components/responsive-resizable-layout";
import { getHistoricalChartDataWithTimestamp } from "@/lib/historical-data-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, FileText, Package, Users } from "lucide-react";
import { RoleGate } from "@/components/auth/role-gate";
import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UpdateIcon } from "@radix-ui/react-icons";
import { revalidatePath } from "next/cache";
import { RefreshCacheButton } from "@/app/(admin)/dashboard/overview/_components/RefreshCacheButton";

// Keep some dynamism for chart data that might be user-specific while still leveraging cache
export const revalidate = 86400; // Revalidate every 24 hours (86400 seconds)

// Server Action: invalidate historical cache and this page
async function refreshHistoricalCache() {
  "use server";
  // Revalidate this route so the timestamp updates immediately
  revalidatePath("/dashboard/overview");
}


export default async function OverviewPage() {
   const user = await auth();
  
    if (user?.user.role === "SELLER") {
      redirect('/dashboard/contracts');
    }
  // Fetch cached data with timestamp - this will be cached for 24 hours
  const { chartData, lastUpdate } = await getHistoricalChartDataWithTimestamp();

  const {
    salesData,
    buyersData,
    topProducts,
    dailySalesComparison,
    productRevenue,
    monthlyContracts,
    paymentMethods,
    monthlyPayments,
    categoryRevenue,
    sellerPerformance,
    adsSalesComparison30Days
  } = chartData;

  const totalSalesThisMonth = dailySalesComparison.current;
  const percentageChange = dailySalesComparison.percentage;

  const totalBuyers = buyersData.reduce((sum: number, item: any) => sum + item.actual, 0);
  const lastMonth = buyersData[buyersData.length - 1];
  const buyersTotal = lastMonth.actual;
  const buyersProjected = lastMonth.projected;

  const buyersPercentage =
    buyersProjected !== 0
      ? ((buyersTotal - buyersProjected) / buyersProjected) * 100
      : 0;

  return (
    <RoleGate allowedRoles={[UserRole.ADMIN, UserRole.OWNER]}>
    <div className="bg-background">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex flex-col">
        {/* Header - Compacto */}
        <header className="mb-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                Dashboard Overview
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                Gráficos e métricas principais do sistema
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="text-xs text-muted-foreground">
                Última atualização:
              </div>
              <div className="text-xs font-mono text-foreground bg-muted flex items-center  px-2 py-1 rounded">
                {lastUpdate}
                <form action={refreshHistoricalCache}>
                  <RefreshCacheButton className="ml-2" />
                </form>
              </div>
            </div>
          </div>
          
        
        </header>

        

        {/* Historical Charts - Cached for 24 hours */}
        <div className="min-h-screen">
          
          {/* Layout Vertical Redimensionável para Desktop */}
          <ResponsiveVerticalLayout
            row1={
              <ResponsiveResizableLayout
                leftPanel={
                  <SalesBarChart
                    title="Vendas por Mês"
                    data={salesData}
                    totalLabel={formatter.format(totalSalesThisMonth)}
                    percentageChange={percentageChange.toFixed(1)}
                  />
                }
                rightPanel={
                  <NewBuyersChart
                    data={buyersData}
                    total={totalBuyers}
                    percentageChange={buyersPercentage}
                  />
                }
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 lg:h-full">
                  <div className="order-1 h-[250px] sm:h-[300px] lg:h-full">
                    <SalesBarChart
                      title="Vendas por Mês"
                      data={salesData}
                      totalLabel={formatter.format(totalSalesThisMonth)}
                      percentageChange={percentageChange.toFixed(1)}
                    />
                  </div>
                  <div className="order-2 h-[250px] sm:h-[300px] lg:h-full">
                    <NewBuyersChart
                      data={buyersData}
                      total={totalBuyers}
                      percentageChange={buyersPercentage}
                    />
                  </div>
                </div>
              </ResponsiveResizableLayout>
            }
            row2={
              <ResponsiveTripleLayout
                panel1={<ProductRevenueChart data={productRevenue} />}
                panel2={<MonthlyContractsChart data={adsSalesComparison30Days} />}
                panel3={<SellerPerformanceChart data={sellerPerformance} />}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 lg:h-full">
                  <div className="order-3 h-[250px] sm:h-[300px] lg:h-full">
                    <ProductRevenueChart data={productRevenue} />
                  </div>
                  <div className="order-4 h-[250px] sm:h-[300px] lg:h-full">
                    <MonthlyContractsChart data={adsSalesComparison30Days} />
                  </div>
                  <div className="order-5 h-[250px] sm:h-[300px] lg:max-h-[300px] md:col-span-2 lg:col-span-1">
                    <SellerPerformanceChart data={sellerPerformance} />
                  </div>
                </div>
              </ResponsiveTripleLayout>
            }
            row3={
              <ResponsiveTripleLayout
                panel1={<MonthlyPaymentsChart data={monthlyPayments} />}
                panel2={<CategoryRevenueChart data={categoryRevenue} />}
                panel3={<PaymentMethodsChart data={paymentMethods} />}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 lg:h-full">
                  <div className="order-6 h-[250px] sm:h-[300px] lg:h-full">
                    <MonthlyPaymentsChart data={monthlyPayments} />
                  </div>
                  <div className="order-7 h-[250px] sm:h-[300px] lg:h-full">
                    <CategoryRevenueChart data={categoryRevenue} />
                  </div>
                  <div className="order-8 h-[250px] sm:h-[300px] lg:h-full md:col-span-2 lg:col-span-1">
                    <PaymentMethodsChart data={paymentMethods} />
                  </div>
                </div>
              </ResponsiveTripleLayout>
            }
          >
            {/* Layout Mobile/Tablet - Grid Tradicional */}
            <div className="space-y-4 sm:space-y-6">
              
              {/* Row 1: Gráficos Principais */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="h-[250px] sm:h-[300px] mb-28">
                  <SalesBarChart
                    title="Vendas por Mês"
                    data={salesData}
                    totalLabel={formatter.format(totalSalesThisMonth)}
                    percentageChange={percentageChange.toFixed(1)}
                  />
                </div>
                <div className="h-[250px] sm:h-[300px] mb-28">
                  <NewBuyersChart
                    data={buyersData}
                    total={totalBuyers}
                    percentageChange={buyersPercentage}
                  />
                </div>
              </div>

              {/* Row 2: Gráficos Secundários */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="h-[250px] sm:h-[300px] mb-28">
                  <ProductRevenueChart data={productRevenue} />
                </div>
                <div className="h-[250px] sm:h-[300px] mb-28">
                  <MonthlyContractsChart data={adsSalesComparison30Days} />
                </div>
                <div className="h-[250px] sm:h-[300px] md:col-span-2 lg:col-span-1 mb-40">
                  <PaymentMethodsChart data={paymentMethods} />
                </div>
              </div>

              {/* Row 3: Gráficos Finais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="h-[250px] sm:h-[300px] mb-18">
                  <MonthlyPaymentsChart data={monthlyPayments} />
                </div>
                <div className="h-[250px] sm:h-[300px] mb-24">
                  <CategoryRevenueChart data={categoryRevenue} />
                </div>
                <div className="h-[250px] sm:h-[300px] md:col-span-2 lg:col-span-1 mb-56">
                  <SellerPerformanceChart data={sellerPerformance} />
                </div>
              </div>
              
              {/* Espaçamento inferior */}
              <div className="h-8"></div>
            </div>
          </ResponsiveVerticalLayout>
          
        </div>
      </div>
    </div>
    </RoleGate>
  );
}