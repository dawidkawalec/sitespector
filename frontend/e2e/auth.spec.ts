import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should register a new user', async ({ page }) => {
    await page.goto('/register')

    // Fill registration form
    await page.fill('input[type="email"]', `test${Date.now()}@example.com`)
    await page.fill('input[type="password"]', 'Test1234')
    await page.fill('input[id="confirmPassword"]', 'Test1234')

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('should show validation errors for invalid password', async ({ page }) => {
    await page.goto('/register')

    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'short') // Too short
    await page.fill('input[id="confirmPassword"]', 'short')

    await page.click('button[type="submit"]')

    // Should show validation error
    await expect(page.locator('text=Hasło musi mieć minimum 8 znaków')).toBeVisible()
  })

  test('should login existing user', async ({ page }) => {
    await page.goto('/login')

    // Fill login form with test credentials
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'Test1234')

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[type="password"]', 'WrongPassword1')

    await page.click('button[type="submit"]')

    // Should show error message
    await expect(page.locator('text=/Nieprawidłowy email lub hasło/i')).toBeVisible()
  })

  test('should navigate between login and register', async ({ page }) => {
    await page.goto('/login')

    // Click on register link
    await page.click('text=Zarejestruj się')
    await expect(page).toHaveURL(/\/register/)

    // Click on login link
    await page.click('text=Zaloguj się')
    await expect(page).toHaveURL(/\/login/)
  })
})

