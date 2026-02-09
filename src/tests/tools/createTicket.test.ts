import { describe, it, expect, beforeEach } from 'vitest';
import { generateTicketFromLogs } from '../../tools/createTicket';
import { LogEntry } from '../../agent/types';

const mockErrorLogs: LogEntry[] = [
  {
    time: '14:30:00',
    service: 'payment-service',
    level: 'ERROR',
    msg: 'Failed to connect to payment.processor.com',
  },
  {
    time: '14:30:05',
    service: 'payment-service',
    level: 'ERROR',
    msg: 'Payment processing failed - external service unavailable',
  },
  {
    time: '14:30:10',
    service: 'order-service',
    level: 'ERROR',
    msg: 'Failed to process order - payment service down',
  },
];

const mockWarningLogs: LogEntry[] = [
  {
    time: '15:00:00',
    service: 'database-service',
    level: 'WARN',
    msg: 'Connection pool at 75% capacity',
  },
  {
    time: '15:00:05',
    service: 'auth-service',
    level: 'WARN',
    msg: 'Slow query detected',
  },
  {
    time: '15:00:10',
    service: 'order-service',
    level: 'WARN',
    msg: 'Deprecated API endpoint used',
  },
];

describe('generateTicketFromLogs', () => {
  describe('error category', () => {
    it('should generate error ticket with correct severity', () => {
      const ticket = generateTicketFromLogs(mockErrorLogs, 'errors');

      expect(ticket).not.toBeNull();
      expect(ticket?.severity).toBe('critical');
    });

    it('should include all affected services in error ticket', () => {
      const ticket = generateTicketFromLogs(mockErrorLogs, 'errors');

      expect(ticket?.affectedServices).toContain('payment-service');
      expect(ticket?.affectedServices).toContain('order-service');
    });

    it('should include error messages in description', () => {
      const ticket = generateTicketFromLogs(mockErrorLogs, 'errors');

      expect(ticket?.description).toContain('Critical errors');
      expect(ticket?.description.length).toBeGreaterThan(0);
    });

    it('should generate suggestions for error ticket', () => {
      const ticket = generateTicketFromLogs(mockErrorLogs, 'errors');

      expect(ticket?.suggestions.length).toBeGreaterThan(0);
    });

    it('should detect connection errors and suggest fixes', () => {
      const ticket = generateTicketFromLogs(mockErrorLogs, 'errors');

      const hasSuggestion = ticket?.suggestions.some(
        (s) => s.toLowerCase().includes('connect') || s.toLowerCase().includes('service')
      );

      expect(hasSuggestion).toBe(true);
    });

    it('should relate logs to ticket', () => {
      const ticket = generateTicketFromLogs(mockErrorLogs, 'errors');

      expect(ticket?.relatedLogs).toBeDefined();
      expect(ticket?.relatedLogs.length).toBeGreaterThan(0);
    });
  });

  describe('warning category', () => {
    it('should generate warning ticket with medium severity', () => {
      const ticket = generateTicketFromLogs(mockWarningLogs, 'warnings');

      expect(ticket).not.toBeNull();
      expect(ticket?.severity).toBe('medium');
    });

    it('should include warning patterns in description', () => {
      const ticket = generateTicketFromLogs(mockWarningLogs, 'warnings');

      expect(ticket?.description).toContain('warning');
    });

    it('should generate practical suggestions for warnings', () => {
      const ticket = generateTicketFromLogs(mockWarningLogs, 'warnings');

      expect(ticket?.suggestions.length).toBeGreaterThan(0);
      expect(ticket?.suggestions.some((s) => s.length > 10)).toBe(true);
    });

    it('should detect deprecation warnings', () => {
      const ticket = generateTicketFromLogs(mockWarningLogs, 'warnings');

      const hasDeprecationSuggestion = ticket?.suggestions.some((s) =>
        s.toLowerCase().includes('deprecated')
      );

      expect(hasDeprecationSuggestion).toBe(true);
    });

    it('should detect slow query warnings', () => {
      const ticket = generateTicketFromLogs(mockWarningLogs, 'warnings');

      expect(ticket?.suggestions.some((s) => s.toLowerCase().includes('slow'))).toBe(true);
    });
  });

  describe('performance category', () => {
    it('should generate performance ticket with high severity', () => {
      const perfLogs: LogEntry[] = [
        {
          time: '16:00:00',
          service: 'api-gateway',
          level: 'WARN',
          msg: 'High latency detected',
        },
      ];

      const ticket = generateTicketFromLogs(perfLogs, 'performance');

      expect(ticket?.severity).toBe('high');
    });

    it('should include performance investigation suggestions', () => {
      const perfLogs: LogEntry[] = [
        {
          time: '16:00:00',
          service: 'database-service',
          level: 'WARN',
          msg: 'Query timeout',
        },
      ];

      const ticket = generateTicketFromLogs(perfLogs, 'performance');

      expect(ticket?.suggestions.some((s) => s.toLowerCase().includes('profile'))).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should return null for empty logs', () => {
      const ticket = generateTicketFromLogs([], 'errors');

      expect(ticket).toBeNull();
    });

    it('should handle single log entry', () => {
      const singleLog: LogEntry[] = [
        {
          time: '17:00:00',
          service: 'test-service',
          level: 'ERROR',
          msg: 'Single error',
        },
      ];

      const ticket = generateTicketFromLogs(singleLog, 'errors');

      expect(ticket).not.toBeNull();
      expect(ticket?.affectedServices).toContain('test-service');
    });

    it('should handle multiple services', () => {
      const multiServiceLogs: LogEntry[] = [
        {
          time: '18:00:00',
          service: 'service-a',
          level: 'ERROR',
          msg: 'Error in A',
        },
        {
          time: '18:00:05',
          service: 'service-b',
          level: 'ERROR',
          msg: 'Error in B',
        },
        {
          time: '18:00:10',
          service: 'service-c',
          level: 'ERROR',
          msg: 'Error in C',
        },
      ];

      const ticket = generateTicketFromLogs(multiServiceLogs, 'errors');

      expect(ticket?.affectedServices).toHaveLength(3);
    });

    it('should create meaningful titles', () => {
      const ticket = generateTicketFromLogs(mockErrorLogs, 'errors');

      expect(ticket?.title).toBeDefined();
      expect(ticket?.title.length).toBeGreaterThan(5);
      expect(ticket?.title).toContain('Error');
    });
  });
});
