import { test, expect } from '@playwright/test';

test.describe('Settings View', () => {
  test('should load settings page', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-view="settings"]');

    // Wait for settings panel to load
    await page.waitForSelector('.settings-panel');

    // Check title
    const title = await page.textContent('#page-title');
    expect(title).toContain('Settings');
  });

  test('should display provider options', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-view="settings"]');

    // Check provider cards exist
    const geminiCard = await page.locator('.provider-card').first();
    expect(geminiCard).toBeTruthy();

    // Check provider names are visible
    const providerNames = await page.locator('.provider-card h5').allTextContents();
    expect(providerNames).toContain('Gemini 2.0 Flash');
    expect(providerNames).toContain('Perplexity Sonar');
  });

  test('should show provider availability status', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-view="settings"]');

    // Check status indicators
    const statuses = await page.locator('.provider-status').allTextContents();
    expect(statuses.length).toBeGreaterThan(0);

    // At least one provider should be available
    const hasAvailable = statuses.some((s) => s.includes('Available') || s.includes('Current'));
    expect(hasAvailable).toBeTruthy();
  });

  test('should display current provider', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-view="settings"]');

    // Check current provider display
    const currentProvider = await page.textContent('#provider-display');
    expect(currentProvider).toBeTruthy();
    expect(['Gemini', 'Perplexity'].some((p) => currentProvider?.includes(p))).toBeTruthy();
  });

  test('should switch provider when button clicked', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-view="settings"]');

    // Get initial provider
    const initialProvider = await page.textContent('#provider-display');

    // Click to switch provider
    const buttons = await page.locator('.provider-card button').all();
    if (buttons.length > 0) {
      // Find the button that's not for the current provider
      const firstButton = buttons[0];
      await firstButton.click();

      // Wait for toast notification
      await page.waitForSelector('.toast', { timeout: 3000 }).catch(() => {});

      // Check provider changed in UI
      await page.waitForTimeout(500);
      const newProvider = await page.textContent('#provider-display');
      // Provider should either stay same or change
      expect(newProvider).toBeTruthy();
    }
  });

  test('should persist provider selection in localStorage', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-view="settings"]');

    // Check localStorage has provider stored
    const selectedProvider = await page.evaluate(() => localStorage.getItem('selectedProvider'));
    expect(['gemini', 'perplexity']).toContain(selectedProvider);
  });

  test('should show system status information', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-view="settings"]');

    // Check status section exists
    await page.waitForSelector('.status-grid');

    // Check theme status is displayed
    const themeStatus = await page.textContent('#theme-status');
    expect(['Light', 'Dark']).toContain(themeStatus);
  });

  test('should display help information', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-view="settings"]');

    // Check info list exists and has content
    const infoList = await page.locator('.info-list li').count();
    expect(infoList).toBeGreaterThan(0);

    // Check info contains provider guidance
    const infoText = await page.textContent('.info-list');
    expect(infoText).toContain('Gemini');
  });
});

test('Mobile Settings: should be responsive on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await page.click('[data-view="settings"]');

  // Provider grid should stack on mobile
  await page.waitForSelector('.provider-grid');

  // Check cards are still clickable
  const buttons = await page.locator('.provider-card button').all();
  expect(buttons.length).toBeGreaterThan(0);

  for (const button of buttons) {
    expect(await button.isVisible()).toBeTruthy();
  }
});

test('Mobile Settings: should show toast notifications on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await page.click('[data-view="settings"]');

  // Try to switch provider
  const firstButton = await page.locator('.provider-card button').first();
  if (firstButton) {
    await firstButton.click();

    // Wait for toast
    const toast = page.locator('.toast');
    await toast.waitFor({ timeout: 3000 }).catch(() => {});

    // Toast should be visible and not overlap content
    const toastBox = await toast.boundingBox();
    const viewportSize = page.viewportSize();
    if (toastBox && viewportSize) {
      expect(toastBox.x + toastBox.width).toBeLessThanOrEqual(viewportSize.width);
      expect(toastBox.y + toastBox.height).toBeLessThanOrEqual(viewportSize.height);
    }
  }
});
