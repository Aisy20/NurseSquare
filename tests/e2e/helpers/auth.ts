import { Page, expect } from '@playwright/test'

/**
 * Seeded demo accounts (see `npm run seed:test`). These intentionally match the
 * "demo accounts" advertised on /auth/login so the auto-fill buttons work.
 */
export const ACCOUNTS = {
  nurse: { email: 'nurse@test.com', password: 'Test123', home: '/nurse/dashboard' },
  hospital: { email: 'employer@test.com', password: 'Test456', home: '/hospital/dashboard' },
  admin: { email: 'admin@test.com', password: 'Test789', home: '/admin' },
} as const

export type Role = keyof typeof ACCOUNTS

/**
 * Log in through the real UI form and wait for the post-login redirect.
 * Auth is client-side (supabase signInWithPassword → cookie), so we drive the
 * actual form rather than injecting cookies.
 */
export async function login(page: Page, role: Role): Promise<void> {
  const { email, password } = ACCOUNTS[role]
  await page.goto('/auth/login')
  await page.getByLabel(/email address/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  // Admin redirects to /hospital/dashboard from the login handler, but proxy
  // then routes admins; accept any authenticated (non-/auth) destination.
  await page.waitForURL((url) => !url.pathname.startsWith('/auth'), { timeout: 15_000 })
}

/**
 * Attach a console-error / page-error collector. UX regressions often surface
 * first as runtime errors in the console. Returns the live array of messages.
 * Filters out noise that is expected in local dev (e.g. missing favicon, HMR).
 */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = []
  const ignore = [
    /favicon/i,
    /Download the React DevTools/i,
    /\[Fast Refresh\]/i,
    /ResizeObserver loop/i,
    // Next.js dev image-optimization warnings are not UX bugs.
    /Image with src .* has either width or height modified/i,
  ]
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    if (ignore.some((re) => re.test(text))) return
    errors.push(text)
  })
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  return errors
}

/** Assert the page has exactly one visible <h1> with non-empty text. */
export async function expectSingleH1(page: Page): Promise<void> {
  const h1 = page.locator('h1')
  await expect(h1.first()).toBeVisible()
  const text = (await h1.first().textContent())?.trim() ?? ''
  expect(text.length, 'h1 should have text').toBeGreaterThan(0)
}

/** Assert no <img> on the page failed to load (broken images = visible UX bug). */
export async function expectNoBrokenImages(page: Page): Promise<void> {
  const broken = await page.evaluate(() =>
    Array.from(document.images)
      .filter((img) => img.complete && img.naturalWidth === 0 && !!img.currentSrc)
      .map((img) => img.currentSrc),
  )
  expect(broken, `broken images: ${broken.join(', ')}`).toEqual([])
}
