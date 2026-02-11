import { AgentMemoryEntry, ToolResult, LogEntry, RecentChanges } from './types.js';

export class AgentMemory {
  private entries: AgentMemoryEntry[] = [];
  private maxTokens = 8000;
  private approximateTokensUsed = 0;

  constructor(
    private systemPrompt: string,
    private initialLogs: LogEntry[],
    private recentChanges: RecentChanges[]
  ) {
    this.initializeMemory();
  }

  private initializeMemory(): void {
    const timestamp = new Date().toISOString();

    this.entries.push({
      role: 'system',
      content: this.systemPrompt,
      timestamp,
    });

    const logsContext = `Initial logs (last 5 received):\n${JSON.stringify(
      this.initialLogs,
      null,
      2
    )}\n\nRecent changes:\n${JSON.stringify(this.recentChanges, null, 2)}`;

    this.entries.push({
      role: 'user',
      content: logsContext,
      timestamp,
    });

    this.approximateTokensUsed = this.estimateTokens(this.systemPrompt + logsContext);
  }

  addAssistantMessage(content: string): void {
    this.entries.push({
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
    });
    this.approximateTokensUsed += this.estimateTokens(content);
    this.checkAndCompressMemory();
  }

  addToolResult(toolName: string, result: any, error?: string): void {
    const resultText = error
      ? `Error: ${error}`
      : `Result: ${JSON.stringify(result)}`;

    this.entries.push({
      role: 'tool',
      content: `Tool "${toolName}" executed: ${resultText}`,
      toolResults: [
        {
          toolName,
          status: error ? 'error' : 'success',
          result,
          error,
        },
      ],
      timestamp: new Date().toISOString(),
    });

    this.approximateTokensUsed += this.estimateTokens(resultText);
    this.checkAndCompressMemory();
  }

  getMessages(): AgentMemoryEntry[] {
    return this.entries;
  }

  getFormattedMessagesForLLM(): Array<{ role: string; content: string }> {
    return this.entries
      .filter((e) => e.role !== 'system' && e.content)
      .map((entry) => ({
        role: entry.role,
        content: entry.content || '',
      }));
  }

  getSystemPrompt(): string {
    return this.systemPrompt;
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private checkAndCompressMemory(): void {
    if (this.approximateTokensUsed > this.maxTokens * 0.8) {
      this.compressOldMessages();
    }
  }

  private compressOldMessages(): void {
    if (this.entries.length < 10) return;

    const systemAndInitial = this.entries.slice(0, 2);
    const recent = this.entries.slice(-5);
    const middle = this.entries.slice(2, -5);

    if (middle.length > 2) {
      const summary = `[Previous conversation - ${middle.length} turns summarized]`;
      const compressedEntry: AgentMemoryEntry = {
        role: 'user',
        content: summary,
        timestamp: new Date().toISOString(),
      };

      this.entries = [...systemAndInitial, compressedEntry, ...recent];
      this.approximateTokensUsed = this.estimateTokens(
        this.entries.map((e) => e.content || '').join('\n')
      );
    }
  }

  clear(): void {
    this.entries = [];
    this.approximateTokensUsed = 0;
    this.initializeMemory();
  }

  // Serialize memory state for session persistence
  serialize(): { entries: AgentMemoryEntry[]; approximateTokensUsed: number } {
    return {
      entries: this.entries,
      approximateTokensUsed: this.approximateTokensUsed,
    };
  }

  // Restore memory from serialized state
  static restore(
    systemPrompt: string,
    initialLogs: LogEntry[],
    recentChanges: RecentChanges[],
    serializedState: { entries: AgentMemoryEntry[]; approximateTokensUsed: number }
  ): AgentMemory {
    const memory = new AgentMemory(systemPrompt, initialLogs, recentChanges);
    // Only overwrite with serialized state if it has entries (subsequent messages)
    // If empty (first message), keep the initialized state with system prompt + logs context
    if (serializedState.entries && serializedState.entries.length > 0) {
      memory.entries = serializedState.entries;
      memory.approximateTokensUsed = serializedState.approximateTokensUsed;
    }
    return memory;
  }

  // Add user message directly (for conversational mode)
  addUserMessage(content: string): void {
    this.entries.push({
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    });
    this.approximateTokensUsed += this.estimateTokens(content);
    this.checkAndCompressMemory();
  }
}
