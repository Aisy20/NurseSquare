import Image from 'next/image'
import type { Testimonial } from '@/lib/marketing/people'

const ACCENT: Record<Testimonial['accent'], { ring: string; chip: string; bg: string }> = {
  plum: { ring: 'var(--plum)', chip: 'var(--plum-50)', bg: 'var(--plum)' },
  tang: { ring: 'var(--tang)', chip: 'var(--tang-50)', bg: 'var(--tang)' },
  sage: { ring: 'var(--sage)', chip: 'var(--sage-50)', bg: 'var(--sage)' },
}

export default function TestimonialCard({ t }: { t: Testimonial }) {
  const a = ACCENT[t.accent]
  return (
    <article
      className="rounded-3xl border p-7 flex flex-col h-full transition-all hover:-translate-y-1 hover:shadow-xl"
      style={{ background: 'white', borderColor: 'var(--g100)' }}
    >
      <svg width="32" height="24" viewBox="0 0 32 24" className="mb-5 opacity-25" aria-hidden style={{ color: a.bg }}>
        <path d="M0 24V14C0 6.268 5.373 0 12 0v6c-3.314 0-6 3.582-6 8h6v10H0zm20 0V14C20 6.268 25.373 0 32 0v6c-3.314 0-6 3.582-6 8h6v10H20z" fill="currentColor" />
      </svg>
      <p className="text-[15px] leading-[1.7] mb-6 flex-1" style={{ color: 'var(--ink)' }}>
        {t.quote}
      </p>
      <footer className="flex items-center gap-3 mt-auto pt-5 border-t" style={{ borderColor: 'var(--g100)' }}>
        <div className="rounded-full p-[2px]" style={{ background: a.bg }}>
          <Image
            src={t.avatar.url}
            alt={t.avatar.alt}
            width={48}
            height={48}
            className="rounded-full block"
            style={{ objectFit: 'cover', aspectRatio: '1 / 1' }}
          />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold truncate" style={{ color: 'var(--ink)' }}>{t.name}</div>
          <div className="text-xs truncate" style={{ color: 'var(--g600)' }}>
            {t.role} <span style={{ color: 'var(--g400)' }}>·</span> {t.location}
          </div>
        </div>
      </footer>
    </article>
  )
}
