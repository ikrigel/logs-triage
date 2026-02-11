import { Router, Request, Response } from 'express';
import { chatSessionStorage } from '../../storage/chatSessions.js';
import { ConversationalAgent } from '../../agent/conversationalAgent.js';
import { AgentMemory } from '../../agent/memory.js';
import { AIService } from '../../services/aiService.js';
import { TicketService } from '../../services/ticketService.js';
import { TicketStorage } from '../../storage/tickets.js';
import { loadLogs, loadRecentChanges } from '../../services/logsAndChangesService.js';

export const chatRouter = Router();

const ticketStorage = new TicketStorage();

// POST /api/chat/start - Start new conversation session
chatRouter.post('/start', async (req: Request, res: Response) => {
  try {
    const { logs, logSetNumber, provider, model, apiKey } = req.body;

    let logsToUse: any[];
    let allLogsToUse: any[];
    let changes: any[];
    let source: string;

    if (logSetNumber) {
      allLogsToUse = await loadLogs(logSetNumber);
      changes = await loadRecentChanges(logSetNumber);
      logsToUse = allLogsToUse.slice(-5);
      source = `log_set_${logSetNumber}`;
    } else if (logs) {
      allLogsToUse = logs;
      logsToUse = logs.slice(-5);
      changes = [];
      source = 'custom_logs';
    } else {
      return res
        .status(400)
        .json({ error: 'Either logs or logSetNumber required' });
    }

    // Create session
    const sessionId = chatSessionStorage.createSession({
      logs: logsToUse,
      allLogs: allLogsToUse,
      recentChanges: changes,
      source,
      provider: (provider || 'gemini') as any,
      model: model || 'gemini-2.0-flash',
    });

    res.json({
      sessionId,
      initialMessage: `Hello! I'm your log triage assistant. I have ${allLogsToUse.length} logs loaded from ${source}. How can I help you investigate?`,
      logsInfo: {
        count: allLogsToUse.length,
        source,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error starting chat session:', error);
    res.status(500).json({ error: `Failed to start chat: ${msg}` });
  }
});

// POST /api/chat/:sessionId/message - Send user message
chatRouter.post('/:sessionId/message', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const session = chatSessionStorage.getSession(sessionId);
    if (!session) {
      return res
        .status(404)
        .json({ error: 'Session not found or expired' });
    }

    // Restore memory from session
    const systemPrompt = new AIService().generateConversationalPrompt();
    const memory = AgentMemory.restore(
      systemPrompt,
      session.logsContext.logs,
      session.logsContext.recentChanges,
      session.memoryState
    );

    // Create agent
    await ticketStorage.initialize();
    const aiService = new AIService({
      provider: session.provider,
      model: session.model,
    });

    const agent = new ConversationalAgent(
      memory,
      session.logsContext.allLogs,
      session.logsContext.recentChanges,
      ticketStorage,
      aiService
    );

    // Process message
    const turn = await agent.processUserMessage(message);

    // Update session with new memory state
    chatSessionStorage.updateSession(sessionId, {
      memoryState: memory.serialize(),
      status: 'active',
    });

    res.json({
      assistantResponse: turn.assistantResponse,
      toolExecutions: turn.toolExecutions.map((te) => ({
        toolCall: te.toolCall,
        result: te.result,
      })),
      status: 'active',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error processing chat message:', error);
    res.status(500).json({ error: `Message processing failed: ${msg}` });
  }
});

// GET /api/chat/:sessionId - Get conversation state
chatRouter.get('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = chatSessionStorage.getSession(sessionId);

    if (!session) {
      return res
        .status(404)
        .json({ error: 'Session not found or expired' });
    }

    res.json({
      sessionId: session.id,
      messages: session.memoryState.entries.map((entry) => ({
        role: entry.role,
        content: entry.content,
        timestamp: entry.timestamp,
        toolResults: entry.toolResults,
      })),
      logsInfo: {
        count: session.logsContext.allLogs.length,
        source: session.logsContext.source,
      },
      status: session.status,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error retrieving chat session:', error);
    res.status(500).json({ error: `Failed to get session: ${msg}` });
  }
});

// DELETE /api/chat/:sessionId - End conversation
chatRouter.delete('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    chatSessionStorage.deleteSession(sessionId);
    res.json({ success: true, message: 'Session ended' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error ending chat session:', error);
    res.status(500).json({ error: `Failed to end session: ${msg}` });
  }
});
