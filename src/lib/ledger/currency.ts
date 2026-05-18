export function formatCents(cents: number | null | undefined): string {
  if (cents == null) return '--'
  const dollars = cents / 100
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(dollars)
}

export function formatCentsPrecise(cents: number | null | undefined): string {
  if (cents == null) return '--'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

export function formatPct(pct: number | null | undefined): string {
  if (pct == null) return ''
  const sign = pct > 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}
