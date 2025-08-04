import { test, expect } from '@playwright/test'

test.describe('Booking Flow', () => {
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

  test('should allow user to search for professionals', async ({ page }) => {
    // Navigate to search page
    await page.click('text=Search')
    
    // Search for professionals
    await page.fill('input[placeholder*="search"]', 'tattoo artist')
    await page.click('button[type="submit"]')
    
    // Should show search results
    await expect(page.locator('.search-results')).toBeVisible()
    await expect(page.locator('.professional-card')).toHaveCount(1)
  })

  test('should allow user to view professional profile', async ({ page }) => {
    // Navigate to search page
    await page.click('text=Search')
    await page.fill('input[placeholder*="search"]', 'tattoo artist')
    await page.click('button[type="submit"]')
    
    // Click on first professional
    await page.click('.professional-card:first-child')
    
    // Should show professional profile
    await expect(page.locator('.professional-profile')).toBeVisible()
    await expect(page.locator('.professional-name')).toBeVisible()
    await expect(page.locator('.professional-bio')).toBeVisible()
  })

  test('should allow user to book appointment', async ({ page }) => {
    // Navigate to professional profile
    await page.click('text=Search')
    await page.fill('input[placeholder*="search"]', 'tattoo artist')
    await page.click('button[type="submit"]')
    await page.click('.professional-card:first-child')
    
    // Click book appointment button
    await page.click('text=Book Appointment')
    
    // Fill booking form
    await page.fill('input[name="date"]', '2024-02-15')
    await page.fill('input[name="time"]', '14:30')
    await page.selectOption('select[name="duration"]', '60')
    await page.fill('textarea[name="notes"]', 'Test booking notes')
    
    // Submit booking
    await page.click('button[type="submit"]')
    
    // Should show confirmation
    await expect(page.locator('text=Booking confirmed')).toBeVisible()
  })

  test('should validate booking form', async ({ page }) => {
    // Navigate to booking form
    await page.click('text=Search')
    await page.fill('input[placeholder*="search"]', 'tattoo artist')
    await page.click('button[type="submit"]')
    await page.click('.professional-card:first-child')
    await page.click('text=Book Appointment')
    
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Should show validation errors
    await expect(page.locator('text=Date is required')).toBeVisible()
    await expect(page.locator('text=Time is required')).toBeVisible()
  })

  test('should show booking history', async ({ page }) => {
    // Navigate to bookings page
    await page.click('text=My Bookings')
    
    // Should show booking history
    await expect(page.locator('.booking-history')).toBeVisible()
    await expect(page.locator('.booking-item')).toHaveCount(1)
  })

  test('should allow user to cancel booking', async ({ page }) => {
    // Navigate to booking history
    await page.click('text=My Bookings')
    
    // Click cancel on first booking
    await page.click('.booking-item:first-child .cancel-button')
    
    // Confirm cancellation
    await page.click('text=Confirm')
    
    // Should show cancellation message
    await expect(page.locator('text=Booking cancelled')).toBeVisible()
  })

  test('should filter bookings by status', async ({ page }) => {
    // Navigate to booking history
    await page.click('text=My Bookings')
    
    // Filter by upcoming bookings
    await page.click('text=Upcoming')
    
    // Should show only upcoming bookings
    await expect(page.locator('.booking-item')).toHaveCount(1)
    
    // Filter by past bookings
    await page.click('text=Past')
    
    // Should show only past bookings
    await expect(page.locator('.booking-item')).toHaveCount(0)
  })

  test('should show professional availability', async ({ page }) => {
    // Navigate to professional profile
    await page.click('text=Search')
    await page.fill('input[placeholder*="search"]', 'tattoo artist')
    await page.click('button[type="submit"]')
    await page.click('.professional-card:first-child')
    
    // Click on availability tab
    await page.click('text=Availability')
    
    // Should show availability calendar
    await expect(page.locator('.availability-calendar')).toBeVisible()
    await expect(page.locator('.available-slot')).toHaveCount(5)
  })

  test('should handle booking conflicts', async ({ page }) => {
    // Try to book an already booked slot
    await page.click('text=Search')
    await page.fill('input[placeholder*="search"]', 'tattoo artist')
    await page.click('button[type="submit"]')
    await page.click('.professional-card:first-child')
    await page.click('text=Book Appointment')
    
    // Fill booking form with conflicting time
    await page.fill('input[name="date"]', '2024-02-15')
    await page.fill('input[name="time"]', '14:30')
    await page.selectOption('select[name="duration"]', '60')
    await page.click('button[type="submit"]')
    
    // Should show conflict error
    await expect(page.locator('text=Time slot not available')).toBeVisible()
  })
}) 