import React from 'react';
import type { WizardData } from '../wizardData';

interface Props {
  data: WizardData;
}

const fmt = (n: number) => n.toLocaleString('en-US');
const currency = (n: number) => '$' + n.toLocaleString('en-US');

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-4 py-1.5 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-600 flex-shrink-0">{label}</span>
    <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <>
    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 border-t first:border-t-0">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
    </div>
    <div className="px-4 py-1">{children}</div>
  </>
);

export const ReviewLaunch: React.FC<Props> = ({ data }) => (
  <div className="space-y-4">
    <p className="text-sm text-gray-600 leading-relaxed">
      Review your inputs below, then click <strong>Launch Analysis</strong> to open the
      calculator. You can refine any value later in the full Inputs tab.
    </p>

    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <Section title="Community">
        <Row label="System name" value={data.communityName || '(not entered)'} />
        <Row label="State" value={data.state || '—'} />
        <Row label="Median household income" value={`${currency(data.medianIncome)}/yr`} />
        <Row label="Below poverty level" value={`${data.povertyPercent}%`} />
      </Section>

      <Section title="Operations">
        <Row label="Residential connections" value={fmt(data.residentialCount)} />
        {data.hasCommercial && (
          <Row label="Commercial connections" value={fmt(data.commercialCount)} />
        )}
        <Row label="Avg residential usage" value={`${fmt(data.avgUsageGal)} gal/mo`} />
        <Row label="Non-revenue water" value={`${data.waterLossPercent}%`} />
      </Section>

      <Section title="Finances">
        <Row label="Annual O&M cost" value={currency(data.annualOM)} />
        <Row label="Reserve balance" value={currency(data.reserveBalance)} />
        {data.hasExistingDebt && (
          <>
            <Row label="Annual debt service" value={currency(data.existingDebtService)} />
            <Row label="Years remaining on debt" value={`${data.debtYearsRemaining} years`} />
          </>
        )}
        {!data.hasExistingDebt && (
          <Row label="Existing debt" value="None" />
        )}
      </Section>

      <Section title="Current Rates">
        <Row label="Rate structure" value={data.rateType === 'flat' ? 'Flat rate' : 'Tiered rate'} />
        <Row label="Monthly base charge" value={`$${data.baseRate.toFixed(2)}/mo`} />
        {data.rateType === 'flat' ? (
          <Row label="Volumetric rate" value={`$${data.tier1Rate.toFixed(2)}/kgal`} />
        ) : (
          <>
            <Row
              label={`Tier 1 rate (0–${fmt(data.tier1LimitGal)} gal)`}
              value={`$${data.tier1Rate.toFixed(2)}/kgal`}
            />
            <Row
              label="Tier 2 rate (above threshold)"
              value={`$${data.tier2Rate.toFixed(2)}/kgal`}
            />
          </>
        )}
      </Section>
    </div>

    <p className="text-xs text-gray-500">
      After launching, visit the <strong>Current Rates</strong> tab to see your revenue analysis,
      then use <strong>Financial Advisor</strong> to get a rate recommendation tailored to your
      cost-recovery needs.
    </p>
  </div>
);
