/**
 * Cached Dashboard Actions
 * 
 * This file provides cached versions of dashboard data fetching functions
 * with appropriate revalidation strategies.
 */

import { unstable_cache } from 'next/cache';
import { getDashboardCards } from '@/actions/getDashboardCards';
import { getFinanceDashboardCards } from '@/actions/dashboard_finance_cards';
import { CACHE_CONFIG } from '@/lib/cache-utils';

/**
 * Cached dashboard cards - contains historical data that should be cached until next month
 */
export const getCachedDashboardCards = unstable_cache(
  getDashboardCards,
  ['dashboard-cards'],
  {
    revalidate: CACHE_CONFIG.HISTORICAL.revalidate,
    tags: [...CACHE_CONFIG.HISTORICAL.tags, 'dashboard-cards']
  }
);

/**
 * Cached finance dashboard cards - contains financial historical data
 */
export const getCachedFinanceDashboardCards = unstable_cache(
  getFinanceDashboardCards,
  ['finance-dashboard-cards'],
  {
    revalidate: CACHE_CONFIG.HISTORICAL.revalidate,
    tags: [...CACHE_CONFIG.HISTORICAL.tags, 'finance-cards']
  }
);

/**
 * Utility function to get all cached dashboard data in one call
 */
export async function getAllCachedDashboardData() {
  return Promise.all([
    getCachedDashboardCards(),
    getCachedFinanceDashboardCards()
  ]);
}
