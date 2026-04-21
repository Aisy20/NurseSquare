import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function safeUrl(s: string | undefined): string {
  if (!s) return 'https://placeholder.supabase.co'
  try { new URL(s); return s } catch { return 'https://placeholder.supabase.co' }
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    safeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length ?? 0) > 20
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      : 'placeholder-anon-key-xxxxxxxxxxxxxx',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
