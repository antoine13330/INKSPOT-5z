import { test, expect } from '@playwright/test'

test.describe('Simple Authentication Tests', () => {
  test('should load login page when accessing home', async ({ page }) => {
    // Go to home page (will be redirected to login)
    await page.goto('/')
    
    // Should be redirected to login page
    await expect(page).toHaveURL(/\/auth\/login/)
    
    // Check that basic text is visible
    await expect(page.locator('body')).toContainText('Welcome Back')
    await expect(page.locator('body')).toContainText('Sign in to your account to continue')
    await expect(page.locator('body')).toContainText('Email')
    await expect(page.locator('body')).toContainText('Password')
    await expect(page.locator('body')).toContainText('Sign In')
    await expect(page.locator('body')).toContainText('Sign up')
  })

  test('should navigate to registration page', async ({ page }) => {
    // Go to login page directly
    await page.goto('/auth/login')
    
    // Click on Sign up link
    await page.click('text=Sign up')
    
    // Should navigate to registration page
    await expect(page).toHaveURL('/auth/register')
    
    // Check that basic text is visible
    await expect(page.locator('body')).toContainText('Create Account')
    await expect(page.locator('body')).toContainText('First Name')
    await expect(page.locator('body')).toContainText('Last Name')
    await expect(page.locator('body')).toContainText('Username')
    await expect(page.locator('body')).toContainText('Email')
    await expect(page.locator('body')).toContainText('Password')
  })

  test('should navigate to password reset page', async ({ page }) => {
    // Go to login page directly
    await page.goto('/auth/login')
    
    // Click on Forgot password link
    await page.click('text=Forgot password?')
    
    // Should navigate to password reset page
    await expect(page).toHaveURL('/auth/reset-password')
    
    // Check that basic text is visible
    await expect(page.locator('body')).toContainText('Email')
  })

  test('should have working navigation between auth pages', async ({ page }) => {
    // Test navigation from login to registration
    await page.goto('/auth/login')
    await page.click('text=Sign up')
    await expect(page).toHaveURL('/auth/register')
    
    // Test navigation back to login
    await page.goto('/auth/login')
    await expect(page).toHaveURL('/auth/login')
    
    // Test navigation to password reset
    await page.click('text=Forgot password?')
    await expect(page).toHaveURL('/auth/reset-password')
  })

  test('should display forms correctly', async ({ page }) => {
    // Test login form
    await page.goto('/auth/login')
    await expect(page.locator('body')).toContainText('Welcome Back')
    
    // Test registration form
    await page.goto('/auth/register')
    await expect(page.locator('body')).toContainText('Create Account')
    
    // Test password reset form
    await page.goto('/auth/reset-password')
    await expect(page.locator('body')).toContainText('Email')
  })
})
