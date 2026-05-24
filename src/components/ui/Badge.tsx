import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.45px]',
        {
          'bg-[var(--g100)] text-[var(--g600)]': variant === 'default',
          'bg-[var(--sage-50)] text-[var(--sage)]': variant === 'success',
          'bg-[var(--gold-50)] text-[var(--tang-deep)]': variant === 'warning',
          'bg-[var(--tang-50)] text-[var(--tang-mid)]': variant === 'danger',
          'bg-[var(--plum-50)] text-[var(--plum)]': variant === 'info',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
