import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'plum'
  className?: string
}

const TONES: Record<NonNullable<StatCardProps['tone']>, { bg: string; border: string; valueColor: string; labelColor: string }> = {
  default: { bg: 'white', border: 'var(--g100)', valueColor: 'var(--ink)', labelColor: 'var(--g400)' },
  success: { bg: 'var(--sage-50)', border: 'transparent', valueColor: 'var(--sage)', labelColor: 'var(--sage)' },
  warning: { bg: 'var(--gold-50)', border: 'transparent', valueColor: 'var(--ink)', labelColor: 'var(--ink)' },
  danger: { bg: 'var(--tang-50)', border: 'transparent', valueColor: 'var(--tang-mid)', labelColor: 'var(--tang-mid)' },
  plum: { bg: 'var(--plum)', border: 'transparent', valueColor: 'white', labelColor: 'var(--plum-100)' },
}

export default function StatCard({ label, value, sub, tone = 'default', className }: StatCardProps) {
  const t = TONES[tone]
  return (
    <div
      className={cn('rounded-2xl p-5 border', className)}
      style={{ background: t.bg, borderColor: t.border }}
    >
      <div className="text-[10px] font-bold tracking-[1.2px] uppercase" style={{ color: t.labelColor }}>
        {label}
      </div>
      <div className="text-3xl font-bold mt-2 leading-none" style={{ color: t.valueColor, fontFamily: 'var(--font-sora)' }}>
        {value}
      </div>
      {sub && (
        <div className="text-xs mt-2" style={{ color: tone === 'plum' ? 'var(--plum-100)' : 'var(--g600)' }}>
          {sub}
        </div>
      )}
    </div>
  )
}
