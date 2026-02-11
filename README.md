# Production Logs Triage Agent

An intelligent AI-powered system that automatically investigates production logs, identifies issues, correlates them with system changes, and creates actionable support tickets with developer suggestions.

> **Deployment Ready** ✅ All Vercel configuration complete - users provide API keys through Settings UI

## Features

### Autonomous Investigation Mode
✨ **AI-Powered Investigation** - Autonomous agent uses Gemini/Claude/Perplexity to analyze logs
🔍 **Deep Recursive Search** - Find related logs across batch IDs, user IDs, and source IDs
🔗 **Change Correlation** - Link errors to deployments and configuration changes
🎫 **Ticket Generation** - Auto-create support tickets with intelligent suggestions

### Interactive Conversational Mode ✨ NEW
💬 **Multi-turn Chat** - Have back-and-forth conversations with the AI agent
🛠️ **Dynamic Tool Usage** - Agent uses tools (search, create tickets, alerts) during conversation
📝 **Persistent Sessions** - Conversation state preserved across multiple turns
👁️ **Tool Visibility** - See exactly what the agent is doing in real-time

### Platform Features
💾 **Local Storage** - JSON-based persistent ticket management
📊 **Web Dashboard** - Modern UI with dark mode support
⚡ **RESTful API** - Full-featured API for programmatic access
🔐 **Multi-Provider** - Support for Gemini, Claude, and Perplexity APIs

## Quick Start

### Prerequisites
- Node.js 18+
- Gemini API key (free from https://aistudio.google.com/app/apikey)

### Setup

```bash
# Clone and install
git clone <repo>
cd logs-triage
npm install

# Configure API key
# Either set environment variable:
export GOOGLE_GENERATIVE_AI_API_KEY=your_key_here

# Or create .env file:
echo "GOOGLE_GENERATIVE_AI_API_KEY=your_key_here" > .env
```

### Run the Agent

```bash
# Test specific log set (1-5)
LOG_FILE_NUMBER=1 npm run dev

# Run web server
npm run server
# Open http://localhost:3000

# Run tests
npm test
```

## Two Modes of Operation

### 1. **Run Auto Triage** (Autonomous Mode)
Automated investigation without user interaction:
- Click **"Run Auto Triage"** button
- Agent investigates logs 1-10 iterations automatically
- Creates tickets and alerts based on findings
- Perfect for: Quick automated analysis, batch processing

**Use Cases:**
- Initial log scan to identify issues
- Overnight automated triage
- Integration with monitoring systems

### 2. **Start Conversation** (Interactive Mode) ✨ NEW
Have a dialogue with the AI agent:
- Click **"Start Conversation"** button
- Type questions: *"What errors are in the logs?"*, *"Search for connection issues"*
- Agent responds conversationally and uses tools as needed
- Ask follow-up questions to steer investigation
- Perfect for: Guided investigation, learning, deep debugging

**Conversation Features:**
- **Multi-turn Context** - Agent remembers previous messages
- **Tool Visibility** - See what tools are being executed
- **Natural Language** - Ask questions in plain English
- **Persistent Sessions** - Conversation state saved across turns
- **Dynamic Tool Usage** - Agent decides when to search/create tickets

**Example Conversation:**
```
You: "What's happening in these logs?"
Agent: [Analyzes logs] "I see warnings about connection pool exhaustion..."

You: "Search for related errors"
Agent: [Uses search_logs tool] "Found 12 matching entries..."

You: "Should we create a ticket?"
Agent: [Uses create_ticket tool] "✅ Created ticket TKT-1234-abc..."
```

## Log Scenarios (1-5)

1. **Healthy System** - All green logs, agent confirms no issues
2. **Warning Pollution** - Multiple deprecations and slow queries → 3 tickets
3. **Critical Outage** - Payment processor failure → Alert + 1 critical ticket
4. **Deployment Issue** - Database pool exhaustion after deploy → Correlate change
5. **Deep Investigation** - Zendesk token expiry → Recursive search needed

## Architecture

### Autonomous Agent Loop (LogTriageAgent)
```
  1. Receive last 5 logs + full log history
  2. Call LLM with available tools
  3. Execute returned tool calls
  4. Add results to memory
  5. Repeat until complete (max 10 iterations)
  6. Generate investigation summary
```

### Conversational Agent Loop (ConversationalAgent) ✨ NEW
```
  1. User sends message
  2. Add message to session memory
  3. Call LLM with current memory
  4. Execute any tool calls returned
  5. Add response to memory
  6. Return to user
  7. Wait for next message (session persists)
```

### Available Tools (Both Modes)
```
  • searchLogs - Deep recursive log search across IDs
  • checkRecentChanges - Correlate errors with deployments
  • createTicket - Generate support tickets with suggestions
  • alertTeam - Send alerts about critical issues
```

### Storage Layer
```
  • Sessions (conversational mode)
    - In-memory Map-based storage
    - Auto-cleanup after 1 hour inactivity
    - Serialized conversation memory

  • Tickets (both modes)
    - JSON-based local persistence
    - Atomic writes, safe concurrent access
    - Automatic backup on changes
```

### Frontend Components
```
  • Dashboard - Stats and recent activity
  • Log Viewer - Browse logs with filtering
  • Ticket Management - CRUD operations
  • Triage Panel - Both autonomous and conversational modes
  • Settings - API key configuration
```

## Project Structure

```
src/
├── agent/                 # AI agent core
│   ├── index.ts          # Main agent loop
│   ├── memory.ts         # Conversation memory
│   └── types.ts          # Type definitions
├── tools/                # Investigation tools
│   ├── searchLogs.ts     # Log search (recursive)
│   ├── checkRecentChanges.ts # Change correlation
│   ├── createTicket.ts   # Ticket generation
│   ├── alertTeam.ts      # Team alerts
│   └── index.ts          # Tool registry
├── services/            # Business logic
│   ├── aiService.ts      # LLM integration
│   ├── ticketService.ts  # Ticket CRUD
│   └── logTriageService.ts # Entry point
├── storage/            # Persistence
│   ├── tickets.ts       # JSON storage
│   └── types.ts         # Storage types
├── utils/              # Utilities
│   ├── filter.ts        # Filtering engine
│   └── logParser.ts     # Log analysis
├── web/                # Web application
│   ├── app.ts           # Express server
│   └── public/          # Frontend
│       ├── index.html
│       ├── styles.css
│       └── app.js
└── tests/             # Test suite
    ├── tools/
    └── agent/
```

## API Endpoints

### Logs
```
GET /api/logs
GET /api/logs/:setNumber?page=1&service=x&level=ERROR&keyword=test
```

### Tickets
```
GET    /api/tickets?status=open&severity=critical
GET    /api/tickets/:id
POST   /api/tickets
PATCH  /api/tickets/:id
POST   /api/tickets/:id/comments
GET    /api/tickets/:id/close
```

### Triage
```
POST /api/triage/run
Body: { logSetNumber: 1-5 }
```

## Development

### Running Tests
```bash
npm test              # Run all tests
npm run test:ui       # Interactive mode
```

### Code Quality
- All files under 250 lines (enforces modularity)
- TypeScript for type safety
- Comprehensive test coverage
- ESLint configured

### Key Files

- **CLAUDE.md** - Detailed architecture & developer guide
- **Plan File** - Design decisions & rationale
- **vitest.config.ts** - Test configuration

## Configuration

### Environment Variables
```
GOOGLE_GENERATIVE_AI_API_KEY   # Gemini API key (required)
PORT                            # Server port (default: 3000)
LOG_FILE_NUMBER                 # Log set to test (1-5)
```

### Customization

**Change agent max iterations:**
```typescript
// In src/agent/index.ts
private maxIterations = 10;  // Adjust as needed
```

**Change storage location:**
```typescript
// In src/services/logTriageService.ts
const storage = new TicketStorage({
  filePath: '/custom/path/tickets.json'
});
```

## Troubleshooting

### API Key Not Found
```bash
# Ensure .env file exists with:
GOOGLE_GENERATIVE_AI_API_KEY=your_actual_key

# Or set environment variable:
export GOOGLE_GENERATIVE_AI_API_KEY=your_actual_key
```

### Port Already in Use
```bash
PORT=3001 npm run server
```

### Tests Failing
```bash
# Ensure dependencies installed
npm install

# Clear test cache
npm test -- --clearCache
```

### No Tickets Created
- Check agent output for errors
- Verify logs contain ERROR or WARN level entries
- Check `data/tickets.json` exists and is readable

## Performance

- **Log Search**: O(n) but fast for typical volumes
- **Recursive Search**: Efficient identifier traversal
- **LLM Calls**: Rate limited with exponential backoff
- **Storage**: Atomic writes prevent corruption
- **Memory**: Auto-compresses at 80% token usage

## Future Enhancements

- [ ] Database storage (SQLite/PostgreSQL)
- [ ] Slack/PagerDuty integration
- [ ] Custom triage rules
- [ ] Service dependency graphs
- [ ] ML anomaly detection
- [ ] Multi-tenant support
- [ ] Webhook notifications
- [ ] Historical trend analysis

## Contributing

1. Keep files under 250 lines
2. Write tests for new features
3. Follow TypeScript best practices
4. Update CLAUDE.md for architecture changes
5. Run `npm test` before committing

## License

MIT

## Resources

- [AI SDK Docs](https://sdk.vercel.ai/docs)
- [Gemini API](https://ai.google.dev/gemini-api/docs/quickstart)
- [Vercel AI SDK Tools](https://sdk.vercel.ai/docs/reference/ai-sdk-core/tool)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**📚 For detailed development guide, see [CLAUDE.md](CLAUDE.md)**