import dotenv from 'dotenv';
import { LogTriageAgent } from '../agent/index.js';
import { loadLogs, loadRecentChanges } from './logsAndChangesService.js';
import { ticketStorage } from '../storage/tickets.js';

dotenv.config();

const LOG_FILE_NUMBER = parseInt(process.env.LOG_FILE_NUMBER || '1', 10);

const activateLogTriageAgent = async (): Promise<string> => {
  try {
    const allLogs = await loadLogs(LOG_FILE_NUMBER);
    const recentChanges = await loadRecentChanges(LOG_FILE_NUMBER);
    const lastFiveLogs = allLogs.slice(-5);

    await ticketStorage.initialize();

    const agent = new LogTriageAgent(
      LOG_FILE_NUMBER,
      lastFiveLogs,
      allLogs,
      recentChanges,
      ticketStorage
    );

    const answer = await agent.run();
    return answer;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return `Error: ${errorMsg}`;
  }
};

activateLogTriageAgent().then(console.log).catch(console.error);