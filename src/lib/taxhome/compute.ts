export interface ContractWindow {
  start_date: string | null
  end_date: string | null
  location_state: string | null
}

export type TaxHomeFlag = 'safe' | 'warning' | 'risk'

export interface StateDayCount {
  state: string
  days: number
}

export interface TaxHomeStatus {
  asOf: string
  taxHomeState: string | null
  daysAwayLast365: number
  daysAtHomeLast365: number
  daysAwayLast730: number
  topStatesLast365: StateDayCount[]
  topStatesLast730: StateDayCount[]
  maxStateDaysLast365: StateDayCount | null
  maxStateDaysLast730: StateDayCount | null
  flag: TaxHomeFlag
  reasons: string[]
}

const DAY_MS = 86_400_000

function toUtcDate(d: string | Date): Date {
  if (d instanceof Date) return d
  return new Date(`${d}T00:00:00Z`)
}

function clampInterval(
  start: Date,
  end: Date,
  windowStart: Date,
  windowEnd: Date,
): { from: Date; to: Date } | null {
  const from = start.getTime() > windowStart.getTime() ? start : windowStart
  const to = end.getTime() < windowEnd.getTime() ? end : windowEnd
  if (from.getTime() > to.getTime()) return null
  return { from, to }
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / DAY_MS) + 1)
}

interface StateIntervalSum {
  byState: Map<string, number>
  total: number
}

function sumDaysByState(
  contracts: ContractWindow[],
  windowStart: Date,
  windowEnd: Date,
): StateIntervalSum {
  const byState = new Map<string, number>()
  let total = 0
  for (const c of contracts) {
    if (!c.start_date || !c.end_date || !c.location_state) continue
    const start = toUtcDate(c.start_date)
    const end = toUtcDate(c.end_date)
    const clipped = clampInterval(start, end, windowStart, windowEnd)
    if (!clipped) continue
    const days = daysBetween(clipped.from, clipped.to)
    const stateKey = c.location_state.toUpperCase()
    byState.set(stateKey, (byState.get(stateKey) ?? 0) + days)
    total += days
  }
  return { byState, total }
}

export function computeTaxHomeStatus(
  contracts: ContractWindow[],
  taxHomeState: string | null,
  asOf: Date = new Date(),
): TaxHomeStatus {
  const windowEnd = asOf
  const windowStart365 = new Date(windowEnd.getTime() - 364 * DAY_MS)
  const windowStart730 = new Date(windowEnd.getTime() - 729 * DAY_MS)

  const taxHome = taxHomeState?.toUpperCase() ?? null

  const sum365 = sumDaysByState(contracts, windowStart365, windowEnd)
  const sum730 = sumDaysByState(contracts, windowStart730, windowEnd)

  const daysAwayLast365 = taxHome
    ? Array.from(sum365.byState.entries())
        .filter(([s]) => s !== taxHome)
        .reduce((acc, [, d]) => acc + d, 0)
    : sum365.total
  const daysAwayLast730 = taxHome
    ? Array.from(sum730.byState.entries())
        .filter(([s]) => s !== taxHome)
        .reduce((acc, [, d]) => acc + d, 0)
    : sum730.total

  const daysAtHomeLast365 = Math.max(0, 365 - daysAwayLast365)

  const toRanked = (map: Map<string, number>): StateDayCount[] =>
    Array.from(map.entries())
      .map(([state, days]) => ({ state, days }))
      .sort((a, b) => b.days - a.days)

  const ranked365 = toRanked(sum365.byState)
  const ranked730 = toRanked(sum730.byState)

  const maxAway365 = ranked365.find((r) => r.state !== taxHome) ?? null
  const maxAway730 = ranked730.find((r) => r.state !== taxHome) ?? null

  const reasons: string[] = []
  let flag: TaxHomeFlag = 'safe'

  if (!taxHome) {
    reasons.push('No tax-home state set on profile.')
    flag = 'warning'
  }
  if (maxAway730 && maxAway730.days > 365) {
    reasons.push(`Worked ${maxAway730.days} days in ${maxAway730.state} in the last 24 months. Exceeds the 12-month-in-one-metro rule of thumb.`)
    flag = 'risk'
  } else if (maxAway730 && maxAway730.days >= 330) {
    reasons.push(`Approaching the 12-month limit in ${maxAway730.state}: ${maxAway730.days} days in the last 24 months.`)
    if (flag === 'safe') flag = 'warning'
  }
  if (taxHome && daysAtHomeLast365 < 14) {
    reasons.push(`Only ${daysAtHomeLast365} days at tax home in the last 365. IRS scrutiny risk if you cannot show duplicate-expense maintenance.`)
    flag = 'risk'
  } else if (taxHome && daysAtHomeLast365 < 30) {
    reasons.push(`${daysAtHomeLast365} days at tax home in the last 365. Folk-wisdom threshold is 30 days.`)
    if (flag === 'safe') flag = 'warning'
  }

  return {
    asOf: windowEnd.toISOString(),
    taxHomeState: taxHome,
    daysAwayLast365,
    daysAtHomeLast365,
    daysAwayLast730,
    topStatesLast365: ranked365.slice(0, 5),
    topStatesLast730: ranked730.slice(0, 5),
    maxStateDaysLast365: ranked365[0] ?? null,
    maxStateDaysLast730: ranked730[0] ?? null,
    flag,
    reasons,
  }
}
