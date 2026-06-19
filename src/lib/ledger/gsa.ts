// GSA per-diem ceilings for the Contract Check "stipend over GSA per-diem" rule.
//
// Rates are stored in gsa_per_diem_rates (see migration 0004) and looked up by
// the assignment's GSA fiscal year + state + city. The lookup is pure over an
// injectable PerDiemSource so the rules can be unit-tested without a database.

export interface PerDiemRate {
  /** Max nightly lodging, in cents. */
  lodging_cents: number
  /** Daily meals & incidental expenses, in cents. */
  mie_cents: number
  /** The locality the rate resolved to: a city name, 'state-default', or 'conus-standard'. */
  resolved: string
}

export interface PerDiemQuery {
  state: string | null
  city: string | null
  fiscalYear: number
}

/**
 * A source of GSA per-diem rows. The DB-backed implementation queries
 * gsa_per_diem_rates; tests pass an in-memory array.
 */
export interface PerDiemSource {
  /**
   * Return every row for a fiscal year (the lookup does the matching). Keep the
   * result small — it is one fiscal year of localities.
   */
  ratesForYear(fiscalYear: number): Promise<PerDiemRow[]>
}

export interface PerDiemRow {
  fiscal_year: number
  state: string
  locality: string
  lodging_cents: number
  mie_cents: number
}

/**
 * GSA fiscal years run October 1 through September 30 and are named for the
 * year they end in. October–December therefore belong to the *next* calendar
 * year's fiscal year.
 */
export function gsaFiscalYear(date: Date): number {
  const month = date.getUTCMonth() // 0 = Jan ... 9 = Oct
  return month >= 9 ? date.getUTCFullYear() + 1 : date.getUTCFullYear()
}

function norm(s: string | null | undefined): string {
  return (s ?? '').trim().toLowerCase()
}

/**
 * Resolve a per-diem ceiling for an assignment. Falls back from an exact
 * city match → the state default (locality '*') → the CONUS standard
 * (state '*'). Returns null only when even the CONUS standard row is missing
 * for the requested fiscal year.
 */
export function resolvePerDiem(rows: PerDiemRow[], query: PerDiemQuery): PerDiemRate | null {
  const inYear = rows.filter((r) => r.fiscal_year === query.fiscalYear)
  const state = norm(query.state)
  const city = norm(query.city)

  const cityMatch =
    state && city
      ? inYear.find((r) => norm(r.state) === state && norm(r.locality) === city)
      : undefined
  if (cityMatch) return toRate(cityMatch, cityMatch.locality)

  const stateDefault = state
    ? inYear.find((r) => norm(r.state) === state && r.locality === '*')
    : undefined
  if (stateDefault) return toRate(stateDefault, 'state-default')

  const conus = inYear.find((r) => r.state === '*' && r.locality === '*')
  if (conus) return toRate(conus, 'conus-standard')

  return null
}

function toRate(row: PerDiemRow, resolved: string): PerDiemRate {
  return { lodging_cents: row.lodging_cents, mie_cents: row.mie_cents, resolved }
}

/** Convenience: resolve a per-diem rate from a source for a given query. */
export async function lookupPerDiem(
  source: PerDiemSource,
  query: PerDiemQuery,
): Promise<PerDiemRate | null> {
  const rows = await source.ratesForYear(query.fiscalYear)
  return resolvePerDiem(rows, query)
}
