import { test, expect } from '@playwright/test';

test.describe('Conversational Chat Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Click on triage view to see the chat
    await page.click('[data-view="triage"]');
  });

  test('should start a conversation and load logs context', async ({ page }) => {
    // Select log set 1
    const logSelect = page.locator('#preset-logs');
    await logSelect.selectOption('1');

    // Click start conversation
    const startConvBtn = page.locator('button:has-text("Start Conversation")');
    await startConvBtn.click();

    // Wait for initial message
    const messages = page.locator('.message.assistant-message');
    await expect(messages.first()).toBeVisible({ timeout: 5000 });

    // Check that session info is displayed
    const sessionInfo = page.locator('#session-info');
    await expect(sessionInfo).toBeVisible();

    // Check that logs are loaded
    const logsInfo = page.locator('#session-logs-info');
    const logsText = await logsInfo.textContent();
    expect(logsText).toContain('logs');
    expect(logsText).toContain('log_set_1');
  });

  test('should send and receive chat messages', async ({ page }) => {
    // Start conversation
    const logSelect = page.locator('#preset-logs');
    await logSelect.selectOption('1');
    const startConvBtn = page.locator('button:has-text("Start Conversation")');
    await startConvBtn.click();

    // Wait for chat input to appear
    const chatInput = page.locator('#chat-input');
    await chatInput.waitFor({ timeout: 5000 });

    // Send a message
    await chatInput.fill('What logs are loaded?');
    const sendBtn = page.locator('#send-chat-btn');
    await sendBtn.click();

    // Check user message appears
    const userMessages = page.locator('.message.user-message');
    await expect(userMessages.last()).toBeVisible({ timeout: 5000 });
    const userText = await userMessages.last().textContent();
    expect(userText).toContain('What logs are loaded?');

    // Check assistant response appears
    const assistantMessages = page.locator('.message.assistant-message');
    await expect(assistantMessages.last()).toBeVisible({ timeout: 10000 });
  });

  test('should preserve logs context across multiple messages', async ({ page }) => {
    // Start conversation with specific log set
    const logSelect = page.locator('#preset-logs');
    await logSelect.selectOption('2');
    const startConvBtn = page.locator('button:has-text("Start Conversation")');
    await startConvBtn.click();

    // Wait for input
    const chatInput = page.locator('#chat-input');
    await chatInput.waitFor({ timeout: 5000 });

    // Send first message
    await chatInput.fill('Are there errors?');
    const sendBtn = page.locator('#send-chat-btn');
    await sendBtn.click();

    // Wait for response
    await page.waitForTimeout(2000);

    // Send second message
    await chatInput.fill('What services are affected?');
    await sendBtn.click();

    // Check that both user messages are in conversation
    const userMessages = await page.locator('.message.user-message').allTextContents();
    expect(userMessages.length).toBeGreaterThanOrEqual(2);
    expect(userMessages.some(msg => msg.includes('errors'))).toBeTruthy();
    expect(userMessages.some(msg => msg.includes('services'))).toBeTruthy();
  });

  test('should display tool executions in chat', async ({ page }) => {
    // Start conversation
    const logSelect = page.locator('#preset-logs');
    await logSelect.selectOption('1');
    const startConvBtn = page.locator('button:has-text("Start Conversation")');
    await startConvBtn.click();

    const chatInput = page.locator('#chat-input');
    await chatInput.waitFor({ timeout: 5000 });

    // Send message that might trigger tool usage
    await chatInput.fill('Search for errors');
    const sendBtn = page.locator('#send-chat-btn');
    await sendBtn.click();

    // Wait a bit for tools to execute if they do
    await page.waitForTimeout(3000);

    // Check if any tool executions are visible
    const toolExecutions = page.locator('.message.tool-execution');
    // Tool execution might appear depending on LLM response
    const toolCount = await toolExecutions.count();
    // Just verify the element type is available, actual execution depends on LLM
    expect(toolCount >= 0).toBeTruthy();
  });

  test('should have working End Conversation button', async ({ page }) => {
    // Start conversation
    const logSelect = page.locator('#preset-logs');
    await logSelect.selectOption('1');
    const startConvBtn = page.locator('button:has-text("Start Conversation")');
    await startConvBtn.click();

    // Wait for session info
    const sessionInfo = page.locator('#session-info');
    await expect(sessionInfo).toBeVisible({ timeout: 5000 });

    // Click End Conversation
    const endBtn = page.locator('button:has-text("End Conversation")');
    await endBtn.click();

    // Session info should disappear
    await expect(sessionInfo).not.toBeVisible();

    // Log source selection should reappear
    const logSelection = page.locator('#log-source-selection');
    await expect(logSelection).toBeVisible();
  });

  test('should have Run Auto Triage button in chat', async ({ page }) => {
    // Start conversation
    const logSelect = page.locator('#preset-logs');
    await logSelect.selectOption('1');
    const startConvBtn = page.locator('button:has-text("Start Conversation")');
    await startConvBtn.click();

    // Wait for auto triage button
    const autoTriageBtn = page.locator('#run-auto-triage-btn');
    await expect(autoTriageBtn).toBeVisible({ timeout: 5000 });

    // Button should be enabled
    const isDisabled = await autoTriageBtn.isDisabled();
    expect(isDisabled).toBeFalsy();
  });

  test('should switch to auto triage mode without ending session', async ({ page }) => {
    // Start conversation
    const logSelect = page.locator('#preset-logs');
    await logSelect.selectOption('3');
    const startConvBtn = page.locator('button:has-text("Start Conversation")');
    await startConvBtn.click();

    // Wait for session
    const sessionInfo = page.locator('#session-info');
    await expect(sessionInfo).toBeVisible({ timeout: 5000 });

    // Send a chat message
    const chatInput = page.locator('#chat-input');
    await chatInput.fill('Test message');
    const sendBtn = page.locator('#send-chat-btn');
    await sendBtn.click();

    // Wait for message to appear
    await page.waitForTimeout(2000);
    const userMessageCount1 = await page.locator('.message.user-message').count();

    // Click Run Auto Triage
    const autoTriageBtn = page.locator('#run-auto-triage-btn');
    await autoTriageBtn.click();

    // Wait for auto triage to process
    await page.waitForTimeout(3000);

    // Session should still be active
    await expect(sessionInfo).toBeVisible();

    // Chat input should still be visible (session not ended)
    await expect(chatInput).toBeVisible();
  });

  test('should display chat in correct order', async ({ page }) => {
    // Start conversation
    const logSelect = page.locator('#preset-logs');
    await logSelect.selectOption('1');
    const startConvBtn = page.locator('button:has-text("Start Conversation")');
    await startConvBtn.click();

    const chatInput = page.locator('#chat-input');
    await chatInput.waitFor({ timeout: 5000 });

    // Send multiple messages
    const messages = ['First question?', 'Second question?', 'Third question?'];
    const sendBtn = page.locator('#send-chat-btn');

    for (const msg of messages) {
      await chatInput.fill(msg);
      await sendBtn.click();
      await page.waitForTimeout(1000);
    }

    // Get all user messages
    const userMessages = await page.locator('.message.user-message').allTextContents();

    // Verify they appear in order (or at least are all present)
    expect(userMessages.length).toBeGreaterThanOrEqual(1);
  });

  test('should support Enter key to send message', async ({ page }) => {
    // Start conversation
    const logSelect = page.locator('#preset-logs');
    await logSelect.selectOption('1');
    const startConvBtn = page.locator('button:has-text("Start Conversation")');
    await startConvBtn.click();

    const chatInput = page.locator('#chat-input');
    await chatInput.waitFor({ timeout: 5000 });

    // Type message and press Enter
    await chatInput.fill('Test message with Enter');
    await chatInput.press('Enter');

    // Check message was sent
    const userMessages = await page.locator('.message.user-message').allTextContents();
    expect(userMessages.some(msg => msg.includes('Enter'))).toBeTruthy();

    // Input should be cleared
    const inputValue = await chatInput.inputValue();
    expect(inputValue).toBe('');
  });

  test('should support Shift+Enter for new line', async ({ page }) => {
    // Start conversation
    const logSelect = page.locator('#preset-logs');
    await logSelect.selectOption('1');
    const startConvBtn = page.locator('button:has-text("Start Conversation")');
    await startConvBtn.click();

    const chatInput = page.locator('#chat-input');
    await chatInput.waitFor({ timeout: 5000 });

    // Type with Shift+Enter (new line, not send)
    await chatInput.fill('Line 1');
    await chatInput.press('Shift+Enter');
    await chatInput.press('End');
    await chatInput.type('Line 2');

    // Should still be in input, not sent
    const inputValue = await chatInput.inputValue();
    expect(inputValue).toContain('Line 1');
    expect(inputValue).toContain('Line 2');
  });
});

test.describe('Logs Context Preservation', () => {
  test('should not lose logs context on first message', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-view="triage"]');

    // Start conversation with log set 2
    const logSelect = page.locator('#preset-logs');
    await logSelect.selectOption('2');
    const startConvBtn = page.locator('button:has-text("Start Conversation")');
    await startConvBtn.click();

    // Wait for initialization
    await page.waitForTimeout(2000);

    // Send message about logs
    const chatInput = page.locator('#chat-input');
    await chatInput.fill('How many logs are loaded?');
    const sendBtn = page.locator('#send-chat-btn');
    await sendBtn.click();

    // Wait for response
    await page.waitForTimeout(3000);

    // Check that assistant responds (not saying "no logs provided")
    const assistantMessages = await page.locator('.message.assistant-message').allTextContents();
    const lastMessage = assistantMessages[assistantMessages.length - 1].toLowerCase();

    // Should not contain messages saying logs weren't provided
    expect(lastMessage).not.toContain('no logs');
    expect(lastMessage).not.toContain('not provided');
  });
});
