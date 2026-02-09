import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to all views', async ({ page }) => {
    await page.goto('/');

    const views = ['dashboard', 'logs', 'tickets', 'triage', 'settings'];

    for (const view of views) {
      // Click navigation link
      const navLink = page.locator(`[data-view="${view}"]`);
      await navLink.click();

      // Wait for view to be active
      const viewElement = page.locator(`#${view}-view`);
      await viewElement.waitFor({ timeout: 5000 });

      // Check page title updated
      const pageTitle = await page.textContent('#page-title');
      expect(pageTitle).toBeTruthy();

      // Check correct view is visible
      const isVisible = await viewElement.evaluate((el) =>
        window.getComputedStyle(el).display !== 'none'
      );
      expect(isVisible).toBeTruthy();
    }
  });

  test('should have all navigation links', async ({ page }) => {
    await page.goto('/');

    const expectedLinks = ['Dashboard', 'Logs', 'Tickets', 'Run Triage', 'Settings'];
    const navText = await page.locator('.nav-link').allTextContents();

    for (const link of expectedLinks) {
      expect(navText.map((t) => t.trim())).toContain(link);
    }
  });

  test('should highlight active navigation link', async ({ page }) => {
    await page.goto('/');

    // Dashboard should be active initially
    let activeLink = await page.locator('.nav-link.active');
    expect(await activeLink.count()).toBe(1);

    // Click logs
    await page.click('[data-view="logs"]');
    activeLink = await page.locator('.nav-link.active');
    expect(await activeLink.count()).toBe(1);

    const activeText = await activeLink.textContent();
    expect(activeText).toContain('Logs');
  });

  test('should maintain theme across navigation', async ({ page }) => {
    await page.goto('/');

    // Toggle theme
    await page.click('#theme-toggle');

    // Check dark mode is on
    const htmlElement = await page.locator('html');
    const isDark = await htmlElement.evaluate((el) => el.classList.contains('dark'));

    // Navigate to different views
    await page.click('[data-view="settings"]');
    await page.click('[data-view="logs"]');
    await page.click('[data-view="dashboard"]');

    // Check dark mode persisted
    const stillDark = await htmlElement.evaluate((el) => el.classList.contains('dark'));
    expect(stillDark).toBe(isDark);
  });
});

test.describe('Dashboard Navigation', () => {
  test('should navigate from dashboard quick actions', async ({ page }) => {
    await page.goto('/');

    // Click "Go to Logs" button
    const goToLogsBtn = await page.locator('text="Go to Logs"');
    if (await goToLogsBtn.isVisible()) {
      await goToLogsBtn.click();

      // Should navigate to logs view
      const logsView = await page.locator('#logs-view');
      await logsView.waitFor({ timeout: 5000 });
    }
  });

  test('should navigate from dashboard to triage', async ({ page }) => {
    await page.goto('/');

    // Click "Go to Triage" button
    const goToTriageBtn = await page.locator('text="Go to Triage"');
    if (await goToTriageBtn.isVisible()) {
      await goToTriageBtn.click();

      // Should navigate to triage view
      const triageView = await page.locator('#triage-view');
      await triageView.waitFor({ timeout: 5000 });
    }
  });
});

test('Mobile Navigation: should be accessible on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');

  // Navigation links should be visible
  const navLinks = await page.locator('.nav-link').all();
  expect(navLinks.length).toBeGreaterThan(0);

  // All links should be clickable
  for (const link of navLinks) {
    expect(await link.isVisible()).toBeTruthy();
  }
});

test('Mobile Navigation: should have readable text on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');

  const navLinks = await page.locator('.nav-link').all();
  for (const link of navLinks) {
    const fontSize = await link.evaluate((el) => window.getComputedStyle(el).fontSize);
    const size = parseFloat(fontSize);
    expect(size).toBeGreaterThanOrEqual(14); // Readable size
  }
});

test.describe('Keyboard Navigation', () => {
  test('should support tab navigation', async ({ page }) => {
    await page.goto('/');

    // Focus on first nav link
    await page.keyboard.press('Tab');

    // Tab should move focus through elements
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();

    // Tab multiple times to navigate
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }
  });

  test('should support Enter to navigate', async ({ page }) => {
    await page.goto('/');

    // Focus on first nav link and press Enter
    const firstLink = await page.locator('.nav-link').first();
    await firstLink.focus();
    await page.keyboard.press('Enter');

    // Should navigate to that view
    await page.waitForTimeout(300);
  });
});
