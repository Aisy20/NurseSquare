import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'
import { ArrowRight, Heart, Shield, Zap, Users, TrendingUp, Clock } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AboutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userRole = null
  let userName = null
  if (user) {
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    userRole = profile?.role
    userName = user.email?.split('@')[0]
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole={userRole as 'nurse' | 'hospital' | 'admin' | null} userName={userName} />

      {/* Hero — plum-deep background */}
      <section style={{ background: 'var(--plum-deep)' }}>
        <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-8 lg:px-12 pt-20 pb-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-[0.8px] uppercase mb-7"
              style={{ background: 'rgba(200,190,255,0.12)', color: 'var(--plum-100)' }}>
              Our story
            </div>
            <h1 className="font-display text-[52px] md:text-[64px] leading-[1.02] mb-6 text-white">
              Direct nurse hiring,<br />
              <em className="italic" style={{ color: 'var(--tang)' }}>done right.</em>
            </h1>
            <p className="text-[18px] leading-[1.78] max-w-xl" style={{ color: 'var(--plum-100)' }}>
              NurseSquare was built by people who got tired of watching travel nurses lose 30% of their earnings to agencies — and hospitals pay double for the privilege.
            </p>
          </div>
        </div>
      </section>

      {/* Mission cards — 3 distinct accent colors */}
      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Heart,
                title: 'Nurses first',
                desc: 'We built for nurses. Free to join, free to apply, zero hidden fees. The rate you see is the rate you earn.',
                bg: 'var(--plum-50)',
                iconColor: 'var(--plum)',
                accent: 'var(--plum)',
              },
              {
                icon: Shield,
                title: 'Verified & trusted',
                desc: 'Every nurse is Nursys license-checked and Checkr background-cleared. Hospitals know exactly who they\'re hiring.',
                bg: 'var(--sage-50)',
                iconColor: 'var(--sage)',
                accent: 'var(--sage)',
              },
              {
                icon: Zap,
                title: 'Direct connections',
                desc: 'No recruiter middle layer. Nurses and hospitals talk directly. Placements close in days, not weeks.',
                bg: 'var(--tang-50)',
                iconColor: 'var(--tang)',
                accent: 'var(--tang)',
              },
            ].map(item => (
              <div key={item.title} className="rounded-2xl border p-7"
                style={{ background: 'white', borderColor: 'var(--g100)' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: item.bg }}>
                  <item.icon className="w-6 h-6" style={{ color: item.iconColor }} />
                </div>
                <h3 className="font-display text-xl mb-2" style={{ color: 'var(--ink)' }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--g600)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story — cream-mid band with left accent bar */}
      <section className="py-20 border-y" style={{ background: 'var(--cream-mid)', borderColor: 'var(--g100)' }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-[38px] mb-6" style={{ color: 'var(--ink)' }}>Why we built this</h2>
              <div className="space-y-5 text-[16px] leading-[1.8]" style={{ color: 'var(--g600)' }}>
                <p>
                  The travel nursing industry runs on a broken model. Agencies sit between nurses and hospitals, charging facilities 25–40% markups while giving nurses a fraction of what they&apos;re worth.
                </p>
                <p>
                  NurseSquare removes the middleman entirely. Hospitals post their roles, nurses apply directly, and our platform handles licensing verification, background checks, and escrow payments automatically.
                </p>
                <p>
                  The result: nurses earn more, hospitals spend less, and placements happen in days. That&apos;s the whole idea.
                </p>
              </div>
            </div>

            {/* Pull-quote card */}
            <div className="rounded-2xl p-8" style={{ background: 'var(--plum-deep)' }}>
              <p className="font-display text-[26px] leading-snug text-white mb-6">
                &ldquo;The agency was taking $18 an hour off my rate. NurseSquare put it back in my pocket.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(200,190,255,0.15)', color: 'var(--plum-100)' }}>
                  KM
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Kayla M.</div>
                  <div className="text-xs" style={{ color: 'var(--plum-100)' }}>ICU Travel Nurse · Seattle, WA</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats — tang accent */}
      <section className="py-16" style={{ background: 'var(--tang)' }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {[
              { icon: Users, n: '2,400+', l: 'Verified nurses' },
              { icon: TrendingUp, n: '38', l: 'States covered' },
              { icon: Shield, n: '15%', l: 'Hospital fee (vs 25–40%)' },
              { icon: Clock, n: '48hr', l: 'Average placement' },
            ].map(stat => (
              <div key={stat.l} className="text-center">
                <stat.icon className="w-6 h-6 mx-auto mb-2 opacity-70 text-white" />
                <div className="font-display text-[42px] mb-1 text-white">{stat.n}</div>
                <div className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>{stat.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — alternating colored steps */}
      <section className="py-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12">
          <h2 className="font-display text-[38px] mb-12 text-center" style={{ color: 'var(--ink)' }}>
            How NurseSquare works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: '01', title: 'Hospitals post jobs', desc: 'Facilities post open positions in minutes — specialty, dates, pay rate. Live immediately.', bg: 'var(--plum-50)', num: 'var(--plum)' },
              { n: '02', title: 'Nurses apply directly', desc: 'Verified nurses browse and apply. No recruiter gatekeeper. Both sides can initiate contact.', bg: 'var(--sage-50)', num: 'var(--sage)' },
              { n: '03', title: 'Escrow handles pay', desc: 'Funds held securely in Stripe. Released 48hrs after placement starts. Zero surprises.', bg: 'var(--tang-50)', num: 'var(--tang)' },
            ].map(step => (
              <div key={step.n} className="rounded-2xl p-7" style={{ background: step.bg }}>
                <div className="font-display text-[56px] leading-none mb-4" style={{ color: step.num, opacity: 0.3 }}>{step.n}</div>
                <h3 className="font-display text-xl mb-2" style={{ color: 'var(--ink)' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--g600)' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t" style={{ borderColor: 'var(--g100)' }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/auth/register/nurse"
              className="inline-flex items-center gap-2 font-bold text-[15px] px-7 py-3.5 rounded-[14px] text-white transition-all hover:-translate-y-px no-underline"
              style={{ background: 'var(--plum)', boxShadow: '0 8px 24px rgba(45,27,105,0.28)' }}>
              Join as a nurse <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/auth/register/hospital"
              className="inline-flex items-center gap-2 font-bold text-[15px] px-7 py-3.5 rounded-[14px] text-white transition-all hover:-translate-y-px no-underline"
              style={{ background: 'var(--tang)', boxShadow: '0 8px 24px rgba(255,121,64,0.32)' }}>
              I&apos;m hiring
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
