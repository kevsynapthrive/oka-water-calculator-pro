import React, { useMemo } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useStore } from '../../store';
import { SectionCard } from '../shared/SectionCard';
import { runAdvisor } from '../../engine/advisor';
import { formatCurrency } from '../../utils/format';

export const ProjectionChart: React.FC = () => {
  const state = useStore();

  const data = useMemo(() => {
    try {
      const plan = runAdvisor(state, state.advisorSettings).transitionPlan;
      return plan.map((r) => ({
        year: r.year === 0 ? 'Now' : `Yr ${r.year}`,
        Revenue: Math.round(r.projectedRevenue),
        'Revenue Need': Math.round(r.revenueNeed),
        'Reserve Balance': Math.round(r.reserveBalance),
      }));
    } catch { return []; }
  }, [state]);

  if (data.length === 0) return null;

  return (
    <SectionCard title="Revenue vs. Need Projection" subtitle="Projected annual revenue against total revenue requirement over the planning period">
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 4, right: 16, left: 16, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="left" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
          <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: number, name: string) => [formatCurrency(value, true), name]}
            labelStyle={{ fontWeight: 600, fontSize: 12 }}
            contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar yAxisId="left" dataKey="Revenue" fill="#3b82f6" radius={[3, 3, 0, 0]} opacity={0.85} />
          <Line yAxisId="left" type="monotone" dataKey="Revenue Need" stroke="#ef4444" strokeWidth={2} dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="Reserve Balance" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="5 3" />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="mt-2 text-xs text-gray-400">
        Revenue bars (left axis) vs. requirement line (left axis). Reserve balance on right axis (dashed). Based on advisor transition plan.
      </p>
    </SectionCard>
  );
};
