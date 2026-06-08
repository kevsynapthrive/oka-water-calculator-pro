import React, { useMemo } from 'react';
import { useStore } from '../../store';
import { SectionCard } from '../shared/SectionCard';
import { MetricCard } from '../shared/MetricCard';
import { StatusBadge } from '../shared/StatusBadge';
import { formatCurrency, formatPercent, affordabilityColorClass, formatAffordabilityStatus } from '../../utils/format';
import { analyzeAffordability, EPA_REFERENCE_USAGE_GAL } from '../../engine/affordability';

const COMPARE_USAGES = [2000, 3000, 5000, 7500, 10000, 15000];

interface Props { mode: 'current' | 'proposed'; }

export const AffordabilityPanel: React.FC<Props> = ({ mode }) => {
  const { community, rateStructures, currentRateStructureId, proposedRateStructureId } = useStore();

  const rsId = mode === 'current' ? currentRateStructureId : proposedRateStructureId;
  const rs = rateStructures.find((r) => r.id === rsId);

  const analysis = useMemo(() => {
    if (!rs) return null;
    return analyzeAffordability({
      rateStructure: rs,
      referenceUsageGal: community.affordabilityReferenceUsage ?? EPA_REFERENCE_USAGE_GAL,
      medianHouseholdIncome: community.medianHouseholdIncome,
      povertyLevelIncome: community.povertyLevelIncome,
      compareUsageLevels: COMPARE_USAGES,
    });
  }, [rs, community]);

  if (!analysis) return null;

  const { mhiStatus, billAsPercentMHI, monthlyBillAtReference, billAsPercentPoverty, povertyStatus, comparisonTable } = analysis;
  const annualBill = monthlyBillAtReference * 12;

  return (
    <SectionCard
      title={`Affordability Analysis — ${mode === 'current' ? 'Current Rates' : 'Proposed Rates'}`}
      subtitle={`EPA benchmark: annual water bill as % of MHI at ${(community.affordabilityReferenceUsage ?? EPA_REFERENCE_USAGE_GAL).toLocaleString()} gal/month`}
    >
      {/* Key Metrics */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label={`Bill @ ${((community.affordabilityReferenceUsage ?? EPA_REFERENCE_USAGE_GAL) / 1000).toFixed(1)}k gal`}
          value={formatCurrency(monthlyBillAtReference)}
          subValue="monthly (EPA ref)"
          status="neutral"
        />
        <MetricCard
          label="Annual Bill"
          value={formatCurrency(annualBill)}
          subValue="at reference usage"
          status="neutral"
        />
        <MetricCard
          label="Median HHI"
          value={formatCurrency(community.medianHouseholdIncome, true)}
          subValue="annual"
          status="neutral"
        />
        <MetricCard
          label="Affordability Burden"
          value={formatPercent(billAsPercentMHI, 2)}
          subValue="of MHI"
          status={mhiStatus === 'affordable' ? 'good' : mhiStatus === 'moderate' ? 'warn' : 'danger'}
        />
      </div>

      {/* Status Banner */}
      <div className="mb-6 flex items-center justify-between rounded-xl border p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">EPA Affordability Classification</p>
          <p className="mt-1 text-2xl font-bold">{formatAffordabilityStatus(mhiStatus)}</p>
          <p className="mt-0.5 text-xs text-gray-400">
            Thresholds: ≤1.5% = Affordable · ≤2.5% = Moderate · ≤4.0% = Burdensome · &gt;4.0% = Severe
          </p>
        </div>
        <StatusBadge
          label={formatAffordabilityStatus(mhiStatus)}
          colorClass={affordabilityColorClass(mhiStatus)}
          size="lg"
        />
      </div>

      {/* Poverty Level Impact */}
      {community.povertyLevelIncome > 0 && (
        <div className={`mb-6 rounded-lg border p-4 ${billAsPercentPoverty > 10 ? 'border-red-200 bg-red-50' : 'border-amber-100 bg-amber-50'}`}>
          <p className="text-sm font-semibold text-gray-800">Low-Income Household Impact</p>
          <p className="mt-1 text-sm text-gray-600">
            At federal poverty level ({formatCurrency(community.povertyLevelIncome)}/yr), the monthly water bill
            is <strong className={billAsPercentPoverty > 10 ? 'text-red-700' : 'text-amber-700'}>
              {formatPercent(billAsPercentPoverty, 1)}
            </strong> of monthly income — classified as <strong>{formatAffordabilityStatus(povertyStatus)}</strong>.
            {billAsPercentPoverty > 10 && (
              <span className="text-red-700"> This exceeds typical utility assistance program thresholds. A Low-Income Assistance Program (LIAP) should be considered.</span>
            )}
          </p>
        </div>
      )}

      {/* Bill Comparison Table */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-gray-700">Bill Affordability by Usage Level</h4>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Monthly Usage</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Monthly Bill</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Annual Bill</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">% of MHI</th>
                <th className="px-4 py-2 text-center font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {comparisonTable.map(({ usage, monthlyBill, billAsPercentMHI: pct, mhiStatus: st }) => (
                <tr key={usage} className={usage === EPA_REFERENCE_USAGE_GAL ? 'bg-blue-50' : ''}>
                  <td className="px-4 py-2 text-gray-700">
                    {(usage / 1000).toFixed(0)}k gal
                    {usage === EPA_REFERENCE_USAGE_GAL && (
                      <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">EPA Ref</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(monthlyBill)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(monthlyBill * 12)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatPercent(pct, 2)}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${affordabilityColorClass(st)}`}>
                      {formatAffordabilityStatus(st)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Rate structure: "{rs?.label}". MHI = {formatCurrency(community.medianHouseholdIncome)}/yr.
          Affordability = annual bill / MHI × 100%.
        </p>
      </div>
    </SectionCard>
  );
};
