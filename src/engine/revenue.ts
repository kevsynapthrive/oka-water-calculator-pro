/**
 * Revenue calculations for tiered water rate structures.
 *
 * KEY IMPROVEMENT over previous version:
 * When a customer class has a usage standard deviation, revenue is calculated
 * by integrating over the lognormal usage distribution — not by applying the
 * average usage to the tiered schedule (which produces incorrect results due
 * to Jensen's inequality for nonlinear functions).
 *
 * When no std dev is provided, falls back to the simple average × count method.
 */

import type { TierRate, RateStructure, CustomerClass } from '../types';

// ─── Tier Breakdown ───────────────────────────────────────────────────────────

export interface TierBreakdownResult {
  items: { tierIndex: number; gallons: number; ratePerKgal: number; cost: number }[];
  totalVolumetricCost: number;
}

/**
 * Calculate volumetric charge for a given usage level and tier schedule.
 * All tiers are cumulative (first x gallons at rate1, next y at rate2, etc.)
 */
export function calculateTierBreakdown(
  gallons: number,
  tiers: TierRate[],
): TierBreakdownResult {
  const enabledTiers = tiers
    .map((t, i) => ({ ...t, originalIndex: i }))
    .filter((t) => t.enabled);

  const items: TierBreakdownResult['items'] = [];
  let totalVolumetricCost = 0;
  let remaining = Math.max(0, gallons);
  let prevLimit = 0;

  for (let i = 0; i < enabledTiers.length; i++) {
    const tier = enabledTiers[i];
    const isLast = i === enabledTiers.length - 1;

    const capacity = isLast || tier.upperLimit === null
      ? remaining
      : Math.max(0, (tier.upperLimit ?? remaining) - prevLimit);

    const usage = Math.min(remaining, capacity);
    const cost = (usage / 1000) * tier.ratePerKgal;

    items.push({ tierIndex: tier.originalIndex, gallons: usage, ratePerKgal: tier.ratePerKgal, cost });
    totalVolumetricCost += cost;

    if (tier.upperLimit !== null) prevLimit = tier.upperLimit;
    remaining -= usage;
    if (remaining <= 0) break;
  }

  return { items, totalVolumetricCost };
}

/**
 * Full monthly bill for a customer at a given usage level.
 */
export function calculateMonthlyBill(
  gallons: number,
  rateStructure: RateStructure,
): number {
  const { totalVolumetricCost } = calculateTierBreakdown(gallons, rateStructure.tiers);
  return rateStructure.baseRate + rateStructure.addonFee + totalVolumetricCost;
}

// ─── Weighted Average Rate ────────────────────────────────────────────────────

/** $/1,000 gallons effective rate at a given usage level */
export function weightedAvgRatePerKgal(
  gallons: number,
  rateStructure: RateStructure,
): number {
  if (gallons <= 0) return rateStructure.tiers.find((t) => t.enabled)?.ratePerKgal ?? 0;
  const bill = calculateMonthlyBill(gallons, rateStructure);
  return (bill * 1000) / gallons;
}

// ─── Lognormal Distribution Revenue ──────────────────────────────────────────

/**
 * Inverse normal CDF (quantile function).
 * Peter Acklam's rational approximation — accurate to ±1.15e-9.
 */
function inverseNormalCDF(p: number): number {
  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
              1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
              6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
              -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
              3.754408661907416e+00];

  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;

  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
           ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
  if (p <= pHigh) {
    const q = p - 0.5;
    const r = q * q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
           (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  }
  const q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
           ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
}

/**
 * Expected monthly bill for a customer class with a lognormal usage distribution.
 *
 * Uses 200-quantile numerical integration over the distribution.
 * E[f(X)] = ∑ f(x_i) / N  where x_i are evenly-spaced quantiles.
 *
 * This correctly handles the non-linearity of tiered pricing (Jensen's inequality).
 */
export function expectedBillLognormal(
  avgUsage: number,
  stdDev: number,
  rateStructure: RateStructure,
): number {
  if (stdDev <= 0 || avgUsage <= 0) {
    return calculateMonthlyBill(avgUsage, rateStructure);
  }

  const cv = stdDev / avgUsage;
  const sigma2 = Math.log(1 + cv * cv);
  const sigma = Math.sqrt(sigma2);
  const mu = Math.log(avgUsage) - sigma2 / 2;

  const N = 200;
  let sum = 0;
  for (let i = 1; i <= N; i++) {
    const p = (i - 0.5) / N;
    const usage = Math.exp(mu + sigma * inverseNormalCDF(p));
    sum += calculateMonthlyBill(Math.max(0, usage), rateStructure);
  }
  return sum / N;
}

// ─── Class-Level Revenue ─────────────────────────────────────────────────────

export interface ClassRevenueResult {
  classId: string;
  className: string;
  expectedMonthlyBillPerCustomer: number;
  annualRevenue: number;
  usedDistribution: boolean;
}

export function calculateClassRevenue(
  cls: CustomerClass,
  rateStructure: RateStructure,
): ClassRevenueResult {
  const usedDistribution = cls.usageStdDev != null && cls.usageStdDev > 0;

  const expectedBill = usedDistribution
    ? expectedBillLognormal(cls.avgMonthlyUsage, cls.usageStdDev!, rateStructure)
    : calculateMonthlyBill(cls.avgMonthlyUsage, rateStructure);

  return {
    classId: cls.id,
    className: cls.name,
    expectedMonthlyBillPerCustomer: expectedBill,
    annualRevenue: expectedBill * cls.count * 12,
    usedDistribution,
  };
}

// ─── System-Wide Revenue ──────────────────────────────────────────────────────

export interface SystemRevenueResult {
  totalAnnualRevenue: number;
  annualRevenueFromBase: number;
  annualRevenueFromAddon: number;
  annualRevenueFromTiers: number;
  byClass: ClassRevenueResult[];
  usedDistributionForAnyClass: boolean;
}

export function calculateSystemRevenue(
  customerClasses: CustomerClass[],
  rateStructures: RateStructure[],
): SystemRevenueResult {
  const rateMap = new Map(rateStructures.map((r) => [r.id, r]));

  const byClass: ClassRevenueResult[] = customerClasses.map((cls) => {
    const rs = rateMap.get(cls.rateStructureId) ?? rateStructures[0];
    return calculateClassRevenue(cls, rs);
  });

  const totalAnnualRevenue = byClass.reduce((s, c) => s + c.annualRevenue, 0);

  // Decompose fixed vs. volumetric for reporting
  let baseTotal = 0;
  let addonTotal = 0;
  for (const cls of customerClasses) {
    const rs = rateMap.get(cls.rateStructureId) ?? rateStructures[0];
    baseTotal += rs.baseRate * cls.count * 12;
    addonTotal += rs.addonFee * cls.count * 12;
  }
  const tierTotal = totalAnnualRevenue - baseTotal - addonTotal;

  return {
    totalAnnualRevenue,
    annualRevenueFromBase: baseTotal,
    annualRevenueFromAddon: addonTotal,
    annualRevenueFromTiers: tierTotal,
    byClass,
    usedDistributionForAnyClass: byClass.some((c) => c.usedDistribution),
  };
}
