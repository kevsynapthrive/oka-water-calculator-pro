/**
 * Long-term financial projections engine.
 *
 * Key fixes over the previous version:
 * - Revenue is inflated year-over-year (customer growth applied consistently)
 * - Debt service uses consistent monthly-compounding amortization
 * - Infrastructure reserve uses sinking fund formula
 * - Reserve interest uses the earning rate (separate from borrowing rate)
 * - Starting reserve balance from user input
 * - Grants are properly matched to their year
 */

import type {
  AppState, ProjectionYear, Loan, CapitalProject, Grant,
} from '../types';
import { annualLoanPayment } from './amortization';
import { annualSinkingFundContribution } from './infrastructure';
import { calculateSystemRevenue } from './revenue';
import { calculateDSCR, dscrStatus } from './dscr';

interface ProjectionInputs {
  appState: AppState;
  rateStructureIds: { current: string; proposed: string };
  startingReserveBalance: number;
}

/** Public convenience wrapper — accepts the full AppState */
export function buildProjections(appState: AppState): ProjectionYear[] {
  return buildProjection({
    appState,
    rateStructureIds: {
      current: appState.currentRateStructureId,
      proposed: appState.proposedRateStructureId,
    },
    startingReserveBalance: appState.system.currentReserveBalance,
  });
}

export function buildProjection(inputs: ProjectionInputs): ProjectionYear[] {
  const { appState, rateStructureIds, startingReserveBalance } = inputs;
  const { financial, customerClasses, rateStructures, loans, projects, grants } = appState;

  const calendarBase = new Date().getFullYear();
  const years = financial.projectionYears;
  const result: ProjectionYear[] = [];

  let reserveBalance = startingReserveBalance;

  // Horizon for sinking fund (years remaining in asset life)
  const sinkingFundHorizon = Math.max(1, financial.assetLifespanYears);

  for (let y = 0; y <= years; y++) {
    const inflationFactor   = Math.pow(1 + financial.inflationRatePercent / 100, y);
    const growthFactor      = Math.pow(1 + financial.customerGrowthRatePercent / 100, y);

    // Scale customer counts for this year
    const scaledClasses = customerClasses.map((cls) => ({
      ...cls,
      count: Math.round(cls.count * growthFactor),
    }));

    // Rate structure: year 0 = current, year 1+ = proposed
    const rsId = y === 0 ? rateStructureIds.current : rateStructureIds.proposed;
    const scaledRateStructures = rateStructures.map((rs) =>
      rs.id === rsId ? rs : rs,
    );
    const scaledClassesForRev = scaledClasses.map((cls) => ({
      ...cls,
      rateStructureId: rsId,
    }));

    // Revenue for this year
    const revenueResult = calculateSystemRevenue(scaledClassesForRev, scaledRateStructures);
    const projectedRevenue = revenueResult.totalAnnualRevenue;

    // Operating cost with inflation
    const operatingCost = financial.annualOperatingCost * inflationFactor;

    // Debt service: pre-existing manual entry
    let totalDebtService = 0;
    if (y < financial.existingDebtRemainingYears) {
      totalDebtService += financial.existingAnnualDebt;
    }

    // Debt service: loan records
    const includedProjectNames = new Set<string>();
    for (const loan of loans) {
      const start = loan.startYear;
      const end = start + loan.termYears;
      if (y >= start && y < end) {
        totalDebtService += annualLoanPayment(loan.amount, loan.annualRatePercent, loan.termYears);
        if (loan.name) includedProjectNames.add(loan.name.trim().toLowerCase());
      }
    }

    // Debt service: loan-funded projects (only if no matching Loan record)
    for (const project of projects) {
      if (project.fundingSource !== 'loan') continue;
      if (project.name && includedProjectNames.has(project.name.trim().toLowerCase())) continue;
      const start = project.year;
      const loanTerm = financial.assetLifespanYears || 20;
      const end = start + loanTerm;
      if (y >= start && y < end) {
        totalDebtService += annualLoanPayment(
          project.totalCost,
          financial.borrowingRatePercent,
          loanTerm,
        );
      }
    }

    // Infrastructure reserve contribution (sinking fund, consistent)
    const reserveContribution = annualSinkingFundContribution(
      financial.infrastructureReplacementCost * inflationFactor, // inflation-adjusted target
      sinkingFundHorizon,
      financial.reserveEarningRatePercent,
      reserveBalance,
    );

    // Grants for this year
    const yearGrants = grants
      .filter((g: Grant) => g.year === y)
      .reduce((s: number, g: Grant) => s + g.amount, 0);

    // Capital projects from reserves
    const reserveWithdrawals = projects
      .filter((p: CapitalProject) => p.year === y && p.fundingSource === 'reserves')
      .reduce((s: number, p: CapitalProject) => s + p.totalCost, 0);

    // Total revenue need (net of grants)
    const revenueNeed = Math.max(
      0,
      operatingCost + totalDebtService + reserveContribution - yearGrants,
    );

    const revenueGap = projectedRevenue - revenueNeed;

    // Reserve balance update
    reserveBalance += reserveContribution + yearGrants - reserveWithdrawals;
    if (reserveBalance < 0) {
      reserveBalance = 0; // clamp; advisor.ts emits the overdraft warning
    } else {
      reserveBalance *= 1 + financial.reserveEarningRatePercent / 100;
    }

    // DSCR
    const dscr = calculateDSCR(projectedRevenue, operatingCost, totalDebtService);

    // Representative rate info from the rate structure
    const rs = rateStructures.find((r) => r.id === rsId) ?? rateStructures[0];

    result.push({
      year: y,
      calendarYear: calendarBase + y,
      customerCount: scaledClasses.reduce((s, c) => s + c.count, 0),
      operatingCost,
      debtService: totalDebtService,
      infrastructureReserveContribution: reserveContribution,
      capitalProjects: projects
        .filter((p: CapitalProject) => p.year === y)
        .reduce((s: number, p: CapitalProject) => s + p.totalCost, 0),
      grants: yearGrants,
      revenueNeed,
      projectedRevenue,
      revenueGap,
      reserveBalance,
      dscr,
      baseRate: rs.baseRate,
      addonFee: rs.addonFee,
      tier1Rate: rs.tiers.find((t) => t.enabled)?.ratePerKgal ?? 0,
      recommendedAvgBill: 0, // Filled in by advisor
      affordabilityMHI: 0,   // Filled in by advisor
    });
  }

  return result;
}
