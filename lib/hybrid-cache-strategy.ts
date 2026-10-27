/**
 * Hybrid Cache Strategy - Combines current data with historical data
 * 
 * This strategy combines:
 * - Current data (hourly cache): Main card values
 * - Historical data (monthly cache): Comparison data for percentages
 * This approach ensures fresh main values while keeping historical data cached for performance.
 */

import { unstable_cache } from 'next/cache';
import { CACHE_CONFIG } from '@/lib/cache-utils';
import { getCurrentDashboardData, CurrentDashboardData } from '@/lib/current-data-provider';
import { getHistoricalComparisonData, HistoricalComparisonData, getHistoricalChartData, HistoricalChartData } from '@/lib/historical-data-provider';

export interface HybridDashboardData {
  current: CurrentDashboardData;
  historical: HistoricalComparisonData;
  charts: HistoricalChartData;
}

/**
 * Get dashboard data using hybrid caching strategy
 * - Main values are fetched fresh (hourly cache)
 * - Historical comparison data is cached monthly
 * - Chart data is cached monthly
 */
export async function getHybridDashboardData(): Promise<HybridDashboardData> {
  console.log('🔄 Fetching dashboard data with hybrid caching strategy');
  
  const [current, historical, charts] = await Promise.all([
    getCurrentDashboardData(),
    getHistoricalComparisonData(),
    getHistoricalChartData()
  ]);

  return {
    current,
    historical,
    charts
  };
}

/**
 * Cache wrapper for data that doesn't require user authentication
 * Use this for historical/aggregate data that is the same for all users
 */
export function createHistoricalCache<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyParts: string[],
  tags?: string[]
) {
  return unstable_cache(
    fn,
    keyParts,
    {
      revalidate: CACHE_CONFIG.HISTORICAL.revalidate,
      tags: [...CACHE_CONFIG.HISTORICAL.tags, ...(tags || [])]
    }
  );
}

/**
 * Cache wrapper for current data (hourly updates)
 * Use this for main card values that need to be fresh
 */
export function createCurrentCache<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyParts: string[],
  tags?: string[]
) {
  return unstable_cache(
    fn,
    keyParts,
    {
      revalidate: CACHE_CONFIG.CURRENT.revalidate,
      tags: [...CACHE_CONFIG.CURRENT.tags, ...(tags || [])]
    }
  );
}

/**
 * Cache wrapper for data that changes daily but doesn't require user auth
 * Use this for daily aggregates, general stats, etc.
 */
export function createDailyCache<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyParts: string[],
  tags?: string[]
) {
  return unstable_cache(
    fn,
    keyParts,
    {
      revalidate: CACHE_CONFIG.DAILY.revalidate,
      tags: [...CACHE_CONFIG.DAILY.tags, ...(tags || [])]
    }
  );
}

/**
 * For user-specific data that requires authentication, use NO CACHE
 * These functions will be called directly without caching
 */
export function createRealTimeFunction<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return fn; // Return function as-is (no caching)
}

/**
 * Hybrid data provider component for React Server Components
 * Use this to provide mixed current and historical data to dashboard components
 */
export async function HybridDataProvider({ 
  children 
}: { 
  children: (data: HybridDashboardData) => React.ReactNode 
}) {
  const data = await getHybridDashboardData();
  return children(data);
}

/**
 * Utility to determine if data should be cached based on characteristics
 */
export function shouldCacheData(dataType: {
  requiresAuth: boolean;
  isHistorical: boolean;
  isUserSpecific: boolean;
  changeFrequency: 'realtime' | 'hourly' | 'daily' | 'monthly';
}): 'none' | 'current' | 'daily' | 'historical' {
  // Never cache if requires authentication or is user-specific
  if (dataType.requiresAuth || dataType.isUserSpecific) {
    return 'none';
  }

  // Cache strategy based on change frequency
  if (dataType.changeFrequency === 'monthly' || dataType.isHistorical) {
    return 'historical';
  }

  if (dataType.changeFrequency === 'hourly') {
    return 'current';
  }

  if (dataType.changeFrequency === 'daily') {
    return 'daily';
  }

  return 'none'; // realtime data
}
