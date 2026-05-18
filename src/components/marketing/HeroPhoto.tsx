import Image from 'next/image'
import { CheckCircle } from 'lucide-react'

export default function HeroPhoto() {
  return (
    <div className="relative animate-scale-in delay-500">
      <div className="relative rounded-[32px] overflow-hidden aspect-[4/5]" style={{ boxShadow: '0 32px 64px rgba(28,16,68,0.28)' }}>
        <Image
          src="https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=900&q=80&auto=format&fit=crop"
          alt="Travel nurse in scrubs with stethoscope, smiling"
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(28,16,68,0) 50%, rgba(28,16,68,0.55) 100%)' }}
        />
      </div>

      {/* Floating ICU job card */}
      <div className="absolute -bottom-6 -left-6 lg:-left-10 max-w-[320px] rounded-2xl p-5"
        style={{ background: 'white', boxShadow: '0 20px 40px rgba(28,16,68,0.18)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold tracking-[1.2px] uppercase px-2 py-1 rounded-md" style={{ background: 'var(--plum-50)', color: 'var(--plum)' }}>
            ICU · Austin, TX
          </span>
          <span className="text-[11px]" style={{ color: 'var(--g400)' }}>13w</span>
        </div>
        <div className="font-display text-[15px] leading-tight" style={{ color: 'var(--ink)' }}>ICU Travel Nurse</div>
        <div className="font-display text-[28px] mt-1 leading-none" style={{ color: 'var(--ink)' }}>
          $2,400<span className="text-sm font-normal" style={{ color: 'var(--g400)' }}>/wk</span>
        </div>
        <div className="mt-3 space-y-1.5">
          {['Nursys verified', 'Checkr cleared', 'Escrow protected'].map((item) => (
            <div key={item} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--g600)' }}>
              <CheckCircle className="w-3 h-3 shrink-0" style={{ color: 'var(--sage)' }} />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Floating verified pill */}
      <div className="absolute top-6 right-6 rounded-full px-3.5 py-1.5 flex items-center gap-1.5"
        style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--sage)' }} />
        <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: 'var(--ink)' }}>License verified</span>
      </div>
    </div>
  )
}
