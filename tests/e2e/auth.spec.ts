import { test, expect } from '@playwright/test'
import { login, expectSingleH1 } from './helpers/auth'

test.describe('Authentication UX', () => {
  test('login page renders form + demo accounts', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    await expect(page.getByLabel(/email address/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    await expect(page.getByText(/demo accounts/i)).toBeVisible()
  })

  test('demo-account button auto-fills credentials', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByRole('button', { name: /nurse.*nurse@test\.com/is }).click()
    await expect(page.getByLabel(/email address/i)).toHaveValue('nurse@test.com')
    await expect(page.getByLabel(/password/i)).toHaveValue('Test123')
  })

  test('invalid credentials show an inline error', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel(/email address/i).fill('nobody@test.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.getByText(/invalid|incorrect|credentials/i)).toBeVisible({ timeout: 10_000 })
    // Stays on the login page.
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('nurse login redirects to nurse dashboard', async ({ page }) => {
    await login(page, 'nurse')
    await expect(page).toHaveURL(/\/nurse\/dashboard/)
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
  })

  test('hospital login redirects to hospital dashboard', async ({ page }) => {
    await login(page, 'hospital')
    await expect(page).toHaveURL(/\/hospital\/dashboard/)
    await expectSingleH1(page)
  })

  test('proxy redirects unauthenticated user from protected route to login', async ({ page }) => {
    await page.goto('/nurse/dashboard')
    await page.waitForURL(/\/auth\/login/)
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('logged-in nurse hitting /auth/login is bounced to dashboard', async ({ page }) => {
    await login(page, 'nurse')
    await page.goto('/auth/login')
    await page.waitForURL(/\/nurse\/dashboard/)
  })

  test('registration role-picker links to both funnels', async ({ page }) => {
    await page.goto('/auth/register')
    await expect(page.locator('a[href="/auth/register/nurse"]').first()).toBeVisible()
    await expect(page.locator('a[href="/auth/register/hospital"]').first()).toBeVisible()
  })

  test('sign out returns user to a logged-out state', async ({ page }) => {
    await login(page, 'nurse')
    // The avatar/user-menu button is the only visible <button> in the nav on
    // desktop (the hamburger is md:hidden). Open it, then sign out.
    await page.locator('nav button:visible').first().click()
    await page.getByRole('button', { name: /sign out/i }).click()
    // After sign-out the protected dashboard should no longer be accessible.
    await page.goto('/nurse/dashboard')
    await page.waitForURL(/\/auth\/login/)
  })
})
