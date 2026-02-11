import { promises as fs } from 'fs';
import path from 'path';
import { Ticket } from '../agent/types.js';
import { StorageData, EMPTY_STORAGE, TicketFilter, StorageOptions } from './types.js';

export class TicketStorage {
  private filePath: string;
  private data: StorageData = EMPTY_STORAGE;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(options: StorageOptions = {}) {
    this.filePath = options.filePath || path.join(process.cwd(), 'data', 'tickets.json');
  }

  async initialize(): Promise<void> {
    try {
      await this.ensureDirectory();
      await this.load();
    } catch (error) {
      this.data = EMPTY_STORAGE;
      await this.save();
    }
  }

  async createTicket(ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>): Promise<Ticket> {
    const now = new Date().toISOString();
    const id = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const fullTicket: Ticket = {
      ...ticket,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.data.tickets.push(fullTicket);
    await this.save();

    return fullTicket;
  }

  async getTicket(id: string): Promise<Ticket | null> {
    return this.data.tickets.find((t) => t.id === id) || null;
  }

  async getTickets(filter?: TicketFilter): Promise<Ticket[]> {
    let results = [...this.data.tickets];

    if (!filter) return results;

    if (filter.status) {
      results = results.filter((t) => t.status === filter.status);
    }

    if (filter.severity) {
      results = results.filter((t) => t.severity === filter.severity);
    }

    if (filter.service) {
      results = results.filter((t) =>
        t.affectedServices.some((s) =>
          s.toLowerCase().includes(filter.service!.toLowerCase())
        )
      );
    }

    if (filter.createdAfter) {
      results = results.filter((t) => t.createdAt >= filter.createdAfter!);
    }

    if (filter.createdBefore) {
      results = results.filter((t) => t.createdAt <= filter.createdBefore!);
    }

    if (filter.keyword) {
      const keywordLower = filter.keyword.toLowerCase();
      results = results.filter(
        (t) =>
          t.title.toLowerCase().includes(keywordLower) ||
          t.description.toLowerCase().includes(keywordLower)
      );
    }

    return results;
  }

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket | null> {
    const ticket = this.data.tickets.find((t) => t.id === id);
    if (!ticket) return null;

    const updated: Ticket = {
      ...ticket,
      ...updates,
      id: ticket.id,
      createdAt: ticket.createdAt,
      updatedAt: new Date().toISOString(),
    };

    const index = this.data.tickets.indexOf(ticket);
    this.data.tickets[index] = updated;
    await this.save();

    return updated;
  }

  async deleteTicket(id: string): Promise<boolean> {
    const index = this.data.tickets.findIndex((t) => t.id === id);
    if (index === -1) return false;

    this.data.tickets.splice(index, 1);
    await this.save();

    return true;
  }

  private async load(): Promise<void> {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(content);
      this.data = parsed;
    } catch {
      this.data = EMPTY_STORAGE;
    }
  }

  private async save(): Promise<void> {
    this.writeQueue = this.writeQueue.then(() => this.performWrite());
    await this.writeQueue;
  }

  private async performWrite(): Promise<void> {
    this.data.lastUpdated = new Date().toISOString();
    const content = JSON.stringify(this.data, null, 2);
    await fs.writeFile(this.filePath, content, 'utf-8');
  }

  private async ensureDirectory(): Promise<void> {
    const dir = path.dirname(this.filePath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
    }
  }

  async clear(): Promise<void> {
    this.data = EMPTY_STORAGE;
    await this.save();
  }
}
