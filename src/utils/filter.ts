import { LogEntry, Ticket } from '../agent/types';

export interface LogFilterOptions {
  services?: string[];
  levels?: LogEntry['level'][];
  keyword?: string;
  timeStart?: string;
  timeEnd?: string;
  hasField?: string;
  fieldValue?: { field: string; value: any };
}

export interface TicketFilterOptions {
  statuses?: Ticket['status'][];
  severities?: Ticket['severity'][];
  service?: string;
  keyword?: string;
  dateAfter?: string;
  dateBefore?: string;
}

export function filterLogs(logs: LogEntry[], options: LogFilterOptions): LogEntry[] {
  return logs.filter((log) => {
    if (options.services && options.services.length > 0) {
      if (!options.services.includes(log.service)) return false;
    }

    if (options.levels && options.levels.length > 0) {
      if (!options.levels.includes(log.level)) return false;
    }

    if (options.keyword) {
      const keywordLower = options.keyword.toLowerCase();
      if (!log.msg.toLowerCase().includes(keywordLower)) return false;
    }

    if (options.timeStart && log.time < options.timeStart) return false;
    if (options.timeEnd && log.time > options.timeEnd) return false;

    if (options.hasField) {
      if (!(options.hasField in log)) return false;
    }

    if (options.fieldValue) {
      const fieldValue = (log as any)[options.fieldValue.field];
      if (fieldValue !== options.fieldValue.value) return false;
    }

    return true;
  });
}

export function filterTickets(tickets: Ticket[], options: TicketFilterOptions): Ticket[] {
  return tickets.filter((ticket) => {
    if (options.statuses && options.statuses.length > 0) {
      if (!options.statuses.includes(ticket.status)) return false;
    }

    if (options.severities && options.severities.length > 0) {
      if (!options.severities.includes(ticket.severity)) return false;
    }

    if (options.service) {
      if (!ticket.affectedServices.some((s) => s.includes(options.service!))) {
        return false;
      }
    }

    if (options.keyword) {
      const keywordLower = options.keyword.toLowerCase();
      const matches =
        ticket.title.toLowerCase().includes(keywordLower) ||
        ticket.description.toLowerCase().includes(keywordLower);
      if (!matches) return false;
    }

    if (options.dateAfter && ticket.createdAt < options.dateAfter) return false;
    if (options.dateBefore && ticket.createdAt > options.dateBefore) return false;

    return true;
  });
}

export function getUniqueServices(logs: LogEntry[]): string[] {
  return Array.from(new Set(logs.map((log) => log.service))).sort();
}

export function getErrorLogsOnly(logs: LogEntry[]): LogEntry[] {
  return logs.filter((log) => log.level === 'ERROR');
}

export function getWarningLogsOnly(logs: LogEntry[]): LogEntry[] {
  return logs.filter((log) => log.level === 'WARN');
}

export function groupLogsByService(logs: LogEntry[]): Map<string, LogEntry[]> {
  const groups = new Map<string, LogEntry[]>();

  logs.forEach((log) => {
    if (!groups.has(log.service)) {
      groups.set(log.service, []);
    }
    groups.get(log.service)!.push(log);
  });

  return groups;
}

export function groupLogsByLevel(logs: LogEntry[]): Map<LogEntry['level'], LogEntry[]> {
  const groups = new Map<LogEntry['level'], LogEntry[]>();

  logs.forEach((log) => {
    if (!groups.has(log.level)) {
      groups.set(log.level, []);
    }
    groups.get(log.level)!.push(log);
  });

  return groups;
}
