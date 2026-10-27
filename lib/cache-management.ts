/**
 * Cache Management Utilities
 * 
 * This file provides utilities for manual cache management and invalidation.
 * Use these functions when you need to force refresh cached data outside
 * of the normal revalidation schedule.
 */

import { revalidatePath } from 'next/cache';

/**
 * Manually invalidate all historical data caches
 * Use this when historical data needs to be refreshed immediately
 * (e.g., after a data correction or manual data import)
 */
export async function invalidateHistoricalData() {
  try {
    revalidatePath('/dashboard/overview');
    console.log('Historical data cache invalidated successfully');
    return { success: true };
  } catch (error) {
    console.error('Failed to invalidate historical data cache:', error);
    return { success: false, error };
  }
}

/**
 * Manually invalidate real-time data caches
 * Use this when real-time data needs immediate refresh
 */
export async function invalidateRealTimeData() {
  try {
    revalidatePath('/dashboard/overview');
    console.log('Real-time data cache invalidated successfully');
    return { success: true };
  } catch (error) {
    console.error('Failed to invalidate real-time data cache:', error);
    return { success: false, error };
  }
}

/**
 * Invalidate specific chart data caches
 */
export async function invalidateChartData(chartType?: string) {
  try {
    revalidatePath('/dashboard/overview');
    console.log(`Chart cache invalidated successfully`);
    return { success: true };
  } catch (error) {
    console.error('Failed to invalidate chart data cache:', error);
    return { success: false, error };
  }
}

/**
 * Invalidate dashboard cards caches
 */
export async function invalidateDashboardCards() {
  try {
    revalidatePath('/dashboard/overview');
    console.log('Dashboard cards cache invalidated successfully');
    return { success: true };
  } catch (error) {
    console.error('Failed to invalidate dashboard cards cache:', error);
    return { success: false, error };
  }
}

/**
 * Nuclear option: Invalidate all dashboard-related caches
 * Use this sparingly as it will cause all data to be re-fetched
 */
export async function invalidateAllDashboardData() {
  try {
    await Promise.all([
      invalidateHistoricalData(),
      invalidateRealTimeData(),
      invalidateChartData(),
      invalidateDashboardCards()
    ]);
    console.log('All dashboard data caches invalidated successfully');
    return { success: true };
  } catch (error) {
    console.error('Failed to invalidate all dashboard data caches:', error);
    return { success: false, error };
  }
}

/**
 * Force refresh historical data at month boundary
 * This can be called as a backup mechanism on the 1st of each month
 * to ensure the monthly revalidation occurred properly
 */
export async function forceMonthlyRefresh() {
  const today = new Date();
  const isFirstDayOfMonth = today.getDate() === 1;
  
  if (!isFirstDayOfMonth) {
    console.warn('Monthly refresh should only be called on the 1st day of the month');
    return { success: false, error: 'Not the first day of the month' };
  }
  
  return invalidateHistoricalData();
}

/**
 * Server Action for manual cache invalidation from the UI
 * This can be called from an admin interface if needed
 */
export async function manualCacheInvalidation(type: 'historical' | 'realtime' | 'charts' | 'dashboard' | 'all') {
  'use server';
  
  switch (type) {
    case 'historical':
      return invalidateHistoricalData();
    case 'realtime':
      return invalidateRealTimeData();
    case 'charts':
      return invalidateChartData();
    case 'dashboard':
      return invalidateDashboardCards();
    case 'all':
      return invalidateAllDashboardData();
    default:
      return { success: false, error: 'Invalid cache type' };
  }
}
