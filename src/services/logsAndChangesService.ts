import { LogEntry, RecentChanges } from '../agent/types.js';
import * as logSet1 from '../prod_logs/log_set_1.js';
import * as logSet2 from '../prod_logs/log_set_2.js';
import * as logSet3 from '../prod_logs/log_set_3.js';
import * as logSet4 from '../prod_logs/log_set_4.js';
import * as logSet5 from '../prod_logs/log_set_5.js';

const logSets = [logSet1, logSet2, logSet3, logSet4, logSet5];

const getLogsAndChanges = (logFileNumber: number): { logs: LogEntry[], changes: RecentChanges[] } => {
    if (logFileNumber < 1 || logFileNumber > 5) {
        throw new Error(`Invalid log set number: ${logFileNumber}. Must be between 1 and 5.`);
    }

    const logSet = logSets[logFileNumber - 1];

    if (!logSet.LOGS || !Array.isArray(logSet.LOGS)) {
        throw new Error(`Log set ${logFileNumber} is missing LOGS export`);
    }

    return {
        logs: logSet.LOGS as LogEntry[],
        changes: (logSet.RECENT_CHANGES || []) as RecentChanges[]
    };
};

export const loadLogs = async (logFileNumber: number): Promise<LogEntry[]> => {
    const { logs } = getLogsAndChanges(logFileNumber);
    return logs;
};

export const loadRecentChanges = async (logFileNumber: number): Promise<RecentChanges[]> => {
    const { changes } = getLogsAndChanges(logFileNumber);
    return changes;
};

