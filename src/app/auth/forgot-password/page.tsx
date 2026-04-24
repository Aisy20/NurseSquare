'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Logo } from '@/components/layout/Navbar'
import { CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/reset-password`,
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--cream)' }}>
      <div className="hidden lg:flex lg:w-[420px] flex-col justify-between p-12"
        style={{ background: 'var(--plum-deep)' }}>
        <Logo inv />
        <div>
          <p className="font-display text-[32px] leading-snug text-white mb-4">
            Forgot your password?<br />No worries.
          </p>
          <p className="text-sm" style={{ color: 'var(--plum-100)' }}>
            Enter your email and we&apos;ll send you a secure reset link.
          </p>
        </div>
        <p className="text-xs" style={{ color: 'var(--g400)' }}>© {new Date().getFullYear()} NurseSquare</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo />
          </div>

          <h1 className="font-display text-[30px] mb-1" style={{ color: 'var(--ink)' }}>Reset password</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--g600)' }}>We&apos;ll email you a link to set a new one.</p>

          <div className="rounded-2xl border p-7" style={{ background: 'white', borderColor: 'var(--g100)' }}>
            {sent ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'var(--sage-50)' }}>
                  <CheckCircle className="w-6 h-6" style={{ color: 'var(--sage)' }} />
                </div>
                <h2 className="font-semibold text-lg mb-2" style={{ color: 'var(--ink)' }}>Check your email</h2>
                <p className="text-sm" style={{ color: 'var(--g600)' }}>
                  We sent a password reset link to <strong>{email}</strong>. Click the link to set a new password.
                </p>
                <p className="text-xs mt-4" style={{ color: 'var(--g400)' }}>
                  Didn&apos;t get it? Check spam, or{' '}
                  <button onClick={() => setSent(false)} className="underline" style={{ color: 'var(--plum)' }}>
                    try another email
                  </button>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
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

                <Button type="submit" loading={loading} className="w-full" size="lg">
                  Send reset link
                </Button>
              </form>
            )}
          </div>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--g600)' }}>
            Remember your password?{' '}
            <Link href="/auth/login" className="font-semibold no-underline" style={{ color: 'var(--plum)' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
