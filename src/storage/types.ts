import { Ticket } from '../agent/types.js';

export interface StorageOptions {
  filePath?: string;
  autoCreate?: boolean;
}

export interface StorageData {
  version: string;
  lastUpdated: string;
  tickets: Ticket[];
}

export interface TicketFilter {
  status?: Ticket['status'];
  severity?: Ticket['severity'];
  service?: string;
  createdAfter?: string;
  createdBefore?: string;
  keyword?: string;
}

export const EMPTY_STORAGE: StorageData = {
  version: '1.0',
  lastUpdated: new Date().toISOString(),
  tickets: [],
};
