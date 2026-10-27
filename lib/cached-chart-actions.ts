/**
 * Optimized Chart Actions with Caching Strategy
 * 
 * This file separates historical chart data (cached until next month) 
 * from real-time data that needs frequent updates.
 */

import { unstable_cache } from 'next/cache';
import { 
  getMonthlySales,
  getMonthlyBuyers,
  getTopSellingProducts,
  getCurrentVsLastMonthSalesUntilToday,
  getRevenueByProduct,
  getMonthlyContractsEvolution,
  getPaymentMethodsMix,
  getMonthlyPayments,
  getRevenueByCategoryWithMetrics,
  getSellerPerformance,
  getAdsSalesComparison30Days
} from '@/actions/chart-action';
import { CACHE_CONFIG } from '@/lib/cache-utils';

/**
 * Cached historical chart functions
 * These functions cache historical data that doesn't change
 */

export const getCachedMonthlySales = unstable_cache(
  getMonthlySales,
  ['monthly-sales'],
  {
    revalidate: CACHE_CONFIG.HISTORICAL.revalidate,
    tags: [...CACHE_CONFIG.HISTORICAL.tags, 'monthly-sales']
  }
);

export const getCachedMonthlyBuyers = unstable_cache(
  getMonthlyBuyers,
  ['monthly-buyers'],
  {
    revalidate: CACHE_CONFIG.HISTORICAL.revalidate,
    tags: [...CACHE_CONFIG.HISTORICAL.tags, 'monthly-buyers']
  }
);

export const getCachedTopSellingProducts = unstable_cache(
  getTopSellingProducts,
  ['top-selling-products'],
  {
    revalidate: CACHE_CONFIG.HISTORICAL.revalidate,
    tags: [...CACHE_CONFIG.HISTORICAL.tags, 'top-products']
  }
);

export const getCachedCurrentVsLastMonthSales = unstable_cache(
  getCurrentVsLastMonthSalesUntilToday,
  ['current-vs-last-month-sales'],
  {
    revalidate: CACHE_CONFIG.HISTORICAL.revalidate,
    tags: [...CACHE_CONFIG.HISTORICAL.tags, 'sales-comparison']
  }
);

export const getCachedRevenueByProduct = unstable_cache(
  getRevenueByProduct,
  ['revenue-by-product'],
  {
    revalidate: CACHE_CONFIG.HISTORICAL.revalidate,
    tags: [...CACHE_CONFIG.HISTORICAL.tags, 'product-revenue']
  }
);

export const getCachedMonthlyContractsEvolution = unstable_cache(
  getMonthlyContractsEvolution,
  ['monthly-contracts-evolution'],
  {
    revalidate: CACHE_CONFIG.HISTORICAL.revalidate,
    tags: [...CACHE_CONFIG.HISTORICAL.tags, 'contracts-evolution']
  }
);

export const getCachedPaymentMethodsMix = unstable_cache(
  getPaymentMethodsMix,
  ['payment-methods-mix'],
  {
    revalidate: CACHE_CONFIG.HISTORICAL.revalidate,
    tags: [...CACHE_CONFIG.HISTORICAL.tags, 'payment-methods']
  }
);

export const getCachedMonthlyPayments = unstable_cache(
  getMonthlyPayments,
  ['monthly-payments'],
  {
    revalidate: CACHE_CONFIG.HISTORICAL.revalidate,
    tags: [...CACHE_CONFIG.HISTORICAL.tags, 'monthly-payments']
  }
);

export const getCachedRevenueByCategoryWithMetrics = unstable_cache(
  getRevenueByCategoryWithMetrics,
  ['revenue-by-category-metrics'],
  {
    revalidate: CACHE_CONFIG.HISTORICAL.revalidate,
    tags: [...CACHE_CONFIG.HISTORICAL.tags, 'category-revenue']
  }
);

export const getCachedSellerPerformance = unstable_cache(
  getSellerPerformance,
  ['seller-performance'],
  {
    revalidate: CACHE_CONFIG.HISTORICAL.revalidate,
    tags: [...CACHE_CONFIG.HISTORICAL.tags, 'seller-performance']
  }
);

export const getCachedAdsSalesComparison30Days = unstable_cache(
  getAdsSalesComparison30Days,
  ['ads-sales-comparison-30days'],
  {
    revalidate: CACHE_CONFIG.HISTORICAL.revalidate,
    tags: [...CACHE_CONFIG.HISTORICAL.tags, 'ads-sales-comparison']
  }
);

/**
 * Utility function to get all cached chart data in one call
 * This optimizes the historical data provider by fetching everything at once
 */
export async function getAllCachedChartData() {
  return Promise.all([
    getCachedMonthlySales(),
    getCachedMonthlyBuyers(),
    getCachedTopSellingProducts(),
    getCachedCurrentVsLastMonthSales(),
    getCachedRevenueByProduct(),
    getCachedMonthlyContractsEvolution(),
    getCachedPaymentMethodsMix(),
    getCachedMonthlyPayments(),
    getCachedRevenueByCategoryWithMetrics(),
    getCachedSellerPerformance()
  ]);
}
