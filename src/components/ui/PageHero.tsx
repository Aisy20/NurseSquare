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
      <div className="flex flex-wrap items-start justify-between gap-5 border-b border-[var(--g100)] pb-6">
        <div className="max-w-2xl">
          {eyebrow && (
            <div
              className="animate-fade-up mb-4 inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase"
              style={{ background: 'var(--plum-50)', color: 'var(--plum)' }}
            >
              {eyebrow}
            </div>
          )}
          <h1
            className="animate-fade-up delay-100 leading-[1.08] text-[32px] font-bold md:text-[42px]"
            style={{ color: 'var(--ink)' }}
          >
            {title}
            {titleAccent && (
              <> <span style={{ color: 'var(--tang)' }}>{titleAccent}</span></>
            )}
          </h1>
          {subtitle && (
            <p
              className="animate-fade-up delay-200 mt-3 max-w-[680px] text-[15px] leading-7"
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
