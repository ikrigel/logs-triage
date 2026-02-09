import { Ticket, Comment } from '../agent/types';
import { TicketStorage } from '../storage/tickets';
import { TicketFilter } from '../storage/types';

export class TicketService {
  constructor(private storage: TicketStorage) {}

  async create(
    title: string,
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    affectedServices: string[],
    suggestions: string[] = [],
    relatedLogs: any[] = []
  ): Promise<Ticket> {
    return this.storage.createTicket({
      title,
      description,
      severity,
      affectedServices,
      suggestions,
      relatedLogs,
      status: 'open',
      comments: [],
    });
  }

  async getById(id: string): Promise<Ticket | null> {
    return this.storage.getTicket(id);
  }

  async getAll(filter?: TicketFilter): Promise<Ticket[]> {
    return this.storage.getTickets(filter);
  }

  async updateStatus(
    id: string,
    status: 'open' | 'in-progress' | 'closed'
  ): Promise<Ticket | null> {
    return this.storage.updateTicket(id, { status });
  }

  async addComment(id: string, author: string, text: string): Promise<Ticket | null> {
    const ticket = await this.storage.getTicket(id);
    if (!ticket) return null;

    const comment: Comment = {
      id: `CMT-${Date.now()}`,
      author,
      text,
      createdAt: new Date().toISOString(),
    };

    ticket.comments.push(comment);
    return this.storage.updateTicket(id, { comments: ticket.comments });
  }

  async getOpenTickets(): Promise<Ticket[]> {
    return this.storage.getTickets({ status: 'open' });
  }

  async getCriticalTickets(): Promise<Ticket[]> {
    return this.storage.getTickets({ severity: 'critical' });
  }

  async getTicketsByService(service: string): Promise<Ticket[]> {
    return this.storage.getTickets({ service });
  }

  async closeTicket(id: string, finalComment?: string): Promise<Ticket | null> {
    let ticket = await this.storage.updateTicket(id, { status: 'closed' });

    if (ticket && finalComment) {
      ticket = await this.addComment(id, 'system', finalComment);
    }

    return ticket;
  }

  async getTicketStats(): Promise<{
    total: number;
    open: number;
    inProgress: number;
    closed: number;
    critical: number;
    high: number;
  }> {
    const all = await this.storage.getTickets();

    return {
      total: all.length,
      open: all.filter((t) => t.status === 'open').length,
      inProgress: all.filter((t) => t.status === 'in-progress').length,
      closed: all.filter((t) => t.status === 'closed').length,
      critical: all.filter((t) => t.severity === 'critical').length,
      high: all.filter((t) => t.severity === 'high').length,
    };
  }

  async deleteTicket(id: string): Promise<boolean> {
    return this.storage.deleteTicket(id);
  }

  async clearAll(): Promise<void> {
    return this.storage.clear();
  }
}

export function createTicketService(storage: TicketStorage): TicketService {
  return new TicketService(storage);
}
