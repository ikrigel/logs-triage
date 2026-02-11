import { AgentMemoryEntry } from './types.js';

export interface ConversationTurn {
  assistantResponse: string;
  toolExecutions: Array<{
    toolCall: { toolName: string; arguments: any };
    result: any;
  }>;
  memoryState: AgentMemoryEntry[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
  toolCall?: {
    toolName: string;
    arguments: any;
    result: any;
  };
}

export interface ConversationStartRequest {
  logs?: any[];
  logSetNumber?: number;
  provider?: string;
  model?: string;
  apiKey?: string;
}

export interface ConversationMessageRequest {
  message: string;
}

export interface ConversationStartResponse {
  sessionId: string;
  initialMessage: string;
  logsInfo: {
    count: number;
    source: string;
  };
}

export interface ConversationMessageResponse {
  assistantResponse: string;
  toolExecutions: Array<{
    toolCall: { toolName: string; arguments: any };
    result: any;
  }>;
  status: 'active' | 'waiting' | 'completed';
}
