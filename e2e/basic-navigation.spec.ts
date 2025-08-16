import { test, expect } from '@playwright/test'

test.describe('Basic Navigation (with middleware)', () => {
  test.beforeEach(async ({ page }) => {
    // Start from home page (will be redirected to login)
    await page.goto('/')
  })

  test('should redirect unauthenticated users to login page', async ({ page }) => {
    // Should be redirected to login page due to middleware
    await expect(page).toHaveURL(/\/auth\/login/)
    
    // Check that login form elements are present
    await expect(page.locator('text=Welcome Back')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should navigate to registration page from login', async ({ page }) => {
    // Should be on login page due to redirect
    await expect(page).toHaveURL(/\/auth\/login/)
    
    // Click on Sign up link
    await page.click('text=Sign up')
    
    // Should navigate to registration page
    await expect(page).toHaveURL('/auth/register')
    
    // Check that registration form elements are present
    await expect(page.locator('text=Create Account')).toBeVisible()
    await expect(page.locator('input[name="firstName"]')).toBeVisible()
    await expect(page.locator('input[name="lastName"]')).toBeVisible()
    await expect(page.locator('input[name="username"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible()
  })

  test('should navigate to password reset page from login', async ({ page }) => {
    // Should be on login page due to redirect
    await expect(page).toHaveURL(/\/auth\/login/)
    
    // Click on Forgot password link
    await page.click('text=Forgot password?')
    
    // Should navigate to password reset page
    await expect(page).toHaveURL('/auth/reset-password')
    
    // Check that password reset form is present
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should handle navigation between auth pages', async ({ page }) => {
    // Should be on login page due to redirect
    await expect(page).toHaveURL(/\/auth\/login/)
    
    // Navigate to registration
    await page.click('text=Sign up')
    await expect(page).toHaveURL('/auth/register')
    
    // Navigate back to login
    await page.goto('/auth/login')
    await expect(page).toHaveURL('/auth/login')
    
    // Navigate to password reset
    await page.click('text=Forgot password?')
    await expect(page).toHaveURL('/auth/reset-password')
    
    // Navigate back to login
    await page.goto('/auth/login')
    await expect(page).toHaveURL('/auth/login')
  })

  test('should display login form correctly', async ({ page }) => {
    // Should be on login page due to redirect
    await expect(page).toHaveURL(/\/auth\/login/)
    
    // Check all form elements
    await expect(page.locator('text=Welcome Back')).toBeVisible()
    await expect(page.locator('text=Sign in to your account to continue')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    await expect(page.locator('text=Or continue with')).toBeVisible()
    await expect(page.locator('text=Continue with Google')).toBeVisible()
    await expect(page.locator('text=Don\'t have an account?')).toBeVisible()
    await expect(page.locator('text=Sign up')).toBeVisible()
  })

  test('should display registration form correctly', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/auth/register')
    
    // Check all form elements
    await expect(page.locator('text=Create Account')).toBeVisible()
    await expect(page.locator('text=Join the community and start sharing your art')).toBeVisible()
    await expect(page.locator('input[name="firstName"]')).toBeVisible()
    await expect(page.locator('input[name="lastName"]')).toBeVisible()
    await expect(page.locator('input[name="username"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should display password reset form correctly', async ({ page }) => {
    // Navigate to password reset page
    await page.goto('/auth/reset-password')
    
    // Check form elements
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should handle form validation on registration', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/auth/register')
    
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Should stay on registration page (HTML5 validation prevents submission)
    await expect(page).toHaveURL('/auth/register')
  })

  test('should handle form validation on login', async ({ page }) => {
    // Should be on login page due to redirect
    await expect(page).toHaveURL(/\/auth\/login/)
    
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Should stay on login page (HTML5 validation prevents submission)
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('should maintain state during navigation', async ({ page }) => {
    // Should be on login page due to redirect
    await expect(page).toHaveURL(/\/auth\/login/)
    
    // Fill some form data
    await page.fill('input[name="email"]', 'test@example.com')
    
    // Navigate to registration
    await page.click('text=Sign up')
    await expect(page).toHaveURL('/auth/register')
    
    // Navigate back to login
    await page.goto('/auth/login')
    await expect(page).toHaveURL('/auth/login')
    
    // Form should be empty (no state persistence expected)
    await expect(page.locator('input[name="email"]')).toHaveValue('')
  })
})
