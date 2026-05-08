export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import { Shield, ArrowLeft } from 'lucide-react'
import NursysAdminTools from './NursysAdminTools'

export default async function AdminNursysPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, email')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole="admin" userName={profile.email?.split('@')[0]} />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-medium no-underline mb-6"
          style={{ color: 'var(--plum)' }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Admin overview
        </Link>

        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5" style={{ color: 'var(--plum)' }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--plum)' }}>Admin</span>
        </div>
        <h1 className="font-display text-[32px] mb-1" style={{ color: 'var(--ink)' }}>Nursys tools</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--g600)' }}>
          NCSBN integration operations: notification backfills, document retrieval, removing nurses from the
          watch list, and rotating the API password.
        </p>

        <NursysAdminTools />
      </main>
    </div>
  )
}
