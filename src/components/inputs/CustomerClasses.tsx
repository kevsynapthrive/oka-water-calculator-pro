import React from 'react';
import { useStore } from '../../store';
import { SectionCard } from '../shared/SectionCard';
import { NumberInput, TextInput } from '../shared/NumberInput';

export const CustomerClasses: React.FC = () => {
  const { customerClasses, rateStructures, updateCustomerClass, addCustomerClass, removeCustomerClass } = useStore();

  return (
    <SectionCard
      title="Customer Classes"
      subtitle="Define separate classes for residential, commercial, industrial, etc."
      collapsible
    >
      <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <strong>Why customer classes matter:</strong> Revenue calculations use the lognormal usage distribution
        for classes with a standard deviation, correcting for the error that occurs when a single average
        is applied to a tiered rate schedule.
      </div>

      <div className="space-y-4">
        {customerClasses.map((cls) => (
          <div key={cls.id} className="rounded-lg border border-gray-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-medium text-gray-900">{cls.name}</h4>
              {customerClasses.length > 1 && (
                <button
                  onClick={() => removeCustomerClass(cls.id)}
                  className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <TextInput
                label="Class Name"
                value={cls.name}
                onChange={(v) => updateCustomerClass(cls.id, { name: v })}
              />
              <NumberInput
                label="Account Count"
                value={cls.count}
                onChange={(v) => updateCustomerClass(cls.id, { count: Math.round(v) })}
                min={0} step={10} suffix="accts"
              />
              <NumberInput
                label="Avg Monthly Usage"
                value={cls.avgMonthlyUsage}
                onChange={(v) => updateCustomerClass(cls.id, { avgMonthlyUsage: v })}
                min={0} step={100} suffix="gal/mo"
                tooltip="Average monthly water use per account in this class."
              />
              <NumberInput
                label="Usage Std Dev"
                value={cls.usageStdDev ?? 0}
                onChange={(v) => updateCustomerClass(cls.id, { usageStdDev: v > 0 ? v : null })}
                min={0} step={100} suffix="gal/mo"
                tooltip="Optional. Standard deviation of monthly usage. When provided, revenue is calculated using a lognormal distribution rather than a single average value — more accurate for tiered billing. Set to 0 to use simple average."
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Rate Structure</label>
                <select
                  value={cls.rateStructureId}
                  onChange={(e) => updateCustomerClass(cls.id, { rateStructureId: e.target.value })}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
                >
                  {rateStructures.map((rs) => (
                    <option key={rs.id} value={rs.id}>{rs.label}</option>
                  ))}
                </select>
              </div>
            </div>
            {cls.usageStdDev && cls.usageStdDev > 0 && (
              <p className="mt-2 text-xs text-green-600">
                ✓ Using lognormal distribution (CV = {(cls.usageStdDev / cls.avgMonthlyUsage * 100).toFixed(0)}%) — revenue corrected for tiered pricing nonlinearity
              </p>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addCustomerClass}
        className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-brand-400 px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Customer Class
      </button>
    </SectionCard>
  );
};
