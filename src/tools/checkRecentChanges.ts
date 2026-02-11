import { RecentChanges, LogEntry } from '../agent/types.js';

export interface CheckChangesInput {
  timeRangeStart?: string;
  timeRangeEnd?: string;
  keyword?: string;
  changeType?: string;
}

export function checkRecentChanges(
  changes: RecentChanges[],
  logs: LogEntry[],
  input: CheckChangesInput = {}
): {
  relevantChanges: RecentChanges[];
  correlatedErrors: LogEntry[];
  analysis: string;
} {
  if (!changes || changes.length === 0) {
    return {
      relevantChanges: [],
      correlatedErrors: [],
      analysis: 'No recent changes found in the system.',
    };
  }

  let relevantChanges = changes;

  // Filter by change type if specified
  if (input.changeType) {
    relevantChanges = relevantChanges.filter((change) =>
      change.type.toLowerCase().includes(input.changeType!.toLowerCase())
    );
  }

  // Filter by time range if specified
  if (input.timeRangeStart || input.timeRangeEnd) {
    relevantChanges = relevantChanges.filter((change) => {
      const changeTime = change.timestamp;
      if (input.timeRangeStart && changeTime < input.timeRangeStart) return false;
      if (input.timeRangeEnd && changeTime > input.timeRangeEnd) return false;
      return true;
    });
  }

  // Find errors that occurred shortly after changes
  const correlatedErrors = findCorrelatedErrors(logs, relevantChanges);

  // Generate analysis
  const analysis = generateChangeAnalysis(relevantChanges, correlatedErrors);

  return {
    relevantChanges,
    correlatedErrors,
    analysis,
  };
}

function findCorrelatedErrors(
  logs: LogEntry[],
  changes: RecentChanges[]
): LogEntry[] {
  const errorLogs = logs.filter((log) => log.level === 'ERROR');
  const correlatedErrors: LogEntry[] = [];

  changes.forEach((change) => {
    const changeTime = new Date(change.timestamp).getTime();

    // Find errors within 2 minutes after the change
    errorLogs.forEach((error) => {
      const errorTime = parseTime(error.time);
      const timeDiffSeconds = (errorTime - changeTime) / 1000;

      if (timeDiffSeconds >= 0 && timeDiffSeconds <= 120) {
        correlatedErrors.push(error);
      }
    });
  });

  return Array.from(new Map(correlatedErrors.map((log) => [JSON.stringify(log), log])).values());
}

function parseTime(timeStr: string): number {
  const today = new Date().toDateString();
  return new Date(`${today} ${timeStr}`).getTime();
}

function generateChangeAnalysis(
  changes: RecentChanges[],
  errors: LogEntry[]
): string {
  if (changes.length === 0) {
    return 'No recent changes to analyze.';
  }

  let analysis = `Found ${changes.length} recent change(s):\n`;

  changes.forEach((change) => {
    analysis += `\n- [${change.timestamp}] ${change.type}: ${change.description}`;
    analysis += `\n  Files: ${change.filesAffected.join(', ')}`;
  });

  if (errors.length > 0) {
    analysis += `\n\nFound ${errors.length} error(s) correlated with these changes:`;
    errors.slice(0, 5).forEach((error) => {
      analysis += `\n- [${error.time}] ${error.service}: ${error.msg}`;
    });
  } else {
    analysis += '\n\nNo errors detected immediately following these changes.';
  }

  return analysis;
}

export function suggestCorrelation(
  changes: RecentChanges[],
  errors: LogEntry[]
): string[] {
  const suggestions: string[] = [];

  if (changes.length === 0 || errors.length === 0) {
    return suggestions;
  }

  // Check for deployment-related errors
  const deploymentChanges = changes.filter((c) =>
    c.type.toLowerCase().includes('deploy')
  );

  if (deploymentChanges.length > 0 && errors.length > 0) {
    suggestions.push(
      `Recent deployment at ${deploymentChanges[0].timestamp} may have caused ${errors.length} error(s). Consider rolling back if issues persist.`
    );
  }

  // Check for configuration changes
  const configChanges = changes.filter((c) =>
    c.type.toLowerCase().includes('config')
  );

  if (configChanges.length > 0 && errors.length > 0) {
    suggestions.push(
      `Configuration change detected. Verify that the new settings are compatible with the system.`
    );
  }

  // Check for migration-related changes
  const migrationChanges = changes.filter((c) =>
    c.type.toLowerCase().includes('migration')
  );

  if (migrationChanges.length > 0 && errors.length > 0) {
    suggestions.push(
      `Database migration detected. Ensure all services have been restarted to load new schema.`
    );
  }

  return suggestions;
}
