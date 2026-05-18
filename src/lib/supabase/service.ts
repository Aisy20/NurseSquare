import { createClient } from '@supabase/supabase-js'

function safeUrl(s: string | undefined): string {
  if (!s) return 'https://placeholder.supabase.co'
  try { new URL(s); return s } catch { return 'https://placeholder.supabase.co' }
}

export function createServiceClient() {
  return createClient(
    safeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-service-key',
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}
