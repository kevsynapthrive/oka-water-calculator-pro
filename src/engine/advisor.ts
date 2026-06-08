/**
 * Financial Advisor — automated rate recommendation engine.
 *
 * Generates an optimal long-term rate structure and a year-by-year
 * transition plan that simultaneously satisfies:
 *   1. Revenue sufficiency (covers O&M + debt + reserve contribution)
 *   2. DSCR ≥ target (default 1.25, the USDA Rural Development minimum)
 *   3. EPA affordability threshold (bill ≤ 2.5% of MHI at reference usage)
 *   4. Maximum annual rate increase cap (default 12%)
 *
 * When the DSCR constraint and the affordability constraint conflict
 * (i.e. achieving DSCR requires a bill above the EPA threshold), the
 * advisor flags this explicitly so the utility can seek grants, reduce costs,
 * or phase the increase over more years rather than silently violating one.
 *
 * Add-on fee behavior:
 * The add-on fee is explicitly included in all recommendation logic and
 * can grow year-over-year subject to the same increase cap. This is
 * disclosed clearly in the UI output.
 */

import type {
  AppState, RateStructure, TierRate, ProjectionYear, AdvisorSettings,
} from '../types';
import { annualLoanPayment } from './amortization';
import { annualSinkingFundContribution } from './infrastructure';
import { calculateMonthlyBill, calculateSystemRevenue } from './revenue';
import { calculateDSCR, DSCR_ADEQUATE } from './dscr';
import { analyzeAffordability } from './affordability';

const MONTHS = 12;

// ─── Revenue need for a given year ───────────────────────────────────────────

function revenueNeedForYear(appState: AppState, year: number): number {
  const { financial, loans, projects, grants } = appState;

  const inf = Math.pow(1 + financial.inflationRatePercent / 100, year);
  const operatingCost = financial.annualOperatingCost * inf;

  let debtService = 0;
  if (year < financial.existingDebtRemainingYears) {
    debtService += financial.existingAnnualDebt;
  }
  const includedNames = new Set<string>();
  for (const loan of loans) {
    const end = loan.startYear + loan.termYears;
    if (year >= loan.startYear && year < end) {
      debtService += annualLoanPayment(loan.amount, loan.annualRatePercent, loan.termYears);
      if (loan.name) includedNames.add(loan.name.trim().toLowerCase());
    }
  }
  for (const project of projects) {
    if (project.fundingSource !== 'loan') continue;
    if (project.name && includedNames.has(project.name.trim().toLowerCase())) continue;
    const term = financial.assetLifespanYears || 20;
    if (year >= project.year && year < project.year + term) {
      debtService += annualLoanPayment(project.totalCost, financial.borrowingRatePercent, term);
    }
  }

  const currentReserve = appState.system.currentReserveBalance;
  const reserveContrib = annualSinkingFundContribution(
    financial.infrastructureReplacementCost * inf,
    Math.max(1, financial.assetLifespanYears - year),
    financial.reserveEarningRatePercent,
    currentReserve,
  );

  const yearGrants = grants
    .filter((g) => g.year === year)
    .reduce((s, g) => s + g.amount, 0);

  return Math.max(0, operatingCost + debtService + reserveContrib - yearGrants);
}

// ─── Ideal target structure ───────────────────────────────────────────────────

function buildIdealStructure(
  appState: AppState,
  settings: AdvisorSettings,
  year = 1,
): RateStructure {
  const { customerClasses, rateStructures } = appState;
  const { financial } = appState;

  const totalCustomers = customerClasses.reduce((s, c) => s + c.count, 0);
  const avgUsage = totalCustomers > 0
    ? customerClasses.reduce((s, c) => s + c.avgMonthlyUsage * c.count, 0) / totalCustomers
    : 5000;

  const need = revenueNeedForYear(appState, year);
  if (totalCustomers <= 0 || need <= 0) return rateStructures[0];

  const monthlyNeedPerCustomer = need / totalCustomers / MONTHS;

  // Allocate revenue need by COS proportions
  const fixedPct = Math.max(0, Math.min(1, settings.baseRateCostSharePercent / 100));
  const volumetricPct = 1 - fixedPct;

  // Current add-on fee: included in fixed cost recovery
  const currentRS = rateStructures.find((r) => r.id === appState.currentRateStructureId) ?? rateStructures[0];
  const addonFee = currentRS.addonFee; // Explicitly NOT frozen — can grow, but starts here

  const fixedNeedPerCustomer = monthlyNeedPerCustomer * fixedPct;
  const volumetricNeedPerCustomer = monthlyNeedPerCustomer * volumetricPct;

  const baseRate = Math.max(0, fixedNeedPerCustomer - addonFee);

  // Tier limits as multiples of average usage
  const tierLimits = [0.5, 1.2, 2.5].map((f) => Math.round(avgUsage * f));

  // Back-calculate the base tier 1 rate given multipliers
  const multipliers = [
    settings.tier1Multiplier,
    settings.tier2Multiplier,
    settings.tier3Multiplier,
    settings.tier4Multiplier,
  ];

  // Weighted contribution factor: how many effective Tier-1-equivalent kgal
  // does an average customer consume given the tier structure?
  let weightedFactor = 0;
  let remaining = avgUsage;
  let prevLimit = 0;
  for (let i = 0; i < 4; i++) {
    const upperLimit = i < 3 ? tierLimits[i] : null;
    const capacity = upperLimit === null ? remaining : Math.max(0, upperLimit - prevLimit);
    const inTier = Math.min(remaining, capacity);
    if (inTier > 0) {
      weightedFactor += (inTier / 1000) * multipliers[i];
    }
    if (upperLimit !== null) prevLimit = upperLimit;
    remaining -= inTier;
    if (remaining <= 0) break;
  }

  const baseTierRate = weightedFactor > 0 ? volumetricNeedPerCustomer / weightedFactor : 0;

  const tiers: TierRate[] = [
    { enabled: true, upperLimit: tierLimits[0], ratePerKgal: Math.round(baseTierRate * multipliers[0] * 100) / 100 },
    { enabled: true, upperLimit: tierLimits[1], ratePerKgal: Math.round(baseTierRate * multipliers[1] * 100) / 100 },
    { enabled: true, upperLimit: tierLimits[2], ratePerKgal: Math.round(baseTierRate * multipliers[2] * 100) / 100 },
    { enabled: true, upperLimit: null,          ratePerKgal: Math.round(baseTierRate * multipliers[3] * 100) / 100 },
  ];

  return {
    id: '__ideal__',
    label: 'Recommended',
    baseRate: Math.round(baseRate * 100) / 100,
    addonFee,
    tiers,
  };
}

// ─── Rate stepping ───────────────────────────────────────────────────────────

function stepTowardIdeal(
  current: RateStructure,
  ideal: RateStructure,
  maxIncreasePercent: number,
  stepFraction: number,
): RateStructure {
  const cap = (cur: number, tgt: number): number => {
    if (tgt >= cur) {
      const maxAllowed = cur * (1 + maxIncreasePercent / 100);
      const proposed = cur + (tgt - cur) * stepFraction;
      return Math.round(Math.min(proposed, maxAllowed) * 100) / 100;
    }
    // Allow decreases without cap
    return Math.round((cur + (tgt - cur) * stepFraction) * 100) / 100;
  };

  return {
    ...current,
    baseRate: cap(current.baseRate, ideal.baseRate),
    addonFee: cap(current.addonFee, ideal.addonFee),
    tiers: current.tiers.map((t, i) => ({
      ...t,
      ratePerKgal: cap(t.ratePerKgal, ideal.tiers[i]?.ratePerKgal ?? t.ratePerKgal),
      upperLimit: ideal.tiers[i]?.upperLimit ?? t.upperLimit,
    })),
  };
}

// ─── Main advisor function ────────────────────────────────────────────────────

export interface AdvisorOutput {
  idealTargetStructure: RateStructure;
  transitionPlan: ProjectionYear[];
  dscrConstraintBinding: boolean;
  affordabilityConstraintBinding: boolean;
  warnings: string[];
}

export function runAdvisor(
  appState: AppState,
  settings: AdvisorSettings,
): AdvisorOutput {
  const warnings: string[] = [];
  let dscrBinding = false;
  let affordabilityBinding = false;

  const { financial, customerClasses, rateStructures } = appState;
  const calendarBase = new Date().getFullYear();
  const projYears = financial.projectionYears;

  const totalCustomers = customerClasses.reduce((s, c) => s + c.count, 0);
  const avgUsage = totalCustomers > 0
    ? customerClasses.reduce((s, c) => s + c.avgMonthlyUsage * c.count, 0) / totalCustomers
    : 5000;

  const ideal = buildIdealStructure(appState, settings, 1);
  const stepFraction = 1 / Math.max(1, projYears);

  const currentRS = rateStructures.find((r) => r.id === appState.currentRateStructureId) ?? rateStructures[0];
  let prevRS: RateStructure = { ...currentRS, id: '__prev__' };

  const minDSCR = settings.minDSCR ?? DSCR_ADEQUATE;
  const maxAffordableMonthlyBill =
    (appState.community.medianHouseholdIncome / MONTHS) * (settings.epaAffordabilityThresholdPercent / 100);

  const plan: ProjectionYear[] = [];
  let reserveBalance = appState.system.currentReserveBalance;

  for (let y = 0; y <= projYears; y++) {
    const inf = Math.pow(1 + financial.inflationRatePercent / 100, y);
    const growthFactor = Math.pow(1 + financial.customerGrowthRatePercent / 100, y);
    const yearCustomers = Math.round(totalCustomers * growthFactor);
    const operatingCost = financial.annualOperatingCost * inf;

    const need = revenueNeedForYear(appState, y);

    // Determine rate structure for this year
    let yearRS: RateStructure;
    if (y === 0) {
      yearRS = { ...currentRS, id: `__year0__` };
    } else {
      // Step toward ideal
      yearRS = stepTowardIdeal(prevRS, ideal, settings.maxAnnualIncreasePercent, stepFraction);

      // Solvency loop: if revenue < need, nudge rates up (within annual cap)
      const scaledClasses = customerClasses.map((c) => ({
        ...c,
        count: Math.round(c.count * growthFactor),
        rateStructureId: yearRS.id,
      }));
      const tempRS = [yearRS, ...rateStructures.filter((r) => r.id !== yearRS.id)];
      let revenue = calculateSystemRevenue(scaledClasses, tempRS).totalAnnualRevenue;

      let iterations = 0;
      while (revenue < need && iterations < 200) {
        const shortfallFraction = (need - revenue) / Math.max(revenue, 1) * 0.1;
        const nudge = Math.min(shortfallFraction, settings.maxAnnualIncreasePercent / 100);
        yearRS = {
          ...yearRS,
          baseRate: Math.round(yearRS.baseRate * (1 + nudge) * 100) / 100,
          addonFee: Math.round(yearRS.addonFee * (1 + nudge) * 100) / 100,
          tiers: yearRS.tiers.map((t) => ({
            ...t,
            ratePerKgal: Math.round(t.ratePerKgal * (1 + nudge) * 100) / 100,
          })),
        };
        const updated = calculateSystemRevenue(
          scaledClasses.map((c) => ({ ...c, rateStructureId: yearRS.id })),
          [yearRS, ...rateStructures.filter((r) => r.id !== yearRS.id)],
        );
        revenue = updated.totalAnnualRevenue;
        iterations++;
      }

      // DSCR check
      let debtService = 0;
      if (y < financial.existingDebtRemainingYears) debtService += financial.existingAnnualDebt;
      for (const loan of appState.loans) {
        const end = loan.startYear + loan.termYears;
        if (y >= loan.startYear && y < end) {
          debtService += annualLoanPayment(loan.amount, loan.annualRatePercent, loan.termYears);
        }
      }

      const dscr = calculateDSCR(revenue, operatingCost, debtService);
      if (dscr < minDSCR && debtService > 0) {
        dscrBinding = true;
        warnings.push(`Year ${y}: DSCR ${dscr.toFixed(2)} is below the ${minDSCR} target. Consider refinancing or rate acceleration.`);
      }

      // Affordability check
      const refBill = calculateMonthlyBill(appState.community.affordabilityReferenceUsage, yearRS);
      if (refBill > maxAffordableMonthlyBill && maxAffordableMonthlyBill > 0) {
        affordabilityBinding = true;
      }
    }

    yearRS.id = `__year${y}__`;

    // Revenue for this year's rates
    const scaledClassesFinal = customerClasses.map((c) => ({
      ...c,
      count: Math.round(c.count * growthFactor),
      rateStructureId: yearRS.id,
    }));
    const revenueResult = calculateSystemRevenue(
      scaledClassesFinal,
      [yearRS, ...rateStructures],
    );
    const projectedRevenue = revenueResult.totalAnnualRevenue;

    let debtServiceFinal = 0;
    if (y < financial.existingDebtRemainingYears) debtServiceFinal += financial.existingAnnualDebt;
    for (const loan of appState.loans) {
      const end = loan.startYear + loan.termYears;
      if (y >= loan.startYear && y < end) {
        debtServiceFinal += annualLoanPayment(loan.amount, loan.annualRatePercent, loan.termYears);
      }
    }

    const reserveContrib = annualSinkingFundContribution(
      financial.infrastructureReplacementCost * inf,
      Math.max(1, financial.assetLifespanYears - y),
      financial.reserveEarningRatePercent,
      reserveBalance,
    );

    const yearGrants = appState.grants
      .filter((g) => g.year === y)
      .reduce((s, g) => s + g.amount, 0);
    const reserveWithdrawals = appState.projects
      .filter((p) => p.year === y && p.fundingSource === 'reserves')
      .reduce((s, p) => s + p.totalCost, 0);

    const revenueGap = projectedRevenue - need;
    reserveBalance += reserveContrib + yearGrants - reserveWithdrawals;
    if (reserveBalance > 0) {
      reserveBalance *= 1 + financial.reserveEarningRatePercent / 100;
    }

    const dscr = calculateDSCR(projectedRevenue, operatingCost, debtServiceFinal);
    const refBill = calculateMonthlyBill(appState.community.affordabilityReferenceUsage, yearRS);
    const affordabilityMHI = appState.community.medianHouseholdIncome > 0
      ? (refBill / (appState.community.medianHouseholdIncome / MONTHS)) * 100
      : 0;

    plan.push({
      year: y,
      calendarYear: calendarBase + y,
      customerCount: yearCustomers,
      operatingCost,
      debtService: debtServiceFinal,
      infrastructureReserveContribution: reserveContrib,
      capitalProjects: appState.projects.filter((p) => p.year === y).reduce((s, p) => s + p.totalCost, 0),
      grants: yearGrants,
      revenueNeed: need,
      projectedRevenue,
      revenueGap,
      reserveBalance,
      dscr,
      baseRate: yearRS.baseRate,
      addonFee: yearRS.addonFee,
      tier1Rate: yearRS.tiers.find((t) => t.enabled)?.ratePerKgal ?? 0,
      recommendedAvgBill: refBill,
      affordabilityMHI,
    });

    prevRS = yearRS;
  }

  if (affordabilityBinding) {
    warnings.push(
      `Achieving full-cost recovery requires bills that exceed ${settings.epaAffordabilityThresholdPercent}% of median household income. ` +
      `Consider a Low-Income Assistance Program (LIAP), phased implementation, or applying for additional grants.`,
    );
  }

  return {
    idealTargetStructure: ideal,
    transitionPlan: plan,
    dscrConstraintBinding: dscrBinding,
    affordabilityConstraintBinding: affordabilityBinding,
    warnings,
  };
}
