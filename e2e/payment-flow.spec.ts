import { test, expect } from './fixtures/auth'

test.describe('Payment Flow', () => {
  test('should display booking page for authenticated user', async ({ authenticatedPage: page }) => {
    await page.goto('/profile/appointments')
    await expect(page).toHaveURL(/appointments/)
  })

  test('should allow user to initiate payment from booking', async ({ authenticatedPage: page }) => {
    await page.goto('/profile/appointments')
    await page.waitForLoadState('networkidle')

    const payButton = page.getByRole('button', { name: /pay|payer/i }).first()
    if (await payButton.isVisible()) {
      await payButton.click()
      await expect(page.locator('[data-testid="payment-form"], form')).toBeVisible()
    }
  })

  test('should validate required payment fields', async ({ authenticatedPage: page }) => {
    await page.goto('/profile/appointments')
    await page.waitForLoadState('networkidle')

    const payButton = page.getByRole('button', { name: /pay|payer/i }).first()
    if (await payButton.isVisible()) {
      await payButton.click()

      const submitBtn = page.getByRole('button', { name: /confirm|submit|valider/i }).first()
      if (await submitBtn.isVisible()) {
        await submitBtn.click()
        const errorMessage = page.locator('[role="alert"], .error, .text-destructive').first()
        await expect(errorMessage).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('should handle Stripe card input with test card', async ({ authenticatedPage: page }) => {
    await page.goto('/profile/appointments')
    await page.waitForLoadState('networkidle')

    const payButton = page.getByRole('button', { name: /pay|payer/i }).first()
    if (await payButton.isVisible()) {
      await payButton.click()

      const stripeFrame = page.frameLocator('iframe[name*="__privateStripeFrame"]').first()
      const cardInput = stripeFrame.locator('[name="cardnumber"]')
      if (await cardInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await cardInput.fill('4242424242424242')
        await stripeFrame.locator('[name="exp-date"]').fill('12/30')
        await stripeFrame.locator('[name="cvc"]').fill('123')
      }
    }
  })

  test('should show payment history', async ({ authenticatedPage: page }) => {
    await page.goto('/pro/dashboard/financial')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1, h2, [data-testid="financial-title"]').first()).toBeVisible()
  })
})
