import { z } from 'zod';
import { searchLogs, SearchLogsInput } from './searchLogs';
import { checkRecentChanges, CheckChangesInput } from './checkRecentChanges';
import { createTicket, CreateTicketInput } from './createTicket';
import { alertTeam, AlertInput } from './alertTeam';
import { LogEntry, RecentChanges } from '../agent/types';
import { TicketStorage } from '../storage/tickets';

// Zod schemas for tool inputs
const SearchLogsSchema = z.object({
  requestId: z.string().optional(),
  userId: z.string().optional(),
  batchId: z.string().optional(),
  sourceId: z.string().optional(),
  service: z.string().optional(),
  level: z.enum(['ERROR', 'WARN', 'INFO', 'DEBUG']).optional(),
  keyword: z.string().optional(),
  timeRangeStart: z.string().optional(),
  timeRangeEnd: z.string().optional(),
  recursive: z.boolean().optional().default(false),
});

const CheckChangesSchema = z.object({
  timeRangeStart: z.string().optional(),
  timeRangeEnd: z.string().optional(),
  keyword: z.string().optional(),
  changeType: z.string().optional(),
});

const CreateTicketSchema = z.object({
  title: z.string(),
  description: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  affectedServices: z.array(z.string()),
  suggestions: z.array(z.string()).optional(),
});

const AlertTeamSchema = z.object({
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  affectedServices: z.array(z.string()),
  issueSummary: z.string(),
});

// Tool definitions for LLM
export const toolDefinitions = [
  {
    name: 'searchLogs',
    description:
      'Search through logs by various criteria (request ID, user ID, batch ID, source ID, service name, etc.). Can perform deep recursive searches to find related logs.',
    inputSchema: SearchLogsSchema,
  },
  {
    name: 'checkRecentChanges',
    description:
      'Check for recent system changes (deployments, config changes, migrations) and correlate them with errors in logs.',
    inputSchema: CheckChangesSchema,
  },
  {
    name: 'createTicket',
    description:
      'Create a support ticket to track an issue. Include title, description, severity level, and affected services.',
    inputSchema: CreateTicketSchema,
  },
  {
    name: 'alertTeam',
    description:
      'Send an alert to the team about a critical issue. Specify severity, affected services, and issue summary.',
    inputSchema: AlertTeamSchema,
  },
];

// Tool execution wrapper
export async function executeTool(
  toolName: string,
  args: Record<string, any>,
  context: {
    allLogs: LogEntry[];
    recentChanges: RecentChanges[];
    storage: TicketStorage;
  }
): Promise<any> {
  switch (toolName) {
    case 'searchLogs': {
      const validated = SearchLogsSchema.parse(args);
      const result = await searchLogs(context.allLogs, validated);
      return {
        logsFound: result.logs.length,
        logs: result.logs,
        relatedIdentifiers: Array.from(result.relatedIdentifiers),
      };
    }

    case 'checkRecentChanges': {
      const validated = CheckChangesSchema.parse(args);
      const result = checkRecentChanges(context.recentChanges, context.allLogs, validated);
      return {
        relevantChanges: result.relevantChanges,
        correlatedErrors: result.correlatedErrors,
        analysis: result.analysis,
      };
    }

    case 'createTicket': {
      const validated = CreateTicketSchema.parse(args);
      const ticket = await createTicket(context.storage, {
        ...validated,
        relatedLogs: context.allLogs.slice(-10),
      });
      return {
        success: true,
        ticketId: ticket.id,
        ticket,
      };
    }

    case 'alertTeam': {
      const validated = AlertTeamSchema.parse(args);
      const result = alertTeam(validated);
      return {
        success: result.success,
        message: result.message,
      };
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

export { searchLogs, checkRecentChanges, createTicket, alertTeam };
