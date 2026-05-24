import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'plum'
  icon?: LucideIcon
  className?: string
}

const TONES: Record<NonNullable<StatCardProps['tone']>, { bg: string; border: string; valueColor: string; labelColor: string; iconBg: string; iconColor: string }> = {
  default: { bg: 'white', border: 'var(--g100)', valueColor: 'var(--ink)', labelColor: 'var(--g400)', iconBg: 'var(--cream-mid)', iconColor: 'var(--g600)' },
  success: { bg: 'var(--sage-50)', border: 'transparent', valueColor: 'var(--sage)', labelColor: 'var(--sage)', iconBg: 'white', iconColor: 'var(--sage)' },
  warning: { bg: 'var(--gold-50)', border: 'transparent', valueColor: 'var(--ink)', labelColor: 'var(--tang-deep)', iconBg: 'white', iconColor: 'var(--tang-deep)' },
  danger: { bg: 'var(--tang-50)', border: 'transparent', valueColor: 'var(--tang-mid)', labelColor: 'var(--tang-mid)', iconBg: 'white', iconColor: 'var(--tang-mid)' },
  plum: { bg: 'var(--plum)', border: 'transparent', valueColor: 'white', labelColor: 'var(--plum-100)', iconBg: 'rgba(255,255,255,0.12)', iconColor: 'white' },
}

export default function StatCard({ label, value, sub, tone = 'default', icon: Icon, className }: StatCardProps) {
  const t = TONES[tone]
  return (
    <div
      className={cn('rounded-lg border p-5 shadow-[var(--shadow-sm)]', className)}
      style={{ background: t.bg, borderColor: t.border }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-bold tracking-[1.2px] uppercase" style={{ color: t.labelColor }}>
            {label}
          </div>
          <div className="mt-2 text-3xl font-bold leading-none" style={{ color: t.valueColor, fontFamily: 'var(--font-sora)' }}>
            {value}
          </div>
        </div>
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md" style={{ background: t.iconBg, color: t.iconColor }}>
            <Icon className="h-[18px] w-[18px]" />
          </div>
        )}
      </div>
      {sub && (
        <div className="text-xs mt-2" style={{ color: tone === 'plum' ? 'var(--plum-100)' : 'var(--g600)' }}>
          {sub}
        </div>
      )}
    </div>
  )
}
