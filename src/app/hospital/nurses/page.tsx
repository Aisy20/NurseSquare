export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import { formatCurrency } from '@/lib/utils'
import { SPECIALTIES } from '@/lib/utils'
import { Star, Shield, CheckCircle, Search, ArrowRight } from 'lucide-react'

interface SearchParams {
  specialty?: string
  state?: string
  availability?: string
}

export default async function BrowseNursesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userRole = null
  let userName = null
  let employerProfile = null

  if (user) {
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    userRole = profile?.role
    userName = user.email?.split('@')[0]
    if (userRole === 'hospital') {
      const { data: ep } = await supabase.from('employer_profiles').select('*').eq('user_id', user.id).single()
      employerProfile = ep
      userName = ep?.org_name ?? userName
    }
  }

  const params = await searchParams
  const { specialty, availability } = params

  let query = supabase
    .from('nurse_profiles')
    .select('*')
    .eq('license_verified', true)
    .eq('background_check_status', 'passed')
    .order('featured', { ascending: false })
    .order('rating_avg', { ascending: false })

  if (specialty) query = query.eq('specialty', specialty)
  if (availability) query = query.eq('availability', availability)

  const { data: nurses } = await query

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole={userRole as 'nurse' | 'hospital' | 'admin' | null} userName={userName} />

      <main className="flex-1 max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 py-10 w-full">
        <div className="mb-8">
          <h1 className="font-display text-[36px]" style={{ color: 'var(--ink)' }}>Browse Nurses</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--g600)' }}>
            {nurses?.length || 0} verified nurses available · Sign in to reach out directly
          </p>
        </div>

        {/* Filters */}
        <form className="flex flex-col sm:flex-row gap-3 mb-8 rounded-2xl border p-4"
          style={{ background: 'white', borderColor: 'var(--g100)' }}>
          <select
            name="specialty"
            defaultValue={specialty}
            className="flex-1 px-3 py-2.5 rounded-xl border text-sm focus:outline-none bg-white"
            style={{ borderColor: 'var(--g200)', color: 'var(--g800)' }}
          >
            <option value="">All specialties</option>
            {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            name="availability"
            defaultValue={availability}
            className="px-3 py-2.5 rounded-xl border text-sm focus:outline-none bg-white"
            style={{ borderColor: 'var(--g200)', color: 'var(--g800)' }}
          >
            <option value="">Any availability</option>
            <option value="available">Available now</option>
            <option value="open_to_offers">Open to offers</option>
          </select>
          <button type="submit"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-px"
            style={{ background: 'var(--tang)' }}>
            Filter
          </button>
        </form>

        {nurses && nurses.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {nurses.map((nurse: any) => (
              <div key={nurse.id} className="rounded-2xl border p-5 flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ background: 'white', borderColor: 'var(--g100)' }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                    style={{ background: 'var(--tang-50)', color: 'var(--tang-mid)' }}>
                    {nurse.full_name?.charAt(0)}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {nurse.featured && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--gold-50)', color: '#A07C00' }}>Featured</span>
                    )}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: nurse.availability === 'available' ? 'var(--sage-50)' : 'var(--tang-50)',
                        color: nurse.availability === 'available' ? 'var(--sage)' : 'var(--tang)',
                      }}>
                      {nurse.availability?.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <h3 className="font-bold mb-0.5" style={{ color: 'var(--ink)' }}>{nurse.full_name}</h3>
                <p className="text-sm mb-3" style={{ color: 'var(--g600)' }}>{nurse.specialty} · {nurse.years_exp}y exp</p>

                <div className="flex items-center gap-3 mb-3">
                  {nurse.license_verified && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--sage)' }}>
                      <CheckCircle className="w-3 h-3" /> Verified
                    </span>
                  )}
                  {nurse.background_check_status === 'passed' && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--tang-mid)' }}>
                      <Shield className="w-3 h-3" /> BGC Passed
                    </span>
                  )}
                </div>

                {nurse.rating_count > 0 && (
                  <div className="flex items-center gap-1 mb-3">
                    <Star className="w-4 h-4 fill-current" style={{ color: 'var(--gold)' }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{nurse.rating_avg?.toFixed(1)}</span>
                    <span className="text-xs" style={{ color: 'var(--g400)' }}>({nurse.rating_count})</span>
                  </div>
                )}

                {nurse.bio && (
                  <p className="text-xs line-clamp-2 mb-4" style={{ color: 'var(--g400)' }}>{nurse.bio}</p>
                )}

                <div className="flex items-center justify-between mt-auto pt-3 border-t"
                  style={{ borderColor: 'var(--g100)' }}>
                  <span className="font-bold text-sm" style={{ color: 'var(--ink)' }}>
                    {formatCurrency(nurse.hourly_rate)}/hr
                  </span>
                  {user && userRole === 'hospital' ? (
                    <Link href={`/hospital/nurses/${nurse.id}`}
                      className="text-sm font-bold no-underline flex items-center gap-1"
                      style={{ color: 'var(--tang-mid)' }}>
                      View Profile <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <Link href="/auth/register/hospital"
                      className="text-xs font-semibold no-underline px-3 py-1.5 rounded-xl text-white"
                      style={{ background: 'var(--tang)' }}>
                      Sign in to reach out
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 rounded-2xl border" style={{ background: 'white', borderColor: 'var(--g100)' }}>
            <Search className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--g200)' }} />
            <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--g800)' }}>No nurses match your filters</h3>
            <p className="text-sm" style={{ color: 'var(--g400)' }}>Try adjusting your search criteria.</p>
          </div>
        )}

        {/* Guest CTA */}
        {!user && (
          <div className="mt-10 rounded-2xl p-8 text-center" style={{ background: 'var(--plum-deep)' }}>
            <p className="font-display text-2xl text-white mb-2">Ready to hire?</p>
            <p className="text-sm mb-5" style={{ color: 'var(--tang-100)' }}>Create a free employer account to view full profiles and reach out directly.</p>
            <Link href="/auth/register/hospital"
              className="inline-flex items-center gap-2 font-bold px-7 py-3 rounded-[14px] text-white no-underline"
              style={{ background: 'var(--tang)' }}>
              Start hiring nurses <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
