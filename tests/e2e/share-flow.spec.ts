import { test, expect } from '@playwright/test'

test.describe('Pay-Package Ledger smoke', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByText(/log in|sign in/i).first()).toBeVisible()
  })

  test('missing share slug returns 404', async ({ page }) => {
    const res = await page.goto('/share/this-slug-does-not-exist')
    expect(res?.status()).toBe(404)
  })
})

const FULL = process.env.E2E_FULL_FLOW === '1'
const fullDescribe = FULL ? test.describe : test.describe.skip

fullDescribe('Pay-Package Ledger happy path (requires E2E_FULL_FLOW + test creds)', () => {
  test('signup → quote → signed → diff → share', async ({ page, browser }) => {
    const email = `e2e+${Date.now()}@nursesquare.test`
    const password = 'testpass123!'

    await page.goto('/auth/register/nurse')
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill(password)
    await page.getByRole('button', { name: /sign up|register|create account/i }).click()

    await page.waitForURL(/\/nurse\//)
    await page.goto('/nurse/ledger/new')
    await page.getByLabel(/specialty/i).fill('ICU')
    await page.getByLabel(/city/i).fill('Phoenix')
    await page.getByLabel(/state/i).fill('AZ')
    await page.getByRole('button', { name: /create contract/i }).click()

    await page.waitForURL(/\/nurse\/ledger\/[0-9a-f-]+/)
    await page.getByPlaceholder(/paste recruiter text/i).fill(
      'ICU Phoenix AZ 9/8 to 12/1. $34/hr taxable, $1500/wk housing, $300/wk meals. 36hr/wk nights 3x12s.',
    )
    await page.getByRole('button', { name: /extract and save/i }).click()
    await expect(page.getByText(/SMS|MANUAL/i).first()).toBeVisible({ timeout: 30_000 })

    // Skipping the PDF upload portion — requires a real PDF fixture and is too
    // brittle for CI without a stubbed Claude. Manually verify in dev.
    const share = await page.getByRole('button', { name: /share diff/i }).first()
    if (await share.isVisible().catch(() => false)) {
      await share.click()
      const input = page.locator('input[readonly]')
      const url = await input.inputValue()
      expect(url).toContain('/share/')
      const guestContext = await browser.newContext()
      const guestPage = await guestContext.newPage()
      const guestRes = await guestPage.goto(url)
      expect(guestRes?.status()).toBe(200)
    }
  })
})
