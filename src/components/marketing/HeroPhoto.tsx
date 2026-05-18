import Image from 'next/image'
import { CheckCircle, Sparkles } from 'lucide-react'

export default function HeroPhoto() {
  return (
    <div className="relative animate-scale-in delay-500">
      {/* Background blob */}
      <div
        aria-hidden
        className="absolute -inset-8 rounded-full opacity-40 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top right, var(--tang-100), transparent 60%)' }}
      />

      {/* Main photo card */}
      <div
        className="relative rounded-[36px] overflow-hidden aspect-[4/5]"
        style={{ boxShadow: '0 32px 64px rgba(28,16,68,0.22)' }}
      >
        <Image
          src="https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=900&q=80&auto=format&fit=crop"
          alt="Travel nurse in scrubs"
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(160deg, rgba(45,27,105,0.05) 0%, rgba(45,27,105,0) 50%, rgba(28,16,68,0.55) 100%)',
          }}
        />
      </div>

      {/* Top-right floating verification pill */}
      <div
        className="absolute top-6 right-6 rounded-full px-3.5 py-2 flex items-center gap-2"
        style={{
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 24px rgba(28,16,68,0.10)',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--sage)' }} />
        <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: 'var(--ink)' }}>
          License verified
        </span>
      </div>

      {/* Bottom-left stacked diff cards */}
      <div className="absolute -bottom-8 -left-4 lg:-left-12 space-y-3 max-w-[300px]">
        <div
          className="rounded-2xl p-4 transform -rotate-2"
          style={{ background: 'white', boxShadow: '0 16px 40px rgba(28,16,68,0.14)' }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-bold tracking-[1.2px] uppercase" style={{ color: 'var(--g400)' }}>
              Quoted · ICU Phoenix
            </span>
            <Sparkles className="w-3 h-3" style={{ color: 'var(--plum)' }} />
          </div>
          <div className="font-display text-xl leading-none" style={{ color: 'var(--ink)' }}>
            $2,716<span className="text-sm font-normal" style={{ color: 'var(--g400)' }}>/wk gross</span>
          </div>
        </div>

        <div
          className="rounded-2xl p-4 transform rotate-1 ml-6"
          style={{
            background: 'white',
            boxShadow: '0 16px 40px rgba(28,16,68,0.14)',
            border: '2px solid var(--tang)',
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-bold tracking-[1.2px] uppercase" style={{ color: 'var(--tang)' }}>
              Signed · ICU Phoenix
            </span>
            <span
              className="text-[9px] font-bold tracking-[1.2px] uppercase px-1.5 py-0.5 rounded"
              style={{ background: 'var(--tang)', color: 'white' }}
            >
              −$400
            </span>
          </div>
          <div className="font-display text-xl leading-none" style={{ color: 'var(--ink)' }}>
            $2,316<span className="text-sm font-normal" style={{ color: 'var(--g400)' }}>/wk gross</span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px]" style={{ color: 'var(--tang-mid)' }}>
            <CheckCircle className="w-2.5 h-2.5" />
            Flagged before signing
          </div>
        </div>
      </div>
    </div>
  )
}
