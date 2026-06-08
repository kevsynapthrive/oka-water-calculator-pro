import { create } from 'zustand';
import type {
  AppState, AdvisorSettings, CommunityInfo, SystemInfo, FinancialInputs,
  CustomerClass, RateStructure, Loan, CapitalProject, Grant,
} from '../types';
import { DEFAULT_STATE, DEFAULT_ADVISOR_SETTINGS, SAMPLE_SCENARIOS } from './defaults';

interface Store extends AppState {
  advisorSettings: AdvisorSettings;

  // Community / System setters
  setCommunity: (c: Partial<CommunityInfo>) => void;
  setSystem: (s: Partial<SystemInfo>) => void;
  setFinancial: (f: Partial<FinancialInputs>) => void;

  // Customer Classes
  setCustomerClasses: (classes: CustomerClass[]) => void;
  updateCustomerClass: (id: string, updates: Partial<CustomerClass>) => void;
  addCustomerClass: () => void;
  removeCustomerClass: (id: string) => void;

  // Rate Structures
  setRateStructures: (rs: RateStructure[]) => void;
  updateRateStructure: (id: string, updates: Partial<RateStructure>) => void;
  addRateStructure: () => void;
  removeRateStructure: (id: string) => void;
  setCurrentRateStructureId: (id: string) => void;
  setProposedRateStructureId: (id: string) => void;

  // Loans / Projects / Grants
  setLoans: (loans: Loan[]) => void;
  addLoan: () => void;
  updateLoan: (id: string, updates: Partial<Loan>) => void;
  removeLoan: (id: string) => void;

  setProjects: (projects: CapitalProject[]) => void;
  addProject: () => void;
  updateProject: (id: string, updates: Partial<CapitalProject>) => void;
  removeProject: (id: string) => void;

  setGrants: (grants: Grant[]) => void;
  addGrant: () => void;
  updateGrant: (id: string, updates: Partial<Grant>) => void;
  removeGrant: (id: string) => void;

  // Advisor
  setAdvisorSettings: (s: Partial<AdvisorSettings>) => void;

  // Misc
  setCompareUsageLevels: (levels: number[]) => void;
  toggleMathMode: () => void;
  loadScenario: (key: string) => void;
  resetToDefaults: () => void;
  loadFromExport: (state: Partial<AppState>) => void;
}

let _nextId = 1;
const uid = () => `id-${Date.now()}-${_nextId++}`;

export const useStore = create<Store>((set) => ({
  ...DEFAULT_STATE,
  advisorSettings: { ...DEFAULT_ADVISOR_SETTINGS },

  setCommunity: (c) => set((s) => ({ community: { ...s.community, ...c } })),
  setSystem: (sys) => set((s) => ({ system: { ...s.system, ...sys } })),
  setFinancial: (f) => set((s) => ({ financial: { ...s.financial, ...f } })),

  setCustomerClasses: (classes) => set({ customerClasses: classes }),
  updateCustomerClass: (id, updates) =>
    set((s) => ({
      customerClasses: s.customerClasses.map((c) =>
        c.id === id ? { ...c, ...updates } : c,
      ),
    })),
  addCustomerClass: () =>
    set((s) => ({
      customerClasses: [
        ...s.customerClasses,
        {
          id: uid(),
          name: 'New Class',
          count: 100,
          avgMonthlyUsage: 5000,
          usageStdDev: null,
          rateStructureId: s.rateStructures[0]?.id ?? '',
        },
      ],
    })),
  removeCustomerClass: (id) =>
    set((s) => ({ customerClasses: s.customerClasses.filter((c) => c.id !== id) })),

  setRateStructures: (rs) => set({ rateStructures: rs }),
  updateRateStructure: (id, updates) =>
    set((s) => ({
      rateStructures: s.rateStructures.map((r) =>
        r.id === id ? { ...r, ...updates } : r,
      ),
    })),
  addRateStructure: () =>
    set((s) => ({
      rateStructures: [
        ...s.rateStructures,
        {
          id: uid(),
          label: 'New Rate Structure',
          baseRate: 20,
          addonFee: 5,
          tiers: [
            { enabled: true,  upperLimit: 4000,  ratePerKgal: 5.0 },
            { enabled: true,  upperLimit: 10000, ratePerKgal: 7.0 },
            { enabled: false, upperLimit: 20000, ratePerKgal: 10.0 },
            { enabled: false, upperLimit: null,  ratePerKgal: 14.0 },
          ],
        },
      ],
    })),
  removeRateStructure: (id) =>
    set((s) => ({ rateStructures: s.rateStructures.filter((r) => r.id !== id) })),
  setCurrentRateStructureId: (id) => set({ currentRateStructureId: id }),
  setProposedRateStructureId: (id) => set({ proposedRateStructureId: id }),

  setLoans: (loans) => set({ loans }),
  addLoan: () =>
    set((s) => ({
      loans: [
        ...s.loans,
        { id: uid(), name: 'New Loan', amount: 0, annualRatePercent: 3.5, termYears: 20, startYear: 0 },
      ],
    })),
  updateLoan: (id, updates) =>
    set((s) => ({ loans: s.loans.map((l) => (l.id === id ? { ...l, ...updates } : l)) })),
  removeLoan: (id) => set((s) => ({ loans: s.loans.filter((l) => l.id !== id) })),

  setProjects: (projects) => set({ projects }),
  addProject: () =>
    set((s) => ({
      projects: [
        ...s.projects,
        { id: uid(), name: 'New Project', totalCost: 0, year: 1, fundingSource: 'loan' as const },
      ],
    })),
  updateProject: (id, updates) =>
    set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)) })),
  removeProject: (id) => set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

  setGrants: (grants) => set({ grants }),
  addGrant: () =>
    set((s) => ({
      grants: [...s.grants, { id: uid(), name: 'New Grant', amount: 0, year: 0 }],
    })),
  updateGrant: (id, updates) =>
    set((s) => ({ grants: s.grants.map((g) => (g.id === id ? { ...g, ...updates } : g)) })),
  removeGrant: (id) => set((s) => ({ grants: s.grants.filter((g) => g.id !== id) })),

  setAdvisorSettings: (updates) =>
    set((s) => ({ advisorSettings: { ...s.advisorSettings, ...updates } })),

  setCompareUsageLevels: (levels) => set({ compareUsageLevels: levels }),
  toggleMathMode: () => set((s) => ({ showMathMode: !s.showMathMode })),

  loadScenario: (key) => {
    const scenario = SAMPLE_SCENARIOS[key];
    if (!scenario) return;
    set((s) => {
      const merged: AppState = {
        ...s,
        ...scenario,
        community: { ...s.community, ...(scenario.community ?? {}) },
        system: { ...s.system, ...(scenario.system ?? {}) },
        financial: { ...s.financial, ...(scenario.financial ?? {}) },
      };
      // Reset rate structures to defaults for new scenario
      if (scenario.customerClasses) {
        merged.rateStructures = DEFAULT_STATE.rateStructures;
        merged.currentRateStructureId = DEFAULT_STATE.currentRateStructureId;
        merged.proposedRateStructureId = DEFAULT_STATE.proposedRateStructureId;
        merged.loans = [];
        merged.projects = [];
        merged.grants = [];
      }
      return merged;
    });
  },

  resetToDefaults: () =>
    set({ ...DEFAULT_STATE, advisorSettings: { ...DEFAULT_ADVISOR_SETTINGS } }),

  loadFromExport: (state) =>
    set((s) => ({ ...s, ...state })),
}));
