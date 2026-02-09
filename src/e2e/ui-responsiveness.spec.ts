import { test, expect, devices } from '@playwright/test';

const viewportSizes = [
  { name: 'Desktop', width: 1920, height: 1080 },
  { name: 'Laptop', width: 1366, height: 768 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Mobile', width: 375, height: 667 },
  { name: 'Small Mobile', width: 320, height: 568 },
];

test.describe('UI Responsiveness Tests', () => {
  viewportSizes.forEach(({ name, width, height }) => {
    test(`Dashboard should render correctly on ${name} (${width}x${height})`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');

      // Wait for dashboard to load
      await page.waitForSelector('.cards-grid');

      // Check all cards are visible
      const cards = await page.locator('.card').count();
      expect(cards).toBeGreaterThan(0);

      // Take screenshot for visual regression
      await page.screenshot({ path: `screenshot-dashboard-${name}.png` });
    });

    test(`Settings should be responsive on ${name} (${width}x${height})`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');

      // Navigate to settings
      await page.click('[data-view="settings"]');
      await page.waitForSelector('.settings-panel');

      // Check provider cards are visible
      const providerCards = await page.locator('.provider-card').count();
      expect(providerCards).toBe(2); // Gemini and Perplexity

      // Check buttons are accessible
      const buttons = await page.locator('.provider-card .btn').all();
      expect(buttons.length).toBeGreaterThan(0);

      await page.screenshot({ path: `screenshot-settings-${name}.png` });
    });

    test(`Navigation should work on ${name} (${width}x${height})`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');

      const navLinks = await page.locator('.nav-link').count();
      expect(navLinks).toBeGreaterThan(0);

      // Click each nav link
      const links = await page.locator('.nav-link').all();
      for (const link of links) {
        await link.click();
        await page.waitForTimeout(300); // Wait for animation
      }
    });
  });
});

// Mobile Specific Tests - Pixel 5
test('Mobile: should have readable touch targets on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 851 });
  await page.goto('/');

  // Check button sizes (min 44x44 for touch)
  const buttons = await page.locator('.btn').all();
  for (const button of buttons) {
    const box = await button.boundingBox();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  }
});

test('Mobile: should handle long text wrapping on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 851 });
  await page.goto('/');

  // Get viewport width
  const viewportSize = page.viewportSize();
  if (viewportSize) {
    // Check no horizontal scrolling is needed
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportSize.width + 10); // Small margin for borders
  }
});

test('Mobile: should have accessible form inputs on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 851 });
  await page.goto('/?view=logs');
  await page.waitForSelector('#logset-selector', { timeout: 5000 }).catch(() => {});

  // Check inputs have proper font size (prevents auto-zoom on iOS)
  const inputs = await page.locator('input, select, textarea').all();
  for (const input of inputs) {
    const fontSize = await input.evaluate((el) => window.getComputedStyle(el).fontSize);
    const size = parseFloat(fontSize);
    expect(size).toBeGreaterThanOrEqual(16); // iOS requires 16px+ to prevent zoom
  }
});

// Tablet Specific Tests - iPad Pro
test('Tablet: should optimize layout for tablet', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 1366 });
  await page.goto('/');

  // Check grid layouts adapt
  const grids = await page.locator('[class*="grid"]').all();
  expect(grids.length).toBeGreaterThan(0);

  // Take tablet view
  await page.screenshot({ path: 'screenshot-tablet-layout.png' });
});
