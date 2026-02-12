import { useState, useEffect } from 'react';
import { useUIStore } from '../../store/uiStore';
import './SettingsView.css';

const PROVIDERS = {
  gemini: {
    name: 'Google Gemini',
    icon: '🔮',
    description: 'Fast and capable generative AI with strong tool use',
    models: [
      { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Recommended)' },
      { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash Exp (Latest)' },
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Most Capable)' },
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
      { value: 'gemini-1.5-pro-exp-0801', label: 'Gemini 1.5 Pro Exp' },
    ],
  },
  claude: {
    name: 'Anthropic Claude',
    icon: '🧠',
    description: 'Advanced reasoning with excellent coding capabilities',
    models: [
      { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet (Latest)' },
      { value: 'claude-3-5-haiku', label: 'Claude 3.5 Haiku (Fast)' },
      { value: 'claude-3-opus', label: 'Claude 3 Opus (Most Powerful)' },
    ],
  },
  perplexity: {
    name: 'Perplexity',
    icon: '🌐',
    description: 'Web search integration with reasoning capabilities',
    models: [
      { value: 'sonar', label: 'Sonar (Standard)' },
      { value: 'sonar-pro', label: 'Sonar Pro (Advanced)' },
      { value: 'sonar-reasoning', label: 'Sonar Reasoning (Deep)' },
    ],
  },
};

export function SettingsView() {
  const { aiProvider, aiModel, setAIProvider, setAIModel } = useUIStore();
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    // Load API keys from localStorage
    const keys: Record<string, string> = {};
    Object.keys(PROVIDERS).forEach((provider) => {
      const key = localStorage.getItem(`${provider}_api_key`) || '';
      keys[provider] = key;
    });
    setApiKeys(keys);
  }, []);

  const handleProviderChange = (provider: string) => {
    setAIProvider(provider as any);
    // Auto-select first model for new provider
    const models = PROVIDERS[provider as keyof typeof PROVIDERS].models;
    if (models.length > 0) {
      setAIModel(models[0].value);
    }
  };

  const handleModelChange = (model: string) => {
    setAIModel(model);
  };

  const handleApiKeyChange = (provider: string, value: string) => {
    setApiKeys((prev) => ({
      ...prev,
      [provider]: value,
    }));
  };

  const handleSaveApiKeys = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      Object.entries(apiKeys).forEach(([provider, key]) => {
        if (key) {
          localStorage.setItem(`${provider}_api_key`, key);
        } else {
          localStorage.removeItem(`${provider}_api_key`);
        }
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const handleDeleteApiKey = (provider: string) => {
    setApiKeys((prev) => ({
      ...prev,
      [provider]: '',
    }));
    localStorage.removeItem(`${provider}_api_key`);
  };

  const currentProvider = PROVIDERS[aiProvider as keyof typeof PROVIDERS];
  const availableModels = currentProvider.models;

  return (
    <div className="settings-view">
      <div className="settings-header">
        <h2>Settings</h2>
        <p>Configure AI provider and API credentials</p>
      </div>

      <div className="settings-container">
        {/* Provider Selection */}
        <div className="settings-section">
          <h3>AI Provider</h3>
          <p className="section-description">
            Select your preferred AI provider for log analysis
          </p>

          <div className="providers-grid">
            {Object.entries(PROVIDERS).map(([key, provider]) => (
              <button
                key={key}
                className={`provider-card ${aiProvider === key ? 'selected' : ''}`}
                onClick={() => handleProviderChange(key)}
              >
                <div className="provider-icon">{provider.icon}</div>
                <h4>{provider.name}</h4>
                <p>{provider.description}</p>
                {aiProvider === key && <div className="checkmark">✓</div>}
              </button>
            ))}
          </div>
        </div>

        {/* Model Selection */}
        <div className="settings-section">
          <h3>Model</h3>
          <p className="section-description">
            Choose which {currentProvider.name} model to use
          </p>

          <div className="model-list">
            {availableModels.map((model) => (
              <label key={model.value} className="model-item">
                <input
                  type="radio"
                  name="model"
                  value={model.value}
                  checked={aiModel === model.value}
                  onChange={(e) => handleModelChange(e.target.value)}
                />
                <span className="model-label">{model.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* API Keys */}
        <div className="settings-section">
          <h3>API Keys</h3>
          <p className="section-description">
            Add your API keys to authenticate with selected providers
          </p>

          <div className="api-keys-form">
            {Object.entries(PROVIDERS).map(([key, provider]) => (
              <div key={key} className="api-key-input-group">
                <label htmlFor={`${key}-api-key`}>{provider.name} API Key</label>
                <div className="input-wrapper">
                  <input
                    id={`${key}-api-key`}
                    type="password"
                    placeholder={`Enter your ${provider.name} API key`}
                    value={apiKeys[key] || ''}
                    onChange={(e) => handleApiKeyChange(key, e.target.value)}
                    className="api-key-input"
                  />
                  {apiKeys[key] && (
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteApiKey(key)}
                      title="Delete API key"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            className={`save-btn ${saveStatus !== 'idle' ? saveStatus : ''}`}
            onClick={handleSaveApiKeys}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'saving' ? 'Saving...' : 'Save API Keys'}
          </button>
        </div>

        {/* Info Section */}
        <div className="settings-section info-section">
          <h3>📋 API Key Setup</h3>
          <ul>
            <li>
              <strong>Gemini:</strong> Get API key from{' '}
              <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer">
                Google AI Studio
              </a>
            </li>
            <li>
              <strong>Claude:</strong> Get API key from{' '}
              <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer">
                Anthropic Console
              </a>
            </li>
            <li>
              <strong>Perplexity:</strong> Get API key from{' '}
              <a href="https://www.perplexity.ai" target="_blank" rel="noopener noreferrer">
                Perplexity Dashboard
              </a>
            </li>
          </ul>
          <p className="info-note">
            ⚠️ Your API keys are stored locally in your browser. They are not sent to any server except
            the API provider.
          </p>
        </div>
      </div>
    </div>
  );
}
