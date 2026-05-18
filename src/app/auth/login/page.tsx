'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Logo } from '@/components/layout/Navbar'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      router.push(profile?.role === 'nurse' ? '/nurse/dashboard' : '/hospital/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--cream)' }}>
      {/* Left panel — brand with photo backdrop */}
      <div className="hidden lg:flex lg:w-[480px] relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: 'var(--plum-deep)' }}>
        <Image
          src="https://images.unsplash.com/photo-1559757175-5700dde675bc?w=1000&q=80&auto=format&fit=crop"
          alt="Travel nurse in scrubs"
          fill
          priority
          sizes="480px"
          className="object-cover opacity-25"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(28,16,68,0.85) 0%, rgba(28,16,68,0.4) 50%, rgba(28,16,68,0.95) 100%)' }} />
        <div className="relative z-10">
          <Logo inv />
        </div>
        <div className="relative z-10">
          <p className="font-display text-[36px] leading-[1.1] text-white mb-4 tracking-tight">
            The platform that finally<br />works <em className="italic" style={{ color: 'var(--tang)' }}>for nurses.</em>
          </p>
          <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--plum-100)' }}>
            Direct hiring. Escrow pay. Bait-and-switch protection. No middleman.
          </p>
          <div className="flex flex-wrap gap-2">
            {['Nursys verified', 'Checkr cleared', '48hr escrow'].map((tag) => (
              <span key={tag} className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--plum-100)' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-xs" style={{ color: 'var(--g400)' }}>© {new Date().getFullYear()} NurseSquare</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo />
          </div>

          <h1 className="font-display text-[30px] mb-1" style={{ color: 'var(--ink)' }}>Welcome back</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--g600)' }}>Sign in to your NurseSquare account</p>

          <div className="rounded-2xl border p-7" style={{ background: 'white', borderColor: 'var(--g100)' }}>
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-3">
                  {error}
                </div>
              )}

              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />

              <div className="space-y-1">
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
                <div className="text-right">
                  <Link href="/auth/forgot-password" className="text-xs font-medium no-underline"
                    style={{ color: 'var(--plum)' }}>
                    Forgot password?
                  </Link>
                </div>
              </div>

              <Button type="submit" loading={loading} className="w-full" size="lg">
                Sign in
              </Button>
            </form>
          </div>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--g600)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="font-semibold no-underline" style={{ color: 'var(--plum)' }}>
              Sign up free
            </Link>
          </p>

          {/* Test accounts */}
          <div className="mt-6 rounded-2xl border p-5" style={{ background: 'var(--cream-mid)', borderColor: 'var(--g100)' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--g600)' }}>
              Try it out — demo accounts
            </p>
            <div className="space-y-2.5">
              {[
                { role: 'Nurse', email: 'nurse@test.com', password: 'Test123', color: 'var(--plum)', bg: 'var(--plum-50)' },
                { role: 'Employer', email: 'employer@test.com', password: 'Test456', color: '#C04E20', bg: 'var(--tang-50)' },
              ].map(acct => (
                <button key={acct.role} type="button"
                  onClick={() => { setEmail(acct.email); setPassword(acct.password) }}
                  className="w-full flex items-center justify-between rounded-xl border px-4 py-2.5 text-left transition-all hover:shadow-sm"
                  style={{ background: acct.bg, borderColor: 'transparent' }}>
                  <div>
                    <span className="text-xs font-bold" style={{ color: acct.color }}>{acct.role}</span>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--g600)' }}>{acct.email}</p>
                  </div>
                  <span className="text-xs font-mono" style={{ color: 'var(--g400)' }}>{acct.password}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] mt-3" style={{ color: 'var(--g400)' }}>
              Click an account to auto-fill credentials, then press Sign in.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
