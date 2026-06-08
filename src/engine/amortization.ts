/**
 * Loan amortization calculations.
 * Uses monthly compounding (standard for US municipal water loans) throughout.
 * All functions are pure — no side effects, no global state.
 */

/**
 * Annual loan payment using monthly compounding (standard US amortization).
 * @param principal  Loan principal, $
 * @param annualRatePercent  Annual interest rate, % (e.g. 3.5 for 3.5%)
 * @param termYears  Loan term in years
 */
export function annualLoanPayment(
  principal: number,
  annualRatePercent: number,
  termYears: number,
): number {
  if (principal <= 0 || termYears <= 0) return 0;
  if (annualRatePercent < 0) return 0;
  if (annualRatePercent === 0) return principal / termYears;

  const r = annualRatePercent / 100 / 12; // monthly rate
  const n = termYears * 12;               // total payments
  const monthly = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  if (!isFinite(monthly) || isNaN(monthly)) return 0;
  return monthly * 12;
}

/**
 * Remaining loan balance after `paymentsMade` monthly payments.
 * Useful for displaying outstanding principal on existing loans.
 */
export function remainingBalance(
  principal: number,
  annualRatePercent: number,
  termYears: number,
  paymentsMade: number,
): number {
  if (principal <= 0 || termYears <= 0) return 0;
  if (annualRatePercent === 0) {
    const monthlyPrincipal = principal / (termYears * 12);
    return Math.max(0, principal - monthlyPrincipal * paymentsMade);
  }
  const r = annualRatePercent / 100 / 12;
  const n = termYears * 12;
  const balance = principal * (Math.pow(1 + r, n) - Math.pow(1 + r, paymentsMade)) /
                  (Math.pow(1 + r, n) - 1);
  return Math.max(0, balance);
}

/**
 * Total interest paid over the life of a loan.
 */
export function totalInterestPaid(
  principal: number,
  annualRatePercent: number,
  termYears: number,
): number {
  const annual = annualLoanPayment(principal, annualRatePercent, termYears);
  return Math.max(0, annual * termYears - principal);
}
