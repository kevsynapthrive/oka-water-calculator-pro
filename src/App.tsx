import React, { useState } from 'react';

// Layout
import { Header } from './components/layout/Header';

// Input forms
import { CommunityInfo } from './components/inputs/CommunityInfo';
import { FinancialInfo } from './components/inputs/FinancialInfo';
import { CustomerClasses } from './components/inputs/CustomerClasses';
import { RateStructures } from './components/inputs/RateStructure';
import { FinancialPlanning } from './components/inputs/FinancialPlanning';

// Results
import { RevenueSufficiency } from './components/results/RevenueSufficiency';
import { AffordabilityPanel } from './components/results/AffordabilityPanel';
import { BillComparison } from './components/results/BillComparison';
import { WaterLossPanel } from './components/results/WaterLossPanel';

// Advisor
import { AdvisorPanel } from './components/advisor/AdvisorPanel';
import { ProjectionTable } from './components/advisor/ProjectionTable';

// Charts
import { ProjectionChart } from './components/charts/ProjectionChart';
import { AffordabilityChart } from './components/charts/AffordabilityChart';
import { DSCRChart } from './components/charts/DSCRChart';
import { RateTransitionChart } from './components/charts/RateTransitionChart';

type Tab = 'inputs' | 'current' | 'proposed' | 'advisor' | 'charts';

const TAB_LABELS: { id: Tab; label: string }[] = [
  { id: 'inputs',   label: 'Inputs' },
  { id: 'current',  label: 'Current Rates' },
  { id: 'proposed', label: 'Proposed Rates' },
  { id: 'advisor',  label: 'Financial Advisor' },
  { id: 'charts',   label: 'Charts & Projections' },
];

const DISCLAIMER = `This tool is for planning and educational purposes only. Results are estimates based on the inputs you provide and the financial modeling assumptions built into this calculator. This tool does not replace a certified water rate study, engineering analysis, or legal/financial advice. Formal rate adoption by a water utility should be supported by a study conducted by a qualified professional engineer or rate consultant licensed in your state.`;

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('inputs');
  const [disclaimerAck, setDisclaimerAck] = useState(false);

  if (!disclaimerAck) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-xl w-full rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
          <h1 className="text-xl font-bold text-gray-900 mb-1">OKA Water Rate Calculator Pro</h1>
          <p className="text-sm text-blue-700 font-medium mb-4">Professional Water Rate Planning Tool</p>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-6 text-sm text-amber-800">
            <p className="font-semibold mb-2">Important Disclaimer</p>
            <p>{DISCLAIMER}</p>
          </div>
          <button
            onClick={() => setDisclaimerAck(true)}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            I Understand — Continue to Calculator
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Tab Navigation */}
      <div className="sticky top-14 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4">
          <nav className="-mb-px flex gap-0 overflow-x-auto" aria-label="Tabs">
            {TAB_LABELS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`whitespace-nowrap border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
                  activeTab === id
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">

        {/* ── INPUTS ─────────────────────────────────────────────── */}
        {activeTab === 'inputs' && (
          <>
            <CommunityInfo />
            <FinancialInfo />
            <CustomerClasses />
            <RateStructures />
            <FinancialPlanning />
          </>
        )}

        {/* ── CURRENT RATE ANALYSIS ─────────────────────────────── */}
        {activeTab === 'current' && (
          <>
            <RevenueSufficiency mode="current" />
            <AffordabilityPanel mode="current" />
            <WaterLossPanel />
          </>
        )}

        {/* ── PROPOSED RATE ANALYSIS ────────────────────────────── */}
        {activeTab === 'proposed' && (
          <>
            <RevenueSufficiency mode="proposed" />
            <AffordabilityPanel mode="proposed" />
            <BillComparison />
          </>
        )}

        {/* ── FINANCIAL ADVISOR ─────────────────────────────────── */}
        {activeTab === 'advisor' && (
          <>
            <AdvisorPanel />
            <ProjectionTable />
          </>
        )}

        {/* ── CHARTS & PROJECTIONS ──────────────────────────────── */}
        {activeTab === 'charts' && (
          <>
            <ProjectionChart />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <DSCRChart />
              <AffordabilityChart />
            </div>
            <RateTransitionChart />
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-400">
        <p>OKA Water Rate Calculator Pro — For planning purposes only. Not a substitute for a certified rate study.</p>
        <p className="mt-1">
          Methodology: AWWA M1 Cost-of-Service · Monthly-compounding amortization · Sinking fund reserves ·
          Lognormal usage distribution · EPA affordability benchmark
        </p>
      </footer>
    </div>
  );
}
