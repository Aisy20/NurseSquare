import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn('rounded-3xl border-2 border-dashed p-12 text-center', className)}
      style={{ borderColor: 'var(--g200)', background: 'white' }}
    >
      {icon && (
        <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--plum-50)', color: 'var(--plum)' }}>
          {icon}
        </div>
      )}
      <h2 className="font-display text-2xl mb-2" style={{ color: 'var(--ink)' }}>{title}</h2>
      {description && (
        <p className="text-sm max-w-md mx-auto mb-6" style={{ color: 'var(--g600)' }}>{description}</p>
      )}
      {action}
    </div>
  )
}
