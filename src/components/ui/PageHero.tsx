import { cn } from '@/lib/utils'

interface PageHeroProps {
  eyebrow?: string
  title: string
  titleAccent?: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export default function PageHero({ eyebrow, title, titleAccent, subtitle, actions, className }: PageHeroProps) {
  return (
    <header className={cn('mb-8 lg:mb-10', className)}>
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="max-w-2xl">
          {eyebrow && (
            <div
              className="animate-fade-up inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-[0.8px] uppercase mb-5"
              style={{ background: 'var(--plum)', color: 'var(--plum-100)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--tang)' }} />
              {eyebrow}
            </div>
          )}
          <h1
            className="animate-fade-up delay-100 font-display leading-[1.02] tracking-[-0.5px] text-[40px] md:text-[52px]"
            style={{ color: 'var(--ink)' }}
          >
            {title}
            {titleAccent && (
              <> <span style={{ color: 'var(--tang)' }}>{titleAccent}</span></>
            )}
          </h1>
          {subtitle && (
            <p
              className="animate-fade-up delay-200 text-[15px] md:text-[17px] leading-[1.7] mt-4 max-w-[640px]"
              style={{ color: 'var(--g600)' }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="animate-fade-up delay-300 flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
