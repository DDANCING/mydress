/**
 * Cache utilities for historical data with monthly revalidation
 * and current data with hourly revalidation
 * 
 * This module provides utilities to calculate revalidation times for:
 * - Historical data: updated monthly (first day of each month)
 * - Current data: updated hourly for fresh values
 */

/**
 * Calculates the number of seconds until the next hour
 * This is used for ISR revalidation of current data that should be fresh
 * 
 * @returns {number} Number of seconds until the next hour
 */
export function getSecondsUntilNextHour(): number {
  const now = new Date();
  
  // Get the start of the next hour
  const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0, 0);
  
  // Calculate the difference in milliseconds and convert to seconds
  const diffInMs = nextHour.getTime() - now.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  
  // Ensure we return at least 60 seconds to avoid too frequent revalidations
  return Math.max(diffInSeconds, 60);
}

/**
 * Creates a revalidate configuration for current data (hourly updates)
 * Current data includes live values like total revenue, orders count, etc.
 * 
 * @returns {number} Revalidation time in seconds (3600 = 1 hour)
 */
export function getCurrentDataRevalidation(): number {
  return 3600; // 1 hour in seconds
}

/**
 * Calculates the number of seconds until the first day of the next month at midnight
 * This is used for ISR (Incremental Static Regeneration) revalidation timing
 * 
 * @returns {number} Number of seconds until the first day of next month
 */
export function getSecondsUntilNextMonth(): number {
  const now = new Date();
  
  // Get the first day of next month at midnight
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  
  // Calculate the difference in milliseconds and convert to seconds
  const diffInMs = nextMonth.getTime() - now.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  
  // Ensure we return at least 1 second to avoid edge cases
  return Math.max(diffInSeconds, 1);
}

/**
 * Creates a revalidate configuration for historical data
 * Historical data should only be revalidated on the first day of each new month
 * 
 * @returns {number} Revalidation time in seconds
 */
export function getHistoricalDataRevalidation(): number {
  return getSecondsUntilNextMonth();
}

/**
 * Checks if we're currently in the first day of the month
 * Useful for determining if a revalidation should occur
 * 
 * @returns {boolean} True if today is the first day of the month
 */
export function isFirstDayOfMonth(): boolean {
  const now = new Date();
  return now.getDate() === 1;
}

/**
 * Gets a cache key for historical data based on the current month
 * This ensures data is cached per month and automatically invalidated
 * when the month changes
 * 
 * @param prefix Optional prefix for the cache key
 * @returns {string} Cache key including year-month
 */
export function getHistoricalDataCacheKey(prefix: string = 'historical'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${prefix}-${year}-${month}`;
}

/**
 * Gets a cache key for current data based on the current hour
 * This ensures fresh data is fetched every hour
 * 
 * @param prefix Optional prefix for the cache key
 * @returns {string} Cache key including year-month-day-hour
 */
export function getCurrentDataCacheKey(prefix: string = 'current'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  return `${prefix}-${year}-${month}-${day}-${hour}`;
}

/**
 * Cache configuration for different types of data
 */
export const CACHE_CONFIG = {
  // Historical data (sales, contracts, etc. from previous months for percentage calculations)
  HISTORICAL: {
    revalidate: getHistoricalDataRevalidation(),
    tags: ['historical-data']
  },
  
  // Current data (main card values updated hourly)
  CURRENT: {
    revalidate: getCurrentDataRevalidation(),
    tags: ['current-data']
  },
  
  // Real-time data (today's activities, live updates)
  REALTIME: {
    revalidate: 300, // 5 minutes
    tags: ['realtime-data']
  },
  
  // Daily data (can be cached for a few hours)
  DAILY: {
    revalidate: 3600, // 1 hour
    tags: ['daily-data']
  }
} as const;
