import Papa from 'papaparse';
import type { AppState, AdvisorSettings } from '../types';

export function exportToJSON(state: AppState, advisorSettings: AdvisorSettings): void {
  const payload = JSON.stringify({ version: '2.0', exportedAt: new Date().toISOString(), state, advisorSettings }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `oka-water-rates-${state.community.name.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importFromJSON(file: File): Promise<{ state: AppState; advisorSettings: AdvisorSettings }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!parsed.state) throw new Error('Invalid export file: missing state field');
        resolve({ state: parsed.state, advisorSettings: parsed.advisorSettings });
      } catch (err) {
        reject(new Error(`Import failed: ${(err as Error).message}`));
      }
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsText(file);
  });
}

/** Export the financial projection table as CSV */
export function exportProjectionCSV(rows: Record<string, unknown>[], filename: string): void {
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
