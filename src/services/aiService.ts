import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText, LanguageModel } from 'ai';
import { toolDefinitions } from '../tools';

export type AIProvider = 'gemini' | 'perplexity' | 'claude';

interface AIServiceConfig {
  provider?: AIProvider;
  model?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
}

export class AIService {
  private model?: LanguageModel | any;
  private provider: AIProvider;
  private apiKey: string;
  private modelName: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: AIServiceConfig = {}) {
    const provider = config.provider || process.env.AI_PROVIDER || 'gemini';
    const temperature = config.temperature ?? 0.7;
    const maxTokens = config.maxTokens ?? 2000;

    this.temperature = temperature;
    this.maxTokens = maxTokens;
    this.provider = provider as AIProvider;

    if (provider === 'gemini') {
      const apiKey = config.apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!apiKey) {
        throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not set in environment');
      }
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
      this.apiKey = apiKey;
      this.modelName = config.model || 'gemini-2.0-flash';
      this.model = google(this.modelName);
    } else if (provider === 'claude') {
      const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY || (process.env as any).claude_api_key;
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY not set in environment');
      }
      process.env.ANTHROPIC_API_KEY = apiKey;
      this.apiKey = apiKey;
      this.modelName = config.model || 'claude-3-opus-20240229';
      this.model = anthropic(this.modelName);
    } else if (provider === 'perplexity') {
      const apiKey = config.apiKey || process.env.PERPLEXITY_API_KEY || (process.env as any).perplexity_api_key;
      if (!apiKey) {
        throw new Error('PERPLEXITY_API_KEY not set in environment');
      }
      this.apiKey = apiKey;
      this.modelName = config.model || 'sonar';
    } else {
      throw new Error(`Unsupported AI provider: ${provider}`);
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
      if (this.provider === 'perplexity') {
        return await this.callPerplexity(systemPrompt, messages);
      } else if (this.provider === 'claude') {
        return await this.callClaude(systemPrompt, messages);
      } else {
        return await this.callGemini(systemPrompt, messages);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`AI Service error: ${error.message}`);
      }
      throw error;
    }
  }

  private async callGemini(
    systemPrompt: string,
    messages: Array<{ role: string; content: string }>
  ): Promise<{
    response: string;
    toolCalls?: Array<{ toolName: string; arguments: Record<string, any> }>;
    stop_reason?: string;
  }> {
    const toolsDescription = toolDefinitions
      .map((tool) => {
        const props = (tool.inputSchema as any)._def?.schema?.shape || {};
        const propDescriptions = Object.entries(props)
          .map(([key]) => `  - ${key}`)
          .join('\n');
        return `- ${tool.name}: ${tool.description}\n${propDescriptions}`;
      })
      .join('\n');

    const enhancedSystem = `${systemPrompt}

AVAILABLE TOOLS:
${toolsDescription}

When using tools, format your response with <TOOL_CALL> blocks like this:
<TOOL_CALL>
{
  "toolName": "search_logs",
  "arguments": { "keyword": "error" }
}
</TOOL_CALL>`;

    const result = await generateText({
      model: this.model!,
      system: enhancedSystem,
      messages: messages as any,
      temperature: this.temperature,
    });

    // Parse tool calls from the response text
    const toolCalls: Array<{ toolName: string; arguments: Record<string, any> }> = [];
    const toolCallRegex = /<TOOL_CALL>\s*(\{[\s\S]*?\})\s*<\/TOOL_CALL>/g;
    let match;

    while ((match = toolCallRegex.exec(result.text)) !== null) {
      try {
        const toolCall = JSON.parse(match[1]);
        if (toolCall.toolName && toolCall.arguments) {
          toolCalls.push(toolCall);
        }
      } catch {
        // Skip malformed tool calls
      }
    }

    return {
      response: result.text,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      stop_reason: result.finishReason,
    };
  }

  private async callClaude(
    systemPrompt: string,
    messages: Array<{ role: string; content: string }>
  ): Promise<{
    response: string;
    toolCalls?: Array<{ toolName: string; arguments: Record<string, any> }>;
    stop_reason?: string;
  }> {
    const toolsDescription = toolDefinitions
      .map((tool) => {
        const props = (tool.inputSchema as any)._def?.schema?.shape || {};
        const propDescriptions = Object.entries(props)
          .map(([key]) => `  - ${key}`)
          .join('\n');
        return `- ${tool.name}: ${tool.description}\n${propDescriptions}`;
      })
      .join('\n');

    const enhancedSystem = `${systemPrompt}

AVAILABLE TOOLS:
${toolsDescription}

When using tools, format your response with <TOOL_CALL> blocks like this:
<TOOL_CALL>
{
  "toolName": "search_logs",
  "arguments": { "keyword": "error" }
}
</TOOL_CALL>`;

    const result = await generateText({
      model: this.model!,
      system: enhancedSystem,
      messages: messages as any,
      temperature: this.temperature,
    });

    // Parse tool calls from the response text
    const toolCalls: Array<{ toolName: string; arguments: Record<string, any> }> = [];
    const toolCallRegex = /<TOOL_CALL>\s*(\{[\s\S]*?\})\s*<\/TOOL_CALL>/g;
    let match;

    while ((match = toolCallRegex.exec(result.text)) !== null) {
      try {
        const toolCall = JSON.parse(match[1]);
        if (toolCall.toolName && toolCall.arguments) {
          toolCalls.push(toolCall);
        }
      } catch {
        // Skip malformed tool calls
      }
    }

    return {
      response: result.text,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      stop_reason: result.finishReason,
    };
  }

  private async callPerplexity(
    systemPrompt: string,
    messages: Array<{ role: string; content: string }>
  ): Promise<{
    response: string;
    toolCalls?: Array<{ toolName: string; arguments: Record<string, any> }>;
    stop_reason?: string;
  }> {
    const toolsDescription = toolDefinitions
      .map((tool) => `- ${tool.name}: ${tool.description}`)
      .join('\n');

    const enhancedSystem = `${systemPrompt}

AVAILABLE TOOLS:
${toolsDescription}

When using tools, format your response with <TOOL_CALL> blocks.`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.modelName,
        messages: [
          { role: 'system', content: enhancedSystem },
          ...messages.map((m) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          })),
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as any;
    const responseText = data.choices?.[0]?.message?.content || '';

    // Parse tool calls
    const toolCalls: Array<{ toolName: string; arguments: Record<string, any> }> = [];
    const toolCallRegex = /<TOOL_CALL>\s*(\{[\s\S]*?\})\s*<\/TOOL_CALL>/g;
    let match;

    while ((match = toolCallRegex.exec(responseText)) !== null) {
      try {
        const toolCall = JSON.parse(match[1]);
        if (toolCall.toolName && toolCall.arguments) {
          toolCalls.push(toolCall);
        }
      } catch {
        // Skip malformed tool calls
      }
    }

    return {
      response: responseText,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      stop_reason: data.choices?.[0]?.finish_reason || 'stop',
    };
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
