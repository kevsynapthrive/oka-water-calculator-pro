import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useStore } from '../../store';
import { SectionCard } from '../shared/SectionCard';
import { runAdvisor } from '../../engine/advisor';
import { DSCR_ADEQUATE } from '../../engine/dscr';

export const DSCRChart: React.FC = () => {
  const state = useStore();

  const data = useMemo(() => {
    try {
      const plan = runAdvisor(state, state.advisorSettings).transitionPlan;
      return plan.map((r) => ({
        year: r.year === 0 ? 'Now' : `Yr ${r.year}`,
        DSCR: isFinite(r.dscr) ? Math.round(r.dscr * 100) / 100 : null,
      }));
    } catch { return []; }
  }, [state]);

  if (data.length === 0) return null;

  return (
    <SectionCard
      title="DSCR Trend"
      subtitle="Debt Service Coverage Ratio over the projection period — USDA 1.25x minimum shown"
    >
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} domain={[0, 'auto']} />
          <Tooltip
            formatter={(v: unknown) => {
              const n = typeof v === 'number' ? v : null;
              return n == null ? ['N/A (no debt)', 'DSCR'] : [`${n.toFixed(2)}×`, 'DSCR'];
            }}
            contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine y={DSCR_ADEQUATE} stroke="#f59e0b" strokeDasharray="4 2"
            label={{ value: `${DSCR_ADEQUATE}× USDA min`, position: 'insideRight', fontSize: 10, fill: '#f59e0b' }} />
          <ReferenceLine y={2.0} stroke="#10b981" strokeDasharray="4 2"
            label={{ value: '2.0× Excellent', position: 'insideRight', fontSize: 10, fill: '#10b981' }} />
          <Line type="monotone" dataKey="DSCR" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>
      <p className="mt-2 text-xs text-gray-400">
        DSCR = (Revenue − O&M) / Debt Service. N/A when no debt service. USDA Rural Development requires ≥1.25× for federal infrastructure loan eligibility.
      </p>
    </SectionCard>
  );
};
