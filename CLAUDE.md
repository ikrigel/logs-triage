# Production Logs Triage Agent - Developer Guide

## Project Overview

This is a **Production Logs Triage Agent** - an AI-powered system that automatically investigates production logs, identifies issues, correlates them with system changes, and creates support tickets with developer suggestions.

The system consists of:
- **AI Agent Loop**: LLM-driven investigation with tool execution
- **Investigation Tools**: Log search, change correlation, ticket creation, team alerting
- **Local Storage**: JSON-based ticket persistence
- **Web Frontend**: Dashboard for visualization and management
- **Express API**: RESTful backend for programmatic access

---

## Architecture

### Core Components

#### Agent Loop (`src/agent/index.ts`)
The `LogTriageAgent` class implements the main agentic loop:

1. **Initialization**: Takes initial logs (last 5) plus full log history
2. **LLM Call**: Sends logs and memory to Gemini API
3. **Tool Execution**: Agent decides which tools to use and passes results back
4. **Iteration**: Loop continues until completion or max iterations (10)

**Key Features:**
- Automatic memory management with compression
- Tool call orchestration
- Iteration limits to prevent token waste
- Detailed logging for debugging

#### Memory Management (`src/agent/memory.ts`)
The `AgentMemory` class tracks conversation history:

- System prompt + initial context
- All LLM responses and tool results
- Token usage estimation
- Automatic compression when reaching ~80% of token limit

**Methods:**
- `addAssistantMessage(content)` - Add LLM response
- `addToolResult(toolName, result, error?)` - Add tool execution result
- `getFormattedMessagesForLLM()` - Get messages for next LLM call
- `getSystemPrompt()` - Get the system instructions

#### AI Service (`src/services/aiService.ts`)
Abstracts LLM provider (currently Gemini, extendable to Perplexity):

- Generates system prompts for each log set
- Calls LLM with tool definitions
- Handles rate limiting with exponential backoff
- Returns both text response and tool calls

---

## Investigation Tools

### searchLogs (`src/tools/searchLogs.ts`)
**Purpose:** Deep search through logs to find related entries

**Capabilities:**
- Search by: `request_id`, `user_id`, `batch_id`, `source_id`, `service`, `level`, `keyword`
- Time range filtering
- **Deep recursive search**: batch_id → user_ids → source_ids
- Extract error context (surrounding logs)

**Example Usage:**
```typescript
const result = await searchLogs(allLogs, {
  batchId: 'batch_20250117_A',
  recursive: true
});
// Returns logs + related identifiers for further investigation
```

### checkRecentChanges (`src/tools/checkRecentChanges.ts`)
**Purpose:** Correlate errors with deployments/config changes

**Capabilities:**
- Find changes within time window
- Correlate with errors within 2 minutes of change
- Generate analysis with suggestions
- Identify deployment/migration/config issues

**Example Usage:**
```typescript
const result = checkRecentChanges(changes, logs, {
  timeRangeStart: '14:30:00',
  timeRangeEnd: '14:35:00'
});
// Returns relevant changes + correlated errors
```

### createTicket (`src/tools/createTicket.ts`)
**Purpose:** Generate and persist support tickets

**Features:**
- Auto-generate tickets from error patterns
- Intelligent suggestions based on error type
- Category detection: errors, warnings, performance
- Persistence via TicketStorage

**Ticket Structure:**
```typescript
interface Ticket {
  id: string;                           // TKT-{timestamp}-{random}
  title: string;                        // Auto-generated
  description: string;                  // Pattern analysis
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'closed';
  affectedServices: string[];           // Extracted from logs
  relatedLogs: LogEntry[];              // Supporting evidence
  suggestions: string[];                // AI-generated recommendations
  comments: Comment[];                  // Developer discussion
  createdAt: string;                    // ISO timestamp
  updatedAt: string;                    // ISO timestamp
}
```

### alertTeam (`src/tools/alertTeam.ts`)
**Purpose:** Send alerts to team about critical issues

**Features:**
- Console-based alerting (demo mode)
- Formatted alerts with severity levels
- Slack/email formatting helpers (extensible)
- Color-coded severity levels

---

## File Organization

Each file stays under **250 lines** for maintainability:

```
src/
├── agent/
│   ├── index.ts          (160 lines) - Main agent loop
│   ├── memory.ts         (130 lines) - Memory management
│   └── types.ts          (80 lines)  - Type definitions
├── tools/
│   ├── searchLogs.ts     (130 lines) - Log search tool
│   ├── checkRecentChanges.ts (170 lines) - Change correlation
│   ├── createTicket.ts   (200 lines) - Ticket generation
│   ├── alertTeam.ts      (140 lines) - Alert formatting
│   └── index.ts          (120 lines) - Tool registry
├── services/
│   ├── aiService.ts      (130 lines) - LLM integration
│   ├── ticketService.ts  (140 lines) - Ticket CRUD
│   ├── logTriageService.ts (30 lines) - Entry point
│   └── logsAndChangesService.ts (20 lines) - Log loading
├── storage/
│   ├── tickets.ts        (190 lines) - JSON persistence
│   └── types.ts          (30 lines)  - Storage interfaces
├── utils/
│   ├── filter.ts         (140 lines) - Filtering engine
│   ├── logParser.ts      (200 lines) - Analysis utilities
│   └── general.ts        (20 lines)  - Misc helpers
├── web/
│   ├── app.ts            (240 lines) - Express server
│   └── public/
│       ├── index.html    (220 lines) - UI structure
│       ├── styles.css    (240 lines) - Styling
│       └── app.js        (230 lines) - Frontend logic
└── tests/
    ├── tools/
    │   ├── searchLogs.test.ts (120 lines)
    │   ├── checkRecentChanges.test.ts (140 lines)
    │   └── createTicket.test.ts (200 lines)
    └── agent/
        └── agent.test.ts (210 lines)
```

---

## Running the Project

### Development

```bash
# Install dependencies
npm install

# Run agent on log set
LOG_FILE_NUMBER=1 npm run dev      # Test different scenarios with 1-5

# Start web server
npm run server                      # Opens http://localhost:3000

# Run tests
npm test                            # Run all tests
npm run test:ui                     # Interactive test runner
```

### Log Sets (Increasing Difficulty)

1. **Set 1 (Healthy)** - No errors, agent should recognize system is healthy
2. **Set 2 (Warnings)** - Connection pool, deprecations, slow queries → 3 tickets
3. **Set 3 (Critical)** - Payment processor outage → 1 critical ticket + alert
4. **Set 4 (Deployment)** - Database issues after deployment → Correlate with change
5. **Set 5 (Deep Investigation)** - Zendesk token expiry → Multi-step recursive search

---

## API Endpoints

### Logs
- `GET /api/logs` - List available log sets (1-5)
- `GET /api/logs/:setNumber?page=1&service=x&level=ERROR` - Get logs with filtering

### Tickets
- `GET /api/tickets?status=open&severity=critical` - List tickets with filters
- `GET /api/tickets/:id` - Get single ticket
- `POST /api/tickets` - Create manual ticket
- `PATCH /api/tickets/:id` - Update ticket status
- `POST /api/tickets/:id/comments` - Add comment

### Triage
- `POST /api/triage/run` - Execute agent on log set
  - Body: `{ logSetNumber: 1-5 }`
  - Returns: `{ success, result, ticketsCreated, tickets }`

---

## Common Patterns

### Adding a New Tool

1. Create file in `src/tools/`
2. Export main function with typed inputs/outputs
3. Add to `toolDefinitions` array in `src/tools/index.ts`
4. Add Zod schema for validation
5. Add case in `executeTool()` switch statement
6. Write tests in `src/tests/tools/`

### Extending the Agent

The agent uses the Vercel AI SDK's tool-calling feature:

```typescript
// LLM returns tool calls like:
{
  toolName: 'searchLogs',
  arguments: { batchId: 'batch_001', recursive: true }
}

// Agent then executes and adds results to memory
memory.addToolResult(toolName, result);

// Next LLM call receives the context with results
```

### Storage & Persistence

All tickets are persisted to `data/tickets.json`:

```typescript
const storage = new TicketStorage();
await storage.initialize();
const ticket = await storage.createTicket({...});
const tickets = await storage.getTickets({ status: 'open' });
```

---

## Debugging

### Enable Verbose Logging
```typescript
// Agent automatically logs:
// - Iteration count
// - Tool calls
// - Results summary
// - Final investigation summary
```

### Test Specific Log Set
```bash
LOG_FILE_NUMBER=5 npm run dev  # Deep investigation scenario
```

### Run Single Test
```bash
npm test searchLogs.test.ts
npm test agent.test.ts
```

### Inspect Tickets Storage
```bash
cat data/tickets.json  # View all persisted tickets
```

---

## Key Constraints

### File Size Limit (250 lines max)
- Enforces modularity and testability
- If file exceeds limit, split into multiple files
- Use clear exports and imports

### Token Budget
- Agent loop has 10 iteration max
- Memory auto-compresses at 80% token usage
- Prevents excessive API costs

### Context Window
- Initial logs: Only last 5 provided to agent
- Full logs available via searchLogs tool
- Encourages tool-driven investigation

---

## Performance Notes

- **Recursive Search**: O(n) for each identifier type, but efficient for deep investigation
- **Storage**: JSON file operations are atomic (no corruption risk)
- **Filtering**: In-memory filtering is fast for typical log volumes
- **LLM Calls**: Rate limited with exponential backoff

---

## Future Enhancements

1. **Database Storage**: Replace JSON with SQLite/PostgreSQL
2. **Slack Integration**: Real alerts to Slack channels
3. **Webhook Support**: Custom integrations
4. **Graph Analysis**: Visualize service dependencies
5. **ML Anomaly Detection**: Unsupervised error pattern discovery
6. **Alert History**: Track resolved issues over time
7. **Multi-tenant**: Support multiple teams/services
8. **Custom Rules**: User-defined triage logic

---

## Support

For questions or issues:
1. Check test files for usage examples
2. Review type definitions for API contracts
3. Read plan file for architectural decisions
4. Check README.md for quick setup guide

---

## React Frontend (New!)

The application now includes a modern **React 19.2.0 + TypeScript 5.9** frontend that has completely replaced the vanilla JavaScript UI.

### Frontend Architecture

**Tech Stack:**
- **React 19.2.0** - Latest React with improved hooks and optimizations
- **React-DOM 19.2.0** - React rendering library
- **TypeScript 5.9.3** - Type-safe JavaScript with strict mode
- **Vite 7.3.1** - Lightning-fast build tool and dev server
- **Zustand 5.0.11** - UI state management
- **TanStack React Query 5.90.21** - Server state management and caching
- **CSS with custom properties** - Theming and dark mode support

### Frontend Directory Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Header.tsx          - Top navigation bar
│   │   │   ├── Sidebar.tsx         - Navigation sidebar with 5 views
│   │   │   └── Layout.tsx          - Main layout wrapper
│   │   ├── Chat/
│   │   │   ├── TriageView.tsx      - Main chat interface
│   │   │   ├── ChatWindow.tsx      - Message display
│   │   │   ├── ChatMessage.tsx     - Individual message component
│   │   │   ├── ChatInput.tsx       - Message input textarea
│   │   │   └── LogSourceSelector.tsx - Log set selection UI
│   │   ├── Views/
│   │   │   ├── DashboardView.tsx   - Metrics and activity
│   │   │   ├── LogsView.tsx        - Log search and filtering
│   │   │   ├── TicketsView.tsx     - Ticket management
│   │   │   └── SettingsView.tsx    - Provider/API key config
│   │   └── Common/
│   │       ├── ErrorBoundary.tsx   - Error handling component
│   │       └── LoadingSkeleton.tsx - Loading skeleton screens
│   ├── hooks/
│   │   ├── useChat.ts              - Chat state management with TanStack Query
│   │   └── useAPI.ts               - API data fetching hook
│   ├── store/
│   │   └── uiStore.ts              - Zustand store for UI state
│   ├── types/
│   │   └── index.ts                - TypeScript type definitions
│   ├── config/
│   │   └── api.ts                  - API endpoint configuration
│   ├── styles/
│   │   └── globals.css             - Global styles and CSS variables
│   ├── App.tsx                     - Root component
│   ├── main.tsx                    - Entry point
│   └── routes.tsx                  - View routing logic
├── public/
│   └── vite.svg                    - Favicon
├── vite.config.ts                  - Vite configuration with API proxy
├── tsconfig.json                   - TypeScript configuration
├── package.json                    - Dependencies and scripts
└── README.md                       - Frontend-specific documentation
```

### Development Workflow

**Start Development Server:**
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
# API calls proxied to http://localhost:3000
```

**Build for Production:**
```bash
npm run build
# Creates optimized dist/ folder (~79.8 kB gzipped)
```

**Run E2E Tests:**
```bash
npm run test
# Runs Playwright tests (30+ tests across all views)
```

### Components Overview

#### Layout Components
- **Header** - Top navigation with theme toggle
- **Sidebar** - Navigation with 5 view buttons, auto-collapse on mobile
- **Layout** - Main wrapper combining Header and Sidebar
- **ErrorBoundary** - Error handling with graceful fallback

#### Chat Components
- **TriageView** - Orchestrates entire chat flow
- **ChatWindow** - Displays messages with auto-scroll
- **ChatMessage** - Individual message with tool execution display
- **ChatInput** - Textarea with auto-grow, Enter to send
- **LogSourceSelector** - UI for selecting log sets 1-5

#### View Components
- **DashboardView** - Metrics cards with trends and activity feed
- **LogsView** - Log table with search and filtering
- **TicketsView** - Ticket list with detail panel
- **SettingsView** - AI provider and API key management

#### Utility Components
- **LoadingSkeleton** - 5 types: card, text, line, circle, metric

### State Management

**UI State (Zustand):**
```typescript
- currentView: Which view is active
- sidebarOpen: Is sidebar visible
- darkMode: Dark mode enabled
- aiProvider: Selected AI provider (gemini|claude|perplexity)
- aiModel: Selected model for current provider
```

**Server State (TanStack Query):**
- Chat session state with refetch every 30 seconds
- Message history and tool execution results
- Optimistic UI updates for user messages

**Component State (React Hooks):**
- Form input values
- Filter/search state
- Modal visibility
- Loading states

### Key Features

✅ **Navigation** - 5 views with sidebar (auto-collapses on mobile)
✅ **Chat Interface** - Interactive conversation with AI agent
✅ **Triage Mode** - Log analysis with tool execution
✅ **Dashboard** - Metrics cards and activity feed
✅ **Logs** - Search and filter by level and service
✅ **Tickets** - View and filter by status/severity
✅ **Settings** - Select AI provider, model, manage API keys
✅ **Dark Mode** - Toggle with localStorage persistence
✅ **Mobile** - Fully responsive, hamburger menu
✅ **Error Handling** - React error boundaries with fallback UI
✅ **Loading States** - Animated skeleton screens
✅ **Accessibility** - aria-labels, semantic HTML, WCAG compliant

### Bundle Size

| Asset | Size |
|-------|------|
| HTML | 0.46 kB |
| CSS | 5.54 kB |
| JavaScript | 73.78 kB |
| **Total (gzipped)** | **~79.8 kB** |

Well under 100 kB target! ✅

### API Integration

The React app communicates with the Express backend:

**Chat Endpoints:**
- `POST /api/chat/start` - Start conversation with log set
- `POST /api/chat/:sessionId/message` - Send message
- `GET /api/chat/:sessionId` - Get conversation state
- `DELETE /api/chat/:sessionId` - End conversation

**Data Endpoints:**
- `GET /api/logs` - List log sets
- `GET /api/logs/:setNumber` - Get logs by set
- `GET /api/tickets` - List tickets
- `POST /api/tickets` - Create ticket

### Testing

**Playwright E2E Tests:**
- 30+ tests across 6 test suites
- Layout and navigation
- All view functionality
- Mobile responsiveness
- Accessibility compliance
- Performance benchmarks

**Run Tests:**
```bash
npm run test
```

### Performance Notes

- Vite hot module reloading for instant dev feedback
- Code splitting automatic with Vite
- CSS variables enable instant theme switching
- TanStack Query caches API responses
- Zustand provides lightweight state (<4 kB)
- Production bundle ~79.8 kB (highly optimized)

### Development Tips

1. **Dark Mode**: Click moon icon in header or use Zustand directly
2. **Theme Colors**: Edit CSS variables in `styles/globals.css`
3. **Add View**: Create new view in `components/Views/` and add to routes
4. **Custom Hook**: Add to `hooks/` and export from there
5. **API Endpoints**: Centralized in `config/api.ts`

### Production Deployment

1. Build frontend: `npm run build` in frontend directory
2. Copy dist/ contents to Express public folder
3. Configure Express to serve dist/index.html
4. Update API proxy in production (if needed)
5. Deploy as usual

### Type Safety

Full TypeScript strict mode enabled:
- All components properly typed
- Props interfaces for all components
- Return type annotations
- No implicit any
- Strict null/undefined checks

### Migration from Vanilla JS

The React version maintains 100% feature parity with the original vanilla JavaScript frontend while adding:
- Type safety with TypeScript
- Reusable components
- Modern hooks-based patterns
- Better error handling
- Loading states
- Comprehensive tests
- Improved performance

All backend functionality (agent loop, tools, tickets, etc.) remains unchanged.

