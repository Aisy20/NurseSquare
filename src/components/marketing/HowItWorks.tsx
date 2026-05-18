import { Upload, GitCompare, ShieldCheck } from 'lucide-react'

const STEPS = [
  {
    n: '01',
    icon: Upload,
    title: 'Forward or upload the offer',
    body: 'Drop the recruiter PDF, paste the email, or forward it to your private NurseSquare address. Claude extracts the full pay package in seconds, no spreadsheets.',
    color: 'var(--plum)',
    bg: 'var(--plum-50)',
  },
  {
    n: '02',
    icon: GitCompare,
    title: 'Upload the signed contract',
    body: 'When the agency sends the contract to sign, upload it. We extract again and diff every field: housing, OT basis, cancellation terms, sign-on, completion, bonuses, dates.',
    color: 'var(--tang)',
    bg: 'var(--tang-50)',
  },
  {
    n: '03',
    icon: ShieldCheck,
    title: 'Sign with eyes open',
    body: 'A clean diff means the agency held the line. Anything worse than $25/wk or 3% gets flagged. Share an anonymized link to negotiate, or sign with confidence.',
    color: 'var(--sage)',
    bg: 'var(--sage-50)',
  },
] as const

export default function HowItWorks() {
  return (
    <section className="py-24 relative overflow-hidden" style={{ background: 'var(--cream)' }}>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 relative">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.8px] uppercase mb-4" style={{ color: 'var(--g400)' }}>
            How it works
          </p>
          <h2 className="font-display text-[42px] md:text-[50px] leading-[1.05] tracking-[-0.5px]" style={{ color: 'var(--ink)' }}>
            Three steps from offer to{' '}
            <em className="italic" style={{ color: 'var(--tang)' }}>signed-with-confidence.</em>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5 relative">
          {/* connecting line on desktop */}
          <div
            aria-hidden
            className="hidden md:block absolute top-12 left-[16.66%] right-[16.66%] h-px"
            style={{ background: 'linear-gradient(90deg, var(--plum) 0%, var(--tang) 50%, var(--sage) 100%)', opacity: 0.2 }}
          />
          {STEPS.map((s) => (
            <article
              key={s.n}
              className="relative rounded-3xl border p-7 transition-all hover:-translate-y-1 hover:shadow-xl"
              style={{ background: 'white', borderColor: 'var(--g100)' }}
            >
              <div className="flex items-start justify-between mb-5">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: s.bg, color: s.color }}
                >
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="font-display text-[44px] leading-none opacity-[0.12]" style={{ color: s.color }}>
                  {s.n}
                </div>
              </div>
              <h3 className="font-display text-[22px] mb-2 leading-tight" style={{ color: 'var(--ink)' }}>
                {s.title}
              </h3>
              <p className="text-[14px] leading-[1.7]" style={{ color: 'var(--g600)' }}>
                {s.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
