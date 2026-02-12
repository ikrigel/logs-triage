// Application-wide type definitions

export type AIProvider = 'gemini' | 'claude' | 'perplexity';

export interface LogEntry {
  timestamp: string;
  level: string;
  service: string;
  message: string;
  details?: Record<string, any>;
  requestId?: string;
  userId?: string;
  batchId?: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'closed';
  affectedServices: string[];
  relatedLogs: LogEntry[];
  suggestions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
  toolCall?: {
    toolName: string;
    arguments: any;
    result?: any;
  };
}

export interface ChatSession {
  id: string;
  status: 'active' | 'waiting' | 'completed';
  messages: ChatMessage[];
  logsInfo: {
    count: number;
    source: string;
  };
  createdAt: string;
  lastActivity: string;
}

export type View = 'dashboard' | 'triage' | 'logs' | 'tickets' | 'settings' | 'about';
