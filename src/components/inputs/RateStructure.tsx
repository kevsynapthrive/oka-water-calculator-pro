import React from 'react';
import { useStore } from '../../store';
import { SectionCard } from '../shared/SectionCard';
import { NumberInput, TextInput } from '../shared/NumberInput';
import type { TierRate } from '../../types';

const TierRow: React.FC<{
  tier: TierRate;
  index: number;
  isLast: boolean;
  onChange: (t: Partial<TierRate>) => void;
}> = ({ tier, index, isLast, onChange }) => (
  <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${tier.enabled ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={tier.enabled}
        onChange={(e) => onChange({ enabled: e.target.checked })}
        className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
      />
      <span className="w-12 text-sm font-medium text-gray-700">Tier {index + 1}</span>
    </div>

    <div className="flex flex-1 items-center gap-3">
      {!isLast ? (
        <div className="flex flex-1 items-center gap-2">
          <span className="whitespace-nowrap text-xs text-gray-500">Up to</span>
          <div className="relative flex-1">
            <input
              type="number"
              value={tier.upperLimit ?? ''}
              disabled={!tier.enabled}
              onChange={(e) => onChange({ upperLimit: parseFloat(e.target.value) || null })}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:bg-gray-50 disabled:text-gray-400 focus:border-brand-600 focus:outline-none"
              placeholder="gallons"
            />
          </div>
          <span className="text-xs text-gray-500">gal/mo</span>
        </div>
      ) : (
        <span className="flex-1 text-sm text-gray-400 italic">Unlimited (final tier)</span>
      )}

      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap text-xs text-gray-500">Rate</span>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
          <input
            type="number"
            value={tier.ratePerKgal}
            disabled={!tier.enabled}
            step={0.01}
            min={0}
            onChange={(e) => onChange({ ratePerKgal: parseFloat(e.target.value) || 0 })}
            className="w-24 rounded-lg border border-gray-300 pl-6 pr-2 py-1.5 text-sm disabled:bg-gray-50 disabled:text-gray-400 focus:border-brand-600 focus:outline-none"
          />
        </div>
        <span className="text-xs text-gray-500">/kgal</span>
      </div>
    </div>
  </div>
);

const RateStructureEditor: React.FC<{ rsId: string }> = ({ rsId }) => {
  const { rateStructures, updateRateStructure, removeRateStructure } = useStore();
  const rs = rateStructures.find((r) => r.id === rsId);
  if (!rs) return null;

  const updateTier = (index: number, changes: Partial<TierRate>) => {
    const tiers = rs.tiers.map((t, i) => (i === index ? { ...t, ...changes } : t));
    updateRateStructure(rsId, { tiers });
  };

  const enabledCount = rs.tiers.filter((t) => t.enabled).length;

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <TextInput
          label=""
          value={rs.label}
          onChange={(v) => updateRateStructure(rsId, { label: v })}
          placeholder="Rate structure name"
          className="flex-1"
        />
        {rateStructures.length > 1 && (
          <button
            onClick={() => removeRateStructure(rsId)}
            className="ml-3 mt-auto rounded-lg border border-red-200 bg-red-50 px-2 py-2 text-xs font-medium text-red-600 hover:bg-red-100"
          >
            Remove
          </button>
        )}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <NumberInput
          label="Base Rate (Fixed Monthly)"
          value={rs.baseRate}
          onChange={(v) => updateRateStructure(rsId, { baseRate: v })}
          min={0} step={0.50} prefix="$" suffix="/mo"
          tooltip="Fixed monthly service charge billed to every account regardless of usage."
        />
        <NumberInput
          label="Add-on Fee (Fixed Monthly)"
          value={rs.addonFee}
          onChange={(v) => updateRateStructure(rsId, { addonFee: v })}
          min={0} step={0.50} prefix="$" suffix="/mo"
          tooltip="Additional fixed monthly charge (e.g. infrastructure fee, stormwater surcharge). Distinct from base rate for accounting clarity."
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Volumetric Tiers ({enabledCount} active)</p>
        {rs.tiers.map((tier, i) => (
          <TierRow
            key={i}
            tier={tier}
            index={i}
            isLast={i === rs.tiers.length - 1}
            onChange={(changes) => updateTier(i, changes)}
          />
        ))}
      </div>
    </div>
  );
};

export const RateStructures: React.FC = () => {
  const { rateStructures, currentRateStructureId, proposedRateStructureId,
          setCurrentRateStructureId, setProposedRateStructureId, addRateStructure } = useStore();

  return (
    <SectionCard
      title="Rate Structures"
      subtitle="Define current and proposed rate schedules. Assign each to a customer class above."
      collapsible
    >
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Current Rate Structure</label>
          <select
            value={currentRateStructureId}
            onChange={(e) => setCurrentRateStructureId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          >
            {rateStructures.map((rs) => <option key={rs.id} value={rs.id}>{rs.label}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Proposed / What-If Structure</label>
          <select
            value={proposedRateStructureId}
            onChange={(e) => setProposedRateStructureId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          >
            {rateStructures.map((rs) => <option key={rs.id} value={rs.id}>{rs.label}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {rateStructures.map((rs) => (
          <RateStructureEditor key={rs.id} rsId={rs.id} />
        ))}
      </div>

      <button
        onClick={addRateStructure}
        className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-brand-400 px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Rate Structure
      </button>
    </SectionCard>
  );
};
