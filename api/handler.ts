import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { loadLogs, loadRecentChanges } from '../src/services/logsAndChangesService';
import { TicketStorage } from '../src/storage/tickets';
import { TicketService } from '../src/services/ticketService';
import { LogTriageAgent } from '../src/agent';
import { filterLogs, filterTickets } from '../src/utils/filter';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const ticketStorage = new TicketStorage();
let agentRunning = false;

// Initialize storage
ticketStorage.initialize().catch(console.error);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/logs', async (req, res) => {
  try {
    const sets = Array.from({ length: 5 }, (_, i) => i + 1);
    res.json({ availableSets: sets });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list log sets' });
  }
});

app.get('/api/logs/:setNumber', async (req, res) => {
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
        services: Array.isArray(filters.service) ? filters.service : [filters.service],
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

app.post('/api/triage/run', async (req, res) => {
  try {
    if (agentRunning) {
      return res.status(429).json({ error: 'Triage already running' });
    }

    const { logSetNumber } = req.body;

    if (!logSetNumber || logSetNumber < 1 || logSetNumber > 5) {
      return res.status(400).json({ error: 'Invalid log set number' });
    }

    agentRunning = true;

    const allLogs = await loadLogs(logSetNumber);
    const changes = await loadRecentChanges(logSetNumber);
    const lastFive = allLogs.slice(-5);

    const agent = new LogTriageAgent(logSetNumber, lastFive, allLogs, changes, ticketStorage);

    const result = await agent.run();
    const tickets = await ticketStorage.getTickets();

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

app.get('/api/tickets', async (req, res) => {
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

    const tickets = await ticketStorage.getTickets(ticketFilters);
    const allTickets = await ticketStorage.getTickets();

    const stats = {
      total: allTickets.length,
      open: allTickets.filter((t) => t.status === 'open').length,
      inProgress: allTickets.filter((t) => t.status === 'in-progress').length,
      closed: allTickets.filter((t) => t.status === 'closed').length,
      critical: allTickets.filter((t) => t.severity === 'critical').length,
      high: allTickets.filter((t) => t.severity === 'high').length,
    };

    res.json({ tickets, stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

app.get('/api/tickets/:id', async (req, res) => {
  try {
    const ticket = await ticketStorage.getTicket(req.params.id);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

app.post('/api/tickets', async (req, res) => {
  try {
    const { title, description, severity, affectedServices, suggestions } = req.body;

    if (!title || !description || !severity || !affectedServices) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const ticket = await ticketStorage.createTicket({
      title,
      description,
      severity,
      affectedServices,
      suggestions: suggestions || [],
      relatedLogs: [],
      status: 'open',
      comments: [],
    });

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

app.patch('/api/tickets/:id', async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status required' });
    }

    const ticket = await ticketStorage.updateTicket(req.params.id, { status });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

app.post('/api/tickets/:id/comments', async (req, res) => {
  try {
    const { author, text } = req.body;

    if (!author || !text) {
      return res.status(400).json({ error: 'Author and text required' });
    }

    const ticket = await ticketStorage.getTicket(req.params.id);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const comment = {
      id: `CMT-${Date.now()}`,
      author,
      text,
      createdAt: new Date().toISOString(),
    };

    ticket.comments.push(comment);
    const updated = await ticketStorage.updateTicket(req.params.id, { comments: ticket.comments });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

export default app;
