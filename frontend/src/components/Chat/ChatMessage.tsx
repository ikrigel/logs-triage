import type { ChatMessage as ChatMessageType } from '../../types/index';
import './ChatMessage.css';

interface ChatMessageProps {
  message: ChatMessageType;
  onToolResultClick?: (toolName: string) => void;
}

export function ChatMessage({
  message,
  onToolResultClick,
}: ChatMessageProps) {
  const getRoleClass = () => {
    if (message.role === 'tool') return 'tool-execution';
    return `${message.role}-message`;
  };

  const formatContent = (content: string) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className={`message ${getRoleClass()}`}>
      {message.role === 'tool' && message.toolCall ? (
        <div className="tool-execution-content">
          <div className="tool-header">
            <span className="tool-icon">🔧</span>
            <span className="tool-name">{message.toolCall.toolName}</span>
            {onToolResultClick && (
              <button
                className="tool-details-btn"
                onClick={() => onToolResultClick(message.toolCall!.toolName)}
                title="View tool details"
              >
                ⓘ
              </button>
            )}
          </div>
          {message.toolCall.result && (
            <div className="tool-result-summary">
              {typeof message.toolCall.result === 'object' &&
              'logs' in message.toolCall.result ? (
                <span>
                  Found {message.toolCall.result.logs?.length || 0} matching logs
                </span>
              ) : typeof message.toolCall.result === 'object' &&
                'ticket' in message.toolCall.result ? (
                <span>Created ticket: {message.toolCall.result.ticket?.id}</span>
              ) : (
                <span>Tool executed successfully</span>
              )}
            </div>
          )}
        </div>
      ) : (
        <p
          dangerouslySetInnerHTML={{
            __html: formatContent(message.content),
          }}
        />
      )}
      <div className="message-timestamp">
        {new Date(message.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
    </div>
  );
}
