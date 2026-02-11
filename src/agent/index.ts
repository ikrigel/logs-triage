import { LogEntry, InvestigationResult, RecentChanges } from './types.js';
import { deepDelete } from '../utils/general.js';
import chalk from 'chalk';
import { AgentMemory } from './memory.js';
import { AIService } from '../services/aiService.js';
import { TicketService } from '../services/ticketService.js';
import { TicketStorage } from '../storage/tickets.js';
import { executeTool } from '../tools/index.js';
import { loadRecentChanges } from '../services/logsAndChangesService.js';

export class LogTriageAgent {
  private memory: AgentMemory;
  private aiService: AIService;
  private ticketService: TicketService;
  private allLogs: LogEntry[];
  private recentChanges: RecentChanges[];
  private maxIterations = 10;

  constructor(
    private logsFileNumber: number,
    logs: LogEntry[],
    allLogs: LogEntry[],
    recentChanges: RecentChanges[],
    ticketStorage: TicketStorage,
    aiService?: AIService
  ) {
    this.allLogs = allLogs;
    this.recentChanges = recentChanges;
    this.aiService = aiService || new AIService();
    this.ticketService = new TicketService(ticketStorage);

    const systemPrompt = this.aiService.generateSystemPrompt(logsFileNumber);
    this.memory = new AgentMemory(systemPrompt, logs, recentChanges);
  }

  async run(): Promise<string> {
    try {
      console.log(chalk.blue(`\n${'═'.repeat(80)}`));
      console.log(chalk.blue(`Starting Log Triage Agent - Log Set #${this.logsFileNumber}`));
      console.log(chalk.blue(`${'═'.repeat(80)}\n`));

      const result = await this.investigateLogs();
      return this.formatResult(result);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`Agent error: ${errorMsg}`));
      return `Investigation failed: ${errorMsg}`;
    }
  }

  private async investigateLogs(): Promise<InvestigationResult> {
    let iteration = 0;
    const findings: string[] = [];
    const ticketsCreated: any[] = [];
    let isComplete = false;

    while (iteration < this.maxIterations && !isComplete) {
      iteration++;
      console.log(chalk.cyan(`\n→ Iteration ${iteration}/${this.maxIterations}`));

      try {
        const messages = this.memory.getFormattedMessagesForLLM();
        const llmResponse = await this.aiService.callLLM(
          this.memory.getSystemPrompt(),
          messages
        );

        this.memory.addAssistantMessage(llmResponse.response);
        console.log(chalk.gray(`Agent: ${llmResponse.response.substring(0, 150)}...`));

        // Execute any tool calls
        if (llmResponse.toolCalls && llmResponse.toolCalls.length > 0) {
          console.log(chalk.yellow(`Tools called: ${llmResponse.toolCalls.map((t) => t.toolName).join(', ')}`));

          for (const toolCall of llmResponse.toolCalls) {
            try {
              const toolResult = await executeTool(toolCall.toolName, toolCall.arguments, {
                allLogs: this.allLogs,
                recentChanges: this.recentChanges,
                storage: this.ticketService['storage'],
              });

              this.memory.addToolResult(toolCall.toolName, toolResult);

              if (toolCall.toolName === 'createTicket' && toolResult.success) {
                ticketsCreated.push(toolResult.ticket);
              }

              console.log(chalk.green(`✓ ${toolCall.toolName} executed successfully`));
            } catch (toolError) {
              const errorMsg = toolError instanceof Error ? toolError.message : String(toolError);
              this.memory.addToolResult(toolCall.toolName, null, errorMsg);
              console.log(chalk.red(`✗ ${toolCall.toolName} failed: ${errorMsg}`));
            }
          }
        }

        if (llmResponse.stop_reason === 'end_turn' || llmResponse.response.includes('investigation complete')) {
          isComplete = true;
          console.log(chalk.green('\n✓ Investigation complete'));
        }

        // Add delay between iterations to avoid rate limits
        if (iteration < this.maxIterations && !isComplete) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(chalk.red(`Error in iteration ${iteration}: ${errorMsg}`));

        if (error instanceof Error && this.aiService.isRateLimited(error)) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }

        if (iteration >= this.maxIterations) {
          throw error;
        }
      }
    }

    return {
      summary: `Completed investigation of log set #${this.logsFileNumber}`,
      findings,
      ticketsCreated,
      suggestedActions: this.extractSuggestedActions(),
      iterations: iteration,
    };
  }

  private extractSuggestedActions(): string[] {
    const messages = this.memory.getMessages();
    const actions: string[] = [];

    messages.forEach((msg) => {
      if (msg.content && msg.content.includes('suggest')) {
        actions.push(msg.content);
      }
    });

    return actions;
  }

  private formatResult(result: InvestigationResult): string {
    let output = chalk.green(`\n${'═'.repeat(80)}\n`);
    output += chalk.green(`INVESTIGATION SUMMARY\n`);
    output += chalk.green(`${'═'.repeat(80)}\n\n`);

    output += `${chalk.bold('Log Set #' + this.logsFileNumber)} Investigation Complete\n`;
    output += `Iterations: ${result.iterations}/${this.maxIterations}\n`;
    output += `Tickets Created: ${result.ticketsCreated.length}\n`;

    if (result.ticketsCreated.length > 0) {
      output += `\n${chalk.bold('Tickets Created:')}\n`;
      result.ticketsCreated.forEach((ticket) => {
        output += `  • [${ticket.severity.toUpperCase()}] ${ticket.title} (${ticket.id})\n`;
      });
    }

    if (result.suggestedActions.length > 0) {
      output += `\n${chalk.bold('Suggested Actions:')}\n`;
      result.suggestedActions.slice(0, 3).forEach((action) => {
        output += `  • ${action.substring(0, 70)}...\n`;
      });
    }

    output += `\n${chalk.green('═'.repeat(80))}\n`;

    return output;
  }
}
