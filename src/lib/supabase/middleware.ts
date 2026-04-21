import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function safeUrl(s: string | undefined): string {
  if (!s) return 'https://placeholder.supabase.co'
  try { new URL(s); return s } catch { return 'https://placeholder.supabase.co' }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    safeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length ?? 0) > 20
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      : 'placeholder-anon-key-xxxxxxxxxxxxxx',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const protectedNursePaths = ['/nurse']
  const protectedHospitalPaths = ['/hospital']
  const protectedAdminPaths = ['/admin']
  const authPaths = ['/auth']

  const path = request.nextUrl.pathname

  if (!user && (
    protectedNursePaths.some(p => path.startsWith(p)) ||
    protectedHospitalPaths.some(p => path.startsWith(p)) ||
    protectedAdminPaths.some(p => path.startsWith(p))
  )) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  if (user && authPaths.some(p => path.startsWith(p))) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile) {
      const url = request.nextUrl.clone()
      url.pathname = profile.role === 'nurse' ? '/nurse/dashboard' : '/hospital/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
