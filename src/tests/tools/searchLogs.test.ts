import { describe, it, expect } from 'vitest';
import { searchLogs, extractErrorContext } from '../../tools/searchLogs.js';
import { LogEntry } from '../../agent/types.js';

const mockLogs: LogEntry[] = [
  {
    time: '14:00:00',
    service: 'payment-service',
    level: 'ERROR',
    msg: 'Payment failed',
    request_id: 'req_123',
  },
  {
    time: '14:00:05',
    service: 'order-service',
    level: 'INFO',
    msg: 'Order created',
    user_id: 'user_001',
  },
  {
    time: '14:00:10',
    service: 'database-service',
    level: 'WARN',
    msg: 'Connection pool at 75%',
  },
  {
    time: '14:00:15',
    service: 'enrichment-service',
    level: 'ERROR',
    msg: 'Batch enrichment failed',
    batch_id: 'batch_A',
    user_id: 'user_002',
    source_id: 'zendesk',
  },
  {
    time: '14:00:20',
    service: 'enrichment-service',
    level: 'ERROR',
    msg: 'Batch enrichment failed',
    batch_id: 'batch_A',
    user_id: 'user_003',
    source_id: 'zendesk',
  },
];

describe('searchLogs', () => {
  it('should find logs by request ID', async () => {
    const result = await searchLogs(mockLogs, { requestId: 'req_123' });
    expect(result.logs).toHaveLength(1);
    expect(result.logs[0].msg).toBe('Payment failed');
  });

  it('should find logs by user ID', async () => {
    const result = await searchLogs(mockLogs, { userId: 'user_001' });
    expect(result.logs).toHaveLength(1);
    expect(result.logs[0].service).toBe('order-service');
  });

  it('should find logs by service', async () => {
    const result = await searchLogs(mockLogs, { service: 'enrichment-service' });
    expect(result.logs).toHaveLength(2);
  });

  it('should find logs by level', async () => {
    const result = await searchLogs(mockLogs, { level: 'ERROR' });
    expect(result.logs).toHaveLength(3);
  });

  it('should find logs by keyword', async () => {
    const result = await searchLogs(mockLogs, { keyword: 'Pool' });
    expect(result.logs).toHaveLength(1);
    expect(result.logs[0].msg).toContain('pool');
  });

  it('should perform recursive search on batch ID', async () => {
    const result = await searchLogs(mockLogs, {
      batchId: 'batch_A',
      recursive: true,
    });

    // Should find batch errors, user errors, and source errors
    expect(result.logs.length).toBeGreaterThan(2);
    expect(result.relatedIdentifiers.size).toBeGreaterThan(0);
  });

  it('should filter by time range', async () => {
    const result = await searchLogs(mockLogs, {
      timeRangeStart: '14:00:05',
      timeRangeEnd: '14:00:15',
    });

    expect(result.logs.length).toBeGreaterThan(0);
    expect(result.logs.every((l) => l.time >= '14:00:05' && l.time <= '14:00:15')).toBe(true);
  });

  it('should combine multiple search criteria', async () => {
    const result = await searchLogs(mockLogs, {
      service: 'enrichment-service',
      level: 'ERROR',
    });

    expect(result.logs).toHaveLength(2);
    expect(result.logs.every((l) => l.service === 'enrichment-service')).toBe(true);
    expect(result.logs.every((l) => l.level === 'ERROR')).toBe(true);
  });

  it('should return empty results for non-matching criteria', async () => {
    const result = await searchLogs(mockLogs, { service: 'non-existent' });
    expect(result.logs).toHaveLength(0);
  });

  it('should collect related identifiers', async () => {
    const result = await searchLogs(mockLogs, { batchId: 'batch_A' });
    expect(result.relatedIdentifiers.size).toBeGreaterThan(0);
  });
});

describe('extractErrorContext', () => {
  it('should extract error with surrounding logs', () => {
    const errorLog = mockLogs[0];
    const context = extractErrorContext(mockLogs, errorLog, 2);

    expect(context.length).toBeGreaterThan(1);
    expect(context.some((l) => l.request_id === 'req_123')).toBe(true);
  });

  it('should handle errors at the beginning', () => {
    const errorLog = mockLogs[0];
    const context = extractErrorContext(mockLogs, errorLog, 10);

    expect(context[0]).toEqual(errorLog);
  });

  it('should return single log if not found', () => {
    const nonExistentLog: LogEntry = {
      time: '15:00:00',
      service: 'test',
      level: 'ERROR',
      msg: 'Not in array',
    };

    const context = extractErrorContext(mockLogs, nonExistentLog, 2);
    expect(context).toHaveLength(1);
    expect(context[0]).toEqual(nonExistentLog);
  });

  it('should respect context size parameter', () => {
    const contextSize = 1;
    const errorLog = mockLogs[2];
    const context = extractErrorContext(mockLogs, errorLog, contextSize);

    expect(context.length).toBeLessThanOrEqual(contextSize * 2 + 1);
  });
});
