export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Shield, ArrowLeft, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export default async function AdminPaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, email')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  const { data: placements } = await supabase
    .from('placements')
    .select('*, job_postings(title), employer_profiles(org_name), nurse_profiles(full_name)')
    .order('created_at', { ascending: false })

  const totalGmv = (placements || []).reduce((s, p) => s + p.contract_value, 0)
  const totalFees = (placements || []).reduce((s, p) => s + p.platform_fee, 0)
  const held = (placements || []).filter(p => p.escrow_status === 'held')
  const released = (placements || []).filter(p => p.escrow_status === 'released')
  const disputed = (placements || []).filter(p => p.escrow_status === 'disputed')

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole="admin" userName={profile.email?.split('@')[0]} />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-medium no-underline mb-6"
          style={{ color: 'var(--plum)' }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back to overview
        </Link>

        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5" style={{ color: 'var(--plum)' }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--plum)' }}>Admin</span>
        </div>
        <h1 className="font-display text-[32px] mb-6" style={{ color: 'var(--ink)' }}>Payments & placements</h1>

        <div className="grid sm:grid-cols-4 gap-3 mb-6">
          <Card>
            <div className="flex items-center gap-1.5 mb-1" style={{ color: 'var(--g600)' }}>
              <DollarSign className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold uppercase tracking-wider">GMV</span>
            </div>
            <p className="font-display text-[24px]" style={{ color: 'var(--ink)' }}>{formatCurrency(totalGmv)}</p>
          </Card>
          <Card>
            <div className="flex items-center gap-1.5 mb-1" style={{ color: 'var(--g600)' }}>
              <DollarSign className="w-3.5 h-3.5" style={{ color: 'var(--tang)' }} />
              <span className="text-xs font-semibold uppercase tracking-wider">Revenue</span>
            </div>
            <p className="font-display text-[24px]" style={{ color: 'var(--ink)' }}>{formatCurrency(totalFees)}</p>
          </Card>
          <Card>
            <div className="flex items-center gap-1.5 mb-1" style={{ color: 'var(--g600)' }}>
              <Clock className="w-3.5 h-3.5" style={{ color: 'var(--tang-mid)' }} />
              <span className="text-xs font-semibold uppercase tracking-wider">In escrow</span>
            </div>
            <p className="font-display text-[24px]" style={{ color: 'var(--ink)' }}>{held.length}</p>
          </Card>
          <Card>
            <div className="flex items-center gap-1.5 mb-1" style={{ color: 'var(--g600)' }}>
              <AlertCircle className="w-3.5 h-3.5" style={{ color: 'var(--tang)' }} />
              <span className="text-xs font-semibold uppercase tracking-wider">Disputed</span>
            </div>
            <p className="font-display text-[24px]" style={{ color: 'var(--ink)' }}>{disputed.length}</p>
          </Card>
        </div>

        <Card>
          {!placements || placements.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--g400)' }} />
              <p className="text-sm" style={{ color: 'var(--g400)' }}>No placements yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider" style={{ color: 'var(--g400)' }}>
                    <th className="text-left font-semibold py-2 px-2">Job</th>
                    <th className="text-left font-semibold py-2 px-2">Nurse</th>
                    <th className="text-left font-semibold py-2 px-2">Employer</th>
                    <th className="text-right font-semibold py-2 px-2">Contract</th>
                    <th className="text-right font-semibold py-2 px-2">Fee</th>
                    <th className="text-left font-semibold py-2 px-2">Start</th>
                    <th className="text-left font-semibold py-2 px-2">Status</th>
                    <th className="text-right font-semibold py-2 px-2">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--g100)' }}>
                  {placements.map((p: any) => (
                    <tr key={p.id}>
                      <td className="py-3 px-2 font-medium" style={{ color: 'var(--ink)' }}>{p.job_postings?.title || '—'}</td>
                      <td className="py-3 px-2" style={{ color: 'var(--g600)' }}>{p.nurse_profiles?.full_name || '—'}</td>
                      <td className="py-3 px-2" style={{ color: 'var(--g600)' }}>{p.employer_profiles?.org_name || '—'}</td>
                      <td className="py-3 px-2 text-right" style={{ color: 'var(--g600)' }}>{formatCurrency(p.contract_value)}</td>
                      <td className="py-3 px-2 text-right" style={{ color: 'var(--g600)' }}>{formatCurrency(p.platform_fee)}</td>
                      <td className="py-3 px-2 text-xs" style={{ color: 'var(--g600)' }}>{formatDate(p.start_date)}</td>
                      <td className="py-3 px-2">
                        <Badge variant={
                          p.escrow_status === 'released' ? 'success' :
                          p.escrow_status === 'refunded' ? 'danger' :
                          p.escrow_status === 'disputed' ? 'danger' : 'warning'
                        }>
                          {p.escrow_status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right text-xs" style={{ color: 'var(--g600)' }}>{formatDate(p.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <p className="text-xs mt-6 text-center" style={{ color: 'var(--g400)' }}>
          Released: {released.length} · Held: {held.length} · Disputed: {disputed.length}
        </p>
      </main>
    </div>
  )
}
