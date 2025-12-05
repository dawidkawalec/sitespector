import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'Test1234')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
  })

  test('should display dashboard with stats', async ({ page }) => {
    // Check for dashboard title
    await expect(page.locator('h1')).toContainText('Dashboard')

    // Check for stats cards
    await expect(page.locator('text=Wszystkie audyty')).toBeVisible()
    await expect(page.locator('text=Ukończone')).toBeVisible()
    await expect(page.locator('text=W trakcie')).toBeVisible()
  })

  test('should open new audit dialog', async ({ page }) => {
    // Click on "Nowy audyt" button
    await page.click('text=Nowy audyt')

    // Dialog should be visible
    await expect(page.locator('text=Nowy audyt strony')).toBeVisible()
    await expect(page.locator('input[placeholder*="przykład"]')).toBeVisible()
  })

  test('should create a new audit', async ({ page }) => {
    // Open new audit dialog
    await page.click('text=Nowy audyt')

    // Fill audit form
    await page.fill('input[placeholder*="przykład"]', 'https://example.com')

    // Submit form
    await page.click('button:has-text("Rozpocznij audyt")')

    // Dialog should close
    await expect(page.locator('text=Nowy audyt strony')).not.toBeVisible()

    // New audit should appear in list
    await expect(page.locator('text=example.com')).toBeVisible()
  })

  test('should display audit list', async ({ page }) => {
    // Check for "Twoje audyty" section
    await expect(page.locator('text=Twoje audyty')).toBeVisible()

    // If there are audits, they should be visible
    // Or empty state should be shown
    const hasAudits = await page.locator('text=Nie masz jeszcze żadnych audytów').isVisible()
    
    if (hasAudits) {
      await expect(page.locator('text=Utwórz pierwszy audyt')).toBeVisible()
    }
  })

  test('should navigate to audit details', async ({ page }) => {
    // Assuming there's at least one audit
    const auditLink = page.locator('[href*="/audits/"]').first()
    
    if (await auditLink.count() > 0) {
      await auditLink.click()
      await expect(page).toHaveURL(/\/audits\//)
    }
  })
})

