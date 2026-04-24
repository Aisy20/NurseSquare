'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (email) setSubscribed(true)
  }

  return (
    <footer className="mt-auto" style={{ background: 'var(--ink)', color: 'var(--g400)' }}>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <svg width="34" height="34" viewBox="0 0 44 44" fill="none">
                <rect width="44" height="44" rx="12" fill="#2D1B69"/>
                <rect x="8" y="9" width="8" height="26" rx="4" fill="white"/>
                <rect x="28" y="9" width="8" height="26" rx="4" fill="white"/>
                <path d="M11 32 L33 12" stroke="white" strokeWidth="8" strokeLinecap="round"/>
                <circle cx="36" cy="10" r="5" fill="#FF7940"/>
              </svg>
              <span className="text-[17px] font-bold tracking-tight text-white">
                Nurse<span style={{ color: 'var(--tang)' }}>Square</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs mb-4" style={{ color: 'var(--g400)' }}>
              Direct nurse hiring, no middleman. Nurses keep more of every dollar. Hospitals fill roles for less.
            </p>
            <p className="text-xs mb-6" style={{ color: 'var(--g600)' }}>Free for nurses · Direct placement</p>

            {/* Newsletter */}
            <p className="text-xs font-semibold mb-2 text-white">Nursing Newsletter</p>
            <p className="text-xs mb-3" style={{ color: 'var(--g600)' }}>Shifts, pay trends, and industry news.</p>
            {subscribed ? (
              <p className="text-xs font-medium" style={{ color: 'var(--sage)' }}>You&apos;re in. ✓</p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                />
                <button type="submit"
                  className="rounded-xl px-3 py-2 flex items-center justify-center transition-opacity hover:opacity-90"
                  style={{ background: 'var(--tang)' }}>
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </button>
              </form>
            )}
          </div>

          {/* Nurses */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Nurses</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/auth/register/nurse" className="no-underline transition-colors hover:text-white" style={{ color: 'var(--g400)' }}>Join Free</Link></li>
              <li><Link href="/nurse/jobs" className="no-underline transition-colors hover:text-white" style={{ color: 'var(--g400)' }}>Browse Jobs</Link></li>
              <li><Link href="/nurse/dashboard" className="no-underline transition-colors hover:text-white" style={{ color: 'var(--g400)' }}>Dashboard</Link></li>
            </ul>
          </div>

          {/* Hospitals */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Hospitals</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/auth/register/hospital" className="no-underline transition-colors hover:text-white" style={{ color: 'var(--g400)' }}>Sign Up</Link></li>
              <li><Link href="/hospital/nurses" className="no-underline transition-colors hover:text-white" style={{ color: 'var(--g400)' }}>Find Nurses</Link></li>
              <li><Link href="/hospital/post-job" className="no-underline transition-colors hover:text-white" style={{ color: 'var(--g400)' }}>Post a Job</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Company</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/about" className="no-underline transition-colors hover:text-white" style={{ color: 'var(--g400)' }}>About Us</Link></li>
              <li><Link href="/contact" className="no-underline transition-colors hover:text-white" style={{ color: 'var(--g400)' }}>Contact Us</Link></li>
              <li><Link href="/privacy" className="no-underline transition-colors hover:text-white" style={{ color: 'var(--g400)' }}>Privacy</Link></li>
              <li><Link href="/terms" className="no-underline transition-colors hover:text-white" style={{ color: 'var(--g400)' }}>Terms</Link></li>
              <li><Link href="/hipaa" className="no-underline transition-colors hover:text-white" style={{ color: 'var(--g400)' }}>HIPAA</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs" style={{ color: 'var(--g600)' }}>© {new Date().getFullYear()} NurseSquare. All rights reserved.</p>
          <p className="text-xs" style={{ color: 'var(--g600)' }}>Questions? <a href="mailto:hello@nursesquare.com" className="no-underline hover:text-white transition-colors" style={{ color: 'var(--g400)' }}>hello@nursesquare.com</a></p>
        </div>
      </div>
    </footer>
  )
}
