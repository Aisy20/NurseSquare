// Contract Check v0 — deterministic assessment of a single recruiter pay quote.
//
// Everything here is pure: it takes an extracted PayPackage, a resolved GSA
// per-diem ceiling, and (optionally) the nurse's tax-home status, and returns a
// breakdown, the blended hourly rate, the bill-rate capture, and explained red
// flags. No I/O, no LLM — those live in the route and extractor. All money is in
// integer cents; capture is a fraction (0.76 = 76%).

import type { PayPackage } from './types'
import type { PerDiemRate } from './gsa'
import type { TaxHomeStatus } from '@/lib/taxhome/compute'
import { formatCents } from './currency'

export type Severity = 'info' | 'warning' | 'high'

export interface Flag {
  code: string
  severity: Severity
  message: string
}

export interface WeeklyBreakdown {
  taxable_cents: number | null
  housing_cents: number | null
  meals_cents: number | null
  travel_cents: number | null
  /** Sum of the present components above (treats null components as 0). */
  total_cents: number
}

export interface Assessment {
  blended_hourly_cents: number | null
  bill_rate_cents: number | null
  /** blended / bill rate, rounded to 4 decimals; null when bill rate undisclosed. */
  bill_rate_capture: number | null
  weekly: WeeklyBreakdown
  flags: Flag[]
  taxHome: TaxHomeStatus | null
  perDiem: PerDiemRate | null
}

// --- Tunable thresholds (exported for tests) -------------------------------

/** Taxable hourly at or below this with sizeable stipends reads as tax-home risk. */
export const LOW_BASE_FLOOR_CENTS = 2500 // $25.00/hr
/** Taxable wages should make up at least this share of weekly comp. */
export const MIN_TAXABLE_SHARE = 0.3

// --- Core math -------------------------------------------------------------

/** Sum of recurring weekly stipends (housing + meals + weekly travel). One-time
 * reimbursements are excluded — they are not part of the weekly blended rate. */
export function weeklyStipendCents(pkg: PayPackage): number {
  return (
    (pkg.weekly_housing_stipend_cents ?? 0) +
    (pkg.weekly_meals_stipend_cents ?? 0) +
    (pkg.weekly_travel_stipend_cents ?? 0)
  )
}

/** Itemized weekly comp. taxable_cents is null when base or hours are unknown. */
export function weeklyBreakdown(pkg: PayPackage): WeeklyBreakdown {
  const hours = pkg.guaranteed_hours_per_week
  const base = pkg.taxable_hourly_rate_cents
  const taxable = base != null && hours != null && hours > 0 ? base * hours : null
  const housing = pkg.weekly_housing_stipend_cents
  const meals = pkg.weekly_meals_stipend_cents
  const travel = pkg.weekly_travel_stipend_cents
  const total = (taxable ?? 0) + (housing ?? 0) + (meals ?? 0) + (travel ?? 0)
  return {
    taxable_cents: taxable,
    housing_cents: housing,
    meals_cents: meals,
    travel_cents: travel,
    total_cents: total,
  }
}

/**
 * Blended hourly rate in cents = total weekly comp / guaranteed hours.
 * Null when hours are missing/zero or there is no compensation to blend.
 */
export function computeBlendedRate(pkg: PayPackage): number | null {
  const hours = pkg.guaranteed_hours_per_week
  if (hours == null || hours <= 0) return null
  const wk = weeklyBreakdown(pkg)
  if (wk.total_cents <= 0) return null
  return Math.round(wk.total_cents / hours)
}

/**
 * Bill-rate capture = blended / bill rate, rounded to 4 decimals.
 * Null when either input is missing or the bill rate is non-positive.
 */
export function computeBillRateCapture(
  blendedCents: number | null,
  billRateCents: number | null,
): number | null {
  if (blendedCents == null || billRateCents == null || billRateCents <= 0) return null
  return Math.round((blendedCents / billRateCents) * 10000) / 10000
}

// --- Red-flag rules --------------------------------------------------------

/** 1. Suspiciously low taxable base paired with inflated stipends (tax-home risk). */
export function flagLowBaseHighStipend(pkg: PayPackage): Flag | null {
  const stipends = weeklyStipendCents(pkg)
  if (stipends <= 0) return null // no stipends to be "inflated" against

  const base = pkg.taxable_hourly_rate_cents
  const wk = weeklyBreakdown(pkg)
  const lowBase = base != null && base < LOW_BASE_FLOOR_CENTS

  let lowShare = false
  if (wk.taxable_cents != null && wk.total_cents > 0) {
    lowShare = wk.taxable_cents / wk.total_cents < MIN_TAXABLE_SHARE
  }
  if (!lowBase && !lowShare) return null

  const baseStr = base != null ? `${formatCents(base)}/hr` : 'an unstated base'
  return {
    code: 'LOW_BASE_HIGH_STIPEND',
    severity: 'high',
    message: `The taxable base (${baseStr}) is low relative to ${formatCents(stipends)}/wk in stipends, which raises IRS tax-home scrutiny and the risk of stipends being reclassified as taxable wages.`,
  }
}

/** 2. Weekly housing/meals stipends above the GSA per-diem ceiling (separate caps). */
export function flagStipendOverGsa(pkg: PayPackage, perDiem: PerDiemRate | null): Flag[] {
  if (!perDiem) return []
  const flags: Flag[] = []
  const lodgingCeil = perDiem.lodging_cents * 7
  const mieCeil = perDiem.mie_cents * 7

  const housing = pkg.weekly_housing_stipend_cents
  if (housing != null && housing > lodgingCeil) {
    flags.push({
      code: 'STIPEND_OVER_GSA_HOUSING',
      severity: 'high',
      message: `Weekly housing stipend (${formatCents(housing)}) exceeds the GSA lodging ceiling of ${formatCents(lodgingCeil)}/wk for this locality, so the excess is not defensibly tax-free.`,
    })
  }

  const meals = pkg.weekly_meals_stipend_cents
  if (meals != null && meals > mieCeil) {
    flags.push({
      code: 'STIPEND_OVER_GSA_MEALS',
      severity: 'high',
      message: `Weekly meals stipend (${formatCents(meals)}) exceeds the GSA M&IE ceiling of ${formatCents(mieCeil)}/wk for this locality, so the excess is not defensibly tax-free.`,
    })
  }
  return flags
}

/** 3. A blended/gross figure quoted with no component breakdown. */
export function flagBlendedNoBreakdown(pkg: PayPackage): Flag | null {
  const grossFigure =
    pkg.weekly_gross_estimate_cents ??
    pkg.weekly_net_estimate_cents ??
    pkg.weekly_net_estimate_cents_high ??
    pkg.weekly_net_estimate_cents_low
  if (grossFigure == null) return null

  const hasBase = pkg.taxable_hourly_rate_cents != null
  const hasStipends =
    pkg.weekly_housing_stipend_cents != null || pkg.weekly_meals_stipend_cents != null
  if (hasBase && hasStipends) return null // properly itemized

  return {
    code: 'BLENDED_NO_BREAKDOWN',
    severity: 'warning',
    message: `A weekly figure of ${formatCents(grossFigure)} is quoted without a full taxable-base and stipend breakdown, so the taxable/tax-free split can't be verified.`,
  }
}

/** 4. Missing or undisclosed bill rate. */
export function flagMissingBillRate(pkg: PayPackage): Flag | null {
  if (pkg.bill_rate_cents != null) return null
  return {
    code: 'BILL_RATE_UNDISCLOSED',
    severity: 'warning',
    message: `No bill rate was disclosed, so you can't see what share of the agency's facility rate you're actually capturing.`,
  }
}

/** Optional 5th surface: tax-home day-count risk from the existing compute logic. */
export function flagTaxHomeDays(taxHome: TaxHomeStatus | null): Flag | null {
  if (!taxHome || taxHome.flag === 'safe') return null
  return {
    code: 'TAX_HOME_DAYS',
    severity: taxHome.flag === 'risk' ? 'high' : 'warning',
    message: taxHome.reasons[0] ?? 'Tax-home day counts across your contracts warrant review.',
  }
}

// --- Aggregator ------------------------------------------------------------

export interface AssessInput {
  pkg: PayPackage
  perDiem: PerDiemRate | null
  taxHome?: TaxHomeStatus | null
}

export function assessQuote({ pkg, perDiem, taxHome = null }: AssessInput): Assessment {
  const blended = computeBlendedRate(pkg)
  const capture = computeBillRateCapture(blended, pkg.bill_rate_cents)

  const flags: Flag[] = [
    flagLowBaseHighStipend(pkg),
    ...flagStipendOverGsa(pkg, perDiem),
    flagBlendedNoBreakdown(pkg),
    flagMissingBillRate(pkg),
    flagTaxHomeDays(taxHome),
  ].filter((f): f is Flag => f !== null)

  return {
    blended_hourly_cents: blended,
    bill_rate_cents: pkg.bill_rate_cents,
    bill_rate_capture: capture,
    weekly: weeklyBreakdown(pkg),
    flags,
    taxHome,
    perDiem,
  }
}
