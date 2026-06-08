/**
 * Simplified Cost-of-Service (COS) analysis.
 *
 * Based on the AWWA M1 methodology, operating costs are allocated to three
 * functional categories that drive different rate components:
 *
 *   Customer costs  → Fixed monthly base rate (per account)
 *     Expenses that exist regardless of usage: meter reading, billing,
 *     customer service, service line maintenance.
 *
 *   Commodity costs → Volumetric Tier 1 rate (per 1,000 gallons)
 *     Expenses proportional to volume: chemicals, treatment power, source water.
 *
 *   Capacity costs  → Higher-tier premiums (per 1,000 gallons above average)
 *     Expenses sized to peak demand: pumping capacity, storage, distribution mains.
 *     These are allocated to above-average usage to send a conservation price signal.
 *
 * This replaces the previous arbitrary 30/20/50 split with a principled
 * allocation driven by user-provided cost breakdown data.
 */

import type { CostAllocation, RateStructure, TierRate } from '../types';
import { calculateTierBreakdown } from './revenue';

export interface COSInputs {
  annualOperatingCost: number;    // Total O&M, $
  costAllocation: CostAllocation; // % breakdown
  totalCustomerCount: number;     // All customer accounts
  avgMonthlyUsageAllCustomers: number; // Weighted average across all classes, gal/month
  tierLimitFactors: number[];     // Tier boundaries as multiples of average usage [0.5, 1.2, 2.5]
  tierMultipliers: number[];      // Tier rate multipliers [1.0, 1.5, 2.5, 4.0]
  existingAddonFee: number;       // Kept constant — user controls this
}

export interface COSRateDesign {
  suggestedBaseRate: number;   // $/month
  suggestedAddonFee: number;   // $/month (= existingAddonFee, unchanged)
  suggestedTiers: TierRate[];
  customerCostTotal: number;   // Annual $
  commodityCostTotal: number;  // Annual $
  capacityCostTotal: number;   // Annual $
  unitCommodityCost: number;   // $/kgal (Tier 1 rate)
  unitCapacityCost: number;    // $/kgal (extra charge for higher tiers)
}

export function designRatesFromCOS(inputs: COSInputs): COSRateDesign {
  const {
    annualOperatingCost,
    costAllocation,
    totalCustomerCount,
    avgMonthlyUsageAllCustomers,
    tierLimitFactors,
    tierMultipliers,
    existingAddonFee,
  } = inputs;

  const fixedPct   = Math.max(0, Math.min(100, costAllocation.fixedCostPercent)) / 100;
  const commodPct  = Math.max(0, Math.min(100 - fixedPct * 100, costAllocation.commodityCostPercent)) / 100;
  const capacityPct = Math.max(0, 1 - fixedPct - commodPct);

  const customerCostTotal  = annualOperatingCost * fixedPct;
  const commodityCostTotal = annualOperatingCost * commodPct;
  const capacityCostTotal  = annualOperatingCost * capacityPct;

  // Base rate: customer cost / customers / 12 months
  const addonRevenue = existingAddonFee * totalCustomerCount * 12;
  const netCustomerCost = Math.max(0, customerCostTotal - addonRevenue);
  const suggestedBaseRate = totalCustomerCount > 0
    ? netCustomerCost / totalCustomerCount / 12
    : 0;

  // Tier 1 (commodity) rate: commodity cost / total annual volume billed
  const totalAnnualBilledKgal = avgMonthlyUsageAllCustomers * totalCustomerCount * 12 / 1000;
  const unitCommodityCost = totalAnnualBilledKgal > 0 ? commodityCostTotal / totalAnnualBilledKgal : 0;

  // Capacity rate: allocate to above-average usage.
  // Calculate how many kgal/year flow through each tier above Tier 1.
  const tierLimits = tierLimitFactors.map((f) => Math.round(avgMonthlyUsageAllCustomers * f));
  const avgKgalMonth = avgMonthlyUsageAllCustomers / 1000;

  let aboveAverageKgalPerYear = 0;
  // Approximate: volume in each higher tier = (tier upper limit - tier lower limit) * customers * 12
  let prevLimit = 0;
  for (let i = 0; i < tierLimits.length; i++) {
    const limit = tierLimits[i];
    const tierCapacity = (limit - prevLimit) / 1000; // kgal/month
    if (prevLimit >= avgMonthlyUsageAllCustomers) {
      // Entire tier is above average — all of it is "capacity"
      aboveAverageKgalPerYear += tierCapacity * totalCustomerCount * 12;
    } else if (limit > avgMonthlyUsageAllCustomers) {
      // Tier straddles the average — count only the above-average portion
      aboveAverageKgalPerYear += (limit - avgMonthlyUsageAllCustomers) / 1000 * totalCustomerCount * 12;
    }
    prevLimit = limit;
  }
  // Tier 4 (unlimited) — estimate 2× average usage for customers in this tier (rough)
  // In practice, only heavy users reach Tier 4
  aboveAverageKgalPerYear += (avgKgalMonth * 0.5) * totalCustomerCount * 12;

  const unitCapacityCost = aboveAverageKgalPerYear > 0
    ? capacityCostTotal / aboveAverageKgalPerYear
    : 0;

  // Design tiered rates using COS unit costs and tier multipliers
  const suggestedTiers: TierRate[] = tierLimits.map((limit, i) => ({
    enabled: true,
    upperLimit: limit,
    ratePerKgal: Math.round((unitCommodityCost + unitCapacityCost * Math.max(0, tierMultipliers[i] - 1)) * 100) / 100,
  }));

  // Tier 4 — unlimited, highest rate
  suggestedTiers.push({
    enabled: true,
    upperLimit: null,
    ratePerKgal: Math.round((unitCommodityCost + unitCapacityCost * Math.max(0, tierMultipliers[3] - 1)) * 100) / 100,
  });

  return {
    suggestedBaseRate: Math.round(suggestedBaseRate * 100) / 100,
    suggestedAddonFee: existingAddonFee,
    suggestedTiers,
    customerCostTotal,
    commodityCostTotal,
    capacityCostTotal,
    unitCommodityCost,
    unitCapacityCost,
  };
}

/**
 * Given a rate structure and COS data, determine which cost category is over/under-recovered.
 */
export function cosRecoveryAnalysis(
  rateStructure: RateStructure,
  cosDesign: COSRateDesign,
  totalCustomerCount: number,
  avgMonthlyUsage: number,
): { fixedRecoveryPercent: number; volumetricRecoveryPercent: number } {
  const breakdown = calculateTierBreakdown(avgMonthlyUsage, rateStructure.tiers);
  const actualBaseRevenue = (rateStructure.baseRate + rateStructure.addonFee) * totalCustomerCount * 12;
  const actualVolumetricRevenue = breakdown.totalVolumetricCost * totalCustomerCount * 12;

  const targetFixed = cosDesign.customerCostTotal;
  const targetVolumetric = cosDesign.commodityCostTotal + cosDesign.capacityCostTotal;

  return {
    fixedRecoveryPercent: targetFixed > 0 ? (actualBaseRevenue / targetFixed) * 100 : 100,
    volumetricRecoveryPercent: targetVolumetric > 0 ? (actualVolumetricRevenue / targetVolumetric) * 100 : 100,
  };
}
