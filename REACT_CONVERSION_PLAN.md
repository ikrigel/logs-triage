# Production Logs Triage - React Conversion Plan

## Executive Summary
Converting the application from vanilla HTML/CSS/JavaScript to React with TypeScript for improved maintainability, component reusability, and developer experience.

**Timeline:** 4-5 weeks | **Effort:** ~160 hours | **Team Size:** 1-2 developers

---

## Phase 1: Core Shell & Navigation (Week 1)

### Objectives
- Set up React project with Vite + TypeScript
- Create app shell and layout structure
- Implement navigation system
- Set up routing with TanStack Router
- Establish state management pattern

### Components to Build
1. **App.tsx** - Root component
2. **Layout.tsx** - Main layout wrapper
3. **Sidebar.tsx** - Navigation sidebar
4. **Header.tsx** - Top header bar
5. **Navigation.tsx** - Nav links logic

### New Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "@tanstack/react-router": "^1.0.0",
  "@tanstack/react-query": "^5.0.0",
  "zustand": "^4.4.0",
  "typescript": "^5.3.0"
}
```

### Technical Setup
- Vite config with React Fast Refresh
- TypeScript strict mode
- Path aliases (@/components, @/hooks, etc.)
- CSS modules or Tailwind
- ESLint + Prettier

### Success Criteria
- ✅ App renders without errors
- ✅ Navigation works on all screen sizes
- ✅ Mobile menu toggle functional
- ✅ Theme toggle persists

---

## Phase 2: Triage View & Chat Mode (Week 2-3)

### Objectives
- Implement conversational chat interface
- Build chat message components
- Connect to existing chat API
- Manage chat session state

### Components to Build
1. **TriageView.tsx** - Main triage page
2. **ChatWindow.tsx** - Chat display
3. **ChatMessage.tsx** - Individual message
4. **ToolExecution.tsx** - Tool result display
5. **ChatInput.tsx** - Message input
6. **LogSourceSelector.tsx** - Log selection UI
7. **useChat()** hook - Chat logic

### State Management
- Store: sessionId, messages, isLoading, currentLogs
- Use TanStack Query for API calls
- Use Zustand for UI state

### API Integration
- POST /api/chat/start
- POST /api/chat/:sessionId/message
- GET /api/chat/:sessionId
- DELETE /api/chat/:sessionId

---

## Phase 3: Logs, Tickets, Settings (Week 3-4)

### Views to Build
1. **Dashboard.tsx** - Overview cards, metrics
2. **LogsView.tsx** - Log list with filters
3. **TicketsView.tsx** - Ticket management
4. **SettingsView.tsx** - Provider/model selection

### Components
- FilterPanel.tsx
- LogTable.tsx
- TicketList.tsx
- ProviderCard.tsx
- ApiKeyInput.tsx

### State & Hooks
- useLogs() - Fetch and filter logs
- useTickets() - CRUD operations
- useSettings() - Provider/model management
- useLocalStorage() - Persist settings

---

## Phase 4: Refactoring & Testing (Week 4-5)

### Tasks
- Extract reusable components
- Create custom hooks library
- Add error boundaries
- Update Playwright tests for React
- Performance optimization
- Accessibility audit
- Mobile responsiveness fixes

### Testing Strategy
- Update E2E tests to work with React
- Add React component tests (Vitest)
- Test hooks in isolation

---

## Architecture

### Folder Structure
```
src/
├── components/
│   ├── Layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Layout.tsx
│   ├── Chat/
│   │   ├── ChatWindow.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── ChatInput.tsx
│   │   └── ToolExecution.tsx
│   ├── Views/
│   │   ├── Dashboard.tsx
│   │   ├── LogsView.tsx
│   │   ├── TicketsView.tsx
│   │   └── SettingsView.tsx
│   └── Common/
│       ├── Card.tsx
│       ├── Button.tsx
│       └── Modal.tsx
├── hooks/
│   ├── useChat.ts
│   ├── useLogs.ts
│   ├── useTickets.ts
│   ├── useSettings.ts
│   └── useLocalStorage.ts
├── store/
│   ├── uiStore.ts (Zustand)
│   └── types.ts
├── types/
│   ├── api.ts
│   ├── chat.ts
│   └── logs.ts
├── services/
│   └── api.ts (HTTP client)
├── styles/
│   └── globals.css
├── routes.tsx
└── App.tsx
```

### State Management Strategy
- **Server State:** TanStack Query for API data
- **UI State:** Zustand for theme, modals, UI toggles
- **Local State:** React hooks for component-specific state

### Styling Approach
- **Option A:** Keep existing CSS (minimal changes)
- **Option B:** Migrate to Tailwind CSS (more modern)
- **Option C:** CSS Modules (scoped styling)

---

## Migration Path

### Keep from Original
- Express.js backend (no changes)
- API endpoints (same structure)
- Agent logic (unchanged)
- Storage system (same)
- Playwright E2E tests (update selectors)

### Replace with React
- HTML/CSS/JS frontend
- View system → React Router
- Event handlers → React event system
- State management → Zustand + React Query

### Parallel Development
- Keep vanilla app running during migration
- Feature-by-feature conversion
- Test each React component with existing API

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Large bundle size | Code splitting, lazy loading |
| API compatibility | Test API calls before conversion |
| Performance regression | Performance profiling, optimization |
| Testing coverage gaps | Incremental test updates |
| Mobile responsiveness issues | Test on real devices early |

---

## Success Metrics

- ✅ All features working in React
- ✅ No performance regression
- ✅ 90%+ Lighthouse score
- ✅ 85%+ test coverage
- ✅ <50KB gzipped bundle (with tree shaking)
- ✅ Deployment successful
- ✅ E2E tests passing

---

## Next Steps

1. Set up Vite + React + TypeScript project
2. Create basic folder structure
3. Implement Phase 1 components
4. Test navigation on all devices
5. Integrate with existing APIs
6. Begin Phase 2 (Chat)

---

**Estimated Start Date:** Next sprint  
**Estimated Completion:** 4-5 weeks from start  
**Team:** 1-2 developers  
**Code Freeze:** Day 30 for final testing  
