export interface LogEntry {
  time: string;
  service: string;
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  msg: string;
  request_id?: string;
  user_id?: string;
  batch_id?: string;
  source_id?: string;
  [key: string]: any;
}

export interface RecentChanges {
  timestamp: string;
  type: string;
  description: string;
  filesAffected: string[];
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
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
  comments: Comment[];
}

export interface ToolResult {
  toolName: string;
  status: 'success' | 'error';
  result: any;
  error?: string;
}

export interface InvestigationResult {
  summary: string;
  findings: string[];
  ticketsCreated: Ticket[];
  suggestedActions: string[];
  iterations: number;
}

export interface AgentMemoryEntry {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string;
  toolResults?: ToolResult[];
  timestamp: string;
}

export interface LLMToolCall {
  toolName: string;
  arguments: Record<string, any>;
}