import React, { useMemo, useState } from 'react';
import { useStore } from '../../store';
import { SectionCard } from '../shared/SectionCard';
import { MetricCard } from '../shared/MetricCard';
import { StatusBadge } from '../shared/StatusBadge';
import { formatCurrency, formatDSCR, formatPercent, formatRatePerKgal } from '../../utils/format';
import { runAdvisor } from '../../engine/advisor';
import { dscrStatus, dscrLabel, dscrColorClass } from '../../engine/dscr';

interface SolvencyGroupProps {
  warnings: string[];
  maxShortfall: number;
  capPct: number;
}

const SolvencyWarningGroup: React.FC<SolvencyGroupProps> = ({ warnings, maxShortfall, capPct }) => {
  const [expanded, setExpanded] = useState(false);

  // Parse affected year numbers for the summary line
  const years = warnings
    .map((w) => { const m = w.match(/^Year (\d+):/); return m ? parseInt(m[1], 10) : null; })
    .filter((y): y is number => y !== null)
    .sort((a, b) => a - b);

  const yearSummary = years.length === 1
    ? `Year ${years[0]}`
    : `${years.length} years (${years[0]}–${years[years.length - 1]})`;

  return (
    <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50">
      <button
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
        onClick={() => setExpanded((v) => !v)}
        type="button"
      >
        <span className="mt-0.5 shrink-0 text-amber-500">⚠</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-800">
            Rate cap binding in {yearSummary} — max shortfall ${maxShortfall.toLocaleString()}
          </p>
          <p className="mt-0.5 text-xs text-amber-700">
            The {capPct}% annual increase cap prevented full cost recovery in {warnings.length} projection{warnings.length > 1 ? 's' : ''}.
            Consider a higher cap, grants, or cost reductions.
          </p>
        </div>
        <span className="ml-2 shrink-0 text-xs text-amber-600 font-medium">
          {expanded ? 'Hide ▲' : 'Details ▼'}
        </span>
      </button>
      {expanded && (
        <div className="border-t border-amber-200 px-4 py-3 space-y-1.5">
          {warnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-700">{w}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export const AdvisorPanel: React.FC = () => {
  const state = useStore();

  const advice = useMemo(() => {
    try {
      return runAdvisor(state, state.advisorSettings);
    } catch {
      return null;
    }
  }, [state]);

  if (!advice) {
    return (
      <SectionCard title="Financial Advisor" subtitle="Rate recommendations based on AWWA M1 cost-of-service methodology">
        <p className="text-sm text-gray-500">Unable to compute recommendations. Check that all inputs are valid.</p>
      </SectionCard>
    );
  }

  const { idealTargetStructure, transitionPlan, warnings, dscrConstraintBinding, affordabilityConstraintBinding } = advice;
  const { advisorSettings } = state;

  const year1 = transitionPlan[1] ?? transitionPlan[0];
  if (!year1) return null;

  const dscrSt = dscrStatus(year1.dscr);

  // Partition warnings: group solvency non-convergence warnings separately
  const SOLVENCY_MARKER = 'could not achieve full cost recovery';
  const solvencyWarnings = warnings.filter((w) => w.includes(SOLVENCY_MARKER));
  const otherWarnings = warnings.filter((w) => !w.includes(SOLVENCY_MARKER));

  // Extract max shortfall from solvency warnings for the summary line
  const maxShortfall = solvencyWarnings.reduce((max, w) => {
    const m = w.match(/Revenue shortfall: \$([0-9,]+)/);
    const n = m ? parseInt(m[1].replace(/,/g, ''), 10) : 0;
    return Math.max(max, n);
  }, 0);

  return (
    <SectionCard
      title="Financial Advisor"
      subtitle="AWWA M1 cost-of-service rate recommendations with DSCR and affordability constraints"
    >
      {/* Solvency warnings — collapsed into a single summary when there are multiple */}
      {solvencyWarnings.length > 0 && (
        <SolvencyWarningGroup
          warnings={solvencyWarnings}
          maxShortfall={maxShortfall}
          capPct={advisorSettings.maxAnnualIncreasePercent}
        />
      )}

      {/* Other warnings (DSCR below target, reserve overdraft) — shown individually */}
      {otherWarnings.length > 0 && (
        <div className="mb-5 space-y-2">
          {otherWarnings.map((w, i) => (
            <div key={i} className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              ⚠ {w}
            </div>
          ))}
        </div>
      )}

      {dscrConstraintBinding && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          ⛔ <strong>DSCR constraint binding:</strong> Full cost recovery requires a DSCR below the {advisorSettings.minDSCR}x minimum.
          Consider grants, refinancing, or extending the rate transition period.
        </div>
      )}
      {affordabilityConstraintBinding && (
        <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          ⚠ <strong>Affordability constraint binding:</strong> Required rates may exceed EPA affordability threshold.
          Consider a Low-Income Assistance Program (LIAP) or phased implementation.
        </div>
      )}

      {/* Year 1 Recommended Rates */}
      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Year 1 Recommended Rates</h4>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Base Rate" value={formatCurrency(year1.baseRate)} subValue="/month" status="neutral" />
        <MetricCard label="Add-on Fee" value={formatCurrency(year1.addonFee)} subValue="/month" status="neutral" />
        <MetricCard label="Tier 1 Rate" value={formatRatePerKgal(year1.tier1Rate)} subValue="/kgal" status="neutral" />
        <MetricCard
          label="DSCR (Year 1)"
          value={formatDSCR(year1.dscr)}
          subValue="coverage ratio"
          status={year1.dscr >= advisorSettings.minDSCR ? 'good' : 'danger'}
        />
      </div>

      {/* Revenue vs Need */}
      <div className="mb-6 rounded-xl border p-4 flex flex-wrap gap-4 justify-between items-center">
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Year 1 Revenue</p>
          <p className="text-2xl font-bold tabular-nums">{formatCurrency(year1.projectedRevenue, true)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Revenue Need</p>
          <p className="text-2xl font-bold tabular-nums">{formatCurrency(year1.revenueNeed, true)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Gap</p>
          <p className={`text-2xl font-bold tabular-nums ${year1.revenueGap >= 0 ? 'text-green-700' : 'text-red-600'}`}>
            {year1.revenueGap >= 0 ? '+' : ''}{formatCurrency(year1.revenueGap)}
          </p>
        </div>
        <div>
          <StatusBadge label={dscrLabel(dscrSt)} colorClass={dscrColorClass(dscrSt)} />
        </div>
      </div>

      {/* Ideal Target Structure */}
      <div className="mb-6">
        <h4 className="mb-1 text-sm font-semibold text-gray-700">Long-Run Ideal Rate Structure</h4>
        <p className="mb-3 text-xs text-gray-400">
          Full cost-of-service recovery target (AWWA M1). The transition plan steps toward this over {state.financial.projectionYears} years.
        </p>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Component</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Ideal Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              <tr>
                <td className="px-4 py-2 text-gray-700">Base Rate (fixed/month)</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(idealTargetStructure.baseRate)}/mo</td>
              </tr>
              {idealTargetStructure.addonFee > 0 && (
                <tr>
                  <td className="px-4 py-2 text-gray-700">Add-on Fee (fixed/month)</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(idealTargetStructure.addonFee)}/mo</td>
                </tr>
              )}
              {idealTargetStructure.tiers.map((t, i) => t.enabled && (
                <tr key={i}>
                  <td className="px-4 py-2 text-gray-700">
                    Tier {i + 1}
                    {t.upperLimit ? ` (0–${t.upperLimit.toLocaleString()} gal)` : ' (unlimited)'}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatRatePerKgal(t.ratePerKgal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Methodology Disclosure */}
      <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500">
        <p className="font-semibold mb-1">Methodology</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Cost-of-service: AWWA M1 simplified methodology</li>
          <li>Amortization: monthly compounding (standard US practice)</li>
          <li>Infrastructure reserve: sinking fund, earning rate {formatPercent(state.financial.reserveEarningRatePercent, 2)}</li>
          <li>DSCR minimum: {advisorSettings.minDSCR}× (USDA Rural Development)</li>
          <li>Max annual rate increase: {advisorSettings.maxAnnualIncreasePercent}%</li>
          <li>Affordability threshold: {advisorSettings.epaAffordabilityThresholdPercent}% of MHI at {state.community.affordabilityReferenceUsage.toLocaleString()} gal/month</li>
          <li>
            <strong>Tier 4 (unlimited) rate assumption:</strong> capacity cost is estimated assuming
            above-average usage in Tier 4 equals ~50% of system average per customer. This may
            understate Tier 4 rates for systems with significant heavy commercial or irrigation users.
          </li>
          <li>This tool is for planning purposes only. Formal rate adoption requires a certified rate study by a licensed engineer.</li>
        </ul>
      </div>
    </SectionCard>
  );
};
