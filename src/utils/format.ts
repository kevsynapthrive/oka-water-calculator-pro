/** Currency formatting — always 2 decimal places, US locale */
export function formatCurrency(value: number, compact = false): string {
  if (!isFinite(value)) return '—';
  if (compact && Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (compact && Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

/** Number formatting with commas */
export function formatNumber(value: number, decimals = 0): string {
  if (!isFinite(value)) return '—';
  return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Percentage with configurable decimals */
export function formatPercent(value: number, decimals = 2): string {
  if (!isFinite(value)) return '—';
  return `${value.toFixed(decimals)}%`;
}

/** DSCR — two decimal places, shows ∞ when no debt */
export function formatDSCR(value: number): string {
  if (!isFinite(value)) return '∞ (No Debt)';
  return value.toFixed(2) + 'x';
}

/** Gallons formatted with appropriate unit */
export function formatGallons(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M gal`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K gal`;
  return `${Math.round(value)} gal`;
}

/** Rate per 1,000 gallons */
export function formatRatePerKgal(value: number): string {
  return `$${value.toFixed(2)}/kgal`;
}

/** Affordability status display text */
export function formatAffordabilityStatus(status: string): string {
  const map: Record<string, string> = {
    affordable: 'Affordable',
    moderate: 'Moderate',
    burdensome: 'Burdensome',
    severe: 'Severe Burden',
  };
  return map[status] ?? status;
}

/** Color classes for affordability statuses */
export function affordabilityColorClass(status: string): string {
  switch (status) {
    case 'affordable': return 'text-green-700 bg-green-50 border-green-200';
    case 'moderate':   return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    case 'burdensome': return 'text-orange-700 bg-orange-50 border-orange-200';
    case 'severe':     return 'text-red-700 bg-red-50 border-red-200';
    default:           return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}
