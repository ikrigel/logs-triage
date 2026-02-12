# Help & Troubleshooting

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher

### Initial Setup
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:5173 in your browser

### First Run
- The app starts with default provider: Google Gemini
- Default model: gemini-2.0-flash
- No API key needed for initial exploration
- To use actual AI features, add your API key in Settings

---

## Common Issues & Solutions

### Issue: "Failed to fetch logs" Error

**Cause**: Log set data is not loading from the backend
**Solutions**:
1. Ensure backend server is running: `npm run server` (if using Express backend)
2. Check network tab in DevTools for 404/500 errors
3. Verify log data files exist in the correct location
4. Clear browser cache and reload

### Issue: "Invalid API Key" Message

**Cause**: The API key you entered is incorrect or expired
**Solutions**:
1. Double-check the key is copied completely (no extra spaces)
2. Verify the API key belongs to the selected provider:
   - Google Gemini: From https://aistudio.google.com
   - Anthropic Claude: From https://console.anthropic.com
   - Perplexity: From https://www.perplexity.ai/settings/api
3. Check if the key has expired (some providers require periodic renewal)
4. Try generating a new API key from the provider's console
5. Save the key again in Settings

### Issue: Chat Not Responding / "Waiting for response..." Stuck

**Cause**:
- API rate limit exceeded
- Network connection issue
- Backend service not responding
**Solutions**:
1. Wait 30+ seconds (rate limit cooldown)
2. Check internet connection
3. Try a shorter message (complex queries use more tokens)
4. Verify API key has sufficient quota
5. Refresh the page and start a new conversation
6. Check browser console (F12) for error messages

### Issue: "Session Expired" Error

**Cause**: Session stored in backend has been cleared (default 1 hour timeout)
**Solutions**:
1. Click "End Conversation" and start a new one
2. Your conversation history will not be recovered
3. Make note of important findings before sessions expire
4. For longer investigations, use the "Auto Triage" mode instead

### Issue: Dark Mode Not Working / Theme Not Persisting

**Cause**: localStorage is disabled or corrupted
**Solutions**:
1. Check Settings → verify theme toggle works
2. Open DevTools → Application → Local Storage
3. Verify `dark_mode` key exists and is `true` or `false`
4. Clear localStorage: `localStorage.clear()` in console
5. Reload page and set preferences again

### Issue: Mobile Menu Not Opening / Sidebar Stuck

**Cause**: CSS or state synchronization issue
**Solutions**:
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear browser cache
3. Check DevTools → Responsive Design Mode (toggle off/on)
4. Verify window width < 768px triggers mobile menu
5. Check for console errors in DevTools

### Issue: Logs View Empty / No Results in Search

**Cause**:
- Wrong log set selected
- Search filters too restrictive
- No logs match the search criteria
**Solutions**:
1. Try "Log Set 1" which has the most comprehensive log data
2. Clear all search filters and try again
3. Use search keywords like: "error", "warning", "connection"
4. Check Logs View shows correct log count at top
5. Try pagination if implemented

### Issue: Tickets Not Saving / Ticket List Empty

**Cause**:
- TicketStorage not initialized
- localStorage full
- Backend ticket persistence issue
**Solutions**:
1. Check DevTools → Application → Local Storage → `tickets`
2. Clear old tickets to free space: `localStorage.removeItem('tickets')`
3. Create a new ticket through UI to test persistence
4. Check network tab for ticket API calls
5. Verify backend `data/tickets.json` file exists with proper permissions

### Issue: Build Fails / TypeScript Errors

**Cause**: Dependency mismatch or incorrect environment
**Solutions**:
1. Reinstall dependencies:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
2. Clear Vite cache:
   ```bash
   rm -rf .vite
   npm run build
   ```
3. Check Node version: `node --version` (should be v18+)
4. Try building with specific target:
   ```bash
   npm run build
   ```

### Issue: E2E Tests Failing / Playwright Issues

**Cause**:
- Browser binaries not installed
- Port 5173 already in use
- Timing issues in tests
**Solutions**:
1. Install browsers:
   ```bash
   npx playwright install
   ```
2. Kill process on port 5173:
   ```bash
   # Windows
   netstat -ano | findstr :5173
   taskkill /PID <PID> /F

   # Mac/Linux
   lsof -i :5173 | awk 'NR!=1 {print $2}' | xargs kill -9
   ```
3. Run single test to isolate:
   ```bash
   npx playwright test --project=chromium app.spec.ts
   ```
4. Increase timeout in playwright.config.ts if needed

---

## Development Tips

### Enable Debug Logging
1. Open DevTools Console (F12)
2. Set debug flag:
   ```javascript
   localStorage.setItem('debug', 'true');
   location.reload();
   ```
3. Watch console for detailed operation logs
4. Disable with: `localStorage.removeItem('debug')`

### Test Different Log Sets
- **Set 1**: Healthy system (no issues)
- **Set 2**: Warning-level issues
- **Set 3**: Critical errors
- **Set 4**: Deployment-related issues
- **Set 5**: Complex multi-step investigation

Use these progressively to test agent capabilities.

### Simulate Network Issues
In DevTools Network tab:
1. Click throttle dropdown (usually "No throttling")
2. Select "Slow 3G" or "Offline" to test error handling
3. Verify UI shows graceful error messages

### Test on Different Screen Sizes
1. DevTools → Responsive Design Mode (Ctrl+Shift+M)
2. Test at: 320px, 375px, 768px, 1024px widths
3. Verify mobile menu works correctly
4. Check touch targets are 44px minimum

### Reset Application State
Complete reset (dangerous - loses all data):
```javascript
// Clear everything
localStorage.clear();
sessionStorage.clear();
// Reload
location.reload();
```

Partial reset (preserve settings):
```javascript
// Keep only settings
const settings = localStorage.getItem('ai_provider');
localStorage.clear();
if (settings) localStorage.setItem('ai_provider', settings);
location.reload();
```

---

## Performance Optimization

### Reduce Bundle Size
The current bundle is optimized at 79.8 kB gzipped. To check current size:
```bash
npm run build
# Check dist/assets/ for .js file sizes
```

### Improve Load Time
1. Verify gzip compression is enabled on server
2. Use CDN for production (Vercel, Netlify, etc.)
3. Enable HTTP/2 push for critical assets
4. Consider lazy-loading view components

### Memory Leak Prevention
- Conversations auto-cleanup after 1 hour
- Large chat histories automatically compress
- Unused sessions are purged periodically

---

## API Integration Debugging

### Check API Endpoints
Test endpoints directly using curl:
```bash
# Start conversation
curl -X POST http://localhost:3000/api/chat/start \
  -H "Content-Type: application/json" \
  -d '{"logSetNumber": 1}'

# Send message
curl -X POST http://localhost:3000/api/chat/{sessionId}/message \
  -H "Content-Type: application/json" \
  -d '{"message": "What logs do you have?"}'

# Get conversation
curl http://localhost:3000/api/chat/{sessionId}

# End conversation
curl -X DELETE http://localhost:3000/api/chat/{sessionId}
```

### Monitor Network Traffic
1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Watch for:
   - Response time > 5s (API slow)
   - 400+ status codes (errors)
   - Failed requests (red)

---

## Frequently Asked Questions

**Q: Can I use the app without an API key?**
A: Limited exploration is possible, but AI features (chat, triage) require a valid API key for one of the supported providers.

**Q: Which AI provider should I choose?**
A:
- **Gemini**: Free tier available, good for testing
- **Claude**: More conversational, better context understanding
- **Perplexity**: Good for web research capability

**Q: Can I change providers mid-conversation?**
A: No, you must end the conversation and start a new one with a different provider.

**Q: How long do conversations persist?**
A: Sessions timeout after 1 hour of inactivity. Export important findings before timeout.

**Q: Is my API key stored securely?**
A: Keys are stored in browser's localStorage (client-side only). The app never sends your key to any server except the LLM provider's API.

**Q: Can I export conversation history?**
A: Currently, no built-in export. You can copy/paste from the chat window or take screenshots.

**Q: Does the app work offline?**
A: No, API calls require internet connection. Chat and triage features will fail offline.

**Q: How many messages can a conversation have?**
A: Theoretically unlimited, but memory auto-compresses at 80% token usage to stay within API limits.

**Q: Can I delete individual messages?**
A: Not currently. Use "End Conversation" to clear the entire session.

**Q: How do I report a bug?**
A: Check GitHub issues first, then create a new issue with:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser/device info
- Screenshot if visual

---

## Contact & Support

For issues not covered here:
1. Check [ABOUT.md](ABOUT.md) for architecture overview
2. Review [COMPONENTS.md](COMPONENTS.md) for component details
3. Read [CLAUDE.md](CLAUDE.md) for full technical documentation
4. Check project README.md for quick start

For security issues, please do not open public issues. Contact the maintainers directly.
