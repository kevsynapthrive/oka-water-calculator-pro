import React from 'react';
import { useStore } from '../../store';
import { SectionCard } from '../shared/SectionCard';
import { NumberInput } from '../shared/NumberInput';

export const FinancialInfo: React.FC = () => {
  const { financial, setFinancial } = useStore();

  return (
    <SectionCard
      title="Financial Inputs"
      subtitle="Operating costs, debt, infrastructure, and economic assumptions"
      collapsible
    >
      <div className="space-y-6">

        {/* Operating Costs */}
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Operating Costs & Debt</h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <NumberInput
              label="Annual O&M Cost"
              value={financial.annualOperatingCost}
              onChange={(v) => setFinancial({ annualOperatingCost: v })}
              min={0} step={1000} prefix="$"
              tooltip="Total annual operating and maintenance cost. Include salaries, chemicals, power, insurance, and administration."
            />
            <NumberInput
              label="Existing Annual Debt Service"
              value={financial.existingAnnualDebt}
              onChange={(v) => setFinancial({ existingAnnualDebt: v })}
              min={0} step={1000} prefix="$"
              tooltip="Annual payment on existing debt obligations NOT listed in the Loans section below. Use for bonds, notes payable, or other pre-existing obligations."
            />
            <NumberInput
              label="Remaining Years on Existing Debt"
              value={financial.existingDebtRemainingYears}
              onChange={(v) => setFinancial({ existingDebtRemainingYears: v })}
              min={0} max={40} step={1} suffix="years"
              tooltip="Number of years remaining until existing debt (above) is paid off."
            />
          </div>
        </div>

        {/* Infrastructure */}
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Infrastructure Reserve</h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <NumberInput
              label="Total Asset Replacement Cost"
              value={financial.infrastructureReplacementCost}
              onChange={(v) => setFinancial({ infrastructureReplacementCost: v })}
              min={0} step={10000} prefix="$"
              tooltip="Total cost to replace all major infrastructure assets (mains, treatment plant, storage). Used for sinking fund calculation."
            />
            <NumberInput
              label="Asset Lifespan"
              value={financial.assetLifespanYears}
              onChange={(v) => setFinancial({ assetLifespanYears: v })}
              min={5} max={60} step={1} suffix="years"
              tooltip="Weighted average useful life of infrastructure assets. Sinking fund accumulates this cost over this period."
            />
            <NumberInput
              label="Target Reserve Balance"
              value={financial.targetReserveBalance}
              onChange={(v) => setFinancial({ targetReserveBalance: v })}
              min={0} step={10000} prefix="$"
              tooltip="Minimum reserve fund balance to maintain as a financial cushion (typically 3–6 months of O&M)."
            />
          </div>
        </div>

        {/* Interest Rates */}
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Interest Rates</h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <NumberInput
              label="Borrowing Rate (New Loans)"
              value={financial.borrowingRatePercent}
              onChange={(v) => setFinancial({ borrowingRatePercent: v })}
              min={0} max={12} step={0.25} suffix="%"
              tooltip="Interest rate for new infrastructure loans. USDA Rural Development rates are typically 2.75–4.5%. State revolving fund rates may be lower."
            />
            <NumberInput
              label="Reserve Fund Earning Rate"
              value={financial.reserveEarningRatePercent}
              onChange={(v) => setFinancial({ reserveEarningRatePercent: v })}
              min={0} max={8} step={0.25} suffix="%"
              tooltip="Annual return on invested reserve funds. Money market accounts and short-term CDs typically earn 1–3%. This is separate from the borrowing rate and is usually lower."
            />
          </div>
          {financial.reserveEarningRatePercent > financial.borrowingRatePercent && (
            <p className="mt-2 text-sm text-amber-600">
              ⚠ Reserve earning rate exceeds borrowing rate. This is unusual — verify this is intentional.
            </p>
          )}
        </div>

        {/* Projection Assumptions */}
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Projection Assumptions</h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <NumberInput
              label="Inflation Rate"
              value={financial.inflationRatePercent}
              onChange={(v) => setFinancial({ inflationRatePercent: v })}
              min={0} max={10} step={0.25} suffix="%"
              tooltip="Annual rate at which operating costs increase. Water utility O&M inflation typically tracks CPI at 2–4%."
            />
            <NumberInput
              label="Customer Growth Rate"
              value={financial.customerGrowthRatePercent}
              onChange={(v) => setFinancial({ customerGrowthRatePercent: v })}
              min={-5} max={10} step={0.1} suffix="%"
              tooltip="Annual percentage change in customer count. Can be negative for declining communities."
            />
            <NumberInput
              label="Projection Period"
              value={financial.projectionYears}
              onChange={(v) => setFinancial({ projectionYears: Math.round(v) })}
              min={5} max={30} step={1} suffix="years"
              tooltip="Number of years for the financial projection and transition plan (5–30 years)."
            />
          </div>
        </div>

        {/* Cost Allocation */}
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Cost-of-Service Allocation
            <span className="ml-2 text-xs font-normal text-gray-400">(AWWA M1 Methodology)</span>
          </h4>
          <p className="mb-3 text-sm text-gray-500">
            Allocate your O&M costs by function. This drives how revenue is split between
            fixed charges (base rate) and volumetric charges (tier rates).
            The remaining percentage is capacity cost, allocated to higher usage tiers.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <NumberInput
              label="Fixed / Customer Costs"
              value={financial.costAllocation.fixedCostPercent}
              onChange={(v) => setFinancial({ costAllocation: { ...financial.costAllocation, fixedCostPercent: v } })}
              min={0} max={100} step={5} suffix="%"
              tooltip="Costs that exist regardless of usage: meter reading, billing, customer service, service line maintenance. Recovered through the base rate."
            />
            <NumberInput
              label="Commodity Costs"
              value={financial.costAllocation.commodityCostPercent}
              onChange={(v) => setFinancial({ costAllocation: { ...financial.costAllocation, commodityCostPercent: v } })}
              min={0} max={100} step={5} suffix="%"
              tooltip="Costs proportional to volume: chemicals, treatment power, source water supply. Recovered through Tier 1 volumetric rates."
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Capacity Costs (Remainder)</label>
              <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <span className={`text-sm font-semibold ${
                  100 - financial.costAllocation.fixedCostPercent - financial.costAllocation.commodityCostPercent < 0
                    ? 'text-red-600' : 'text-gray-700'
                }`}>
                  {Math.max(0, 100 - financial.costAllocation.fixedCostPercent - financial.costAllocation.commodityCostPercent).toFixed(0)}%
                </span>
                <span className="ml-2 text-xs text-gray-400">allocated to higher tier premiums</span>
              </div>
              {financial.costAllocation.fixedCostPercent + financial.costAllocation.commodityCostPercent > 100 && (
                <p className="text-xs text-red-500">Fixed + commodity cannot exceed 100%</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </SectionCard>
  );
};
