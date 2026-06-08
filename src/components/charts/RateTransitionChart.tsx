import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useStore } from '../../store';
import { SectionCard } from '../shared/SectionCard';
import { runAdvisor } from '../../engine/advisor';
import { formatCurrency, formatRatePerKgal } from '../../utils/format';

export const RateTransitionChart: React.FC = () => {
  const state = useStore();

  const data = useMemo(() => {
    try {
      const plan = runAdvisor(state, state.advisorSettings).transitionPlan;
      return plan.map((r) => ({
        year: r.year === 0 ? 'Now' : `Yr ${r.year}`,
        'Base Rate ($)': Math.round(r.baseRate * 100) / 100,
        'Tier 1 ($/kgal)': Math.round(r.tier1Rate * 1000) / 1000,
      }));
    } catch { return []; }
  }, [state]);

  if (data.length === 0) return null;

  return (
    <SectionCard
      title="Rate Transition Plan"
      subtitle="Recommended base rate and Tier 1 volumetric rate changes over the planning period"
    >
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="base" tickFormatter={(v) => `$${v.toFixed(2)}`} tick={{ fontSize: 11 }} />
          <YAxis yAxisId="tier" orientation="right" tickFormatter={(v) => `$${v.toFixed(3)}`} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(v: number, name: string) =>
              name === 'Base Rate ($)'
                ? [formatCurrency(v) + '/mo', 'Base Rate']
                : [formatRatePerKgal(v), 'Tier 1 Rate']
            }
            contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line yAxisId="base" type="monotone" dataKey="Base Rate ($)" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
          <Line yAxisId="tier" type="monotone" dataKey="Tier 1 ($/kgal)" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
      <p className="mt-2 text-xs text-gray-400">
        Base rate ($/month, left axis) and Tier 1 volumetric rate ($/kgal, right axis). Annual cap: {state.advisorSettings.maxAnnualIncreasePercent}%. Rates step toward the ideal AWWA M1 cost-of-service structure.
      </p>
    </SectionCard>
  );
};
