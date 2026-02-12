import { useState } from 'react';
import './LogSourceSelector.css';

interface LogSourceSelectorProps {
  onSelectLogSet: (logSetNumber: number) => void;
  loading?: boolean;
}

const LOG_SETS = [
  { id: 1, name: 'Log Set 1', description: 'Healthy system - No errors' },
  { id: 2, name: 'Log Set 2', description: 'Warnings and deprecations' },
  { id: 3, name: 'Log Set 3', description: 'Critical issues' },
  { id: 4, name: 'Log Set 4', description: 'Post-deployment errors' },
  { id: 5, name: 'Log Set 5', description: 'Deep investigation scenario' },
];

export function LogSourceSelector({
  onSelectLogSet,
  loading = false,
}: LogSourceSelectorProps) {
  const [selectedSet, setSelectedSet] = useState<number>(1);

  const handleSelectSet = (setId: number) => {
    setSelectedSet(setId);
    onSelectLogSet(setId);
  };

  return (
    <div className="log-source-selector">
      <div className="selector-header">
        <h3>📋 Select Logs to Investigate</h3>
        <p>Choose a log set or upload your own logs to begin</p>
      </div>

      <div className="log-sets-grid">
        {LOG_SETS.map((logSet) => (
          <button
            key={logSet.id}
            className={`log-set-card ${selectedSet === logSet.id ? 'selected' : ''}`}
            onClick={() => handleSelectSet(logSet.id)}
            disabled={loading}
            aria-pressed={selectedSet === logSet.id}
          >
            <div className="card-number">{logSet.id}</div>
            <div className="card-content">
              <h4>{logSet.name}</h4>
              <p>{logSet.description}</p>
            </div>
            {selectedSet === logSet.id && (
              <div className="card-checkmark">✓</div>
            )}
          </button>
        ))}
      </div>

      <button
        className="start-conversation-btn"
        onClick={() => handleSelectSet(selectedSet)}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="spinner"></span>
            <span>Starting conversation...</span>
          </>
        ) : (
          <>
            <span>🚀</span>
            <span>Start Conversation</span>
          </>
        )}
      </button>

      <div className="selector-info">
        <p>💡 Tip: Each log set demonstrates different investigation scenarios</p>
      </div>
    </div>
  );
}
