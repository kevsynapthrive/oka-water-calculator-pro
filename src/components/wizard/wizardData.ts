export interface WizardData {
  systemProfile: 'small-rural' | 'mid-tribal' | 'medium-rural' | 'growing-suburb';
  communityName: string;
  state: string;
  medianIncome: number;
  povertyPercent: number;
  residentialCount: number;
  avgUsageGal: number;
  waterLossPercent: number;
  hasCommercial: boolean;
  commercialCount: number;
  commercialAvgUsage: number;
  annualOM: number;
  hasExistingDebt: boolean;
  existingDebtService: number;
  debtYearsRemaining: number;
  reserveBalance: number;
  rateType: 'flat' | 'tiered';
  baseRate: number;
  tier1LimitGal: number;
  tier1Rate: number;
  tier2Rate: number;
}

export const PROFILE_SEEDS: Record<string, Partial<WizardData>> = {
  'small-rural': {
    medianIncome: 38_500, povertyPercent: 26,
    residentialCount: 400, avgUsageGal: 4_800, waterLossPercent: 20,
    hasCommercial: true, commercialCount: 30, commercialAvgUsage: 10_000,
    annualOM: 260_000, reserveBalance: 25_000,
    baseRate: 16.00, tier1LimitGal: 4_000, tier1Rate: 5.50, tier2Rate: 8.00,
  },
  'mid-tribal': {
    medianIncome: 41_200, povertyPercent: 32,
    residentialCount: 800, avgUsageGal: 5_200, waterLossPercent: 24,
    hasCommercial: true, commercialCount: 60, commercialAvgUsage: 12_000,
    annualOM: 520_000, reserveBalance: 50_000,
    baseRate: 18.00, tier1LimitGal: 4_000, tier1Rate: 5.75, tier2Rate: 8.50,
  },
  'medium-rural': {
    medianIncome: 48_000, povertyPercent: 18,
    residentialCount: 1_500, avgUsageGal: 5_000, waterLossPercent: 15,
    hasCommercial: false, commercialCount: 120, commercialAvgUsage: 15_000,
    annualOM: 975_000, reserveBalance: 100_000,
    baseRate: 20.00, tier1LimitGal: 5_000, tier1Rate: 5.50, tier2Rate: 8.00,
  },
  'growing-suburb': {
    medianIncome: 72_000, povertyPercent: 9,
    residentialCount: 4_000, avgUsageGal: 7_200, waterLossPercent: 10,
    hasCommercial: true, commercialCount: 350, commercialAvgUsage: 22_000,
    annualOM: 2_600_000, reserveBalance: 500_000,
    baseRate: 26.00, tier1LimitGal: 6_000, tier1Rate: 5.00, tier2Rate: 7.50,
  },
};

export const INITIAL_WIZARD_DATA: WizardData = {
  systemProfile: 'medium-rural',
  communityName: '',
  state: '',
  medianIncome: 48_000,
  povertyPercent: 18,
  residentialCount: 1_500,
  avgUsageGal: 5_000,
  waterLossPercent: 15,
  hasCommercial: false,
  commercialCount: 120,
  commercialAvgUsage: 15_000,
  annualOM: 975_000,
  hasExistingDebt: false,
  existingDebtService: 0,
  debtYearsRemaining: 0,
  reserveBalance: 100_000,
  rateType: 'flat',
  baseRate: 20.00,
  tier1LimitGal: 5_000,
  tier1Rate: 5.50,
  tier2Rate: 8.00,
};
