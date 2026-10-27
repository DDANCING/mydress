/**
 * Current Data Provider - Hourly caching for current dashboard values
 * 
 * This component fetches and caches current data values (main card values)
 * that should be updated every hour for freshness. Historical data for
 * percentage calculations is still fetched from the historical provider.
 */

import { unstable_cache } from 'next/cache';
import { 
  getCurrentDashboardCards,
  getCurrentFinanceDashboardCards 
} from './current-dashboard-actions';
import { CACHE_CONFIG, getCurrentDataCacheKey } from '@/lib/cache-utils';

// Type definitions for current data
export interface CurrentDashboardData {
  cards: Awaited<ReturnType<typeof getCurrentDashboardCards>>;
  financeCards: Awaited<ReturnType<typeof getCurrentFinanceDashboardCards>>;
}

/**
 * Cached function to fetch current dashboard cards with hourly revalidation
 * These are the main values displayed on the cards (total revenue, orders count, etc.)
 */
const getCachedCurrentDashboardData = unstable_cache(
  async (): Promise<CurrentDashboardData> => {
    console.log('🔄 Fetching current dashboard data (hourly cache)');
    
    const [cards, financeCards] = await Promise.all([
      getCurrentDashboardCards(),
      getCurrentFinanceDashboardCards()
    ]);

    return {
      cards,
      financeCards
    };
  },
  [getCurrentDataCacheKey('dashboard-current')],
  {
    revalidate: CACHE_CONFIG.CURRENT.revalidate,
    tags: [...CACHE_CONFIG.CURRENT.tags]
  }
);

/**
 * Get current dashboard data with hourly caching
 * This includes main card values that need to be fresh
 */
export async function getCurrentDashboardData(): Promise<CurrentDashboardData> {
  return getCachedCurrentDashboardData();
}

/**
 * Current data provider component for React Server Components
 * Use this to provide current data to dashboard components
 */
export async function CurrentDataProvider({ 
  children 
}: { 
  children: (data: CurrentDashboardData) => React.ReactNode 
}) {
  const data = await getCurrentDashboardData();
  return children(data);
}
