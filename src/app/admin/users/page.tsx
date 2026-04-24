export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { Shield, ArrowLeft } from 'lucide-react'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, email')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  const [{ data: nurses }, { data: employers }] = await Promise.all([
    supabase.from('nurse_profiles')
      .select('id, full_name, license_type, license_state, specialty, license_verified, background_check_status, created_at, users(email)')
      .order('created_at', { ascending: false }),
    supabase.from('employer_profiles')
      .select('id, org_name, type, city, state, verified, subscription_tier, created_at, users(email)')
      .order('created_at', { ascending: false }),
  ])

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
        <h1 className="font-display text-[32px] mb-6" style={{ color: 'var(--ink)' }}>All users</h1>

        {/* Nurses */}
        <Card className="mb-6">
          <h2 className="font-semibold text-base mb-4" style={{ color: 'var(--ink)' }}>Nurses ({nurses?.length || 0})</h2>
          {!nurses || nurses.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--g400)' }}>No nurses registered yet.</p>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider" style={{ color: 'var(--g400)' }}>
                    <th className="text-left font-semibold py-2 px-2">Name</th>
                    <th className="text-left font-semibold py-2 px-2">Email</th>
                    <th className="text-left font-semibold py-2 px-2">License</th>
                    <th className="text-left font-semibold py-2 px-2">Specialty</th>
                    <th className="text-left font-semibold py-2 px-2">Verified</th>
                    <th className="text-left font-semibold py-2 px-2">Background</th>
                    <th className="text-right font-semibold py-2 px-2">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--g100)' }}>
                  {nurses.map((n: any) => (
                    <tr key={n.id}>
                      <td className="py-3 px-2 font-medium" style={{ color: 'var(--ink)' }}>{n.full_name}</td>
                      <td className="py-3 px-2" style={{ color: 'var(--g600)' }}>{n.users?.email}</td>
                      <td className="py-3 px-2" style={{ color: 'var(--g600)' }}>{n.license_type} / {n.license_state}</td>
                      <td className="py-3 px-2" style={{ color: 'var(--g600)' }}>{n.specialty || '—'}</td>
                      <td className="py-3 px-2">
                        <Badge variant={n.license_verified ? 'success' : 'warning'}>
                          {n.license_verified ? 'Yes' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={n.background_check_status === 'passed' ? 'success' : n.background_check_status === 'failed' ? 'danger' : 'warning'}>
                          {n.background_check_status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right" style={{ color: 'var(--g600)' }}>{formatDate(n.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Employers */}
        <Card>
          <h2 className="font-semibold text-base mb-4" style={{ color: 'var(--ink)' }}>Hospitals & employers ({employers?.length || 0})</h2>
          {!employers || employers.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--g400)' }}>No employers yet.</p>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider" style={{ color: 'var(--g400)' }}>
                    <th className="text-left font-semibold py-2 px-2">Org</th>
                    <th className="text-left font-semibold py-2 px-2">Email</th>
                    <th className="text-left font-semibold py-2 px-2">Type</th>
                    <th className="text-left font-semibold py-2 px-2">Location</th>
                    <th className="text-left font-semibold py-2 px-2">Tier</th>
                    <th className="text-left font-semibold py-2 px-2">Verified</th>
                    <th className="text-right font-semibold py-2 px-2">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--g100)' }}>
                  {employers.map((e: any) => (
                    <tr key={e.id}>
                      <td className="py-3 px-2 font-medium" style={{ color: 'var(--ink)' }}>{e.org_name}</td>
                      <td className="py-3 px-2" style={{ color: 'var(--g600)' }}>{e.users?.email}</td>
                      <td className="py-3 px-2 capitalize" style={{ color: 'var(--g600)' }}>{e.type?.replace(/_/g, ' ')}</td>
                      <td className="py-3 px-2" style={{ color: 'var(--g600)' }}>{e.city ? `${e.city}, ${e.state}` : '—'}</td>
                      <td className="py-3 px-2 capitalize" style={{ color: 'var(--g600)' }}>{e.subscription_tier}</td>
                      <td className="py-3 px-2">
                        <Badge variant={e.verified ? 'success' : 'warning'}>
                          {e.verified ? 'Yes' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right" style={{ color: 'var(--g600)' }}>{formatDate(e.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}
