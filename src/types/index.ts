// ─── Customer / Community ────────────────────────────────────────────────────

export interface CustomerClass {
  id: string;
  name: string;           // e.g. "Residential", "Commercial", "Industrial"
  count: number;          // Number of accounts in this class
  avgMonthlyUsage: number; // gallons/month — average for this class
  usageStdDev: number | null; // Optional: enables lognormal distribution modeling
  rateStructureId: string; // Which rate structure applies to this class
}

export interface CommunityInfo {
  name: string;
  state: string;
  medianHouseholdIncome: number;   // Annual, $
  povertyLevelIncome: number;      // Annual, $  (federal poverty level for family of 4)
  belowPovertyPercent: number;     // % of households below poverty
  affordabilityReferenceUsage: number; // gallons/month — EPA benchmark usage for affordability calc
}

// ─── Rate Structures ─────────────────────────────────────────────────────────

export interface TierRate {
  enabled: boolean;
  upperLimit: number | null; // gallons/month; null = unlimited (last tier)
  ratePerKgal: number;       // $/1,000 gallons
}

export interface RateStructure {
  id: string;
  label: string;            // e.g. "Residential", "Commercial"
  baseRate: number;         // $/month fixed charge
  addonFee: number;         // $/month additional fixed fee
  tiers: TierRate[];        // Up to 4 tiers
}

// ─── Financial Planning ───────────────────────────────────────────────────────

export interface Loan {
  id: string;
  name: string;
  amount: number;        // Principal, $
  annualRatePercent: number; // Interest rate, %
  termYears: number;
  startYear: number;     // 0 = current year
}

export interface CapitalProject {
  id: string;
  name: string;
  totalCost: number;     // $
  year: number;          // Year project occurs (0 = current)
  fundingSource: 'loan' | 'reserves' | 'grant';
  linkedLoanId?: string; // If fundingSource='loan', link to a Loan record
}

export interface Grant {
  id: string;
  name: string;
  amount: number; // $
  year: number;   // Year grant is received (0 = current)
}

export interface CostAllocation {
  fixedCostPercent: number;    // % of O&M that is fixed (customer cost) → base rate
  commodityCostPercent: number;// % of O&M that varies with volume → Tier 1 rate
  // The remainder (100 - fixed - commodity) is capacity cost → higher tiers
}

// ─── System / Operational ────────────────────────────────────────────────────

export interface SystemInfo {
  waterLossPercent: number;     // % of water PRODUCED that is lost (non-revenue water)
  currentReserveBalance: number; // Existing reserve fund balance, $
}

export interface FinancialInputs {
  annualOperatingCost: number;   // Total annual O&M, $
  existingAnnualDebt: number;    // Annual debt service on pre-existing debt not in loan list, $
  existingDebtRemainingYears: number; // Remaining years for existing debt
  infrastructureReplacementCost: number; // Total asset replacement value, $
  assetLifespanYears: number;    // Years to replace assets (sinking fund horizon)
  borrowingRatePercent: number;  // % for new loans
  reserveEarningRatePercent: number; // % earned on reserve fund (separate from borrowing rate)
  inflationRatePercent: number;
  customerGrowthRatePercent: number;
  projectionYears: number;       // 1–30
  targetReserveBalance: number;  // Target reserve fund level, $
  costAllocation: CostAllocation;
}

// ─── Calculation Results ──────────────────────────────────────────────────────

export interface TierBreakdownItem {
  tierIndex: number;
  gallons: number;
  ratePerKgal: number;
  cost: number;
  enabled: boolean;
}

export interface BillCalculation {
  baseRate: number;
  addonFee: number;
  tierBreakdown: TierBreakdownItem[];
  totalVolumetric: number;
  totalMonthlyBill: number;
}

export interface RevenueResult {
  annualRevenueFromBase: number;
  annualRevenueFromAddon: number;
  annualRevenueFromTiers: number;
  totalAnnualRevenue: number;
  revenueByClass: { classId: string; className: string; revenue: number }[];
  usedDistribution: boolean;
}

export interface DebtSummary {
  existingDebt: number;       // Annual payment on pre-list debt
  loansDebt: number;          // Annual payment on Loan records
  projectsDebt: number;       // Annual payment on project loans
  totalAnnualDebtService: number;
}

export interface RevenueSufficiencyResult {
  totalAnnualRevenue: number;
  annualRevenueNeed: number;
  revenueGap: number;           // positive = surplus, negative = deficit
  revenueAdequacyPercent: number;
  operatingCost: number;
  debtService: DebtSummary;
  infrastructureReserveContribution: number;
  grantsApplied: number;
  dscr: number;                 // Debt Service Coverage Ratio
  dscrStatus: DSCRStatus;
}

export type DSCRStatus = 'excellent' | 'adequate' | 'marginal' | 'insufficient' | 'no-debt';

export interface AffordabilityResult {
  referenceUsage: number;
  monthlyBill: number;
  billAsPercentMHI: number;
  billAsPercentPoverty: number;
  mhiAffordabilityStatus: AffordabilityStatus;
  povertyAffordabilityStatus: AffordabilityStatus;
  billComparisonTable: BillComparisonRow[];
}

export type AffordabilityStatus = 'affordable' | 'moderate' | 'burdensome' | 'severe';

export interface BillComparisonRow {
  usage: number;
  monthlyBill: number;
  billAsPercentMHI: number;
  mhiStatus: AffordabilityStatus;
  billAsPercentPoverty: number;
  povertyStatus: AffordabilityStatus;
}

export interface WaterLossResult {
  lossPercent: number;       // % of production (user input)
  totalBilledAnnual: number; // gallons billed per year
  totalProducedAnnual: number;
  waterLostAnnual: number;
  productionCostOfLoss: number; // $ — operating cost attributed to lost water
  revenueEquivalent: number;    // $ — what the lost water would have earned (informational)
}

export interface ProjectionYear {
  year: number;             // 0 = current, 1 = year 1, etc.
  calendarYear: number;
  customerCount: number;
  operatingCost: number;
  debtService: number;
  infrastructureReserveContribution: number;
  capitalProjects: number;
  grants: number;
  revenueNeed: number;
  projectedRevenue: number;
  revenueGap: number;
  reserveBalance: number;
  dscr: number;
  baseRate: number;
  addonFee: number;
  tier1Rate: number;
  recommendedAvgBill: number;
  affordabilityMHI: number;
}

export interface AdvisorResult {
  idealTargetStructure: RateStructure;
  transitionPlan: ProjectionYear[];
  dscrConstraintBinding: boolean; // True if DSCR requirement drove rates above EPA threshold
  affordabilityConstraintBinding: boolean;
  warnings: string[];
}

// ─── Top-level App State ──────────────────────────────────────────────────────

export interface AppState {
  community: CommunityInfo;
  system: SystemInfo;
  financial: FinancialInputs;
  customerClasses: CustomerClass[];
  rateStructures: RateStructure[];
  currentRateStructureId: string;   // Which rate structure is "current"
  proposedRateStructureId: string;  // Which rate structure is "proposed" (what-if)
  loans: Loan[];
  projects: CapitalProject[];
  grants: Grant[];
  compareUsageLevels: number[];     // gallons/month for bill comparison table
  showMathMode: boolean;
}

// ─── Advisor Settings ─────────────────────────────────────────────────────────

export interface AdvisorSettings {
  epaAffordabilityThresholdPercent: number; // default 2.5
  minDSCR: number;                          // default 1.25 (USDA requirement)
  maxAnnualIncreasePercent: number;         // default 12
  sinkingFundTarget: 'full-replacement' | 'annual-contribution';
  baseRateCostSharePercent: number;         // 0–100 — how much of O&M attributed to fixed costs
  tier1Multiplier: number;                  // default 1.0
  tier2Multiplier: number;                  // default 1.5
  tier3Multiplier: number;                  // default 2.5
  tier4Multiplier: number;                  // default 4.0
}
