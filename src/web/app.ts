import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { loadLogs, loadRecentChanges } from '../services/logsAndChangesService.js';
import { TicketStorage } from '../storage/tickets.js';
import { TicketService } from '../services/ticketService.js';
import { LogTriageAgent } from '../agent/index.js';
import { filterLogs, filterTickets } from '../utils/filter.js';
import { AIService, AIProvider } from '../services/aiService.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app: Express = express();
const port = process.env.PORT || 3000;

// Configure Helmet with relaxed CSP to allow inline scripts and event handlers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      imgSrc: ["'self'", "data:"],
      fontSrc: ["'self'", "https:", "data:"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
    },
  },
}));
app.use(cors());
app.use(express.json());

const ticketStorage = new TicketStorage();
const ticketService = new TicketService(ticketStorage);

let agentRunning = false;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/logs', async (req: Request, res: Response) => {
  try {
    const sets = Array.from({ length: 5 }, (_, i) => i + 1);
    res.json({ availableSets: sets });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list log sets' });
  }
});

app.get('/api/logs/:setNumber', async (req: Request, res: Response) => {
  try {
    const setNumber = parseInt(req.params.setNumber, 10);

    if (setNumber < 1 || setNumber > 5) {
      return res.status(400).json({ error: 'Log set must be between 1 and 5' });
    }

    const logs = await loadLogs(setNumber);
    const changes = await loadRecentChanges(setNumber);

    const filters = req.query as any;
    let filteredLogs = logs;

    if (filters.service) {
      filteredLogs = filterLogs(filteredLogs, {
        services: Array.isArray(filters.service)
          ? filters.service
          : [filters.service],
      });
    }

    if (filters.level) {
      filteredLogs = filterLogs(filteredLogs, {
        levels: Array.isArray(filters.level) ? filters.level : [filters.level],
      });
    }

    if (filters.keyword) {
      filteredLogs = filterLogs(filteredLogs, { keyword: filters.keyword });
    }

    const page = parseInt(filters.page || '1', 10);
    const pageSize = parseInt(filters.pageSize || '50', 10);
    const start = (page - 1) * pageSize;
    const paginatedLogs = filteredLogs.slice(start, start + pageSize);

    res.json({
      setNumber,
      total: logs.length,
      filtered: filteredLogs.length,
      page,
      pageSize,
      logs: paginatedLogs,
      changes,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to load logs: ${msg}` });
  }
});

app.post('/api/triage/run', async (req: Request, res: Response) => {
  try {
    if (agentRunning) {
      return res.status(429).json({ error: 'Triage already running' });
    }

    const { logSetNumber, provider, model, apiKey } = req.body;

    if (!logSetNumber || logSetNumber < 1 || logSetNumber > 5) {
      return res.status(400).json({ error: 'Invalid log set number' });
    }

    agentRunning = true;

    const allLogs = await loadLogs(logSetNumber);
    const changes = await loadRecentChanges(logSetNumber);
    const lastFive = allLogs.slice(-5);

    await ticketStorage.initialize();

    // Create AIService with provided configuration if available
    let customAIService: AIService | undefined;
    if (provider && apiKey) {
      customAIService = new AIService({
        provider: provider as AIProvider,
        model: model || undefined,
        apiKey: apiKey,
      });
    }

    const agent = new LogTriageAgent(logSetNumber, lastFive, allLogs, changes, ticketStorage, customAIService);

    const result = await agent.run();
    const tickets = await ticketService.getAll();

    res.json({
      success: true,
      result,
      ticketsCreated: tickets.length,
      tickets,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Triage failed: ${msg}` });
  } finally {
    agentRunning = false;
  }
});

app.get('/api/tickets', async (req: Request, res: Response) => {
  try {
    const filters = req.query as any;

    const ticketFilters: any = {};
    if (filters.status) {
      ticketFilters.status = filters.status;
    }
    if (filters.severity) {
      ticketFilters.severity = filters.severity;
    }
    if (filters.service) {
      ticketFilters.service = filters.service;
    }
    if (filters.keyword) {
      ticketFilters.keyword = filters.keyword;
    }

    const tickets = await ticketService.getAll(ticketFilters);
    const stats = await ticketService.getTicketStats();

    res.json({ tickets, stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

app.get('/api/tickets/:id', async (req: Request, res: Response) => {
  try {
    const ticket = await ticketService.getById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

app.post('/api/tickets', async (req: Request, res: Response) => {
  try {
    const { title, description, severity, affectedServices, suggestions } = req.body;

    if (!title || !description || !severity || !affectedServices) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const ticket = await ticketService.create(
      title,
      description,
      severity,
      affectedServices,
      suggestions || []
    );

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

app.patch('/api/tickets/:id', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status required' });
    }

    const ticket = await ticketService.updateStatus(req.params.id, status);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

app.post('/api/tickets/:id/comments', async (req: Request, res: Response) => {
  try {
    const { author, text } = req.body;

    if (!author || !text) {
      return res.status(400).json({ error: 'Author and text required' });
    }

    const ticket = await ticketService.addComment(req.params.id, author, text);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

app.get('/api/tickets/:id/close', async (req: Request, res: Response) => {
  try {
    const ticket = await ticketService.closeTicket(req.params.id);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ error: 'Failed to close ticket' });
  }
});

app.get('/api/settings', (req: Request, res: Response) => {
  try {
    // API keys are provided by users through the Settings UI (localStorage)
    // All providers are available for configuration; actual availability checked at runtime
    res.json({
      currentProvider: 'gemini',
      availableProviders: {
        gemini: { name: 'Gemini 2.0 Flash', available: true },
        perplexity: { name: 'Perplexity Sonar', available: true },
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

app.post('/api/settings/provider', (req: Request, res: Response) => {
  try {
    const { provider } = req.body;

    if (!provider || !['gemini', 'perplexity'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    // Set environment variable for this session
    process.env.AI_PROVIDER = provider;

    res.json({
      success: true,
      message: `Switched to ${provider}`,
      currentProvider: provider,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Open http://localhost:${port} in your browser`);
});

export default app;
