/**
 * Debt Service Coverage Ratio (DSCR) calculations.
 *
 * DSCR = Net Operating Revenue / Annual Debt Service
 *   Net Operating Revenue = Total Revenue − Total Operating Expenses (O&M)
 *
 * Lender thresholds:
 *   ≥1.50  Excellent — strong cushion, favorable loan terms
 *   ≥1.25  Adequate  — meets USDA Rural Development minimum requirement
 *   ≥1.10  Marginal  — meets many state revolving fund minimums
 *   <1.10  Insufficient — likely fails lender covenants
 *   N/A    No debt service
 */

import type { DSCRStatus } from '../types';

export const DSCR_EXCELLENT = 1.50;
export const DSCR_ADEQUATE  = 1.25;  // USDA Rural Development minimum
export const DSCR_MARGINAL  = 1.10;  // Typical SRF minimum

export function calculateDSCR(
  totalAnnualRevenue: number,
  annualOperatingCost: number,
  totalAnnualDebtService: number,
): number {
  if (totalAnnualDebtService <= 0) return Infinity;
  const netOperatingRevenue = totalAnnualRevenue - annualOperatingCost;
  return netOperatingRevenue / totalAnnualDebtService;
}

export function dscrStatus(dscr: number): DSCRStatus {
  if (!isFinite(dscr)) return 'no-debt';
  if (dscr >= DSCR_EXCELLENT) return 'excellent';
  if (dscr >= DSCR_ADEQUATE)  return 'adequate';
  if (dscr >= DSCR_MARGINAL)  return 'marginal';
  return 'insufficient';
}

export function dscrLabel(status: DSCRStatus): string {
  switch (status) {
    case 'excellent':     return 'Excellent';
    case 'adequate':      return 'Adequate (Meets USDA)';
    case 'marginal':      return 'Marginal';
    case 'insufficient':  return 'Insufficient';
    case 'no-debt':       return 'N/A (No Debt)';
  }
}

export function dscrColorClass(status: DSCRStatus): string {
  switch (status) {
    case 'excellent':    return 'text-green-700 bg-green-50 border-green-200';
    case 'adequate':     return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'marginal':     return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    case 'insufficient': return 'text-red-700 bg-red-50 border-red-200';
    case 'no-debt':      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

/**
 * Revenue needed to achieve a target DSCR.
 * Useful for showing "you need $X more revenue to meet the USDA standard."
 */
export function revenueForTargetDSCR(
  annualOperatingCost: number,
  totalAnnualDebtService: number,
  targetDSCR: number,
): number {
  if (totalAnnualDebtService <= 0) return annualOperatingCost;
  return annualOperatingCost + totalAnnualDebtService * targetDSCR;
}
