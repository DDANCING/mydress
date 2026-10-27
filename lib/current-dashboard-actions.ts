/**
 * Current Dashboard Actions - Hourly updated data for main card values
 * 
 * These functions fetch current data that should be updated every hour
 * for dashboard cards main values. Historical comparison data is handled
 * separately in cached-dashboard-actions.ts
 */

import { getDashboardCards } from '@/actions/getDashboardCards';
import { getFinanceDashboardCards } from '@/actions/dashboard_finance_cards';

/**
 * Get current dashboard cards with fresh main values
 * This fetches current totals for revenue, orders, contracts, etc.
 * but may exclude historical comparison data for percentage calculations
 */
export async function getCurrentDashboardCards() {
  return await getDashboardCards();
}

/**
 * Get current finance dashboard cards with fresh main values
 * This fetches current financial totals and metrics
 */
export async function getCurrentFinanceDashboardCards() {
  return await getFinanceDashboardCards();
}
