import { LogEntry, RecentChanges } from '../agent/types.js';
import { AIProvider } from '../services/aiService.js';
import { AgentMemoryEntry } from '../agent/types.js';

export interface ChatSession {
  id: string;
  createdAt: string;
  lastActivity: string;
  logsContext: {
    logs: LogEntry[];
    allLogs: LogEntry[];
    recentChanges: RecentChanges[];
    source: string; // "log_set_1" | "file_upload" | "url_fetch"
  };
  memoryState: {
    entries: AgentMemoryEntry[];
    approximateTokensUsed: number;
  };
  provider: AIProvider;
  model: string;
  status: 'active' | 'waiting' | 'completed';
}

interface CreateSessionOptions {
  logs: LogEntry[];
  allLogs: LogEntry[];
  recentChanges: RecentChanges[];
  source: string;
  provider: AIProvider;
  model: string;
}

export class ChatSessionStorage {
  private sessions: Map<string, ChatSession> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup interval (every 5 minutes)
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldSessions();
    }, 5 * 60 * 1000);
  }

  createSession(options: CreateSessionOptions): string {
    const now = new Date().toISOString();
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: ChatSession = {
      id: sessionId,
      createdAt: now,
      lastActivity: now,
      logsContext: {
        logs: options.logs,
        allLogs: options.allLogs,
        recentChanges: options.recentChanges,
        source: options.source,
      },
      memoryState: {
        entries: [],
        approximateTokensUsed: 0,
      },
      provider: options.provider,
      model: options.model,
      status: 'active',
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  getSession(id: string): ChatSession | null {
    const session = this.sessions.get(id);
    if (!session) return null;

    // Update last activity
    session.lastActivity = new Date().toISOString();
    return session;
  }

  updateSession(id: string, updates: Partial<ChatSession>): void {
    const session = this.sessions.get(id);
    if (!session) return;

    // Merge updates but preserve key fields
    Object.assign(session, updates, {
      id: session.id,
      createdAt: session.createdAt,
    });

    session.lastActivity = new Date().toISOString();
  }

  deleteSession(id: string): void {
    this.sessions.delete(id);
  }

  private cleanupOldSessions(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    for (const [id, session] of this.sessions) {
      if (session.lastActivity < oneHourAgo) {
        this.sessions.delete(id);
        console.log(`[ChatSessionStorage] Cleaned up expired session: ${id}`);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval !== null) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Export singleton instance
export const chatSessionStorage = new ChatSessionStorage();
