import { test, expect } from '@playwright/test'
import { login, collectConsoleErrors, expectNoBrokenImages } from './helpers/auth'

test.beforeEach(async ({ page }) => {
  await login(page, 'hospital')
})

test.describe('Hospital workspace journey', () => {
  test('dashboard renders for the employer org', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await page.goto('/hospital/dashboard')
    await expect(page.locator('h1')).toBeVisible()
    await expectNoBrokenImages(page)
    expect(errors).toEqual([])
  })

  test('nav bar exposes every hospital section', async ({ page }) => {
    await page.goto('/hospital/dashboard')
    for (const label of ['Browse Nurses', 'Post a Job', 'Applicants', 'Billing']) {
      await expect(page.getByRole('link', { name: label, exact: true })).toBeVisible()
    }
  })

  test('browse nurses lists the seeded nurse profile', async ({ page }) => {
    await page.goto('/hospital/nurses')
    await expect(page.getByRole('heading', { name: /browse nurses/i })).toBeVisible()
    // Seeded nurse (Tessa Test, ICU) should be discoverable to employers.
    await expect(page.getByText(/Tessa Test/i).first()).toBeVisible()
  })

  test('post-job wizard: step 1 validates and advances to onboarding checklist', async ({ page }) => {
    await page.goto('/hospital/post-job')
    await expect(page.getByRole('heading', { name: /post a job/i })).toBeVisible()

    await page.getByLabel(/job title/i).fill('ICU Travel Nurse — 13-Week Contract')
    await page.getByLabel(/^city$/i).fill('Chicago')
    await page.getByLabel(/^state$/i).selectOption('IL')
    await page.getByLabel(/specialty required/i).selectOption('ICU')
    await page.getByLabel(/start date/i).fill('2026-09-01')
    await page.getByLabel(/duration \(weeks\)/i).fill('13')
    await page.getByLabel(/weekly rate/i).fill('3500')
    await page.getByLabel(/job description/i).fill('Day shift ICU role at a level-1 trauma center.')

    await page.getByRole('button', { name: /continue to onboarding checklist/i }).click()

    // Step 2 (checklist) fields appear — wizard advanced without a page reload.
    await expect(page.getByLabel(/parking instructions/i)).toBeVisible()
    // Don't submit: avoids persisting a throwaway job on every run.
  })

  test('post-job wizard blocks empty submission (required fields)', async ({ page }) => {
    await page.goto('/hospital/post-job')
    await page.getByRole('button', { name: /continue to onboarding checklist/i }).click()
    // HTML5 required validation keeps us on step 1.
    await expect(page.getByLabel(/job title/i)).toBeVisible()
    const valid = await page.getByLabel(/job title/i).evaluate(
      (el: HTMLInputElement) => el.checkValidity(),
    )
    expect(valid).toBe(false)
  })

  test('applicants page renders', async ({ page }) => {
    await page.goto('/hospital/applicants')
    await expect(page.getByRole('heading', { name: /applicant management/i })).toBeVisible()
  })

  test('billing page renders subscription view', async ({ page }) => {
    await page.goto('/hospital/billing')
    await expect(page.getByRole('heading', { name: /billing & subscription/i })).toBeVisible()
  })

  test('every hospital route is free of console errors and broken images', async ({ page }) => {
    const routes = ['/hospital/dashboard', '/hospital/nurses', '/hospital/post-job', '/hospital/applicants', '/hospital/billing', '/hospital/profile']
    for (const route of routes) {
      const errors = collectConsoleErrors(page)
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      await expectNoBrokenImages(page)
      expect(errors, `console errors on ${route}: ${errors.join(' | ')}`).toEqual([])
    }
  })
})
