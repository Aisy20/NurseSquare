import Link from 'next/link'
import { ArrowRight, Stethoscope, Building2, CheckCircle } from 'lucide-react'
import { Logo } from '@/components/layout/Navbar'

export default function RegisterChoicePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: 'var(--cream)' }}>
      <div className="w-full max-w-2xl">
        <div className="flex flex-col items-center mb-10">
          <Logo />
          <h1 className="font-display text-[32px] mt-6 mb-1" style={{ color: 'var(--ink)' }}>Join NurseSquare</h1>
          <p className="text-sm" style={{ color: 'var(--g600)' }}>Choose how you&apos;ll use the platform</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {/* Nurse card */}
          <Link href="/auth/register/nurse" className="no-underline group">
            <div className="rounded-2xl border p-7 h-full transition-all hover:-translate-y-0.5 hover:shadow-xl"
              style={{ background: 'white', borderColor: 'var(--g100)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-colors"
                style={{ background: 'var(--plum-50)' }}>
                <Stethoscope className="w-7 h-7" style={{ color: 'var(--plum)' }} />
              </div>
              <h2 className="font-display text-xl mb-2" style={{ color: 'var(--ink)' }}>I&apos;m a Nurse</h2>
              <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--g600)' }}>
                Travel nurses and home care aides. Join free, apply directly, keep more of every dollar.
              </p>
              <div className="space-y-2.5 mb-6">
                {[
                  'Free to join & apply',
                  'Direct access to hospitals',
                  'Secure escrow payment',
                  '1099 contractor positions',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2 text-sm" style={{ color: 'var(--g600)' }}>
                    <CheckCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--sage)' }} />
                    {item}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--plum)' }}>
                Get started free <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* Hospital card */}
          <Link href="/auth/register/hospital" className="no-underline group">
            <div className="rounded-2xl border p-7 h-full transition-all hover:-translate-y-0.5 hover:shadow-xl"
              style={{ background: 'white', borderColor: 'var(--g100)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-colors"
                style={{ background: 'var(--tang-50)' }}>
                <Building2 className="w-7 h-7" style={{ color: 'var(--tang)' }} />
              </div>
              <h2 className="font-display text-xl mb-2" style={{ color: 'var(--ink)' }}>I&apos;m Hiring</h2>
              <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--g600)' }}>
                Hospitals, clinics, and agencies. Post jobs, browse verified nurses, pay just 15%.
              </p>
              <div className="space-y-2.5 mb-6">
                {[
                  '15% fee (vs 25–40% agencies)',
                  'Verified, background-checked nurses',
                  'Escrow payment protection',
                  'Automatic onboarding PDF',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2 text-sm" style={{ color: 'var(--g600)' }}>
                    <CheckCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--sage)' }} />
                    {item}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--tang)' }}>
                Start hiring <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>

        <p className="text-center text-sm mt-8" style={{ color: 'var(--g600)' }}>
          Already have an account?{' '}
          <Link href="/auth/login" className="font-semibold no-underline" style={{ color: 'var(--plum)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
