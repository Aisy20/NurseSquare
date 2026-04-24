'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Logo } from '@/components/layout/Navbar'
import { CheckCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
    setTimeout(() => router.push('/auth/login'), 2500)
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--cream)' }}>
      <div className="hidden lg:flex lg:w-[420px] flex-col justify-between p-12"
        style={{ background: 'var(--plum-deep)' }}>
        <Logo inv />
        <div>
          <p className="font-display text-[32px] leading-snug text-white mb-4">
            Set a new password.
          </p>
          <p className="text-sm" style={{ color: 'var(--plum-100)' }}>
            Choose a strong one — at least 8 characters.
          </p>
        </div>
        <p className="text-xs" style={{ color: 'var(--g400)' }}>© {new Date().getFullYear()} NurseSquare</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo />
          </div>

          <h1 className="font-display text-[30px] mb-1" style={{ color: 'var(--ink)' }}>New password</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--g600)' }}>Pick something you&apos;ll remember.</p>

          <div className="rounded-2xl border p-7" style={{ background: 'white', borderColor: 'var(--g100)' }}>
            {done ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'var(--sage-50)' }}>
                  <CheckCircle className="w-6 h-6" style={{ color: 'var(--sage)' }} />
                </div>
                <h2 className="font-semibold text-lg mb-2" style={{ color: 'var(--ink)' }}>Password updated</h2>
                <p className="text-sm" style={{ color: 'var(--g600)' }}>Redirecting you to sign in…</p>
              </div>
            ) : !ready ? (
              <div className="text-center py-6">
                <p className="text-sm mb-4" style={{ color: 'var(--g600)' }}>
                  This reset link is invalid or has expired.
                </p>
                <Link href="/auth/forgot-password" className="font-semibold no-underline text-sm"
                  style={{ color: 'var(--plum)' }}>
                  Request a new reset link →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-3">
                    {error}
                  </div>
                )}

                <Input
                  label="New password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                />

                <Input
                  label="Confirm password"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Repeat password"
                />

                <Button type="submit" loading={loading} className="w-full" size="lg">
                  Update password
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
