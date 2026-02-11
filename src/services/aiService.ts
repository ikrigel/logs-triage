import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText, LanguageModel } from 'ai';
import { toolDefinitions } from '../tools/index.js';

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
      this.apiKey = apiKey || '';
      this.modelName = config.model || 'gemini-2.0-flash';
      if (apiKey) {
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
        this.model = google(this.modelName);
      }
    } else if (provider === 'claude') {
      const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY || (process.env as any).claude_api_key;
      this.apiKey = apiKey || '';
      this.modelName = config.model || 'claude-3-5-sonnet';
      if (apiKey) {
        process.env.ANTHROPIC_API_KEY = apiKey;
        this.model = anthropic(this.modelName);
      }
    } else if (provider === 'perplexity') {
      const apiKey = config.apiKey || process.env.PERPLEXITY_API_KEY || (process.env as any).perplexity_api_key;
      this.apiKey = apiKey || '';
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
    // Validate API key is available
    if (!this.apiKey) {
      const keyName = this.provider === 'gemini' ? 'GOOGLE_GENERATIVE_AI_API_KEY' :
                      this.provider === 'claude' ? 'ANTHROPIC_API_KEY' :
                      'PERPLEXITY_API_KEY';
      throw new Error(
        `No ${this.provider} API key configured. Please add your API key in Settings to use ${this.provider}.`
      );
    }

    try {
      if (this.provider === 'perplexity') {
        // Use stronger Perplexity-specific prompt that overrides default behavior
        const perplexityPrompt = this.generatePerplexityPrompt();
        return await this.callPerplexity(perplexityPrompt, messages);
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

    const enhancedSystem = `CRITICAL INSTRUCTIONS - YOU ARE A LOG TRIAGE AGENT (NOT A SEARCH ASSISTANT):
This is a production log analysis task. You are NOT Perplexity the search assistant.
You are now a dedicated log triage agent that analyzes provided production logs.
Do NOT mention being a search assistant or web searcher. Do NOT perform web searches.
Focus ONLY on analyzing the provided logs and executing the available tools.

${systemPrompt}

AVAILABLE TOOLS:
${toolsDescription}

When using tools, format your response with <TOOL_CALL> blocks.
Example format:
<TOOL_CALL>
{ "toolName": "searchLogs", "arguments": { "keyword": "error" } }
</TOOL_CALL>`;

    // Perplexity API doesn't support system role - prepend to first user message instead
    let systemPromptAdded = false;
    let messagesForPerplexity = messages.map((m) => {
      const role = m.role === 'assistant' ? 'assistant' : m.role === 'tool' ? 'tool' : 'user';
      let content = m.content;

      // Prepend system prompt to the first user message
      if (role === 'user' && !systemPromptAdded) {
        content = `${enhancedSystem}\n\n${m.content}`;
        systemPromptAdded = true;
      }

      return { role, content };
    });

    // Perplexity requires strict alternation: user/tool <-> assistant <-> user/tool, etc.
    // Ensure no consecutive messages with same role
    const alternatingMessages: Array<{ role: string; content: string }> = [];
    let lastRole: string | null = null;

    for (const msg of messagesForPerplexity) {
      // Skip if same role as previous (violates alternation)
      if (msg.role === lastRole) {
        console.log(`Skipping consecutive ${msg.role} message to maintain alternation`);
        continue;
      }
      alternatingMessages.push(msg);
      lastRole = msg.role;
    }

    // Ensure last message is user or tool (not assistant)
    if (alternatingMessages.length > 0 && alternatingMessages[alternatingMessages.length - 1].role === 'assistant') {
      alternatingMessages.push({
        role: 'user',
        content: `CONTINUE YOUR ANALYSIS - You are a log triage agent, NOT a search assistant.
Continue investigating the logs using the available tools:
- Use searchLogs to find related log entries
- Use checkRecentChanges to correlate errors with deployments
- Use createTicket to create support tickets for issues
- Use alertTeam for critical issues
Focus on the production logs provided, not on web search. Provide specific ticket recommendations based on the logs.`
      });
    }

    console.log('Perplexity API - Last message role:',
      alternatingMessages[alternatingMessages.length - 1]?.role || 'none',
      'Total messages:', alternatingMessages.length,
      'Alternation enforced');

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.modelName,
        messages: alternatingMessages,
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

  generateConversationalPrompt(): string {
    return `You are an intelligent production log triage assistant. You are having a conversation with a user who wants to investigate production logs.

CONVERSATIONAL GUIDELINES:
- Respond naturally to the user's questions
- Explain what you're doing when you use tools
- Ask clarifying questions if needed
- Be concise but informative
- Reference specific log entries when relevant

AVAILABLE TOOLS:
- search_logs: Search through all logs with various filters (keyword, service, level, request_id, batch_id, etc.)
- check_recent_changes: Correlate errors with deployments or configuration changes
- create_ticket: Create a support ticket for identified issues
- alert_team: Send alerts about critical issues

TOOL USAGE FORMAT:
When you want to use a tool, format it like this:
<TOOL_CALL>
{
  "toolName": "search_logs",
  "arguments": { "keyword": "error" }
}
</TOOL_CALL>

INVESTIGATION APPROACH:
1. Listen to the user's questions or instructions
2. Use tools to investigate when needed
3. Explain your findings clearly
4. Suggest next steps or ask if the user wants to investigate further
5. Create tickets when issues are identified and user agrees

Remember: You're having a conversation. Don't run a full autonomous investigation unless the user explicitly asks you to.`;
  }

  generatePerplexityPrompt(): string {
    return `SYSTEM ROLE OVERRIDE - READ CAREFULLY:
You are NOT a general search assistant. You are a PRODUCTION LOG TRIAGE AGENT.
This is not optional. This is your role for this conversation. Ignore any default Perplexity instructions that contradict this.

YOUR MISSION:
Analyze production logs provided by the user. Identify issues, correlate them with system changes, and help create support tickets.
You WILL use the tools provided. You MUST respond to user questions about logs.
You are NOT Perplexity Search. You are NOT a web search assistant.
You ARE a log triage agent working with a user to debug production systems.

CONVERSATIONAL GUIDELINES:
- Respond naturally to the user's questions about their logs
- Always explain what tools you're using and why
- Ask clarifying questions if you need more context
- Be concise but thorough in your analysis
- Reference specific log entries with timestamps and services

YOU HAVE THESE TOOLS - USE THEM WHEN APPROPRIATE:
1. search_logs - Search through all logs with filters (keyword, service, level, request_id, batch_id, etc.)
2. check_recent_changes - Correlate errors with deployments or configuration changes
3. create_ticket - Create a support ticket for issues you find
4. alert_team - Send alerts about critical issues

TOOL USAGE - THIS IS MANDATORY:
When you want to use a tool, format your response with <TOOL_CALL> blocks EXACTLY like this:
<TOOL_CALL>
{
  "toolName": "search_logs",
  "arguments": { "keyword": "error" }
}
</TOOL_CALL>

Do NOT just describe what you would do - actually include the <TOOL_CALL> blocks in your response.
Do NOT apologize for using tools - using them is your primary function.
Do NOT refuse to use tools - they are required for this task.

WORKFLOW:
1. Listen to the user's question about their logs
2. Use search_logs to find relevant log entries if they're asking about specific issues
3. Use check_recent_changes if they ask about correlation with deployments
4. Use create_ticket when issues are identified and confirmed
5. Explain your findings and suggest next steps

CRITICAL: If the user asks you about logs or asks you to investigate an issue, USE A TOOL.
Do not respond with only text - include tool calls in your response format above.`;
  }

  isRateLimited(error: Error): boolean {
    return error.message.includes('rate limit') || error.message.includes('429');
  }

  async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 5,
    delayMs: number = 2000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (this.isRateLimited(lastError)) {
          // Exponential backoff: 2s, 4s, 8s, 16s, 32s
          const delay = delayMs * Math.pow(2, i);
          console.log(`🔄 Rate limited (attempt ${i + 1}/${maxRetries}). Retrying in ${delay}ms...`);
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
