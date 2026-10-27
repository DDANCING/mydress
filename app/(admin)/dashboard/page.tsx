
import { QuickStatsFromData } from "@/components/dashboard/quick-stats-from-data";
import { SectionCards } from "./_components/section-cards";
import { UpcomingOrders } from "@/components/dashboard/upcoming-orders";
import { UpcomingSchedules } from "@/components/dashboard/upcoming-schedules";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ChartAreaInteractive } from "./_components/ChartAreaInteractive";
import { Separator } from "@/components/ui/separator";
import { HybridDataProvider } from "@/lib/hybrid-cache-strategy";
import { RealTimeDataProvider } from "@/lib/realtime-data-provider";
import { RoleGate } from "@/components/auth/role-gate";
import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";


async function DashboardStorePage() {
  const user = await auth();

  if (user?.user?.role === "SELLER") {
    redirect('/dashboard/contracts');
  }
  
  return (
    <RoleGate allowedRoles={[UserRole.ADMIN, UserRole.OWNER]}>
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        
        {/* Header */}
        <header className="mb-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                Visão geral dos dados financeiros e de performance
              </p>
            </div>
            <div className="text-sm text-muted-foreground text-right">
              Última atualização: {new Date().toLocaleString('pt-BR')}
            </div>
          </div>
        </header>

        {/* Real-time Data Section - Always fresh (no cache) */}
        <RealTimeDataProvider>
          {({ stats, orders, schedules, activities }) => (
            <>
              {/* Quick Stats Section */}
              <div className="space-y-4">
                <QuickStatsFromData stats={stats} />
              </div>
              <Separator/>

              {/* Two Column Layout for Orders, Schedules, and Activity */}
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-1">
                  <UpcomingOrders orders={orders.orders} contracts={orders.contracts || []} />
                </div>
                <div className="lg:col-span-1">
                  <UpcomingSchedules schedules={schedules} />
                </div>
                
                <div className="lg:col-span-1">
                  <ActivityFeed activities={activities} />
                </div>
              </div>
            </>
          )}
        </RealTimeDataProvider>

        <Separator/>

        {/* Hybrid Data Section - Current values (hourly) + Historical data (monthly) */}
        <HybridDataProvider>
          {({ current }) => (
            <>
              {/* Finance Cards Section - Fresh data every hour */}
              <div className="space-y-4">
                <SectionCards cards={current.financeCards} />
              </div>
              <Separator/>

              {/* Main Dashboard Cards Section - Fresh data every hour */}
              <div className="space-y-4">
                <SectionCards cards={current.cards} />
              </div>
            </>
          )}
        </HybridDataProvider>

        {/* Chart Section */}
        <div className="space-y-4">
          <Separator/>
          
          <div className="w-full">
            <ChartAreaInteractive />
          </div>
        </div>

      </div>
    </div>
    </RoleGate>
  );
}

export default DashboardStorePage;