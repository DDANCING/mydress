/**
 * Real-time Data Provider - Handles frequently changing data
 * 
 * This component fetches real-time data that changes frequently and depends on user session.
 * These functions are NOT cached because they require authentication and user-specific data.
 */

import { getUpcomingOrders } from '@/actions/getUpcomingOrders';
import { getUpcomingSchedules } from '@/actions/getUpcomingSchedules';
import { getQuickStats } from '@/actions/getQuickStats';
import { getRecentActivities } from '@/actions/getRecentActivities';

// Type definitions for real-time data
export interface RealTimeData {
  orders: Awaited<ReturnType<typeof getUpcomingOrders>>;
  schedules: Awaited<ReturnType<typeof getUpcomingSchedules>>;
  stats: Awaited<ReturnType<typeof getQuickStats>>;
  activities: Awaited<ReturnType<typeof getRecentActivities>>;
}

/**
 * Get real-time data - NO CACHING because it depends on user session
 * These functions need to access headers/cookies for authentication
 */
export async function getRealTimeData(): Promise<RealTimeData> {
  // Fetch all real-time data in parallel - NO CACHE
  const [orders, schedules, stats, activities] = await Promise.all([
    getUpcomingOrders(),
    getUpcomingSchedules(),
    getQuickStats(),
    getRecentActivities()
  ]);

  return {
    orders,
    schedules,
    stats,
    activities
  };
}

/**
 * React Server Component that provides real-time data to its children
 * This fetches fresh data on every request to ensure real-time updates
 */
export async function RealTimeDataProvider({ 
  children 
}: { 
  children: (data: RealTimeData) => React.ReactNode;
}) {
  const data = await getRealTimeData();
  return children(data);
}
