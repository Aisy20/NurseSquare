import { test, expect } from '@playwright/test'
import { login, collectConsoleErrors, expectNoBrokenImages } from './helpers/auth'

// All tests in this file share a logged-in nurse session.
test.beforeEach(async ({ page }) => {
  await login(page, 'nurse')
})

test.describe('Nurse workspace journey', () => {
  test('dashboard greets the nurse and shows onboarding checklist', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await page.goto('/nurse/dashboard')
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    // Seeded nurse is verified → the verified badge should show.
    await expect(page.getByText(/verified nurse profile/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /browse jobs/i }).first()).toBeVisible()
    await expectNoBrokenImages(page)
    expect(errors).toEqual([])
  })

  test('nav bar exposes every nurse section', async ({ page }) => {
    await page.goto('/nurse/dashboard')
    for (const label of ['Find Jobs', 'My Applications', 'Pay Ledger', 'Credentials', 'Tax Home', 'Payments']) {
      await expect(page.getByRole('link', { name: label, exact: true })).toBeVisible()
    }
  })

  test('jobs: search/filter form submits and reflects query in URL', async ({ page }) => {
    await page.goto('/nurse/jobs')
    await expect(page.getByRole('heading', { name: /browse jobs/i })).toBeVisible()

    await page.getByPlaceholder(/search job titles/i).fill('ICU')
    // The filter selects have no <label>; target them by name attribute.
    await page.locator('select[name="state"]').selectOption('CA')
    await page.getByRole('button', { name: /^filter$/i }).click()

    await page.waitForURL(/[?&]q=ICU/)
    expect(page.url()).toMatch(/state=CA/)
  })

  test('jobs: opening a listing reaches a detail page or empty state', async ({ page }) => {
    await page.goto('/nurse/jobs')
    const firstJob = page.locator('a[href^="/nurse/jobs/"]').first()
    if (await firstJob.count()) {
      await firstJob.click()
      await page.waitForURL(/\/nurse\/jobs\/[0-9a-f-]+/)
      await expect(page.locator('h1')).toBeVisible()
    } else {
      // No jobs seeded — board should still render its empty/CTA state.
      await expect(page.getByRole('heading', { name: /browse jobs/i })).toBeVisible()
    }
  })

  test('profile page renders editable identity fields', async ({ page }) => {
    await page.goto('/nurse/profile')
    // Profile is a client component: a spinner shows until the auth + profile
    // fetch resolves, so allow extra time for the heading to mount.
    await expect(page.getByRole('heading', { name: /my profile/i })).toBeVisible({ timeout: 15_000 })
    // Seeded full name should be populated (loaded async into the form).
    await expect(page.getByLabel('Full name')).toHaveValue(/Tessa Test/, { timeout: 10_000 })
  })

  test('credentials wallet renders with an add-credential CTA', async ({ page }) => {
    await page.goto('/nurse/credentials')
    await expect(page.getByText(/credentialing wallet/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /add credential/i }).first()).toBeVisible()
  })

  test('applications page renders', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await page.goto('/nurse/applications')
    await expect(page.getByRole('heading', { name: /my applications/i })).toBeVisible()
    expect(errors).toEqual([])
  })

  test('verify-license page renders the verification flow', async ({ page }) => {
    await page.goto('/nurse/verify-license')
    await expect(page.getByRole('heading', { name: /verify your license/i })).toBeVisible()
  })

  test('payments page renders earnings view', async ({ page }) => {
    await page.goto('/nurse/payments')
    await expect(page.getByRole('heading', { name: /payments & earnings/i })).toBeVisible()
  })

  test('every nurse route is free of console errors and broken images', async ({ page }) => {
    const routes = ['/nurse/dashboard', '/nurse/jobs', '/nurse/applications', '/nurse/credentials', '/nurse/tax-home', '/nurse/profile', '/nurse/payments']
    for (const route of routes) {
      const errors = collectConsoleErrors(page)
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      await expectNoBrokenImages(page)
      expect(errors, `console errors on ${route}: ${errors.join(' | ')}`).toEqual([])
    }
  })
})
