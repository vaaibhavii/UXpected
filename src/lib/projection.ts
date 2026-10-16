/**
 * Hypothetical future-value maths. Pure functions, no UI.
 *
 * Method: contributions are made at the END of each month (ordinary annuity).
 * The annual assumption is converted to an effective monthly rate:
 *   r = (1 + annual)^(1/12) - 1
 * and the value after n months is  P * ((1 + r)^n - 1) / r.
 * At r = 0 this is exactly P * n. Fees, taxes, inflation, withdrawals and missed
 * payments are ignored.
 */

export const SCENARIO_RATES = { low: 4, mid: 8, high: 12 } as const;
export const MIN_RATE = -50;
export const MAX_RATE = 50;

export function monthlyRate(annualPct: number): number {
  return Math.pow(1 + annualPct / 100, 1 / 12) - 1;
}

export function totalContributed(monthly: number, years: number): number {
  return Math.max(0, monthly) * years * 12;
}

export function futureValue(monthly: number, annualPct: number, months: number): number {
  if (monthly <= 0 || months <= 0) return 0;
  const r = monthlyRate(annualPct);
  if (Math.abs(r) < 1e-12) return monthly * months;
  return monthly * ((Math.pow(1 + r, months) - 1) / r);
}

export interface YearPoint {
  year: number;
  contributed: number;
  value: number;
}

export function yearlySeries(monthly: number, annualPct: number, years: number): YearPoint[] {
  return Array.from({ length: years }, (_, i) => {
    const year = i + 1;
    return {
      year,
      contributed: totalContributed(monthly, year),
      value: futureValue(monthly, annualPct, year * 12),
    };
  });
}

export interface Outcome {
  rate: number;
  contributed: number;
  value: number;
  /** value - contributed. Negative means a hypothetical shortfall. */
  difference: number;
}

export function outcome(monthly: number, annualPct: number, years: number): Outcome {
  const contributed = totalContributed(monthly, years);
  const value = futureValue(monthly, annualPct, years * 12);
  return { rate: annualPct, contributed, value, difference: value - contributed };
}

export function parseRate(raw: string): { value: number | null; error: string | null } {
  const t = raw.trim().replace("%", "");
  if (t === "") return { value: null, error: "Enter a number, like 6 or -3." };
  if (!/^-?\d{1,2}(\.\d{1,2})?$/.test(t)) return { value: null, error: "Numbers only, like 6 or -3." };
  const v = parseFloat(t);
  if (v < MIN_RATE || v > MAX_RATE) return { value: null, error: `Keep it between ${MIN_RATE}% and ${MAX_RATE}%.` };
  return { value: v, error: null };
}
