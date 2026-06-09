import React, { useRef } from 'react';
import { useStore } from '../../store';
import { exportToJSON, importFromJSON } from '../../utils/export';
import { SAMPLE_SCENARIOS } from '../../store/defaults';

export const Header: React.FC = () => {
  const state = useStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => exportToJSON(state, state.advisorSettings);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { state: imported, advisorSettings } = await importFromJSON(file);
      state.loadFromExport(imported);
      state.setAdvisorSettings(advisorSettings);
    } catch (err) {
      alert((err as Error).message);
    }
    e.target.value = '';
  };

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-6 py-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            {/* Water drop */}
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C12 2 4 10.5 4 15a8 8 0 0016 0C20 10.5 12 2 12 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none text-gray-900">Oka' Water Rate Calculator</h1>
            <p className="text-xs text-gray-500">Professional Edition — {state.community.name}</p>
          </div>
        </div>

        {/* Center: Scenario selector */}
        <div className="hidden items-center gap-2 md:flex">
          <label className="text-sm text-gray-600">Load scenario:</label>
          <select
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            defaultValue=""
            onChange={(e) => { if (e.target.value) state.loadScenario(e.target.value); }}
          >
            <option value="">— Select —</option>
            {Object.keys(SAMPLE_SCENARIOS).map((key) => (
              <option key={key} value={key}>{SAMPLE_SCENARIOS[key].community?.name ?? key}</option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Import
          </button>
<input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>
      </div>
    </header>
  );
};
