import { LogEntry } from '../agent/types';

export interface LogStatistics {
  total: number;
  errors: number;
  warnings: number;
  info: number;
  debug: number;
  services: Map<string, number>;
  timeRange: { start: string; end: string } | null;
}

export interface LogPattern {
  message: string;
  count: number;
  firstOccurrence: string;
  lastOccurrence: string;
  services: Set<string>;
}

export function getLogStatistics(logs: LogEntry[]): LogStatistics {
  const stats: LogStatistics = {
    total: logs.length,
    errors: 0,
    warnings: 0,
    info: 0,
    debug: 0,
    services: new Map(),
    timeRange: null,
  };

  logs.forEach((log) => {
    switch (log.level) {
      case 'ERROR':
        stats.errors++;
        break;
      case 'WARN':
        stats.warnings++;
        break;
      case 'INFO':
        stats.info++;
        break;
      case 'DEBUG':
        stats.debug++;
        break;
    }

    const count = stats.services.get(log.service) || 0;
    stats.services.set(log.service, count + 1);
  });

  if (logs.length > 0) {
    stats.timeRange = {
      start: logs[0].time,
      end: logs[logs.length - 1].time,
    };
  }

  return stats;
}

export function identifyErrorPatterns(logs: LogEntry[]): LogPattern[] {
  const patterns = new Map<string, LogPattern>();

  logs.filter((log) => log.level === 'ERROR').forEach((log) => {
    const key = log.msg;

    if (!patterns.has(key)) {
      patterns.set(key, {
        message: key,
        count: 0,
        firstOccurrence: log.time,
        lastOccurrence: log.time,
        services: new Set(),
      });
    }

    const pattern = patterns.get(key)!;
    pattern.count++;
    pattern.lastOccurrence = log.time;
    pattern.services.add(log.service);
  });

  return Array.from(patterns.values()).sort((a, b) => b.count - a.count);
}

export function identifyWarningPatterns(logs: LogEntry[]): LogPattern[] {
  const patterns = new Map<string, LogPattern>();

  logs.filter((log) => log.level === 'WARN').forEach((log) => {
    const key = log.msg;

    if (!patterns.has(key)) {
      patterns.set(key, {
        message: key,
        count: 0,
        firstOccurrence: log.time,
        lastOccurrence: log.time,
        services: new Set(),
      });
    }

    const pattern = patterns.get(key)!;
    pattern.count++;
    pattern.lastOccurrence = log.time;
    pattern.services.add(log.service);
  });

  return Array.from(patterns.values()).sort((a, b) => b.count - a.count);
}

export function findErrorClusters(logs: LogEntry[]): Array<LogEntry[]> {
  const errorLogs = logs.filter((log) => log.level === 'ERROR');
  if (errorLogs.length === 0) return [];

  const clusters: Array<LogEntry[]> = [];
  let currentCluster: LogEntry[] = [];

  for (let i = 0; i < errorLogs.length; i++) {
    const current = errorLogs[i];
    const previous = i > 0 ? errorLogs[i - 1] : null;

    if (previous) {
      const currMinutes = timeStringToMinutes(current.time);
      const prevMinutes = timeStringToMinutes(previous.time);

      if (Math.abs(currMinutes - prevMinutes) <= 1) {
        currentCluster.push(current);
      } else {
        if (currentCluster.length > 0) {
          clusters.push(currentCluster);
        }
        currentCluster = [current];
      }
    } else {
      currentCluster.push(current);
    }
  }

  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  return clusters.filter((cluster) => cluster.length > 1);
}

function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export function summarizeLogs(logs: LogEntry[], limit: number = 5): string {
  const stats = getLogStatistics(logs);
  const errorPatterns = identifyErrorPatterns(logs);
  const warningPatterns = identifyWarningPatterns(logs);

  let summary = `Log Summary:\n`;
  summary += `- Total logs: ${stats.total}\n`;
  summary += `- Errors: ${stats.errors}, Warnings: ${stats.warnings}, Info: ${stats.info}\n`;
  summary += `- Services: ${Array.from(stats.services.keys()).join(', ')}\n`;

  if (errorPatterns.length > 0) {
    summary += `\nTop Error Patterns:\n`;
    errorPatterns.slice(0, limit).forEach((pattern, i) => {
      summary += `${i + 1}. "${pattern.message}" (${pattern.count}x in ${Array.from(pattern.services).join(', ')})\n`;
    });
  }

  if (warningPatterns.length > 0) {
    summary += `\nTop Warning Patterns:\n`;
    warningPatterns.slice(0, limit).forEach((pattern, i) => {
      summary += `${i + 1}. "${pattern.message}" (${pattern.count}x)\n`;
    });
  }

  return summary;
}

export function detectAnomalies(logs: LogEntry[]): LogEntry[] {
  const errorLogs = logs.filter((log) => log.level === 'ERROR');

  if (errorLogs.length === 0) return [];

  const avgErrorsPerMinute = errorLogs.length / getLogSpanInMinutes(logs);
  const threshold = avgErrorsPerMinute * 2;

  const minLogByMinute = new Map<string, LogEntry[]>();

  logs.forEach((log) => {
    const minute = log.time.substring(0, 5);
    if (!minLogByMinute.has(minute)) {
      minLogByMinute.set(minute, []);
    }
    minLogByMinute.get(minute)!.push(log);
  });

  const anomalies: LogEntry[] = [];

  minLogByMinute.forEach((minuteLogs) => {
    const errorCount = minuteLogs.filter((l) => l.level === 'ERROR').length;
    if (errorCount > threshold) {
      anomalies.push(...minuteLogs.filter((l) => l.level === 'ERROR'));
    }
  });

  return anomalies;
}

function getLogSpanInMinutes(logs: LogEntry[]): number {
  if (logs.length === 0) return 1;

  const firstTime = timeStringToMinutes(logs[0].time);
  const lastTime = timeStringToMinutes(logs[logs.length - 1].time);

  const span = lastTime - firstTime;
  return span > 0 ? span : 1;
}
