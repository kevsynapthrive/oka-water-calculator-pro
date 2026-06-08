import React from 'react';
import { useStore } from '../../store';
import { SectionCard } from '../shared/SectionCard';
import { NumberInput, TextInput } from '../shared/NumberInput';

export const FinancialPlanning: React.FC = () => {
  const {
    loans, addLoan, updateLoan, removeLoan,
    projects, addProject, updateProject, removeProject,
    grants, addGrant, updateGrant, removeGrant,
  } = useStore();

  return (
    <SectionCard
      title="Financial Planning"
      subtitle="Capital projects, loans, and grants — properly tracked to avoid double-counting"
      collapsible
      defaultOpen={false}
    >
      {/* Loans */}
      <div className="mb-6">
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Loans</h4>
        <p className="mb-3 text-xs text-gray-400">
          All loan payments are calculated using monthly-compounding amortization (standard US practice).
          To link a loan to a capital project, give them the same name to prevent double-counting.
        </p>
        <div className="space-y-3">
          {loans.map((loan) => (
            <div key={loan.id} className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-4 md:grid-cols-5">
              <TextInput label="Name" value={loan.name} onChange={(v) => updateLoan(loan.id, { name: v })} />
              <NumberInput label="Principal" value={loan.amount} onChange={(v) => updateLoan(loan.id, { amount: v })} min={0} step={1000} prefix="$" />
              <NumberInput label="Rate" value={loan.annualRatePercent} onChange={(v) => updateLoan(loan.id, { annualRatePercent: v })} min={0} max={15} step={0.25} suffix="%" />
              <NumberInput label="Term" value={loan.termYears} onChange={(v) => updateLoan(loan.id, { termYears: Math.round(v) })} min={1} max={40} step={1} suffix="yrs" />
              <div className="flex items-end gap-2">
                <NumberInput label="Start Year" value={loan.startYear} onChange={(v) => updateLoan(loan.id, { startYear: Math.round(v) })} min={0} max={30} step={1} />
                <button onClick={() => removeLoan(loan.id)} className="mb-0.5 rounded-lg border border-red-200 bg-red-50 px-2 py-2 text-xs text-red-600 hover:bg-red-100">✕</button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={addLoan} className="mt-2 flex items-center gap-2 rounded border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50">
          + Add Loan
        </button>
      </div>

      {/* Capital Projects */}
      <div className="mb-6">
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Capital Projects</h4>
        <div className="space-y-3">
          {projects.map((proj) => (
            <div key={proj.id} className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-4 md:grid-cols-5">
              <TextInput label="Project Name" value={proj.name} onChange={(v) => updateProject(proj.id, { name: v })} />
              <NumberInput label="Total Cost" value={proj.totalCost} onChange={(v) => updateProject(proj.id, { totalCost: v })} min={0} step={10000} prefix="$" />
              <NumberInput label="Year" value={proj.year} onChange={(v) => updateProject(proj.id, { year: Math.round(v) })} min={0} max={30} step={1} />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Funding</label>
                <select
                  value={proj.fundingSource}
                  onChange={(e) => updateProject(proj.id, { fundingSource: e.target.value as 'loan' | 'reserves' | 'grant' })}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
                >
                  <option value="loan">Loan</option>
                  <option value="reserves">Reserves</option>
                  <option value="grant">Grant</option>
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={() => removeProject(proj.id)} className="rounded-lg border border-red-200 bg-red-50 px-2 py-2 text-xs text-red-600 hover:bg-red-100">✕</button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={addProject} className="mt-2 flex items-center gap-2 rounded border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50">
          + Add Project
        </button>
      </div>

      {/* Grants */}
      <div>
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Grants & External Funding</h4>
        <div className="space-y-3">
          {grants.map((grant) => (
            <div key={grant.id} className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-4 md:grid-cols-4">
              <TextInput label="Grant Name" value={grant.name} onChange={(v) => updateGrant(grant.id, { name: v })} />
              <NumberInput label="Amount" value={grant.amount} onChange={(v) => updateGrant(grant.id, { amount: v })} min={0} step={10000} prefix="$" />
              <NumberInput label="Year" value={grant.year} onChange={(v) => updateGrant(grant.id, { year: Math.round(v) })} min={0} max={30} step={1} />
              <div className="flex items-end">
                <button onClick={() => removeGrant(grant.id)} className="rounded-lg border border-red-200 bg-red-50 px-2 py-2 text-xs text-red-600 hover:bg-red-100">✕</button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={addGrant} className="mt-2 flex items-center gap-2 rounded border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50">
          + Add Grant
        </button>
      </div>
    </SectionCard>
  );
};
