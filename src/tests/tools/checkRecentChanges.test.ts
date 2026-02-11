import { describe, it, expect } from 'vitest';
import { checkRecentChanges, suggestCorrelation } from '../../tools/checkRecentChanges.js';
import { LogEntry, RecentChanges } from '../../agent/types.js';

const mockChanges: RecentChanges[] = [
  {
    timestamp: '14:30:00',
    type: 'deployment',
    description: 'Deployed new version',
    filesAffected: ['payment-service.js'],
  },
  {
    timestamp: '14:35:00',
    type: 'config',
    description: 'Updated database connection pool size',
    filesAffected: ['config.yaml'],
  },
];

const mockLogs: LogEntry[] = [
  {
    time: '14:29:00',
    service: 'payment-service',
    level: 'INFO',
    msg: 'Service started',
  },
  {
    time: '14:30:30',
    service: 'payment-service',
    level: 'ERROR',
    msg: 'Connection timeout',
  },
  {
    time: '14:31:00',
    service: 'payment-service',
    level: 'ERROR',
    msg: 'Failed to process payment',
  },
  {
    time: '14:40:00',
    service: 'database-service',
    level: 'INFO',
    msg: 'Restarted successfully',
  },
];

describe('checkRecentChanges', () => {
  it('should return empty when no changes provided', () => {
    const result = checkRecentChanges([], mockLogs);

    expect(result.relevantChanges).toHaveLength(0);
    expect(result.correlatedErrors).toHaveLength(0);
    expect(result.analysis).toContain('No recent changes');
  });

  it('should return all changes when no filter applied', () => {
    const result = checkRecentChanges(mockChanges, mockLogs);

    expect(result.relevantChanges).toHaveLength(2);
  });

  it('should filter changes by type', () => {
    const result = checkRecentChanges(mockChanges, mockLogs, {
      changeType: 'deployment',
    });

    expect(result.relevantChanges).toHaveLength(1);
    expect(result.relevantChanges[0].type).toBe('deployment');
  });

  it('should correlate errors with recent changes', () => {
    const result = checkRecentChanges(mockChanges, mockLogs);

    expect(result.correlatedErrors.length).toBeGreaterThan(0);
    expect(result.correlatedErrors.every((e) => e.level === 'ERROR')).toBe(true);
  });

  it('should generate analysis string', () => {
    const result = checkRecentChanges(mockChanges, mockLogs);

    expect(result.analysis).toContain('changes');
    expect(result.analysis.length).toBeGreaterThan(0);
  });

  it('should identify deployment errors', () => {
    const result = checkRecentChanges(mockChanges, mockLogs);

    expect(result.analysis).toBeDefined();
    if (result.correlatedErrors.length > 0) {
      expect(result.analysis).toContain('Error');
    }
  });

  it('should handle changes at different times', () => {
    const earlyChange: RecentChanges = {
      timestamp: '14:00:00',
      type: 'migration',
      description: 'Database migration',
      filesAffected: ['schema.sql'],
    };

    const result = checkRecentChanges([earlyChange], mockLogs);
    expect(result.relevantChanges).toHaveLength(1);
  });

  it('should filter by time range', () => {
    const result = checkRecentChanges(mockChanges, mockLogs, {
      timeRangeStart: '14:30:00',
      timeRangeEnd: '14:33:00',
    });

    expect(result.relevantChanges.length).toBeGreaterThanOrEqual(1);
  });
});

describe('suggestCorrelation', () => {
  it('should suggest action for deployment changes', () => {
    const suggestions = suggestCorrelation(mockChanges, mockLogs);

    expect(suggestions.length).toBeGreaterThan(0);
    const deploymentSuggestion = suggestions.find((s) => s.includes('deployment'));
    expect(deploymentSuggestion).toBeDefined();
  });

  it('should suggest action for config changes', () => {
    const configChange: RecentChanges = {
      timestamp: '14:30:00',
      type: 'config',
      description: 'Changed config',
      filesAffected: ['config.yaml'],
    };

    const suggestions = suggestCorrelation([configChange], mockLogs);

    if (mockLogs.some((l) => l.level === 'ERROR')) {
      expect(suggestions.length).toBeGreaterThan(0);
    }
  });

  it('should suggest action for migration changes', () => {
    const migrationChange: RecentChanges = {
      timestamp: '14:30:00',
      type: 'migration',
      description: 'Database migration',
      filesAffected: ['schema.sql'],
    };

    const suggestions = suggestCorrelation([migrationChange], mockLogs);

    if (mockLogs.some((l) => l.level === 'ERROR')) {
      expect(suggestions.length).toBeGreaterThan(0);
    }
  });

  it('should return empty suggestions for no changes', () => {
    const suggestions = suggestCorrelation([], mockLogs);

    expect(suggestions).toHaveLength(0);
  });

  it('should return empty suggestions for no errors', () => {
    const infoLogs: LogEntry[] = [
      { time: '14:30:00', service: 'test', level: 'INFO', msg: 'All good' },
    ];

    const suggestions = suggestCorrelation(mockChanges, infoLogs);

    expect(suggestions).toHaveLength(0);
  });
});
