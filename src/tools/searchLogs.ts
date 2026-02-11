import { LogEntry } from '../agent/types.js';

export interface SearchLogsInput {
  requestId?: string;
  userId?: string;
  batchId?: string;
  sourceId?: string;
  service?: string;
  level?: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  keyword?: string;
  timeRangeStart?: string;
  timeRangeEnd?: string;
  recursive?: boolean;
}

export async function searchLogs(
  allLogs: LogEntry[],
  input: SearchLogsInput
): Promise<{ logs: LogEntry[]; relatedIdentifiers: Set<string> }> {
  const relatedIdentifiers = new Set<string>();
  let results: LogEntry[] = [];

  // First pass: direct field matching
  results = allLogs.filter((log) => {
    let match = true;

    if (input.requestId && log.request_id !== input.requestId) match = false;
    if (input.userId && log.user_id !== input.userId) match = false;
    if (input.batchId && log.batch_id !== input.batchId) match = false;
    if (input.sourceId && log.source_id !== input.sourceId) match = false;
    if (input.service && log.service !== input.service) match = false;
    if (input.level && log.level !== input.level) match = false;

    if (input.keyword) {
      const keywordLower = input.keyword.toLowerCase();
      if (!log.msg.toLowerCase().includes(keywordLower)) match = false;
    }

    if (input.timeRangeStart && log.time < input.timeRangeStart) match = false;
    if (input.timeRangeEnd && log.time > input.timeRangeEnd) match = false;

    return match;
  });

  // Collect related identifiers for recursive search
  results.forEach((log) => {
    if (log.request_id) relatedIdentifiers.add(`req:${log.request_id}`);
    if (log.user_id) relatedIdentifiers.add(`usr:${log.user_id}`);
    if (log.batch_id) relatedIdentifiers.add(`bat:${log.batch_id}`);
    if (log.source_id) relatedIdentifiers.add(`src:${log.source_id}`);
  });

  // Deep recursive search if requested
  if (input.recursive && input.batchId) {
    const recursiveResults = performDeepRecursiveSearch(allLogs, input.batchId);
    relatedIdentifiers.forEach((id) => recursiveResults.relatedIds.add(id));
    return {
      logs: [...results, ...recursiveResults.logs],
      relatedIdentifiers: recursiveResults.relatedIds,
    };
  }

  return { logs: results, relatedIdentifiers };
}

function performDeepRecursiveSearch(
  allLogs: LogEntry[],
  batchId: string
): { logs: LogEntry[]; relatedIds: Set<string> } {
  const allResults: LogEntry[] = [];
  const relatedIds = new Set<string>();

  // Step 1: Find all logs with this batch_id
  const batchLogs = allLogs.filter((log) => log.batch_id === batchId);
  allResults.push(...batchLogs);

  // Step 2: Extract all user_ids from batch results
  const userIds = new Set<string>();
  batchLogs.forEach((log) => {
    if (log.user_id) {
      userIds.add(log.user_id);
      relatedIds.add(`usr:${log.user_id}`);
    }
  });

  // Step 3: Search by each user_id
  userIds.forEach((userId) => {
    const userLogs = allLogs.filter((log) => log.user_id === userId);
    allResults.push(...userLogs);
  });

  // Step 4: Extract all source_ids and search those
  const sourceIds = new Set<string>();
  allResults.forEach((log) => {
    if (log.source_id) {
      sourceIds.add(log.source_id);
      relatedIds.add(`src:${log.source_id}`);
    }
  });

  sourceIds.forEach((sourceId) => {
    const sourceLogs = allLogs.filter((log) => log.source_id === sourceId);
    allResults.push(...sourceLogs);
  });

  // Remove duplicates
  const uniqueResults = Array.from(
    new Map(allResults.map((log) => [JSON.stringify(log), log])).values()
  );

  return {
    logs: uniqueResults,
    relatedIds,
  };
}

export function extractErrorContext(
  logs: LogEntry[],
  errorLog: LogEntry,
  contextSize: number = 3
): LogEntry[] {
  const errorIndex = logs.findIndex((log) => JSON.stringify(log) === JSON.stringify(errorLog));

  if (errorIndex === -1) return [errorLog];

  const start = Math.max(0, errorIndex - contextSize);
  const end = Math.min(logs.length, errorIndex + contextSize + 1);

  return logs.slice(start, end);
}
