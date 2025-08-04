import { test, expect } from '@playwright/test'

test.describe('Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/')
    await page.click('text=Sign In')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/dashboard/)
  })

  test('should allow user to make payment', async ({ page }) => {
    // Navigate to payment page (after booking)
    await page.click('text=My Bookings')
    await page.click('.booking-item:first-child .pay-button')
    
    // Fill payment form
    await page.fill('input[name="cardNumber"]', '4242424242424242')
    await page.fill('input[name="expiryDate"]', '12/25')
    await page.fill('input[name="cvv"]', '123')
    await page.fill('input[name="name"]', 'John Doe')
    
    // Submit payment
    await page.click('button[type="submit"]')
    
    // Should show payment confirmation
    await expect(page.locator('text=Payment successful')).toBeVisible()
  })

  test('should validate payment form', async ({ page }) => {
    // Navigate to payment page
    await page.click('text=My Bookings')
    await page.click('.booking-item:first-child .pay-button')
    
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Should show validation errors
    await expect(page.locator('text=Card number is required')).toBeVisible()
    await expect(page.locator('text=Expiry date is required')).toBeVisible()
    await expect(page.locator('text=CVV is required')).toBeVisible()
  })

  test('should handle invalid card number', async ({ page }) => {
    // Navigate to payment page
    await page.click('text=My Bookings')
    await page.click('.booking-item:first-child .pay-button')
    
    // Fill payment form with invalid card
    await page.fill('input[name="cardNumber"]', '1234567890123456')
    await page.fill('input[name="expiryDate"]', '12/25')
    await page.fill('input[name="cvv"]', '123')
    await page.fill('input[name="name"]', 'John Doe')
    
    // Submit payment
    await page.click('button[type="submit"]')
    
    // Should show error
    await expect(page.locator('text=Invalid card number')).toBeVisible()
  })

  test('should handle expired card', async ({ page }) => {
    // Navigate to payment page
    await page.click('text=My Bookings')
    await page.click('.booking-item:first-child .pay-button')
    
    // Fill payment form with expired card
    await page.fill('input[name="cardNumber"]', '4242424242424242')
    await page.fill('input[name="expiryDate"]', '12/20')
    await page.fill('input[name="cvv"]', '123')
    await page.fill('input[name="name"]', 'John Doe')
    
    // Submit payment
    await page.click('button[type="submit"]')
    
    // Should show error
    await expect(page.locator('text=Card has expired')).toBeVisible()
  })

  test('should handle insufficient funds', async ({ page }) => {
    // Navigate to payment page
    await page.click('text=My Bookings')
    await page.click('.booking-item:first-child .pay-button')
    
    // Fill payment form with card that has insufficient funds
    await page.fill('input[name="cardNumber"]', '4000000000000002')
    await page.fill('input[name="expiryDate"]', '12/25')
    await page.fill('input[name="cvv"]', '123')
    await page.fill('input[name="name"]', 'John Doe')
    
    // Submit payment
    await page.click('button[type="submit"]')
    
    // Should show error
    await expect(page.locator('text=Insufficient funds')).toBeVisible()
  })

  test('should show payment history', async ({ page }) => {
    // Navigate to payment history
    await page.click('text=Payment History')
    
    // Should show payment history
    await expect(page.locator('.payment-history')).toBeVisible()
    await expect(page.locator('.payment-item')).toHaveCount(1)
  })

  test('should allow user to request refund', async ({ page }) => {
    // Navigate to payment history
    await page.click('text=Payment History')
    
    // Click refund on first payment
    await page.click('.payment-item:first-child .refund-button')
    
    // Fill refund form
    await page.fill('textarea[name="reason"]', 'Test refund request')
    await page.click('button[type="submit"]')
    
    // Should show refund request confirmation
    await expect(page.locator('text=Refund request submitted')).toBeVisible()
  })

  test('should show payment methods', async ({ page }) => {
    // Navigate to payment methods
    await page.click('text=Payment Methods')
    
    // Should show saved payment methods
    await expect(page.locator('.payment-methods')).toBeVisible()
    await expect(page.locator('.payment-method')).toHaveCount(1)
  })

  test('should allow user to add new payment method', async ({ page }) => {
    // Navigate to payment methods
    await page.click('text=Payment Methods')
    
    // Click add new payment method
    await page.click('text=Add Payment Method')
    
    // Fill payment method form
    await page.fill('input[name="cardNumber"]', '4242424242424242')
    await page.fill('input[name="expiryDate"]', '12/25')
    await page.fill('input[name="cvv"]', '123')
    await page.fill('input[name="name"]', 'John Doe')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show success message
    await expect(page.locator('text=Payment method added')).toBeVisible()
  })

  test('should allow user to remove payment method', async ({ page }) => {
    // Navigate to payment methods
    await page.click('text=Payment Methods')
    
    // Click remove on first payment method
    await page.click('.payment-method:first-child .remove-button')
    
    // Confirm removal
    await page.click('text=Confirm')
    
    // Should show removal confirmation
    await expect(page.locator('text=Payment method removed')).toBeVisible()
  })

  test('should handle 3D Secure authentication', async ({ page }) => {
    // Navigate to payment page
    await page.click('text=My Bookings')
    await page.click('.booking-item:first-child .pay-button')
    
    // Fill payment form with 3D Secure card
    await page.fill('input[name="cardNumber"]', '4000002500003155')
    await page.fill('input[name="expiryDate"]', '12/25')
    await page.fill('input[name="cvv"]', '123')
    await page.fill('input[name="name"]', 'John Doe')
    
    // Submit payment
    await page.click('button[type="submit"]')
    
    // Should redirect to 3D Secure page
    await expect(page.locator('text=3D Secure Authentication')).toBeVisible()
    
    // Complete 3D Secure
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Should return to payment confirmation
    await expect(page.locator('text=Payment successful')).toBeVisible()
  })
}) 