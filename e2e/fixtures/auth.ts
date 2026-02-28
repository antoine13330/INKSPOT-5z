import { test as base, expect, type Page } from '@playwright/test'

const TEST_USER = {
  email: process.env.E2E_TEST_EMAIL || 'test@inkspot.local',
  password: process.env.E2E_TEST_PASSWORD || 'TestPassword123!',
}

async function loginViaUI(page: Page) {
  await page.goto('/auth/login')
  await page.waitForLoadState('networkidle')

  await page.fill('input[id="email"], input[type="email"]', TEST_USER.email)
  await page.fill('input[id="password"], input[type="password"]', TEST_USER.password)

  const submitBtn = page.getByRole('button', { name: /sign in|log in|connexion/i })
  await submitBtn.click()

  await page.waitForURL((url) => !url.pathname.includes('/auth/login'), {
    timeout: 10000,
  })
}

type AuthFixtures = {
  authenticatedPage: Page
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    const hasCredentials = process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD

    if (!hasCredentials) {
      test.skip(true, 'E2E_TEST_EMAIL and E2E_TEST_PASSWORD env vars required for authenticated tests')
    }

    await loginViaUI(page)
    await use(page)
  },
})

export { expect }
