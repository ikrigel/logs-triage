# E2E Testing Guide with Playwright

## Overview

The Logs Triage Agent now includes comprehensive E2E testing with Playwright to ensure full UI responsiveness across all device sizes and screen types.

## Installation

```bash
# Install dependencies (includes Playwright)
npm install

# Install Playwright browsers
npx playwright install
```

## Running Tests

### All Tests
```bash
npm run test:e2e
```

### UI Test Runner
```bash
npm run test:e2e:ui
```

### Debug Mode
```bash
npm run test:e2e:debug
```

### Specific Test File
```bash
npx playwright test src/e2e/ui-responsiveness.spec.ts
npx playwright test src/e2e/settings.spec.ts
npx playwright test src/e2e/navigation.spec.ts
```

### Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
npx playwright test --project=Tablet
```

## Test Coverage

### UI Responsiveness Tests (`ui-responsiveness.spec.ts`)
- Desktop (1920x1080)
- Laptop (1366x768)
- Tablet (768x1024)
- Mobile (375x667)
- Small Mobile (320x568)
- iPhone 12 specific tests
- iPad Pro specific tests
- Touch target size validation
- Text wrapping on mobile
- Form input accessibility

### Settings Tests (`settings.spec.ts`)
- Provider option display
- Availability status indicators
- Current provider highlighting
- Provider switching functionality
- localStorage persistence
- Toast notifications
- System status information
- Mobile responsiveness
- Mobile toast positioning

### Navigation Tests (`navigation.spec.ts`)
- View switching
- Active link highlighting
- Theme persistence across views
- Dashboard quick actions
- Keyboard navigation (Tab, Enter)
- Mobile navigation accessibility
- Touch target accessibility

## Device Profiles

Playwright tests run on the following device profiles:

| Device | Size | Type |
|--------|------|------|
| Chromium (Desktop) | 1920x1080 | Browser |
| Firefox (Desktop) | 1920x1080 | Browser |
| WebKit (Desktop) | 1920x1080 | Browser |
| Pixel 5 | 393x851 | Android |
| iPhone 12 | 390x844 | iOS |
| iPad Pro | 1024x1366 | Tablet |

## What's Tested

### Viewport Sizes
✅ All screen sizes from 320px (small mobile) to 1920px (desktop)
✅ Portrait and landscape orientations
✅ Tablet and mobile specific layouts

### Responsive Features
✅ Grid layouts adapting to viewport
✅ Navigation accessibility
✅ Button and touch target sizes (min 44x44)
✅ Text wrapping without horizontal scroll
✅ Font sizes (16px+ on mobile to prevent zoom)
✅ Form input accessibility

### Provider Switching
✅ Provider selection UI updates
✅ localStorage persistence
✅ Toast notifications
✅ Provider availability status
✅ Current provider highlighting
✅ Works on all device sizes

### Navigation
✅ All view navigation
✅ Active link styling
✅ Theme persistence
✅ Keyboard navigation (Tab, Enter)
✅ Mobile navigation
✅ Dashboard quick actions

## Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

Screenshots are saved for visual regression testing:
- `screenshot-dashboard-*.png` - Dashboard at different sizes
- `screenshot-settings-*.png` - Settings at different sizes
- `screenshot-tablet-layout.png` - Tablet specific view

## CI/CD Integration

For GitHub Actions:

```yaml
name: Playwright Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Performance Tests

The test suite validates:

- **Touch Targets**: All buttons are minimum 44x44 for mobile
- **Font Sizes**: Inputs are 16px+ to prevent iOS auto-zoom
- **No Horizontal Scroll**: Content fits viewport width
- **Text Wrapping**: Long text wraps properly on mobile
- **Layout Stability**: Grids adapt smoothly

## Debugging Failed Tests

```bash
# Run test in debug mode
npm run test:e2e:debug

# Run with trace enabled
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

## Common Issues

### Port Already In Use
```bash
PORT=3001 npm run server
# Then update playwright.config.ts baseURL
```

### Playwright Browsers Not Installed
```bash
npx playwright install
```

### Test Timeout
```bash
npx playwright test --timeout=60000
```

### Take Screenshots During Test
```typescript
await page.screenshot({ path: 'debug-screenshot.png' });
```

## Continuous Improvement

The E2E test suite helps ensure:

- ✅ No regressions on UI changes
- ✅ All devices remain supported
- ✅ Navigation works flawlessly
- ✅ Settings persist correctly
- ✅ Responsive design holds
- ✅ Accessibility standards met
- ✅ Toast notifications work
- ✅ Provider switching reliable

## Next Steps

After running tests successfully:

1. **Review Report**: Open the HTML report
2. **Check Screenshots**: Compare visual changes
3. **Fix Issues**: Update code if tests fail
4. **Commit**: Push changes with test passing
5. **Deploy**: Deploy with confidence

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI/CD Integration](https://playwright.dev/docs/ci)
