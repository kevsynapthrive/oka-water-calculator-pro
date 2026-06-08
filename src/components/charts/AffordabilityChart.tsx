import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useStore } from '../../store';
import { SectionCard } from '../shared/SectionCard';
import { runAdvisor } from '../../engine/advisor';
import { EPA_REFERENCE_USAGE_GAL } from '../../engine/affordability';

export const AffordabilityChart: React.FC = () => {
  const state = useStore();

  const data = useMemo(() => {
    try {
      const plan = runAdvisor(state, state.advisorSettings).transitionPlan;
      return plan.map((r) => ({
        year: r.year === 0 ? 'Now' : `Yr ${r.year}`,
        // affordabilityMHI is stored as % of monthly income × 100 (monthly/monthly)
        // We want annual bill / annual MHI × 100 = same ratio
        'Affordability Burden (%)': Math.round(r.affordabilityMHI * 100) / 100,
      }));
    } catch { return []; }
  }, [state]);

  if (data.length === 0) return null;

  return (
    <SectionCard
      title="Affordability Trend"
      subtitle={`Annual water bill at ${EPA_REFERENCE_USAGE_GAL.toLocaleString()} gal/month as % of MHI — advisor transition plan`}
    >
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} domain={[0, 'auto']} />
          <Tooltip formatter={(v: number) => [`${v.toFixed(2)}%`, 'Affordability Burden']}
            contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine y={1.5} stroke="#10b981" strokeDasharray="4 2"
            label={{ value: '1.5% Affordable', position: 'insideRight', fontSize: 10, fill: '#10b981' }} />
          <ReferenceLine y={2.5} stroke="#f59e0b" strokeDasharray="4 2"
            label={{ value: '2.5% Moderate', position: 'insideRight', fontSize: 10, fill: '#f59e0b' }} />
          <ReferenceLine y={4.0} stroke="#ef4444" strokeDasharray="4 2"
            label={{ value: '4.0% Burdensome', position: 'insideRight', fontSize: 10, fill: '#ef4444' }} />
          <Line type="monotone" dataKey="Affordability Burden (%)" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
      <p className="mt-2 text-xs text-gray-400">
        Metric = monthly bill at reference usage / monthly MHI × 100. Thresholds: ≤1.5% Affordable · ≤2.5% Moderate · ≤4.0% Burdensome · &gt;4.0% Severe.
      </p>
    </SectionCard>
  );
};
