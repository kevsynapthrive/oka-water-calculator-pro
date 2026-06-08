/**
 * EPA affordability analysis.
 *
 * Uses a configurable reference usage level (default 7,500 gal/month per
 * EPA residential benchmark) rather than the system's average — making
 * results comparable across communities and rate scenarios.
 *
 * Thresholds (based on EPA DWINSA guidance):
 *   ≤1.5%  of MHI: Affordable
 *   ≤2.5%  of MHI: Moderate  (EPA threshold)
 *   ≤4.0%  of MHI: Burdensome
 *   >4.0%  of MHI: Severe
 */

import type { AffordabilityStatus, BillComparisonRow } from '../types';
import { calculateMonthlyBill } from './revenue';
import type { RateStructure } from '../types';

export const EPA_THRESHOLD_PERCENT = 2.5;
export const EPA_REFERENCE_USAGE_GAL = 7_500; // Standard residential benchmark

export function affordabilityStatus(billAsPercentIncome: number): AffordabilityStatus {
  if (billAsPercentIncome <= 1.5) return 'affordable';
  if (billAsPercentIncome <= 2.5) return 'moderate';
  if (billAsPercentIncome <= 4.0) return 'burdensome';
  return 'severe';
}

export interface AffordabilityAnalysisInputs {
  rateStructure: RateStructure;
  referenceUsageGal: number;     // Benchmark for primary affordability metric
  medianHouseholdIncome: number; // Annual, $
  povertyLevelIncome: number;    // Annual, $
  compareUsageLevels: number[];  // Additional usage levels for comparison table
}

export interface AffordabilityAnalysis {
  referenceUsage: number;
  monthlyBillAtReference: number;
  billAsPercentMHI: number;
  mhiStatus: AffordabilityStatus;
  billAsPercentPoverty: number;
  povertyStatus: AffordabilityStatus;
  maxAffordableMonthlybillMHI: number;
  comparisonTable: BillComparisonRow[];
}

export function analyzeAffordability(
  inputs: AffordabilityAnalysisInputs,
): AffordabilityAnalysis {
  const { rateStructure, referenceUsageGal, medianHouseholdIncome, povertyLevelIncome, compareUsageLevels } = inputs;

  const monthlyMHI = medianHouseholdIncome / 12;
  const monthlyPoverty = povertyLevelIncome / 12;

  const monthlyBillAtReference = calculateMonthlyBill(referenceUsageGal, rateStructure);

  const billAsPercentMHI = monthlyMHI > 0 ? (monthlyBillAtReference / monthlyMHI) * 100 : 0;
  const billAsPercentPoverty = monthlyPoverty > 0 ? (monthlyBillAtReference / monthlyPoverty) * 100 : 0;

  const maxAffordableMonthlybillMHI = monthlyMHI * (EPA_THRESHOLD_PERCENT / 100);

  const comparisonTable: BillComparisonRow[] = compareUsageLevels.map((usage) => {
    const bill = calculateMonthlyBill(usage, rateStructure);
    const pctMHI = monthlyMHI > 0 ? (bill / monthlyMHI) * 100 : 0;
    const pctPoverty = monthlyPoverty > 0 ? (bill / monthlyPoverty) * 100 : 0;
    return {
      usage,
      monthlyBill: bill,
      billAsPercentMHI: pctMHI,
      mhiStatus: affordabilityStatus(pctMHI),
      billAsPercentPoverty: pctPoverty,
      povertyStatus: affordabilityStatus(pctPoverty),
    };
  });

  return {
    referenceUsage: referenceUsageGal,
    monthlyBillAtReference,
    billAsPercentMHI,
    mhiStatus: affordabilityStatus(billAsPercentMHI),
    billAsPercentPoverty,
    povertyStatus: affordabilityStatus(billAsPercentPoverty),
    maxAffordableMonthlybillMHI,
    comparisonTable,
  };
}
