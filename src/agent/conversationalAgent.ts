import { LogEntry, RecentChanges } from './types.js';
import { ConversationTurn } from './conversationTypes.js';
import { AgentMemory } from './memory.js';
import { AIService } from '../services/aiService.js';
import { TicketService } from '../services/ticketService.js';
import { TicketStorage } from '../storage/tickets.js';
import { executeTool } from '../tools/index.js';
import chalk from 'chalk';

export class ConversationalAgent {
  private memory: AgentMemory;
  private aiService: AIService;
  private ticketService: TicketService;
  private allLogs: LogEntry[];
  private recentChanges: RecentChanges[];

  constructor(
    memory: AgentMemory,
    allLogs: LogEntry[],
    recentChanges: RecentChanges[],
    ticketStorage: TicketStorage,
    aiService: AIService
  ) {
    this.memory = memory;
    this.aiService = aiService;
    this.ticketService = new TicketService(ticketStorage);
    this.allLogs = allLogs;
    this.recentChanges = recentChanges;
  }

  async processUserMessage(message: string): Promise<ConversationTurn> {
    try {
      // 1. Add user message to memory
      this.memory.addUserMessage(message);

      // 2. Call LLM with current memory
      const messages = this.memory.getFormattedMessagesForLLM();
      const systemPrompt = this.memory.getSystemPrompt();

      const llmResponse = await this.aiService.callLLM(systemPrompt, messages);

      // 3. Add assistant response to memory
      this.memory.addAssistantMessage(llmResponse.response);

      // 4. Execute any tool calls
      const toolResults = [];
      if (llmResponse.toolCalls && llmResponse.toolCalls.length > 0) {
        for (const toolCall of llmResponse.toolCalls) {
          try {
            const toolResult = await executeTool(
              toolCall.toolName,
              toolCall.arguments,
              {
                allLogs: this.allLogs,
                recentChanges: this.recentChanges,
                storage: this.ticketService['storage'],
              }
            );

            this.memory.addToolResult(toolCall.toolName, toolResult);
            toolResults.push({ toolCall, result: toolResult });

            console.log(
              chalk.green(
                `✓ Conversational agent executed tool: ${toolCall.toolName}`
              )
            );
          } catch (toolError) {
            const errorMsg =
              toolError instanceof Error
                ? toolError.message
                : String(toolError);
            this.memory.addToolResult(toolCall.toolName, null, errorMsg);
            console.log(
              chalk.red(
                `✗ Tool execution failed (${toolCall.toolName}): ${errorMsg}`
              )
            );
          }
        }
      }

      // 5. Return the conversation turn
      return {
        assistantResponse: llmResponse.response,
        toolExecutions: toolResults,
        memoryState: this.memory.getMessages(),
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`ConversationalAgent error: ${errorMsg}`));
      throw error;
    }
  }

  getMemory(): AgentMemory {
    return this.memory;
  }
}
