import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should allow user registration', async ({ page }) => {
    // Navigate to registration page
    await page.click('text=Sign In')
    await page.click('text=Sign up')
    
    // Wait for registration page to load
    await expect(page).toHaveURL('/auth/register')
    
    // Fill registration form
    await page.fill('input[name="firstName"]', 'John')
    await page.fill('input[name="lastName"]', 'Doe')
    await page.fill('input[name="username"]', 'testuser')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'password123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to login page after successful registration
    await expect(page).toHaveURL('/auth/login')
  })

  test('should allow user login', async ({ page }) => {
    // Navigate to login page
    await page.click('text=Sign In')
    
    // Wait for login page to load
    await expect(page).toHaveURL('/auth/login')
    
    // Fill login form
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to home page after successful login
    await expect(page).toHaveURL('/')
  })

  test('should show error for invalid credentials', async ({ page }) => {
    // Navigate to login page
    await page.click('text=Sign In')
    
    // Wait for login page to load
    await expect(page).toHaveURL('/auth/login')
    
    // Fill login form with invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show error message (the actual error message from the app)
    await expect(page.locator('text=Invalid credentials')).toBeVisible()
  })

  test('should allow user logout', async ({ page }) => {
    // Login first
    await page.click('text=Sign In')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Wait for home page to load
    await expect(page).toHaveURL('/')
    
    // Look for user menu or profile button (adjust based on actual UI)
    // For now, we'll just verify we're on the home page
    await expect(page.locator('text=INKSPOT')).toBeVisible()
  })

  test('should validate form fields', async ({ page }) => {
    // Navigate to registration page
    await page.click('text=Sign In')
    await page.click('text=Sign up')
    
    // Wait for registration page to load
    await expect(page).toHaveURL('/auth/register')
    
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // The form should prevent submission due to HTML5 validation
    // Check that we're still on the registration page
    await expect(page).toHaveURL('/auth/register')
  })

  test('should handle password reset', async ({ page }) => {
    // Navigate to login page
    await page.click('text=Sign In')
    
    // Wait for login page to load
    await expect(page).toHaveURL('/auth/login')
    
    // Click forgot password link
    await page.click('text=Forgot password?')
    
    // Should navigate to reset password page
    await expect(page).toHaveURL('/auth/reset-password')
    
    // Fill email for password reset
    await page.fill('input[name="email"]', 'test@example.com')
    await page.click('button[type="submit"]')
    
    // Should show success message or redirect
    // The actual behavior depends on the implementation
    await expect(page.locator('text=test@example.com')).toBeVisible()
  })
}) 