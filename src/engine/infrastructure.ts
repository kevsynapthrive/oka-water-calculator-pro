/**
 * Infrastructure reserve funding calculations.
 * Uses the sinking fund formula throughout (time value of money).
 *
 * The sinking fund formula answers: "How much must I set aside annually,
 * earning rate r, to accumulate FV in n years?"
 *   PMT = FV × r / ((1+r)^n − 1)
 *
 * This is used consistently in BOTH the What-If section and the Financial
 * Advisor — eliminating the ~2× discrepancy in the previous version.
 */

/**
 * Annual reserve contribution required to accumulate `targetAmount` in
 * `years` years, given existing `currentBalance` already in the fund.
 *
 * @param targetAmount  Total replacement cost (future value needed), $
 * @param years         Horizon (asset lifespan), years
 * @param earningRatePercent  Annual rate earned on reserve deposits, %
 * @param currentBalance  Existing reserve balance (reduces required deposits), $
 */
export function annualSinkingFundContribution(
  targetAmount: number,
  years: number,
  earningRatePercent: number,
  currentBalance: number = 0,
): number {
  if (targetAmount <= 0 || years <= 0) return 0;

  // Future value of the current balance at end of horizon
  const r = earningRatePercent / 100;
  const currentBalanceFV = r > 0
    ? currentBalance * Math.pow(1 + r, years)
    : currentBalance;

  // Net amount still to accumulate
  const netTarget = Math.max(0, targetAmount - currentBalanceFV);
  if (netTarget <= 0) return 0;

  if (r <= 0) return netTarget / years;

  const denom = Math.pow(1 + r, years) - 1;
  if (denom === 0) return netTarget / years;

  return (netTarget * r) / denom;
}

/**
 * Future value of an existing balance after `years` at `earningRatePercent`.
 */
export function futureValueOfBalance(
  currentBalance: number,
  earningRatePercent: number,
  years: number,
): number {
  if (years <= 0) return currentBalance;
  const r = earningRatePercent / 100;
  if (r <= 0) return currentBalance;
  return currentBalance * Math.pow(1 + r, years);
}

/**
 * Project how the reserve balance grows year-by-year given annual contributions.
 * Returns an array of end-of-year balances.
 *
 * @param startingBalance  Balance at year 0
 * @param annualContributions  Array of contributions per year (length = years)
 * @param annualWithdrawals    Array of withdrawals per year (capital projects from reserves)
 * @param earningRatePercent   Rate earned on the fund
 */
export function reserveBalanceProjection(
  startingBalance: number,
  annualContributions: number[],
  annualWithdrawals: number[],
  earningRatePercent: number,
): number[] {
  const r = earningRatePercent / 100;
  const balances: number[] = [];
  let balance = startingBalance;

  for (let i = 0; i < annualContributions.length; i++) {
    balance += annualContributions[i];
    balance -= annualWithdrawals[i] ?? 0;
    balance *= 1 + r; // end-of-year interest
    balances.push(balance);
  }

  return balances;
}
