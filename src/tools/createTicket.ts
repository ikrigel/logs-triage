import { Ticket, LogEntry } from '../agent/types.js';
import { TicketStorage } from '../storage/tickets.js';

export interface CreateTicketInput {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedServices: string[];
  relatedLogIndices?: number[];
  suggestions?: string[];
  relatedLogs?: LogEntry[];
}

export async function createTicket(
  storage: TicketStorage,
  input: CreateTicketInput
): Promise<Ticket> {
  const ticket = await storage.createTicket({
    title: input.title,
    description: input.description,
    severity: input.severity,
    affectedServices: input.affectedServices,
    relatedLogs: input.relatedLogs || [],
    suggestions: input.suggestions || [],
    status: 'open',
    comments: [],
  });

  return ticket;
}

export function generateTicketFromLogs(
  logs: LogEntry[],
  category: 'errors' | 'warnings' | 'performance'
): CreateTicketInput | null {
  if (logs.length === 0) return null;

  const services = [...new Set(logs.map((l) => l.service))];

  switch (category) {
    case 'errors':
      return {
        title: `Critical Errors Detected in ${services.join(', ')}`,
        description: generateErrorDescription(logs),
        severity: 'critical',
        affectedServices: services,
        relatedLogs: logs,
        suggestions: generateErrorSuggestions(logs),
      };

    case 'warnings':
      return {
        title: `Warnings in ${services.join(', ')}`,
        description: generateWarningDescription(logs),
        severity: 'medium',
        affectedServices: services,
        relatedLogs: logs,
        suggestions: generateWarningSuggestions(logs),
      };

    case 'performance':
      return {
        title: `Performance Issues Detected`,
        description: generatePerformanceDescription(logs),
        severity: 'high',
        affectedServices: services,
        relatedLogs: logs,
        suggestions: generatePerformanceSuggestions(logs),
      };

    default:
      return null;
  }
}

function generateErrorDescription(logs: LogEntry[]): string {
  const errorCounts = new Map<string, number>();

  logs.forEach((log) => {
    const key = log.msg;
    errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
  });

  let description = 'Critical errors have been detected in the system:\n\n';
  errorCounts.forEach((count, message) => {
    description += `- ${message} (${count} occurrence${count > 1 ? 's' : ''})\n`;
  });

  return description;
}

function generateErrorSuggestions(logs: LogEntry[]): string[] {
  const suggestions: string[] = [];

  const hasConnectionErrors = logs.some((l) =>
    l.msg.toLowerCase().includes('connection')
  );

  if (hasConnectionErrors) {
    suggestions.push('Check database/service connectivity and firewall rules.');
    suggestions.push('Verify credentials and authentication tokens are valid.');
  }

  const hasTimeoutErrors = logs.some((l) =>
    l.msg.toLowerCase().includes('timeout')
  );

  if (hasTimeoutErrors) {
    suggestions.push('Increase timeout thresholds if legitimate operations are timing out.');
    suggestions.push('Check for resource constraints (CPU, memory, disk).');
  }

  const hasAuthErrors = logs.some((l) =>
    l.msg.toLowerCase().includes('token') || l.msg.toLowerCase().includes('auth')
  );

  if (hasAuthErrors) {
    suggestions.push('Verify and refresh authentication tokens/credentials.');
    suggestions.push('Check token expiration policies and renewal mechanisms.');
  }

  return suggestions.length > 0
    ? suggestions
    : ['Investigate root cause in application logs.',
        'Contact the affected service team for more information.'];
}

function generateWarningDescription(logs: LogEntry[]): string {
  const patterns = new Map<string, number>();

  logs.forEach((log) => {
    const key = log.msg;
    patterns.set(key, (patterns.get(key) || 0) + 1);
  });

  let description = 'Multiple warnings detected:\n\n';
  Array.from(patterns.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([message, count]) => {
      description += `- ${message} (${count}x)\n`;
    });

  return description;
}

function generateWarningSuggestions(logs: LogEntry[]): string[] {
  const suggestions: string[] = [];

  if (logs.some((l) => l.msg.toLowerCase().includes('deprecated'))) {
    suggestions.push('Update code to use non-deprecated APIs.');
    suggestions.push('Plan migration away from deprecated endpoints.');
  }

  if (logs.some((l) => l.msg.toLowerCase().includes('pool'))) {
    suggestions.push('Monitor connection pool utilization.');
    suggestions.push('Consider increasing pool size or optimizing queries.');
  }

  if (logs.some((l) => l.msg.toLowerCase().includes('slow'))) {
    suggestions.push('Identify and optimize slow queries.');
    suggestions.push('Add database indexes if needed.');
  }

  return suggestions.length > 0 ? suggestions : ['Monitor this warning trend.'];
}

function generatePerformanceDescription(logs: LogEntry[]): string {
  return `Performance issues detected affecting ${logs.length} log entries. Services affected: ${[...new Set(logs.map((l) => l.service))].join(', ')}`;
}

function generatePerformanceSuggestions(logs: LogEntry[]): string[] {
  return [
    'Profile the affected services to identify bottlenecks.',
    'Review recent deployments or config changes.',
    'Check system resource utilization (CPU, memory, disk I/O).',
    'Analyze query performance and consider adding indexes.',
  ];
}
