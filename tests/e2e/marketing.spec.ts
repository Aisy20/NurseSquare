import { test, expect } from '@playwright/test'
import { collectConsoleErrors, expectSingleH1, expectNoBrokenImages } from './helpers/auth'

test.describe('Marketing & public pages', () => {
  test('home page: hero, nav, role CTAs, metrics, footer', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await page.goto('/')

    await expectSingleH1(page)
    await expectNoBrokenImages(page)

    // Primary nav present for logged-out visitors.
    await expect(page.getByRole('link', { name: /log in/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /join nursesquare/i })).toBeVisible()

    // Hero CTAs route to the two registration funnels.
    await expect(page.locator('a[href="/auth/register/nurse"]').first()).toBeVisible()
    await expect(page.locator('a[href="/nurse/jobs"]').first()).toBeVisible()

    // Trust metrics block (rendered from the `metrics` array).
    await expect(page.getByText(/verified nurses/i).first()).toBeVisible()
    await expect(page.getByText(/escrow release/i).first()).toBeVisible()

    // Footer columns.
    await expect(page.getByRole('heading', { name: 'Nurses' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Hospitals' })).toBeVisible()

    expect(errors, 'no console errors on home').toEqual([])
  })

  test('home CTA navigates to nurse registration', async ({ page }) => {
    await page.goto('/')
    await page.locator('a[href="/auth/register/nurse"]').first().click()
    await page.waitForURL(/\/auth\/register\/nurse/)
    await expectSingleH1(page)
  })

  test('about page renders', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await page.goto('/about')
    await expectSingleH1(page)
    await expectNoBrokenImages(page)
    expect(errors).toEqual([])
  })

  test('contact page: form is present and submittable', async ({ page }) => {
    await page.goto('/contact')
    await expectSingleH1(page)

    await page.getByLabel(/your name/i).fill('Jane Smith')
    await page.getByLabel(/email address/i).fill('jane@example.com')
    await page.getByPlaceholder(/tell us how we can help/i).fill('Hello, this is a test message.')

    const submit = page.getByRole('button', { name: /send/i })
    await expect(submit).toBeEnabled()
    await submit.click()

    // Client-side success state (no real backend send required).
    await expect(page.getByText(/message sent/i)).toBeVisible({ timeout: 10_000 })
  })

  test('job board is public: browsable without auth', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await page.goto('/nurse/jobs')
    // No redirect to login — the board renders for anonymous visitors.
    await expect(page).toHaveURL(/\/nurse\/jobs/)
    await expect(page.getByRole('heading', { name: /browse jobs/i })).toBeVisible()
    await expect(page.getByPlaceholder(/search job titles/i)).toBeVisible()
    // Anonymous visitors see the join CTA and logged-out nav.
    await expect(page.getByRole('link', { name: /join as a nurse/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /log in/i })).toBeVisible()
    // Seeded active posting is visible to anonymous visitors.
    await expect(page.getByRole('heading', { name: /ICU Travel Nurse/i })).toBeVisible()
    expect(errors).toEqual([])
  })

  // Org name comes from the public_employers view (migration 0002). Gated like
  // the repo's other DB-dependent E2E so the suite stays green until applied.
  const VIEW = process.env.E2E_VIEW_MIGRATED === '1'
  ;(VIEW ? test : test.skip)(
    'public board exposes employer org name via public_employers view',
    async ({ page }) => {
      await page.goto('/nurse/jobs')
      // Org name is readable by anonymous visitors (safe columns only).
      await expect(page.getByText(/Test General Hospital/i).first()).toBeVisible()
      // And on the detail page.
      await page.getByRole('link', { name: /view & apply/i }).first().click()
      await page.waitForURL(/\/nurse\/jobs\/[0-9a-f-]+/)
      await expect(page.getByText(/Test General Hospital/i).first()).toBeVisible()
    },
  )

  test('footer legal links resolve (privacy, terms, hipaa)', async ({ page }) => {
    for (const { href, heading } of [
      { href: '/privacy', heading: /privacy policy/i },
      { href: '/terms', heading: /terms of service/i },
      { href: '/hipaa', heading: /hipaa & data handling/i },
    ]) {
      const res = await page.goto(href)
      expect(res?.status(), `${href} should not 404`).toBe(200)
      await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    }
  })

  test('responsive: mobile menu toggles on home', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    // Desktop nav links are hidden; the hamburger toggle is the menu affordance.
    const toggle = page.locator('nav button').last()
    await toggle.click()
    // "Jobs" exists in both the (hidden) desktop nav and the mobile drawer;
    // the drawer copy is last in DOM order and is the visible one.
    await expect(page.getByRole('link', { name: 'Jobs', exact: true }).last()).toBeVisible()
  })
})
