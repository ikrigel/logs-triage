import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { API_ENDPOINTS } from '../config/api';
import type { ChatMessage, ChatSession } from '../types/index';

interface ToolExecution {
  toolCall: {
    toolName: string;
    arguments: any;
  };
  result: any;
}

interface ChatResponse {
  assistantResponse: string;
  toolExecutions: ToolExecution[];
  status: string;
}

export function useChat(sessionId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch conversation state
  const { data: session } = useQuery({
    queryKey: ['chat', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;

      const response = await fetch(API_ENDPOINTS.CHAT_SESSION(sessionId), {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat session');
      }

      const data: ChatSession = await response.json();
      setMessages(
        data.messages.map((msg) => ({
          ...msg,
          id: msg.id || `${msg.timestamp}-${Math.random()}`,
        }))
      );
      return data;
    },
    enabled: !!sessionId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!sessionId) {
        throw new Error('No active chat session');
      }

      // Add user message optimistically
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const response = await fetch(
          API_ENDPOINTS.CHAT_MESSAGE(sessionId),
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: 'Failed to send message',
          }));
          throw new Error(errorData.error || 'Message failed to send');
        }

        const data: ChatResponse = await response.json();

        // Add tool executions as messages
        if (data.toolExecutions && data.toolExecutions.length > 0) {
          for (const toolExec of data.toolExecutions) {
            const toolMessage: ChatMessage = {
              id: `tool-${Date.now()}-${Math.random()}`,
              role: 'tool',
              content: `Tool: ${toolExec.toolCall.toolName}`,
              timestamp: new Date().toISOString(),
              toolCall: toolExec.toolCall,
            };
            setMessages((prev) => [...prev, toolMessage]);
          }
        }

        // Add assistant response
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.assistantResponse,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        setError(null);
        return data;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
  });

  const sendMessage = useCallback(
    (message: string) => {
      if (!message.trim()) return;
      sendMessageMutation.mutate(message);
    },
    [sendMessageMutation]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    session,
    sendMessage,
    clearError,
    isMutating: sendMessageMutation.isPending,
  };
}
