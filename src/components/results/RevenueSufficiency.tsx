import React, { useMemo } from 'react';
import { useStore } from '../../store';
import { SectionCard } from '../shared/SectionCard';
import { MetricCard } from '../shared/MetricCard';
import { StatusBadge } from '../shared/StatusBadge';
import { formatCurrency, formatPercent, formatDSCR } from '../../utils/format';
import { calculateSystemRevenue } from '../../engine/revenue';
import { annualSinkingFundContribution } from '../../engine/infrastructure';
import { annualLoanPayment } from '../../engine/amortization';
import { calculateDSCR, dscrStatus, dscrLabel, dscrColorClass } from '../../engine/dscr';

interface Props { mode: 'current' | 'proposed'; }

export const RevenueSufficiency: React.FC<Props> = ({ mode }) => {
  const state = useStore();
  const { financial, customerClasses, rateStructures, loans, projects, grants,
          currentRateStructureId, proposedRateStructureId, system } = state;

  const rsId = mode === 'current' ? currentRateStructureId : proposedRateStructureId;
  const analysisYear = mode === 'current' ? 0 : 1;

  const result = useMemo(() => {
    // Revenue
    const classesForMode = customerClasses.map((c) => ({ ...c, rateStructureId: rsId }));
    const rev = calculateSystemRevenue(classesForMode, rateStructures);

    // Operating cost (year 1 inflated for proposed)
    const inf = analysisYear > 0 ? Math.pow(1 + financial.inflationRatePercent / 100, analysisYear) : 1;
    const opCost = financial.annualOperatingCost * inf;

    // Debt service
    let debtService = 0;
    if (analysisYear < financial.existingDebtRemainingYears) {
      debtService += financial.existingAnnualDebt;
    }
    const includedNames = new Set<string>();
    for (const loan of loans) {
      const end = loan.startYear + loan.termYears;
      if (analysisYear >= loan.startYear && analysisYear < end) {
        debtService += annualLoanPayment(loan.amount, loan.annualRatePercent, loan.termYears);
        if (loan.name) includedNames.add(loan.name.trim().toLowerCase());
      }
    }
    for (const proj of projects) {
      if (proj.fundingSource !== 'loan') continue;
      if (proj.name && includedNames.has(proj.name.trim().toLowerCase())) continue;
      const term = financial.assetLifespanYears || 20;
      if (analysisYear >= proj.year && analysisYear < proj.year + term) {
        debtService += annualLoanPayment(proj.totalCost, financial.borrowingRatePercent, term);
      }
    }

    // Infrastructure reserve (sinking fund — consistent with advisor)
    const reserveContrib = annualSinkingFundContribution(
      financial.infrastructureReplacementCost * inf,
      Math.max(1, financial.assetLifespanYears),
      financial.reserveEarningRatePercent,
      system.currentReserveBalance,
    );

    // Grants
    const yearGrants = grants.filter((g) => g.year === analysisYear).reduce((s, g) => s + g.amount, 0);

    const revenueNeed = Math.max(0, opCost + debtService + reserveContrib - yearGrants);
    const revenueGap = rev.totalAnnualRevenue - revenueNeed;
    const adequacyPct = revenueNeed > 0 ? (rev.totalAnnualRevenue / revenueNeed) * 100 : 100;

    const dscr = calculateDSCR(rev.totalAnnualRevenue, opCost, debtService);

    return {
      revenue: rev.totalAnnualRevenue,
      revenueFromBase: rev.annualRevenueFromBase,
      revenueFromAddon: rev.annualRevenueFromAddon,
      revenueFromTiers: rev.annualRevenueFromTiers,
      opCost, debtService, reserveContrib, yearGrants,
      revenueNeed, revenueGap, adequacyPct,
      dscr, dscrSt: dscrStatus(dscr),
      usedDistribution: rev.usedDistributionForAnyClass,
      byClass: rev.byClass,
    };
  }, [state, mode]);

  const gapStatus = result.revenueGap >= 0 ? 'good' : 'danger';
  const adqStatus = result.adequacyPct >= 100 ? 'good' : result.adequacyPct >= 85 ? 'warn' : 'danger';

  return (
    <SectionCard
      title={`Revenue Sufficiency — ${mode === 'current' ? 'Current Rates' : 'Proposed Rates'}`}
      subtitle={mode === 'current' ? 'Year 0 analysis' : 'Year 1 analysis (inflation-adjusted costs)'}
    >
      {/* Key Metrics */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Annual Revenue" value={formatCurrency(result.revenue, true)}
          subValue={result.usedDistribution ? '(distribution-corrected)' : '(avg usage method)'}
          status="neutral" />
        <MetricCard label="Revenue Need" value={formatCurrency(result.revenueNeed, true)} status="neutral" />
        <MetricCard
          label="Revenue Gap"
          value={formatCurrency(result.revenueGap, true)}
          subValue={result.revenueGap >= 0 ? 'Surplus' : 'Deficit'}
          status={gapStatus}
        />
        <MetricCard
          label="Revenue Adequacy"
          value={formatPercent(result.adequacyPct, 1)}
          subValue="of need covered"
          status={adqStatus}
        />
      </div>

      {/* DSCR */}
      <div className="mb-6 rounded-xl border p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Debt Service Coverage Ratio (DSCR)
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{formatDSCR(result.dscr)}</p>
          <p className="mt-0.5 text-xs text-gray-400">USDA Rural Development minimum: 1.25x</p>
        </div>
        <div className="text-right">
          <StatusBadge label={dscrLabel(result.dscrSt)} colorClass={dscrColorClass(result.dscrSt)} />
          {result.dscr < 1.25 && isFinite(result.dscr) && (
            <p className="mt-2 text-xs text-red-600">
              ⚠ Below USDA minimum. May not qualify for federal infrastructure loans.
            </p>
          )}
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="mb-5">
        <h4 className="mb-3 text-sm font-semibold text-gray-700">Revenue Breakdown</h4>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Source</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Annual Amount</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              <tr><td className="px-4 py-2 text-gray-700">Base Rate</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(result.revenueFromBase)}</td>
                <td className="px-4 py-2 text-right text-gray-500">{formatPercent(result.revenue > 0 ? result.revenueFromBase / result.revenue * 100 : 0, 1)}</td></tr>
              <tr><td className="px-4 py-2 text-gray-700">Add-on Fee</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(result.revenueFromAddon)}</td>
                <td className="px-4 py-2 text-right text-gray-500">{formatPercent(result.revenue > 0 ? result.revenueFromAddon / result.revenue * 100 : 0, 1)}</td></tr>
              <tr><td className="px-4 py-2 text-gray-700">Volumetric (Tiers)</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(result.revenueFromTiers)}</td>
                <td className="px-4 py-2 text-right text-gray-500">{formatPercent(result.revenue > 0 ? result.revenueFromTiers / result.revenue * 100 : 0, 1)}</td></tr>
              <tr className="font-semibold bg-gray-50">
                <td className="px-4 py-2">Total Revenue</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(result.revenue)}</td>
                <td className="px-4 py-2 text-right">100%</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-gray-700">Revenue Need Breakdown</h4>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Component</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Annual Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              <tr><td className="px-4 py-2 text-gray-700">Operating & Maintenance</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(result.opCost)}</td></tr>
              <tr><td className="px-4 py-2 text-gray-700">Debt Service</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(result.debtService)}</td></tr>
              <tr><td className="px-4 py-2 text-gray-700">Infrastructure Reserve (sinking fund)</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(result.reserveContrib)}</td></tr>
              {result.yearGrants > 0 && (
                <tr><td className="px-4 py-2 text-green-700">Less: Grants</td>
                  <td className="px-4 py-2 text-right tabular-nums text-green-700">({formatCurrency(result.yearGrants)})</td></tr>
              )}
              <tr className="font-semibold bg-gray-50">
                <td className="px-4 py-2">Net Revenue Requirement</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(result.revenueNeed)}</td></tr>
              <tr className={result.revenueGap >= 0 ? 'text-green-700' : 'text-red-700'}>
                <td className="px-4 py-2 font-semibold">{result.revenueGap >= 0 ? 'Surplus' : 'Deficit'}</td>
                <td className="px-4 py-2 text-right tabular-nums font-semibold">{formatCurrency(Math.abs(result.revenueGap))}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {result.usedDistribution && (
        <p className="mt-3 text-xs text-green-600">
          ✓ Revenue calculated using lognormal distribution integration — accounts for usage variation across tiered rates.
        </p>
      )}
    </SectionCard>
  );
};
