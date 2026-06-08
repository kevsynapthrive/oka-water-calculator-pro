/**
 * Non-Revenue Water (NRW) / water loss calculations.
 *
 * IMPORTANT: Water loss is expressed as a percentage of water PRODUCED
 * (the industry standard — AWWA M36, EPA NRW guidelines).
 *
 *   waterProduced = waterBilled / (1 − lossRate)
 *   waterLost     = waterProduced − waterBilled
 *
 * The previous version treated the input as % of delivery, overstating
 * loss volume by approximately lossRate / (1 − lossRate).
 */

export interface WaterLossInputs {
  /** Total water billed to customers, gallons/year */
  totalBilledGallonsPerYear: number;
  /** Non-revenue water as % of PRODUCTION (0–99) */
  lossPercentOfProduction: number;
  /** Annual O&M cost, $ (used to calculate production cost of lost water) */
  annualOperatingCost: number;
  /** Weighted average revenue rate, $/kgal (for revenue-equivalent display) */
  weightedAvgRevenueRatePerKgal: number;
}

export interface WaterLossResult {
  lossPercent: number;
  totalBilledGallonsPerYear: number;
  totalProducedGallonsPerYear: number;
  waterLostGallonsPerYear: number;
  /** Cost of treating/pumping lost water = (lost/produced) × O&M */
  productionCostOfLoss: number;
  /**
   * Revenue equivalent: what the lost water would have earned.
   * Presented as context for advocacy, NOT as recoverable revenue.
   */
  revenueEquivalent: number;
}

export function calculateWaterLoss(inputs: WaterLossInputs): WaterLossResult {
  const {
    totalBilledGallonsPerYear,
    lossPercentOfProduction,
    annualOperatingCost,
    weightedAvgRevenueRatePerKgal,
  } = inputs;

  const lossRate = Math.max(0, Math.min(0.99, lossPercentOfProduction / 100));

  // Total production required to deliver the billed amount
  const totalProducedGallonsPerYear =
    lossRate < 1 ? totalBilledGallonsPerYear / (1 - lossRate) : totalBilledGallonsPerYear;

  const waterLostGallonsPerYear = totalProducedGallonsPerYear - totalBilledGallonsPerYear;

  // Operating cost attributable to lost water = (lost / produced) × total O&M
  const productionCostOfLoss =
    totalProducedGallonsPerYear > 0
      ? (waterLostGallonsPerYear / totalProducedGallonsPerYear) * annualOperatingCost
      : 0;

  // Revenue equivalent (informational only — clearly not "lost revenue")
  const revenueEquivalent = (waterLostGallonsPerYear / 1000) * weightedAvgRevenueRatePerKgal;

  return {
    lossPercent: lossPercentOfProduction,
    totalBilledGallonsPerYear,
    totalProducedGallonsPerYear,
    waterLostGallonsPerYear,
    productionCostOfLoss,
    revenueEquivalent,
  };
}
