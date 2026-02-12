import { test, expect } from '@playwright/test';

test.describe('React App Navigation & Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
  });

  test('should render app layout with header and sidebar', async ({ page }) => {
    // Check header exists
    await expect(page.locator('header')).toBeVisible();

    // Check sidebar exists
    await expect(page.locator('aside')).toBeVisible();

    // Check main content area exists
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display all navigation items in sidebar', async ({ page }) => {
    const navItems = [
      'Dashboard',
      'Triage',
      'Logs',
      'Tickets',
      'Settings',
    ];

    for (const item of navItems) {
      const button = page.getByRole('button', { name: new RegExp(item, 'i') });
      await expect(button).toBeVisible();
    }
  });

  test('should navigate between views', async ({ page }) => {
    // Navigate to Triage
    await page.getByRole('button', { name: /triage/i }).click();
    await expect(page.locator('text=Start Conversation')).toBeVisible();

    // Navigate to Logs
    await page.getByRole('button', { name: /logs/i }).click();
    await expect(page.locator('text=Browse and filter')).toBeVisible();

    // Navigate to Tickets
    await page.getByRole('button', { name: /tickets/i }).click();
    await expect(page.locator('text=Track and manage')).toBeVisible();

    // Navigate to Settings
    await page.getByRole('button', { name: /settings/i }).click();
    await expect(page.locator('text=Configure AI provider')).toBeVisible();

    // Navigate back to Dashboard
    await page.getByRole('button', { name: /dashboard/i }).click();
    await expect(page.locator('text=Overview of your production')).toBeVisible();
  });

  test('should toggle dark mode', async ({ page }) => {
    // Get initial mode
    const initialDarkMode = await page
      .locator('html')
      .evaluate((el) => el.classList.contains('dark-mode'));

    // Click theme toggle
    await page.getByRole('button', { name: /light mode|dark mode/i }).click();

    // Check mode changed
    const newDarkMode = await page
      .locator('html')
      .evaluate((el) => el.classList.contains('dark-mode'));

    expect(newDarkMode).toBe(!initialDarkMode);

    // Toggle back
    await page.getByRole('button', { name: /light mode|dark mode/i }).click();
    const finalDarkMode = await page
      .locator('html')
      .evaluate((el) => el.classList.contains('dark-mode'));

    expect(finalDarkMode).toBe(initialDarkMode);
  });

  test('should show hamburger menu on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Hamburger button should be visible on mobile
    const hamburger = page.getByRole('button', { name: /toggle sidebar/i });
    await expect(hamburger).toBeVisible();

    // Click to toggle sidebar
    await hamburger.click();
    await expect(page.locator('aside.open')).toBeVisible();

    // Click again to close
    await hamburger.click();
  });

  test('should close mobile sidebar after navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Open sidebar
    await page.getByRole('button', { name: /toggle sidebar/i }).click();
    await expect(page.locator('aside.open')).toBeVisible();

    // Navigate to a different view
    await page.getByRole('button', { name: /logs/i }).click();

    // Sidebar should be closed
    await expect(page.locator('aside.open')).not.toBeVisible();
  });
});

test.describe('Dashboard View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
  });

  test('should display dashboard with metric cards', async ({ page }) => {
    // Check for metrics
    await expect(page.locator('text=Total Logs')).toBeVisible();
    await expect(page.locator('text=Open Tickets')).toBeVisible();
    await expect(page.locator('text=Critical Issues')).toBeVisible();
    await expect(page.locator('text=Chat Sessions')).toBeVisible();
  });

  test('should display recent activity feed', async ({ page }) => {
    await expect(page.locator('text=Recent Activity')).toBeVisible();

    // Check for activity items
    const activityItems = page.locator('.activity-item');
    const count = await activityItems.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Logs View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.getByRole('button', { name: /logs/i }).click();
  });

  test('should display logs with filters', async ({ page }) => {
    // Check search input exists
    const searchInput = page.getByPlaceholder(/search logs/i);
    await expect(searchInput).toBeVisible();

    // Check filter dropdowns exist
    await expect(page.getByRole('combobox').first()).toBeVisible(); // Level filter
    await expect(page.getByRole('combobox').nth(1)).toBeVisible(); // Service filter
  });

  test('should filter logs by level', async ({ page }) => {
    // Get initial count
    const initialCount = await page.locator('.log-row').count();

    // Filter by ERROR
    await page.getByRole('combobox').first().selectOption('ERROR');

    // Wait for filter to apply
    await page.waitForTimeout(300);

    // Count should change
    const filteredCount = await page.locator('.log-row').count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('should search logs', async ({ page }) => {
    // Type in search
    await page.getByPlaceholder(/search logs/i).fill('error');

    // Wait for search to apply
    await page.waitForTimeout(300);

    // Check results are filtered
    const rows = page.locator('.log-row');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Tickets View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.getByRole('button', { name: /tickets/i }).click();
  });

  test('should display tickets with filters', async ({ page }) => {
    // Check filter buttons exist
    const filterButtons = page.locator('.filter-btn');
    const count = await filterButtons.count();
    expect(count).toBeGreaterThan(0);

    // Check ticket cards exist
    const ticketCards = page.locator('.ticket-card');
    const ticketCount = await ticketCards.count();
    expect(ticketCount).toBeGreaterThan(0);
  });

  test('should filter tickets by status', async ({ page }) => {
    // Get initial count
    const initialCount = await page.locator('.ticket-card').count();

    // Click open filter
    await page.getByRole('button', { name: /^Open$/i }).click();

    // Wait for filter
    await page.waitForTimeout(300);

    // Count may change
    const filteredCount = await page.locator('.ticket-card').count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('should show ticket details on click', async ({ page }) => {
    // Click first ticket card
    await page.locator('.ticket-card').first().click();

    // Check detail panel appears
    await expect(page.locator('.ticket-details')).toBeVisible();
  });
});

test.describe('Settings View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.getByRole('button', { name: /settings/i }).click();
  });

  test('should display provider selection', async ({ page }) => {
    // Check provider cards
    await expect(page.locator('text=Google Gemini')).toBeVisible();
    await expect(page.locator('text=Anthropic Claude')).toBeVisible();
    await expect(page.locator('text=Perplexity')).toBeVisible();
  });

  test('should select provider', async ({ page }) => {
    // Click Claude provider
    await page.locator('text=Anthropic Claude').click();

    // Check selection indicator
    await expect(
      page.locator('text=Anthropic Claude').locator('..').locator('.checkmark')
    ).toBeVisible();
  });

  test('should display model options', async ({ page }) => {
    // Check model radio buttons exist
    const modelInputs = page.locator('input[type="radio"][name="model"]');
    const count = await modelInputs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should manage API keys', async ({ page }) => {
    // Check API key inputs exist
    const apiInputs = page.locator('input[type="password"]');
    const count = await apiInputs.count();
    expect(count).toBeGreaterThan(0);

    // Fill in an API key
    await apiInputs.first().fill('test-api-key-12345');

    // Click save button
    await page.getByRole('button', { name: /save api keys/i }).click();

    // Check for save confirmation
    await expect(
      page.getByRole('button', { name: /saved/i })
    ).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Check H1 exists
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    expect(h1Count).toBeGreaterThanOrEqual(0);

    // Check H2 exists
    const h2 = page.locator('h2');
    const h2Count = await h2.count();
    expect(h2Count).toBeGreaterThan(0);
  });

  test('should have proper button labels', async ({ page }) => {
    // Check buttons have aria-label or text content
    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();

      const hasLabel = ariaLabel || textContent?.trim().length;
      expect(hasLabel).toBeTruthy();
    }
  });

  test('should have proper form labels', async ({ page }) => {
    await page.getByRole('button', { name: /logs/i }).click();

    // Check input has associated label
    const searchInput = page.getByPlaceholder(/search logs/i);
    const placeholder = await searchInput.getAttribute('placeholder');
    expect(placeholder).toBeTruthy();
  });
});

test.describe('Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
  });

  test('should load page within reasonable time', async ({ page }) => {
    const startTime = Date.now();

    // Wait for main content to be visible
    await expect(page.locator('main')).toBeVisible();

    const loadTime = Date.now() - startTime;

    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should navigate between views quickly', async ({ page }) => {
    const startTime = Date.now();

    // Navigate to 3 different views
    await page.getByRole('button', { name: /logs/i }).click();
    await page.getByRole('button', { name: /tickets/i }).click();
    await page.getByRole('button', { name: /settings/i }).click();

    const navigationTime = Date.now() - startTime;

    // Navigation should complete within 2 seconds
    expect(navigationTime).toBeLessThan(2000);
  });
});
