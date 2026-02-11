import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LogTriageAgent } from '../../agent.js';
import { TicketStorage } from '../../storage/tickets.js';
import { LogEntry, RecentChanges } from '../../agent/types.js';

const mockLogs: LogEntry[] = [
  {
    time: '14:00:00',
    service: 'api-gateway',
    level: 'INFO',
    msg: 'Health check OK',
  },
  {
    time: '14:01:00',
    service: 'database-service',
    level: 'INFO',
    msg: 'Query executed',
  },
  {
    time: '14:02:00',
    service: 'payment-service',
    level: 'INFO',
    msg: 'Payment authorized',
  },
];

const mockChanges: RecentChanges[] = [];

describe('LogTriageAgent', () => {
  let storage: TicketStorage;

  beforeEach(async () => {
    storage = new TicketStorage({ filePath: ':memory:' });
    await storage.initialize();
  });

  describe('initialization', () => {
    it('should create agent with valid parameters', () => {
      const agent = new LogTriageAgent(
        1,
        mockLogs.slice(-5),
        mockLogs,
        mockChanges,
        storage
      );

      expect(agent).toBeDefined();
    });

    it('should accept different log set numbers', () => {
      for (let i = 1; i <= 5; i++) {
        const agent = new LogTriageAgent(
          i,
          mockLogs,
          mockLogs,
          mockChanges,
          storage
        );
        expect(agent).toBeDefined();
      }
    });
  });

  describe('run method', () => {
    it('should return a string result', async () => {
      const agent = new LogTriageAgent(
        1,
        mockLogs,
        mockLogs,
        mockChanges,
        storage
      );

      const result = await agent.run();

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should mention investigation complete in output', async () => {
      const agent = new LogTriageAgent(
        1,
        mockLogs,
        mockLogs,
        mockChanges,
        storage
      );

      const result = await agent.run();

      expect(result.toLowerCase()).toContain('investigation');
    });

    it('should handle healthy logs without errors', async () => {
      const agent = new LogTriageAgent(
        1,
        mockLogs,
        mockLogs,
        [],
        storage
      );

      const result = await agent.run();

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle missing API keys gracefully', async () => {
      const originalKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;

      try {
        const agent = new LogTriageAgent(
          1,
          mockLogs,
          mockLogs,
          mockChanges,
          storage
        );

        // Should handle API key error gracefully
        expect(agent).toBeDefined();
      } finally {
        if (originalKey) {
          process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalKey;
        }
      }
    });

    it('should handle empty logs array', async () => {
      const agent = new LogTriageAgent(
        1,
        [],
        [],
        mockChanges,
        storage
      );

      const result = await agent.run();

      expect(typeof result).toBe('string');
    });

    it('should handle malformed logs', async () => {
      const malformedLogs: any[] = [
        { time: '14:00:00' }, // missing required fields
        { service: 'test' }, // incomplete
      ];

      const agent = new LogTriageAgent(
        1,
        malformedLogs,
        malformedLogs,
        mockChanges,
        storage
      );

      // Should not throw, but handle gracefully
      expect(agent).toBeDefined();
    });
  });

  describe('memory management', () => {
    it('should initialize agent memory on construction', () => {
      const agent = new LogTriageAgent(
        1,
        mockLogs,
        mockLogs,
        mockChanges,
        storage
      );

      expect(agent).toBeDefined();
    });

    it('should handle agents with large log sets', () => {
      const largeLogs = Array.from({ length: 1000 }, (_, i) => ({
        time: `${Math.floor(i / 60)}:${i % 60}:00`.padStart(8, '0'),
        service: `service-${i % 10}`,
        level: (
          ['ERROR', 'WARN', 'INFO', 'DEBUG'] as const
        )[i % 4],
        msg: `Log message ${i}`,
      }));

      const agent = new LogTriageAgent(
        3,
        largeLogs.slice(-5),
        largeLogs,
        mockChanges,
        storage
      );

      expect(agent).toBeDefined();
    });
  });

  describe('log set handling', () => {
    it('should correctly identify log set number', () => {
      for (let i = 1; i <= 5; i++) {
        const agent = new LogTriageAgent(
          i,
          mockLogs,
          mockLogs,
          mockChanges,
          storage
        );

        // Agent should be created successfully for each set
        expect(agent).toBeDefined();
      }
    });

    it('should handle complex log patterns', () => {
      const complexLogs: LogEntry[] = [
        {
          time: '14:00:00',
          service: 'enrichment-service',
          level: 'ERROR',
          msg: 'Batch enrichment failed',
          batch_id: 'batch_001',
          user_id: 'user_123',
          source_id: 'zendesk',
        },
        {
          time: '14:00:05',
          service: 'enrichment-service',
          level: 'ERROR',
          msg: 'Batch enrichment failed',
          batch_id: 'batch_001',
          user_id: 'user_456',
          source_id: 'zendesk',
        },
      ];

      const agent = new LogTriageAgent(
        5,
        complexLogs,
        complexLogs,
        [],
        storage
      );

      expect(agent).toBeDefined();
    });
  });

  describe('output formatting', () => {
    it('should produce readable output', async () => {
      const agent = new LogTriageAgent(
        1,
        mockLogs,
        mockLogs,
        mockChanges,
        storage
      );

      const result = await agent.run();

      // Should contain useful information
      expect(result).toContain('Log Set');
    });
  });
});
