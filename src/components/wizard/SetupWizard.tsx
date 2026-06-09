import React, { useState } from 'react';
import { useStore } from '../../store';
import type { CustomerClass, RateStructure, TierRate } from '../../types';
import { WizardProgress } from './WizardProgress';
import { SystemProfile } from './steps/SystemProfile';
import { WizardCommunity } from './steps/WizardCommunity';
import { WaterOperations } from './steps/WaterOperations';
import { OperatingCosts } from './steps/OperatingCosts';
import { CurrentRates } from './steps/CurrentRates';
import { ReviewLaunch } from './steps/ReviewLaunch';
import { INITIAL_WIZARD_DATA } from './wizardData';
import type { WizardData } from './wizardData';

const STEP_SUBTITLES = [
  'Your System',
  'Your Community',
  'Water Operations',
  'Operating Costs',
  'Current Rates',
  'Review & Launch',
];

interface Props {
  onClose: () => void;
  onComplete: () => void;
}

export const SetupWizard: React.FC<Props> = ({ onClose, onComplete }) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(INITIAL_WIZARD_DATA);
  const store = useStore();

  const update = (updates: Partial<WizardData>) => setData((d) => ({ ...d, ...updates }));
  const next = () => setStep((s) => Math.min(s + 1, 5));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleComplete = () => {
    store.setCommunity({
      name: data.communityName.trim() || 'My Community',
      state: data.state,
      medianHouseholdIncome: data.medianIncome,
      povertyLevelIncome: 27_750,
      belowPovertyPercent: data.povertyPercent,
      affordabilityReferenceUsage: 7_500,
    });

    store.setSystem({
      waterLossPercent: data.waterLossPercent,
      currentReserveBalance: data.reserveBalance,
    });

    store.setFinancial({
      annualOperatingCost: data.annualOM,
      existingAnnualDebt: data.hasExistingDebt ? data.existingDebtService : 0,
      existingDebtRemainingYears: data.hasExistingDebt ? data.debtYearsRemaining : 0,
    });

    const classes: CustomerClass[] = [
      {
        id: 'wizard-res',
        name: 'Residential',
        count: data.residentialCount,
        avgMonthlyUsage: data.avgUsageGal,
        usageStdDev: null,
        rateStructureId: 'wizard-current',
      },
    ];
    if (data.hasCommercial && data.commercialCount > 0) {
      classes.push({
        id: 'wizard-com',
        name: 'Commercial',
        count: data.commercialCount,
        avgMonthlyUsage: data.commercialAvgUsage,
        usageStdDev: null,
        rateStructureId: 'wizard-current',
      });
    }
    store.setCustomerClasses(classes);

    const tiers: TierRate[] = data.rateType === 'flat'
      ? [
          { enabled: true,  upperLimit: null,   ratePerKgal: data.tier1Rate },
          { enabled: false, upperLimit: 10_000, ratePerKgal: Math.round(data.tier1Rate * 1.5 * 100) / 100 },
          { enabled: false, upperLimit: 20_000, ratePerKgal: Math.round(data.tier1Rate * 2.5 * 100) / 100 },
          { enabled: false, upperLimit: null,   ratePerKgal: Math.round(data.tier1Rate * 4.0 * 100) / 100 },
        ]
      : [
          { enabled: true,  upperLimit: data.tier1LimitGal,     ratePerKgal: data.tier1Rate },
          { enabled: true,  upperLimit: null,                    ratePerKgal: data.tier2Rate },
          { enabled: false, upperLimit: data.tier1LimitGal * 3, ratePerKgal: Math.round(data.tier2Rate * 1.5 * 100) / 100 },
          { enabled: false, upperLimit: null,                    ratePerKgal: Math.round(data.tier2Rate * 2.0 * 100) / 100 },
        ];

    const currentStructure: RateStructure = {
      id: 'wizard-current',
      label: 'Current Residential Rate',
      baseRate: data.baseRate,
      addonFee: 0,
      tiers,
    };

    // Also create a "proposed" copy so the Proposed Rates tab is ready to use
    const proposedStructure: RateStructure = {
      ...currentStructure,
      id: 'wizard-proposed',
      label: 'Proposed Rate (edit me)',
    };

    store.setRateStructures([currentStructure, proposedStructure]);
    store.setCurrentRateStructureId('wizard-current');
    store.setProposedRateStructureId('wizard-proposed');
    store.setLoans([]);
    store.setProjects([]);
    store.setGrants([]);

    localStorage.setItem('oka-wizard-completed', 'true');
    onComplete();
  };

  const stepProps = { data, onChange: update };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal header */}
        <div className="flex items-start justify-between px-8 pt-6 pb-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Setup Guide</h2>
            <p className="text-sm text-gray-500 mt-0.5">{STEP_SUBTITLES[step]}</p>
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none transition-colors"
            aria-label="Close setup guide"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <WizardProgress step={step} totalSteps={6} />

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-8 py-5">
          {step === 0 && <SystemProfile {...stepProps} />}
          {step === 1 && <WizardCommunity {...stepProps} />}
          {step === 2 && <WaterOperations {...stepProps} />}
          {step === 3 && <OperatingCosts {...stepProps} />}
          {step === 4 && <CurrentRates {...stepProps} />}
          {step === 5 && <ReviewLaunch data={data} />}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-8 py-4 rounded-b-2xl">
          <button
            onClick={step === 0 ? onClose : back}
            className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
          >
            {step === 0 ? (
              'Cancel'
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </>
            )}
          </button>

          {step < 5 ? (
            <button
              onClick={next}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 transition-colors"
            >
              Continue
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 transition-colors"
            >
              Launch Analysis
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
