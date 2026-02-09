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
