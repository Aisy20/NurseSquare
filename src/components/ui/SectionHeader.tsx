import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  right?: React.ReactNode
  className?: string
}

export default function SectionHeader({ eyebrow, title, description, right, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-end justify-between gap-4 mb-4', className)}>
      <div>
        {eyebrow && (
          <div className="text-[10px] font-bold tracking-[1.2px] uppercase mb-1" style={{ color: 'var(--tang)' }}>
            {eyebrow}
          </div>
        )}
        <h2 className="font-display text-2xl" style={{ color: 'var(--ink)' }}>{title}</h2>
        {description && (
          <p className="text-sm mt-1" style={{ color: 'var(--g600)' }}>{description}</p>
        )}
      </div>
      {right}
    </div>
  )
}
