# Production Logs Triage Agent

An intelligent AI-powered system that automatically investigates production logs, identifies issues, correlates them with system changes, and creates actionable support tickets with developer suggestions.

## Features

✨ **AI-Powered Investigation** - Autonomous agent uses Gemini API to analyze logs
🔍 **Deep Recursive Search** - Find related logs across batch IDs, user IDs, and source IDs
🔗 **Change Correlation** - Link errors to deployments and configuration changes
🎫 **Ticket Generation** - Auto-create support tickets with intelligent suggestions
💾 **Local Storage** - JSON-based persistent ticket management
📊 **Web Dashboard** - Modern UI for visualization and management
⚡ **RESTful API** - Full-featured API for programmatic access

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

## Log Scenarios (1-5)

1. **Healthy System** - All green logs, agent confirms no issues
2. **Warning Pollution** - Multiple deprecations and slow queries → 3 tickets
3. **Critical Outage** - Payment processor failure → Alert + 1 critical ticket
4. **Deployment Issue** - Database pool exhaustion after deploy → Correlate change
5. **Deep Investigation** - Zendesk token expiry → Recursive search needed

## Architecture

```
Agent Loop:
  1. Receive last 5 logs + full log history
  2. Call Gemini API with available tools
  3. Execute returned tool calls
  4. Add results to memory
  5. Repeat until complete (max 10 iterations)

Tools:
  • searchLogs - Deep recursive log search
  • checkRecentChanges - Correlate with deployments
  • createTicket - Generate support tickets
  • alertTeam - Send critical alerts

Storage:
  • JSON-based local persistence
  • Atomic writes, safe concurrent access
  • Automatic backup on changes

Frontend:
  • Dashboard with stats
  • Log viewer with filtering
  • Ticket management
  • Triage execution panel
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