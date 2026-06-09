import type { AppState, AdvisorSettings } from '../types';

const resId = 'residential';
const comId = 'commercial';
const rsResId = 'rs-residential';
const rsComId = 'rs-commercial';

export const DEFAULT_ADVISOR_SETTINGS: AdvisorSettings = {
  epaAffordabilityThresholdPercent: 2.5,
  minDSCR: 1.25,
  maxAnnualIncreasePercent: 12,
  sinkingFundTarget: 'full-replacement',
  baseRateCostSharePercent: 40,
  tier1Multiplier: 1.0,
  tier2Multiplier: 1.5,
  tier3Multiplier: 2.5,
  tier4Multiplier: 4.0,
};

export const DEFAULT_STATE: AppState = {
  community: {
    name: 'Sample Community',
    state: 'OK',
    medianHouseholdIncome: 48_000,
    povertyLevelIncome: 30_000,
    belowPovertyPercent: 18,
    affordabilityReferenceUsage: 7_500,  // EPA standard residential benchmark
  },

  system: {
    waterLossPercent: 15,          // % of production (AWWA standard basis)
    currentReserveBalance: 250_000,
  },

  financial: {
    annualOperatingCost: 2_800_000,
    existingAnnualDebt: 320_000,
    existingDebtRemainingYears: 15,
    infrastructureReplacementCost: 12_000_000,
    assetLifespanYears: 30,
    borrowingRatePercent: 3.5,
    reserveEarningRatePercent: 1.5,    // Lower than borrowing rate (realistic)
    inflationRatePercent: 2.5,
    customerGrowthRatePercent: 0.5,
    projectionYears: 20,
    targetReserveBalance: 500_000,
    costAllocation: {
      fixedCostPercent: 40,       // 40% of O&M is fixed (customer/meter/billing)
      commodityCostPercent: 35,   // 35% is commodity (chemicals, treatment)
      // 25% is capacity (remainder allocated to higher tiers)
    },
  },

  customerClasses: [
    {
      id: resId,
      name: 'Residential',
      count: 4_200,
      avgMonthlyUsage: 5_500,
      usageStdDev: 2_200,          // Enables lognormal distribution modeling
      rateStructureId: rsResId,
    },
    {
      id: comId,
      name: 'Commercial',
      count: 380,
      avgMonthlyUsage: 18_000,
      usageStdDev: 8_000,
      rateStructureId: rsComId,
    },
  ],

  rateStructures: [
    {
      id: rsResId,
      label: 'Residential (Current)',
      baseRate: 18.50,
      addonFee: 6.00,
      tiers: [
        { enabled: true,  upperLimit: 3_000,  ratePerKgal: 5.20 },
        { enabled: true,  upperLimit: 8_000,  ratePerKgal: 6.80 },
        { enabled: false, upperLimit: 15_000, ratePerKgal: 8.50 },
        { enabled: false, upperLimit: null,   ratePerKgal: 12.00 },
      ],
    },
    {
      id: rsComId,
      label: 'Commercial (Current)',
      baseRate: 28.00,
      addonFee: 6.00,
      tiers: [
        { enabled: true,  upperLimit: 10_000, ratePerKgal: 5.20 },
        { enabled: true,  upperLimit: 30_000, ratePerKgal: 6.20 },
        { enabled: false, upperLimit: 75_000, ratePerKgal: 7.50 },
        { enabled: false, upperLimit: null,   ratePerKgal: 9.00 },
      ],
    },
    {
      id: 'rs-residential-proposed',
      label: 'Residential (Proposed)',
      baseRate: 21.00,
      addonFee: 6.00,
      tiers: [
        { enabled: true,  upperLimit: 3_000,  ratePerKgal: 5.80 },
        { enabled: true,  upperLimit: 8_000,  ratePerKgal: 8.20 },
        { enabled: true,  upperLimit: 15_000, ratePerKgal: 12.50 },
        { enabled: false, upperLimit: null,   ratePerKgal: 16.00 },
      ],
    },
    {
      id: 'rs-commercial-proposed',
      label: 'Commercial (Proposed)',
      baseRate: 32.00,
      addonFee: 6.00,
      tiers: [
        { enabled: true,  upperLimit: 10_000, ratePerKgal: 5.80 },
        { enabled: true,  upperLimit: 30_000, ratePerKgal: 7.20 },
        { enabled: true,  upperLimit: 75_000, ratePerKgal: 9.00 },
        { enabled: false, upperLimit: null,   ratePerKgal: 11.50 },
      ],
    },
  ],

  currentRateStructureId: rsResId,
  proposedRateStructureId: 'rs-residential-proposed',

  loans: [
    {
      id: 'loan-1',
      name: 'Water Treatment Plant Upgrade',
      amount: 2_000_000,
      annualRatePercent: 3.2,
      termYears: 20,
      startYear: 0,
    },
  ],

  projects: [
    {
      id: 'proj-1',
      name: 'Distribution Main Replacement',
      totalCost: 1_500_000,
      year: 3,
      fundingSource: 'loan',
    },
  ],

  grants: [
    {
      id: 'grant-1',
      name: 'USDA Water & Waste Disposal Grant',
      amount: 600_000,
      year: 2,
    },
  ],

  compareUsageLevels: [2_000, 5_500, 7_500, 12_000, 20_000],

  showMathMode: false,
};

// ─── Sample Scenarios ─────────────────────────────────────────────────────────

export const SAMPLE_SCENARIOS: Record<string, Partial<AppState>> = {
  'small-rural': {
    community: {
      name: 'Madill, OK',
      state: 'OK',
      medianHouseholdIncome: 38_500,
      povertyLevelIncome: 27_750,
      belowPovertyPercent: 26,
      affordabilityReferenceUsage: 7_500,
    },
    system: { waterLossPercent: 20, currentReserveBalance: 50_000 },
    financial: {
      annualOperatingCost: 920_000,
      existingAnnualDebt: 85_000,
      existingDebtRemainingYears: 12,
      infrastructureReplacementCost: 4_200_000,
      assetLifespanYears: 25,
      borrowingRatePercent: 3.25,
      reserveEarningRatePercent: 1.25,
      inflationRatePercent: 2.5,
      customerGrowthRatePercent: 0.2,
      projectionYears: 20,
      targetReserveBalance: 200_000,
      costAllocation: { fixedCostPercent: 38, commodityCostPercent: 32 },
    },
    customerClasses: [
      { id: 'res', name: 'Residential', count: 1_350, avgMonthlyUsage: 4_800, usageStdDev: 1_900, rateStructureId: 'rs-res' },
      { id: 'com', name: 'Commercial',  count: 95,    avgMonthlyUsage: 12_000, usageStdDev: null, rateStructureId: 'rs-res' },
    ],
  },
  'mid-tribal': {
    community: {
      name: 'Tribal Water District',
      state: 'OK',
      medianHouseholdIncome: 41_200,
      povertyLevelIncome: 27_750,
      belowPovertyPercent: 32,
      affordabilityReferenceUsage: 7_500,
    },
    system: { waterLossPercent: 24, currentReserveBalance: 120_000 },
    financial: {
      annualOperatingCost: 1_650_000,
      existingAnnualDebt: 180_000,
      existingDebtRemainingYears: 18,
      infrastructureReplacementCost: 7_500_000,
      assetLifespanYears: 30,
      borrowingRatePercent: 3.0,
      reserveEarningRatePercent: 1.0,
      inflationRatePercent: 2.5,
      customerGrowthRatePercent: 0.8,
      projectionYears: 20,
      targetReserveBalance: 400_000,
      costAllocation: { fixedCostPercent: 42, commodityCostPercent: 33 },
    },
    customerClasses: [
      { id: 'res', name: 'Residential', count: 2_400, avgMonthlyUsage: 5_200, usageStdDev: 2_100, rateStructureId: 'rs-res' },
      { id: 'com', name: 'Commercial',  count: 180,   avgMonthlyUsage: 15_000, usageStdDev: null, rateStructureId: 'rs-res' },
    ],
  },
  'medium-rural': {
    community: {
      name: 'Mid-Size Rural System',
      state: 'OK',
      medianHouseholdIncome: 48_000,
      povertyLevelIncome: 27_750,
      belowPovertyPercent: 18,
      affordabilityReferenceUsage: 7_500,
    },
    system: { waterLossPercent: 15, currentReserveBalance: 100_000 },
    financial: {
      annualOperatingCost: 975_000,
      existingAnnualDebt: 0,
      existingDebtRemainingYears: 0,
      infrastructureReplacementCost: 6_000_000,
      assetLifespanYears: 30,
      borrowingRatePercent: 3.5,
      reserveEarningRatePercent: 1.5,
      inflationRatePercent: 2.5,
      customerGrowthRatePercent: 0.5,
      projectionYears: 20,
      targetReserveBalance: 300_000,
      costAllocation: { fixedCostPercent: 40, commodityCostPercent: 33 },
    },
    customerClasses: [
      { id: 'res', name: 'Residential', count: 1_500, avgMonthlyUsage: 5_000, usageStdDev: 2_000, rateStructureId: 'rs-res' },
      { id: 'com', name: 'Commercial',  count: 120,   avgMonthlyUsage: 15_000, usageStdDev: null,  rateStructureId: 'rs-res' },
    ],
  },
  'growing-suburb': {
    community: {
      name: 'Newcastle, OK',
      state: 'OK',
      medianHouseholdIncome: 72_000,
      povertyLevelIncome: 27_750,
      belowPovertyPercent: 9,
      affordabilityReferenceUsage: 7_500,
    },
    system: { waterLossPercent: 10, currentReserveBalance: 800_000 },
    financial: {
      annualOperatingCost: 3_200_000,
      existingAnnualDebt: 420_000,
      existingDebtRemainingYears: 22,
      infrastructureReplacementCost: 18_000_000,
      assetLifespanYears: 35,
      borrowingRatePercent: 4.0,
      reserveEarningRatePercent: 2.0,
      inflationRatePercent: 2.8,
      customerGrowthRatePercent: 2.5,
      projectionYears: 20,
      targetReserveBalance: 1_200_000,
      costAllocation: { fixedCostPercent: 45, commodityCostPercent: 30 },
    },
    customerClasses: [
      { id: 'res', name: 'Residential', count: 4_800, avgMonthlyUsage: 7_200, usageStdDev: 3_000, rateStructureId: 'rs-res' },
      { id: 'com', name: 'Commercial',  count: 420,   avgMonthlyUsage: 22_000, usageStdDev: null, rateStructureId: 'rs-res' },
    ],
  },
};
