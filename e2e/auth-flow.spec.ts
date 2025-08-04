import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should allow user registration', async ({ page }) => {
    // Navigate to registration page
    await page.click('text=Sign Up')
    
    // Fill registration form
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="username"]', 'testuser')
    await page.fill('input[name="firstName"]', 'John')
    await page.fill('input[name="lastName"]', 'Doe')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard or show success message
    await expect(page).toHaveURL(/dashboard|success/)
  })

  test('should allow user login', async ({ page }) => {
    // Navigate to login page
    await page.click('text=Sign In')
    
    // Fill login form
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/)
  })

  test('should show error for invalid credentials', async ({ page }) => {
    // Navigate to login page
    await page.click('text=Sign In')
    
    // Fill login form with invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible()
  })

  test('should allow user logout', async ({ page }) => {
    // Login first
    await page.click('text=Sign In')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/dashboard/)
    
    // Click logout
    await page.click('text=Logout')
    
    // Should redirect to home page
    await expect(page).toHaveURL('/')
  })

  test('should validate form fields', async ({ page }) => {
    // Navigate to registration page
    await page.click('text=Sign Up')
    
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Should show validation errors
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
  })

  test('should handle password reset', async ({ page }) => {
    // Navigate to login page
    await page.click('text=Sign In')
    
    // Click forgot password link
    await page.click('text=Forgot Password?')
    
    // Fill email for password reset
    await page.fill('input[name="email"]', 'test@example.com')
    await page.click('button[type="submit"]')
    
    // Should show success message
    await expect(page.locator('text=Password reset email sent')).toBeVisible()
  })
}) 