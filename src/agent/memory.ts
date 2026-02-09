import { AgentMemoryEntry, ToolResult, LogEntry, RecentChanges } from './types';

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
}
