import React, { useMemo } from 'react';
import { useStore } from '../../store';
import { SectionCard } from '../shared/SectionCard';
import { MetricCard } from '../shared/MetricCard';
import { formatCurrency, formatPercent, formatGallons } from '../../utils/format';
import { calculateWaterLoss } from '../../engine/waterLoss';
import { calculateSystemRevenue } from '../../engine/revenue';

interface ScenarioProps {
  currentNrwPct: number;
  totalBilledPerYear: number;
  annualOperatingCost: number;
  weightedRate: number;
  currentCostOfLoss: number;
}

const NRWSavingsScenarios: React.FC<ScenarioProps> = ({
  currentNrwPct,
  totalBilledPerYear,
  annualOperatingCost,
  weightedRate,
  currentCostOfLoss,
}) => {
  const targets = [15, 10, 5].filter((t) => t < currentNrwPct);
  if (targets.length === 0) return null;

  const rows = targets.map((targetPct) => {
    const r = calculateWaterLoss({
      totalBilledGallonsPerYear: totalBilledPerYear,
      lossPercentOfProduction: targetPct,
      annualOperatingCost,
      weightedAvgRevenueRatePerKgal: weightedRate,
    });
    const annualSavings = currentCostOfLoss - r.productionCostOfLoss;
    return { targetPct, annualSavings, tenYearSavings: annualSavings * 10 };
  });

  return (
    <div className="mt-6">
      <h4 className="mb-1 text-sm font-semibold text-gray-700">NRW Reduction — Savings Scenarios</h4>
      <p className="mb-3 text-xs text-gray-500">
        Estimated reduction in annual production O&M cost if non-revenue water were reduced to the target level.
        Useful for calculating payback periods on leak-detection programs and grant cost-benefit narratives.
      </p>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Target NRW</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Benchmark</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Annual Savings</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">10-Year Cumulative</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {rows.map(({ targetPct, annualSavings, tenYearSavings }) => (
              <tr key={targetPct} className={targetPct === 10 ? 'bg-green-50' : ''}>
                <td className="px-4 py-2 font-semibold tabular-nums">{targetPct}%</td>
                <td className="px-4 py-2 text-gray-500 text-xs">
                  {targetPct <= 5 ? 'Excellent' : targetPct <= 10 ? 'AWWA well-managed' : 'AWWA acceptable'}
                </td>
                <td className="px-4 py-2 text-right tabular-nums font-semibold text-green-700">
                  {formatCurrency(annualSavings)}/yr
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-gray-700">
                  {formatCurrency(tenYearSavings)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-gray-400">
        Savings represent reduced pumping and treatment costs (O&M basis). Does not include capital cost of
        leak detection, pipe replacement, or meter upgrade programs needed to achieve the reduction.
      </p>
    </div>
  );
};

export const WaterLossPanel: React.FC = () => {
  const { system, financial, customerClasses, rateStructures, currentRateStructureId } = useStore();

  const totalBilledPerYear = useMemo(() => {
    return customerClasses.reduce((sum, c) => sum + c.count * c.avgMonthlyUsage * 12, 0);
  }, [customerClasses]);

  const weightedRate = useMemo(() => {
    const allCurrent = customerClasses.map((c) => ({ ...c, rateStructureId: currentRateStructureId }));
    const rev = calculateSystemRevenue(allCurrent, rateStructures);
    return totalBilledPerYear > 0 ? (rev.totalAnnualRevenue / (totalBilledPerYear / 1000)) : 0;
  }, [customerClasses, rateStructures, currentRateStructureId, totalBilledPerYear]);

  const result = useMemo(() => {
    return calculateWaterLoss({
      totalBilledGallonsPerYear: totalBilledPerYear,
      lossPercentOfProduction: system.waterLossPercent,
      annualOperatingCost: financial.annualOperatingCost,
      weightedAvgRevenueRatePerKgal: weightedRate,
    });
  }, [totalBilledPerYear, system.waterLossPercent, financial.annualOperatingCost, weightedRate]);

  const nrwPct = system.waterLossPercent;
  const nrwStatus = nrwPct <= 10 ? 'good' : nrwPct <= 15 ? 'warn' : 'danger';

  return (
    <SectionCard
      title="Non-Revenue Water (NRW) Impact"
      subtitle="Water loss as a percentage of production — AWWA/EPA industry standard calculation basis"
    >
      <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <strong>Calculation method:</strong> NRW is entered as % of water <em>produced</em> (industry standard).
        Total production = billed volume ÷ (1 − loss rate). At {nrwPct}% NRW, the system must produce{' '}
        {(1 / (1 - nrwPct / 100)).toFixed(3)} gallons for every 1 gallon billed.
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="NRW Rate" value={formatPercent(nrwPct, 1)} subValue="of production" status={nrwStatus} />
        <MetricCard label="Total Production" value={formatGallons(result.totalProducedGallonsPerYear)} subValue="gallons/year" status="neutral" />
        <MetricCard label="Water Lost" value={formatGallons(result.waterLostGallonsPerYear)} subValue="gallons/year" status={nrwStatus} />
        <MetricCard label="Annual Cost of Loss" value={formatCurrency(result.productionCostOfLoss)} subValue="production overhead" status={nrwStatus} />
      </div>

      <div className="mb-5 overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Metric</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            <tr>
              <td className="px-4 py-2 text-gray-700">Total billed volume</td>
              <td className="px-4 py-2 text-right tabular-nums">{formatGallons(result.totalBilledGallonsPerYear)}/yr</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-gray-700">Production required to deliver billed volume</td>
              <td className="px-4 py-2 text-right tabular-nums">{formatGallons(result.totalProducedGallonsPerYear)}/yr</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-gray-700">Volume lost (leaks, meter error, flushing, authorized use)</td>
              <td className="px-4 py-2 text-right tabular-nums">{formatGallons(result.waterLostGallonsPerYear)}/yr</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-gray-700">Production overhead factor</td>
              <td className="px-4 py-2 text-right tabular-nums">
                {(result.totalProducedGallonsPerYear / result.totalBilledGallonsPerYear).toFixed(4)}× billed volume
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-gray-700">NRW cost as % of annual O&M</td>
              <td className="px-4 py-2 text-right tabular-nums">
                {formatPercent(financial.annualOperatingCost > 0
                  ? (result.productionCostOfLoss / financial.annualOperatingCost) * 100 : 0, 1)}
              </td>
            </tr>
            <tr className="bg-gray-50 font-semibold">
              <td className="px-4 py-2">Annual production cost attributable to NRW</td>
              <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(result.productionCostOfLoss)}</td>
            </tr>
            {result.revenueEquivalent > 0 && (
              <tr className="text-gray-400 italic">
                <td className="px-4 py-2 text-sm">Revenue equivalent (informational — not recoverable)</td>
                <td className="px-4 py-2 text-right tabular-nums text-sm">{formatCurrency(result.revenueEquivalent)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-gray-700">AWWA Benchmarks</h4>
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div className={`rounded-lg border p-3 ${nrwPct <= 10 ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
            <p className="font-semibold text-green-700">≤ 10%</p>
            <p className="text-gray-500 mt-0.5">Well-managed system</p>
          </div>
          <div className={`rounded-lg border p-3 ${nrwPct > 10 && nrwPct <= 15 ? 'border-amber-200 bg-amber-50' : 'border-gray-200'}`}>
            <p className="font-semibold text-amber-700">10–15%</p>
            <p className="text-gray-500 mt-0.5">Acceptable — monitor</p>
          </div>
          <div className={`rounded-lg border p-3 ${nrwPct > 15 ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
            <p className="font-semibold text-red-700">&gt; 15%</p>
            <p className="text-gray-500 mt-0.5">Action needed — investigate leaks</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Production cost is the O&M overhead of pumping and treating water that never reaches a customer. The system is already billing only metered volume — the impact is higher unit cost per delivered gallon.
        </p>
      </div>

      <NRWSavingsScenarios
        currentNrwPct={nrwPct}
        totalBilledPerYear={totalBilledPerYear}
        annualOperatingCost={financial.annualOperatingCost}
        weightedRate={weightedRate}
        currentCostOfLoss={result.productionCostOfLoss}
      />
    </SectionCard>
  );
};
