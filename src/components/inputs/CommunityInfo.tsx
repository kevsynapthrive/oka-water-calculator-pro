import React from 'react';
import { useStore } from '../../store';
import { SectionCard } from '../shared/SectionCard';
import { NumberInput, TextInput } from '../shared/NumberInput';

export const CommunityInfo: React.FC = () => {
  const { community, system, setCommunity, setSystem } = useStore();

  return (
    <SectionCard
      title="Community & System"
      subtitle="Demographics and operational characteristics"
      collapsible
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <TextInput
          label="Community Name"
          value={community.name}
          onChange={(v) => setCommunity({ name: v })}
          placeholder="e.g. Ada, Oklahoma"
        />
        <TextInput
          label="State"
          value={community.state}
          onChange={(v) => setCommunity({ state: v })}
          placeholder="e.g. OK"
        />

        <NumberInput
          label="Median Household Income (Annual)"
          value={community.medianHouseholdIncome}
          onChange={(v) => setCommunity({ medianHouseholdIncome: v })}
          min={0} step={500} prefix="$"
          tooltip="Annual median household income for the service area. Used for EPA affordability calculations."
        />
        <NumberInput
          label="Poverty Level Income (Annual)"
          value={community.povertyLevelIncome}
          onChange={(v) => setCommunity({ povertyLevelIncome: v })}
          min={0} step={500} prefix="$"
          tooltip="Federal poverty level for a family of 4. Used for low-income affordability analysis."
        />
        <NumberInput
          label="Households Below Poverty"
          value={community.belowPovertyPercent}
          onChange={(v) => setCommunity({ belowPovertyPercent: v })}
          min={0} max={100} step={0.5} suffix="%"
          tooltip="Percentage of households in the service area living below the federal poverty line."
        />

        <NumberInput
          label="EPA Reference Usage"
          value={community.affordabilityReferenceUsage}
          onChange={(v) => setCommunity({ affordabilityReferenceUsage: v })}
          min={500} step={500} suffix="gal/mo"
          tooltip="Standard usage level for the primary affordability metric. EPA guidance recommends 7,500 gal/month as a residential benchmark for comparability across communities. Your system's average may differ."
        />

        <NumberInput
          label="Non-Revenue Water (% of Production)"
          value={system.waterLossPercent}
          onChange={(v) => setSystem({ waterLossPercent: v })}
          min={0} max={60} step={0.5} suffix="%"
          tooltip="Water lost before reaching customers, as a percentage of TOTAL WATER PRODUCED. Industry standard (AWWA/EPA) reports NRW as % of production. Example: 15% means 15 gallons lost for every 100 gallons pumped."
        />
        <NumberInput
          label="Current Reserve Fund Balance"
          value={system.currentReserveBalance}
          onChange={(v) => setSystem({ currentReserveBalance: v })}
          min={0} step={1000} prefix="$"
          tooltip="Current balance in the infrastructure/capital reserve fund. This reduces the annual sinking fund contribution needed to reach the replacement target."
        />
      </div>
    </SectionCard>
  );
};
