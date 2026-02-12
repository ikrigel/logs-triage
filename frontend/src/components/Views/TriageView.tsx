import { useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { ChatWindow } from '../Chat/ChatWindow';
import { ChatInput } from '../Chat/ChatInput';
import { LogSourceSelector } from '../Chat/LogSourceSelector';
import { useChat } from '../../hooks/useChat';
import { API_ENDPOINTS } from '../../config/api';
import './TriageView.css';

export function TriageView() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const { aiProvider, aiModel } = useUIStore();
  const { messages, isLoading, error, isMutating, sendMessage, clearError } =
    useChat(currentSessionId);

  const handleStartConversation = async (logSetNumber: number) => {
    try {
      setSessionLoading(true);
      setSessionError(null);

      const apiKey = localStorage.getItem(`${aiProvider}_api_key`);

      const response = await fetch(API_ENDPOINTS.CHAT_START, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logSetNumber,
          provider: aiProvider,
          model: aiModel,
          apiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Failed to start conversation',
        }));
        throw new Error(errorData.error || 'Failed to start conversation');
      }

      const data = await response.json();
      setCurrentSessionId(data.sessionId);
      setSessionError(null);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to start conversation';
      setSessionError(errorMsg);
      console.error('Error starting conversation:', err);
    } finally {
      setSessionLoading(false);
    }
  };

  const handleEndConversation = () => {
    setCurrentSessionId(null);
  };

  const handleSendMessage = (message: string) => {
    sendMessage(message);
  };

  return (
    <div className="triage-view">
      {!currentSessionId ? (
        <LogSourceSelector
          onSelectLogSet={handleStartConversation}
          loading={sessionLoading}
        />
      ) : (
        <div className="chat-session-container">
          <div className="chat-header-bar">
            <div className="session-info">
              <span className="session-status">🟢 Active Session</span>
              <span className="message-count">
                {messages.length} messages
              </span>
            </div>
            <button
              className="end-session-btn"
              onClick={handleEndConversation}
              aria-label="End conversation"
            >
              ✕ End Conversation
            </button>
          </div>

          {sessionError && (
            <div className="error-banner">
              <span>❌ {sessionError}</span>
            </div>
          )}

          {error && (
            <div className="error-banner">
              <span>❌ {error}</span>
              <button
                onClick={clearError}
                className="error-close"
                aria-label="Close error"
              >
                ✕
              </button>
            </div>
          )}

          <ChatWindow messages={messages} isLoading={isLoading} />

          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isLoading || isMutating}
            placeholder="Ask a question about the logs..."
          />
        </div>
      )}
    </div>
  );
}
