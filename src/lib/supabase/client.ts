import { createBrowserClient } from '@supabase/ssr'

function isValidUrl(s: string | undefined): boolean {
  if (!s) return false
  try { new URL(s); return true } catch { return false }
}

export function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const url = isValidUrl(rawUrl) ? rawUrl! : 'https://placeholder.supabase.co'
  const key = rawKey && rawKey.length > 20 ? rawKey : 'placeholder-anon-key-xxxxxxxxxxxxxx'
  return createBrowserClient(url, key)
}
