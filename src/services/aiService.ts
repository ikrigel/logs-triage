import { google } from '@ai-sdk/google';
import { generateText, LanguageModel } from 'ai';
import { toolDefinitions } from '../tools';

export type AIProvider = 'gemini' | 'perplexity';

interface AIServiceConfig {
  provider?: AIProvider;
  model?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
}

export class AIService {
  private model: LanguageModel;
  private temperature: number;
  private maxTokens: number;

  constructor(config: AIServiceConfig = {}) {
    const provider = config.provider || 'gemini';
    const temperature = config.temperature ?? 0.7;
    const maxTokens = config.maxTokens ?? 2000;

    this.temperature = temperature;
    this.maxTokens = maxTokens;

    if (provider === 'gemini') {
      const apiKey = config.apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!apiKey) {
        throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not set in environment');
      }
      this.model = google('gemini-1.5-flash', { apiKey });
    } else {
      throw new Error(`Provider ${provider} not yet implemented`);
    }
  }

  async callLLM(
    systemPrompt: string,
    messages: Array<{ role: string; content: string }>
  ): Promise<{
    response: string;
    toolCalls?: Array<{ toolName: string; arguments: Record<string, any> }>;
    stop_reason?: string;
  }> {
    try {
      const result = await generateText({
        model: this.model,
        system: systemPrompt,
        messages: messages as any,
        tools: toolDefinitions as any,
        temperature: this.temperature,
        maxTokens: this.maxTokens,
      });

      // Extract tool calls from the result if available
      const toolCalls: Array<{ toolName: string; arguments: Record<string, any> }> = [];

      if (result.toolCalls && Array.isArray(result.toolCalls)) {
        result.toolCalls.forEach((toolCall: any) => {
          toolCalls.push({
            toolName: toolCall.toolName,
            arguments: toolCall.args || {},
          });
        });
      }

      return {
        response: result.text,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        stop_reason: result.finishReason,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`AI Service error: ${error.message}`);
      }
      throw error;
    }
  }

  generateSystemPrompt(logSetNumber: number): string {
    return `You are an intelligent production log triage agent. Your job is to analyze production logs, identify issues, find root causes, and create tickets with developer suggestions.

You have access to the following tools:
- searchLogs: Deep search through logs with recursive capability
- checkRecentChanges: Correlate system changes with errors
- createTicket: Create support tickets for issues found
- alertTeam: Send alerts about critical issues

INSTRUCTIONS:
1. Start by analyzing the provided logs for ERROR and WARN level entries
2. Use searchLogs to investigate patterns and correlations
3. Use checkRecentChanges to identify potential causes (deployments, config changes, etc.)
4. For each significant issue, create a ticket with clear description and developer suggestions
5. For critical issues, also call alertTeam
6. Provide your final summary with findings and action items

Log Set #${logSetNumber} Analysis:
- Stop when you have fully investigated and taken appropriate actions
- Create tickets for issues that need developer attention
- Alert the team for critical severity issues
- Be thorough but efficient in your investigation`;
  }

  isRateLimited(error: Error): boolean {
    return error.message.includes('rate limit') || error.message.includes('429');
  }

  async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (this.isRateLimited(lastError)) {
          const delay = delayMs * Math.pow(2, i);
          console.log(`Rate limited. Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }
}

export function createAIService(config?: AIServiceConfig): AIService {
  return new AIService(config);
}
