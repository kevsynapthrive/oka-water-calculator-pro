import React, { useMemo } from 'react';
import { useStore } from '../../store';
import { SectionCard } from '../shared/SectionCard';
import { formatCurrency, formatPercent, affordabilityColorClass, formatAffordabilityStatus } from '../../utils/format';
import { calculateMonthlyBill } from '../../engine/revenue';
import { affordabilityStatus } from '../../engine/affordability';

const USAGE_LEVELS = [1000, 2000, 3000, 5000, 7500, 10000, 15000, 20000] as const;

export const BillComparison: React.FC = () => {
  const { rateStructures, currentRateStructureId, proposedRateStructureId, community } = useStore();

  const current = rateStructures.find((r) => r.id === currentRateStructureId);
  const proposed = rateStructures.find((r) => r.id === proposedRateStructureId);
  const monthlyMHI = community.medianHouseholdIncome / 12;

  const rows = useMemo(() => {
    return USAGE_LEVELS.map((usage) => {
      const currentBill = current ? calculateMonthlyBill(usage, current) : 0;
      const proposedBill = proposed ? calculateMonthlyBill(usage, proposed) : 0;
      const change = proposedBill - currentBill;
      const changePct = currentBill > 0 ? (change / currentBill) * 100 : 0;
      const currentPct = monthlyMHI > 0 ? (currentBill / monthlyMHI) * 100 : 0;
      const proposedPct = monthlyMHI > 0 ? (proposedBill / monthlyMHI) * 100 : 0;
      return {
        usage, currentBill, proposedBill, change, changePct,
        currentStatus: affordabilityStatus(currentPct), currentPct,
        proposedStatus: affordabilityStatus(proposedPct), proposedPct,
      };
    });
  }, [current, proposed, monthlyMHI]);

  const sameStructure = currentRateStructureId === proposedRateStructureId;

  return (
    <SectionCard
      title="Bill Comparison: Current vs. Proposed"
      subtitle="Monthly bill at multiple usage levels for typical residential customers"
    >
      {sameStructure && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Current and proposed rate structures are the same. Select a different proposed rate structure in Inputs → Rate Structures to compare.
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Monthly Usage</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">
                Current Bill
                <div className="font-normal text-xs text-gray-400">{current?.label ?? '—'}</div>
              </th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">
                Proposed Bill
                <div className="font-normal text-xs text-gray-400">{proposed?.label ?? '—'}</div>
              </th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Change</th>
              <th className="px-4 py-2 text-center font-medium text-gray-500">Current Afford.</th>
              <th className="px-4 py-2 text-center font-medium text-gray-500">Proposed Afford.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {rows.map(({ usage, currentBill, proposedBill, change, changePct, currentStatus, currentPct, proposedStatus, proposedPct }) => (
              <tr key={usage} className={usage === 7500 ? 'bg-blue-50' : ''}>
                <td className="px-4 py-2 text-gray-700">
                  {(usage / 1000).toFixed(0)}k gal
                  {usage === 7500 && (
                    <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">EPA Ref</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(currentBill)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(proposedBill)}</td>
                <td className={`px-4 py-2 text-right tabular-nums font-medium ${
                  change > 0 ? 'text-red-600' : change < 0 ? 'text-green-700' : 'text-gray-500'
                }`}>
                  {change > 0 ? '+' : ''}{formatCurrency(change)}
                  <span className="ml-1 text-xs">({change > 0 ? '+' : ''}{formatPercent(changePct, 1)})</span>
                </td>
                <td className="px-4 py-2 text-center">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${affordabilityColorClass(currentStatus)}`}>
                    {formatAffordabilityStatus(currentStatus)}
                    <span className="ml-1 opacity-75">{formatPercent(currentPct, 2)}</span>
                  </span>
                </td>
                <td className="px-4 py-2 text-center">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${affordabilityColorClass(proposedStatus)}`}>
                    {formatAffordabilityStatus(proposedStatus)}
                    <span className="ml-1 opacity-75">{formatPercent(proposedPct, 2)}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-gray-400">
        Affordability = monthly bill / monthly MHI × 100. MHI = {formatCurrency(community.medianHouseholdIncome)}/yr.
        All bills are per-account monthly totals (base + add-on + volumetric).
      </p>
    </SectionCard>
  );
};
