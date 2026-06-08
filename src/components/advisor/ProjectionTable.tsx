import React, { useMemo } from 'react';
import { useStore } from '../../store';
import { SectionCard } from '../shared/SectionCard';
import { formatCurrency, formatDSCR } from '../../utils/format';
import { runAdvisor } from '../../engine/advisor';
import { dscrStatus, dscrColorClass } from '../../engine/dscr';

export const ProjectionTable: React.FC = () => {
  const state = useStore();

  const transitionPlan = useMemo(() => {
    try {
      return runAdvisor(state, state.advisorSettings).transitionPlan;
    } catch {
      return [];
    }
  }, [state]);

  if (transitionPlan.length === 0) {
    return (
      <SectionCard title="Multi-Year Financial Projection" subtitle="Year-by-year revenue, costs, and DSCR">
        <p className="text-sm text-gray-500">Unable to compute projections. Check inputs.</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Multi-Year Financial Projection"
      subtitle="Revenue, costs, debt service, reserve balance, and DSCR over the projection period"
      collapsible
      defaultOpen
    >
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-center font-medium text-gray-500">Year</th>
              <th className="px-3 py-2 text-right font-medium text-gray-500">Base Rate</th>
              <th className="px-3 py-2 text-right font-medium text-gray-500">Tier 1</th>
              <th className="px-3 py-2 text-right font-medium text-gray-500">Revenue</th>
              <th className="px-3 py-2 text-right font-medium text-gray-500">O&M</th>
              <th className="px-3 py-2 text-right font-medium text-gray-500">Debt Svc</th>
              <th className="px-3 py-2 text-right font-medium text-gray-500">Rsv Contrib</th>
              <th className="px-3 py-2 text-right font-medium text-gray-500">Rev Need</th>
              <th className="px-3 py-2 text-right font-medium text-gray-500">Gap</th>
              <th className="px-3 py-2 text-right font-medium text-gray-500">Rsv Balance</th>
              <th className="px-3 py-2 text-center font-medium text-gray-500">DSCR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {transitionPlan.map((row) => {
              const gap = row.projectedRevenue - row.revenueNeed;
              const dscrSt = dscrStatus(row.dscr);
              return (
                <tr key={row.year} className={row.year === 0 ? 'bg-gray-50 font-medium' : ''}>
                  <td className="px-3 py-2 text-center text-gray-700">
                    {row.year === 0 ? 'Now' : `Yr ${row.year}`}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(row.baseRate)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">${row.tier1Rate.toFixed(3)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(row.projectedRevenue, true)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(row.operatingCost, true)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(row.debtService, true)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(row.infrastructureReserveContribution, true)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(row.revenueNeed, true)}</td>
                  <td className={`px-3 py-2 text-right tabular-nums font-medium ${gap >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {gap >= 0 ? '+' : ''}{formatCurrency(gap, true)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(row.reserveBalance, true)}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium border ${dscrColorClass(dscrSt)}`}>
                      {formatDSCR(row.dscr)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
        <span>Rates are advisor transition-plan values</span>
        <span>Rev need = O&M + debt + reserve − grants</span>
        <span>Reserve balance earns at {state.financial.reserveEarningRatePercent}%/yr</span>
        <span>DSCR = (Revenue − O&M) / Debt Service</span>
      </div>
    </SectionCard>
  );
};
