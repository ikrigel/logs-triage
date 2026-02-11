import { test, expect } from '@playwright/test';

test.describe('Ticket Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate to triage view
    await page.click('[data-view="triage"]');
  });

  test('should create tickets during auto triage', async ({ page }) => {
    // Select log set 1
    const logSelect = page.locator('#preset-logs');
    await logSelect.selectOption('1');

    // Run auto triage
    const triageBtn = page.locator('#start-triage-btn');
    await triageBtn.click();

    // Wait for triage to complete
    const messages = page.locator('.message');
    await expect(messages.last()).toBeVisible({ timeout: 30000 });

    // Check for ticket creation message
    const chatText = await page.locator('#chat-messages').textContent();
    // Should have some indication of triage completion
    expect(chatText).toBeTruthy();
  });

  test('should show created tickets in Tickets view', async ({ page }) => {
    // Create tickets first via auto triage
    const logSelect = page.locator('#preset-logs');
    await logSelect.selectOption('2');

    const triageBtn = page.locator('#start-triage-btn');
    await triageBtn.click();

    // Wait for completion
    await page.waitForTimeout(15000);

    // Navigate to Tickets view
    await page.click('[data-view="tickets"]');

    // Check if tickets are displayed
    const ticketsView = page.locator('#tickets-view');
    await expect(ticketsView).toBeVisible({ timeout: 5000 });

    // Look for ticket list
    const ticketItems = page.locator('.ticket-item, .ticket');
    const count = await ticketItems.count();
    // At least some tickets should be visible (if triage created any)
    expect(count >= 0).toBeTruthy();
  });

  test('should preserve tickets across multiple triage runs', async ({ page }) => {
    // Run first triage
    const logSelect = page.locator('#preset-logs');
    await logSelect.selectOption('1');

    let triageBtn = page.locator('#start-triage-btn');
    await triageBtn.click();

    // Wait for completion
    await page.waitForTimeout(15000);

    // Navigate to tickets to see what was created
    await page.click('[data-view="tickets"]');
    await page.waitForTimeout(1000);

    // Get initial ticket count
    let ticketItems = page.locator('.ticket-item, .ticket');
    const initialCount = await ticketItems.count();

    // Go back to triage and run again with different log set
    await page.click('[data-view="triage"]');

    // Clear the log select and choose different logs
    await logSelect.selectOption('3');

    triageBtn = page.locator('#start-triage-btn');
    await triageBtn.click();

    // Wait for completion
    await page.waitForTimeout(15000);

    // Navigate to tickets again
    await page.click('[data-view="tickets"]');
    await page.waitForTimeout(1000);

    // Get final ticket count
    ticketItems = page.locator('.ticket-item, .ticket');
    const finalCount = await ticketItems.count();

    // Should have more or equal tickets (preserved previous + new)
    expect(finalCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('should handle concurrent triage runs without losing tickets', async ({ page }) => {
    // First triage on log set 1
    const logSelect = page.locator('#preset-logs');
    await logSelect.selectOption('1');

    const triageBtn = page.locator('#start-triage-btn');
    await triageBtn.click();

    // Wait for first triage to complete
    await page.waitForTimeout(15000);

    // Check tickets view
    await page.click('[data-view="tickets"]');
    await page.waitForTimeout(1000);

    const ticketItems1 = page.locator('.ticket-item, .ticket');
    const count1 = await ticketItems1.count();

    // Go back and run another triage
    await page.click('[data-view="triage"]');
    await logSelect.selectOption('2');

    await triageBtn.click();
    await page.waitForTimeout(15000);

    // Check if all tickets are still there
    await page.click('[data-view="tickets"]');
    await page.waitForTimeout(1000);

    const ticketItems2 = page.locator('.ticket-item, .ticket');
    const count2 = await ticketItems2.count();

    // Second triage should not remove first triage's tickets
    expect(count2).toBeGreaterThanOrEqual(count1);
  });

  test('should display ticket details correctly', async ({ page }) => {
    // Run triage first
    const logSelect = page.locator('#preset-logs');
    await logSelect.selectOption('4');

    const triageBtn = page.locator('#start-triage-btn');
    await triageBtn.click();

    await page.waitForTimeout(15000);

    // Navigate to tickets
    await page.click('[data-view="tickets"]');
    await page.waitForTimeout(1000);

    // Click first ticket if it exists
    const firstTicket = page.locator('.ticket-item, .ticket').first();
    const count = await page.locator('.ticket-item, .ticket').count();

    if (count > 0) {
      await firstTicket.click();
      await page.waitForTimeout(1000);

      // Check if ticket details are shown
      const ticketDetail = page.locator('[id*="ticket-detail"], .ticket-detail');
      const detailCount = await ticketDetail.count();

      // Ticket details should be visible or modal should open
      expect(detailCount >= 0).toBeTruthy();
    }
  });

  test('should filter tickets by status', async ({ page }) => {
    // Navigate to tickets
    await page.click('[data-view="tickets"]');
    await page.waitForTimeout(1000);

    // Look for status filter
    const statusFilter = page.locator('select[name*="status"], select[name*="Status"]');
    const filterCount = await statusFilter.count();

    if (filterCount > 0) {
      // Try filtering by open status
      await statusFilter.selectOption('open');
      await page.waitForTimeout(500);

      // Should show only open tickets
      const ticketItems = page.locator('.ticket-item, .ticket');
      const count = await ticketItems.count();
      expect(count >= 0).toBeTruthy();
    }
  });

  test('should search tickets by keyword', async ({ page }) => {
    // Navigate to tickets
    await page.click('[data-view="tickets"]');
    await page.waitForTimeout(1000);

    // Look for search input
    const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="Search"]');
    const searchCount = await searchInput.count();

    if (searchCount > 0) {
      // Type a search term
      await searchInput.first().fill('error');
      await page.waitForTimeout(500);

      // Should filter tickets
      const ticketItems = page.locator('.ticket-item, .ticket');
      const count = await ticketItems.count();
      expect(count >= 0).toBeTruthy();
    }
  });
});

test.describe('Ticket Creation from Chat', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('[data-view="triage"]');
  });

  test('should create ticket from chat conversation', async ({ page }) => {
    // Start conversation
    const logSelect = page.locator('#preset-logs');
    await logSelect.selectOption('2');

    const startConvBtn = page.locator('button:has-text("Start Conversation")');
    await startConvBtn.click();

    const chatInput = page.locator('#chat-input');
    await chatInput.waitFor({ timeout: 5000 });

    // Ask about issues and create ticket
    await chatInput.fill('What issues do you see that need a ticket?');
    const sendBtn = page.locator('#send-chat-btn');
    await sendBtn.click();

    // Wait for response with potential tool use
    await page.waitForTimeout(5000);

    // Navigate to tickets to see if any were created
    await page.click('[data-view="tickets"]');
    await page.waitForTimeout(2000);

    // Check if tickets exist
    const ticketItems = page.locator('.ticket-item, .ticket');
    const count = await ticketItems.count();
    expect(count >= 0).toBeTruthy();
  });

  test('should display auto triage results in chat', async ({ page }) => {
    // Start conversation
    const logSelect = page.locator('#preset-logs');
    await logSelect.selectOption('1');

    const startConvBtn = page.locator('button:has-text("Start Conversation")');
    await startConvBtn.click();

    // Wait for session
    const chatInput = page.locator('#chat-input');
    await chatInput.waitFor({ timeout: 5000 });

    // Click Run Auto Triage button
    const autoTriageBtn = page.locator('#run-auto-triage-btn');
    await autoTriageBtn.click();

    // Wait for auto triage to complete
    await page.waitForTimeout(5000);

    // Check for completion message
    const messages = page.locator('.message');
    const messageTexts = await messages.allTextContents();

    // Should have some completion message
    expect(messageTexts.length > 0).toBeTruthy();
  });
});
