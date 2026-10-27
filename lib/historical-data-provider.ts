/**
 * Historical Data Provider - Monthly caching for historical comparison data
 * 
 * This component fetches and caches historical data that is immutable (e.g., sales from previous months)
 * specifically for percentage calculations and trends. Main card values are handled by
 * the CurrentDataProvider for hourly updates.
 */

import { unstable_cache } from 'next/cache';
import { 
  getCachedMonthlySales,
  getCachedMonthlyBuyers,
  getCachedTopSellingProducts,
  getCachedCurrentVsLastMonthSales,
  getCachedRevenueByProduct,
  getCachedMonthlyContractsEvolution,
  getCachedPaymentMethodsMix,
  getCachedMonthlyPayments,
  getCachedRevenueByCategoryWithMetrics,
  getCachedSellerPerformance,
  getCachedAdsSalesComparison30Days
} from '@/lib/cached-chart-actions';
import { CACHE_CONFIG, getHistoricalDataCacheKey } from '@/lib/cache-utils';

// Type definitions for the cached data
export interface HistoricalChartData {
  salesData: Awaited<ReturnType<typeof getCachedMonthlySales>>;
  buyersData: Awaited<ReturnType<typeof getCachedMonthlyBuyers>>;
  topProducts: Awaited<ReturnType<typeof getCachedTopSellingProducts>>;
  dailySalesComparison: Awaited<ReturnType<typeof getCachedCurrentVsLastMonthSales>>;
  productRevenue: Awaited<ReturnType<typeof getCachedRevenueByProduct>>;
  monthlyContracts: Awaited<ReturnType<typeof getCachedMonthlyContractsEvolution>>;
  paymentMethods: Awaited<ReturnType<typeof getCachedPaymentMethodsMix>>;
  monthlyPayments: Awaited<ReturnType<typeof getCachedMonthlyPayments>>;
  categoryRevenue: Awaited<ReturnType<typeof getCachedRevenueByCategoryWithMetrics>>;
  sellerPerformance: Awaited<ReturnType<typeof getCachedSellerPerformance>>;
  adsSalesComparison30Days: Awaited<ReturnType<typeof getCachedAdsSalesComparison30Days>>;
}

export interface HistoricalChartDataWithTimestamp {
  chartData: HistoricalChartData;
  lastUpdate: string;
}

export interface HistoricalComparisonData {
  // Data from previous months for percentage calculations
  lastMonthTotals: {
    revenue: number;
    orders: number;
    contracts: number;
    customers: number;
  };
  previousPeriodTotals: {
    revenue: number;
    orders: number;
    contracts: number;
    customers: number;
  };
}

/**
 * Cached function to fetch all historical chart data with timestamp
 * This data represents historical information from previous months that doesn't change
 */
const getCachedHistoricalChartDataWithTimestamp = unstable_cache(
  async (): Promise<HistoricalChartDataWithTimestamp> => {
    console.log('📊 Fetching historical chart data with timestamp (daily cache)');
    
    // Capture the exact moment when data is being cached
    const lastUpdate = new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    // Fetch all historical data in parallel
    const [
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
    ] = await Promise.all([
      getCachedMonthlySales(),
      getCachedMonthlyBuyers(),
      getCachedTopSellingProducts(),
      getCachedCurrentVsLastMonthSales(),
      getCachedRevenueByProduct(),
      getCachedMonthlyContractsEvolution(),
      getCachedPaymentMethodsMix(),
      getCachedMonthlyPayments(),
      getCachedRevenueByCategoryWithMetrics(),
      getCachedSellerPerformance(),
      getCachedAdsSalesComparison30Days()
    ]);

    return {
      chartData: {
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
      },
      lastUpdate
    };
  },
  [getHistoricalDataCacheKey('chart-data-with-timestamp')],
  {
    revalidate: 86400, // 24 hours to match overview page
    tags: [...CACHE_CONFIG.HISTORICAL.tags]
  }
);

/**
 * Cached function to fetch all historical chart data
 * This data represents historical information from previous months that doesn't change
 */
const getCachedHistoricalChartData = unstable_cache(
  async (): Promise<HistoricalChartData> => {
    console.log('📊 Fetching historical chart data (monthly cache)');
    
    // Fetch all historical data in parallel
    const [
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
    ] = await Promise.all([
      getCachedMonthlySales(),
      getCachedMonthlyBuyers(),
      getCachedTopSellingProducts(),
      getCachedCurrentVsLastMonthSales(),
      getCachedRevenueByProduct(),
      getCachedMonthlyContractsEvolution(),
      getCachedPaymentMethodsMix(),
      getCachedMonthlyPayments(),
      getCachedRevenueByCategoryWithMetrics(),
      getCachedSellerPerformance(),
      getCachedAdsSalesComparison30Days()
    ]);

    return {
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
    };
  },
  [getHistoricalDataCacheKey('chart-data')],
  {
    revalidate: CACHE_CONFIG.HISTORICAL.revalidate,
    tags: [...CACHE_CONFIG.HISTORICAL.tags]
  }
);

/**
 * Cached function to fetch historical comparison data for percentage calculations
 * This includes data from previous months needed for growth percentages
 */
const getCachedHistoricalComparisonData = unstable_cache(
  async (): Promise<HistoricalComparisonData> => {
    console.log('📈 Fetching historical comparison data (monthly cache)');
    
    // This would fetch data from previous months for comparison
    // For now, returning mock data - implement based on your needs
    return {
      lastMonthTotals: {
        revenue: 0,
        orders: 0,
        contracts: 0,
        customers: 0
      },
      previousPeriodTotals: {
        revenue: 0,
        orders: 0,
        contracts: 0,
        customers: 0
      }
    };
  },
  [getHistoricalDataCacheKey('comparison-data')],
  {
    revalidate: CACHE_CONFIG.HISTORICAL.revalidate,
    tags: [...CACHE_CONFIG.HISTORICAL.tags]
  }
);

/**
 * Public API to get cached historical chart data
 */
export async function getHistoricalChartData(): Promise<HistoricalChartData> {
  return getCachedHistoricalChartData();
}

/**
 * Public API to get cached historical chart data with timestamp
 */
export async function getHistoricalChartDataWithTimestamp(): Promise<HistoricalChartDataWithTimestamp> {
  return getCachedHistoricalChartDataWithTimestamp();
}

/**
 * Public API to get cached historical comparison data
 */
export async function getHistoricalComparisonData(): Promise<HistoricalComparisonData> {
  return getCachedHistoricalComparisonData();
}

/**
 * React Server Component that provides historical data to its children
 * This acts as a data provider that fetches cached historical data once
 * and can be shared across multiple dashboard components
 */
export async function HistoricalDataProvider({ 
  children 
}: { 
  children: (data: {
    chartData: HistoricalChartData;
    comparisonData: HistoricalComparisonData;
  }) => React.ReactNode;
}) {
  // Fetch both historical data sets in parallel
  const [chartData, comparisonData] = await Promise.all([
    getHistoricalChartData(),
    getHistoricalComparisonData()
  ]);

  return children({ chartData, comparisonData });
}
