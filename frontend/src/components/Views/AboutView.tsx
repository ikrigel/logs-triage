import './AboutView.css';

export function AboutView() {
  return (
    <div className="about-view">
      <div className="about-header">
        <h1>About Production Logs Triage Agent</h1>
        <p className="about-subtitle">
          Intelligent automated investigation of production logs
        </p>
      </div>

      <div className="about-content">
        {/* Overview Section */}
        <section className="about-section">
          <h2>What is this?</h2>
          <p>
            The <strong>Production Logs Triage Agent</strong> is an intelligent
            system that automatically investigates production logs, identifies
            issues, correlates them with system changes, and creates support
            tickets with actionable recommendations.
          </p>
          <p>
            Instead of manually sifting through hundreds of log lines, you can
            ask natural language questions and have an AI agent investigate,
            find patterns, suggest solutions, and create tickets automatically.
          </p>
        </section>

        {/* Key Features */}
        <section className="about-section">
          <h2>Key Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI-Powered Investigation</h3>
              <p>
                Automatically analyzes logs using LLM technology from Gemini,
                Claude, or Perplexity
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Interactive Chat</h3>
              <p>
                Have a natural conversation with the agent to guide the
                investigation
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Deep Search</h3>
              <p>
                Recursively search logs by request_id, batch_id, service, level,
                and keywords
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Correlation</h3>
              <p>
                Connect errors with deployments and configuration changes to
                identify root causes
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎫</div>
              <h3>Auto Tickets</h3>
              <p>
                Create organized support tickets with severity, affected
                services, and AI suggestions
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Mobile Responsive</h3>
              <p>
                Works seamlessly on desktop, tablet, and mobile devices with
                full functionality
              </p>
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="about-section">
          <h2>Technology Stack</h2>
          <div className="tech-stack">
            <div className="tech-column">
              <h3>Frontend</h3>
              <ul>
                <li>React 19.2.0</li>
                <li>TypeScript 5.9.3</li>
                <li>Vite 7.3.1</li>
                <li>Zustand (State)</li>
                <li>TanStack Query</li>
              </ul>
            </div>
            <div className="tech-column">
              <h3>Backend</h3>
              <ul>
                <li>Node.js</li>
                <li>Express.js</li>
                <li>TypeScript</li>
                <li>Vercel AI SDK</li>
                <li>JSON Storage</li>
              </ul>
            </div>
            <div className="tech-column">
              <h3>AI Providers</h3>
              <ul>
                <li>Google Gemini 2.0</li>
                <li>Anthropic Claude</li>
                <li>Perplexity</li>
                <li>Multi-provider support</li>
                <li>Tool calling enabled</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Investigation Tools */}
        <section className="about-section">
          <h2>Investigation Tools</h2>
          <div className="tools-list">
            <div className="tool-item">
              <h3>🔎 Search Logs</h3>
              <p>
                Deep search through production logs with support for multiple
                filters and recursive investigation
              </p>
            </div>
            <div className="tool-item">
              <h3>🔗 Check Recent Changes</h3>
              <p>
                Correlate errors with deployments and configuration changes to
                identify what went wrong
              </p>
            </div>
            <div className="tool-item">
              <h3>🎫 Create Tickets</h3>
              <p>
                Generate support tickets with categorization, affected services,
                and AI-generated suggestions
              </p>
            </div>
            <div className="tool-item">
              <h3>🚨 Alert Team</h3>
              <p>
                Send critical issue alerts to your team (extensible to Slack,
                email, webhooks)
              </p>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="about-section">
          <h2>By The Numbers</h2>
          <div className="stats-grid">
            <div className="stat">
              <div className="stat-number">19</div>
              <div className="stat-label">React Components</div>
            </div>
            <div className="stat">
              <div className="stat-number">4</div>
              <div className="stat-label">Investigation Tools</div>
            </div>
            <div className="stat">
              <div className="stat-number">80 kB</div>
              <div className="stat-label">Bundle Size (gzipped)</div>
            </div>
            <div className="stat">
              <div className="stat-number">30+</div>
              <div className="stat-label">E2E Tests</div>
            </div>
            <div className="stat">
              <div className="stat-number">5</div>
              <div className="stat-label">Log Sets</div>
            </div>
            <div className="stat">
              <div className="stat-number">3</div>
              <div className="stat-label">AI Providers</div>
            </div>
          </div>
        </section>

        {/* Getting Started */}
        <section className="about-section">
          <h2>Getting Started</h2>
          <ol className="getting-started-list">
            <li>
              <strong>Add API Key</strong> - Go to Settings and enter your
              Gemini, Claude, or Perplexity API key
            </li>
            <li>
              <strong>Select Log Source</strong> - Choose from 5 predefined log
              sets or upload your own
            </li>
            <li>
              <strong>Start Conversation</strong> - Ask questions about your
              logs in natural language
            </li>
            <li>
              <strong>Or Run Auto Triage</strong> - Let the agent automatically
              investigate and create tickets
            </li>
            <li>
              <strong>Review & Act</strong> - Check the Tickets view and follow
              AI suggestions
            </li>
          </ol>
        </section>

        {/* Links */}
        <section className="about-section">
          <h2>More Information</h2>
          <div className="links-grid">
            <a href="https://github.com/ikrigel/logs-triage" className="info-link">
              📦 GitHub Repository
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Check HELP.md in project root'); }} className="info-link">
              ❓ Troubleshooting Guide
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Check COMPONENTS.md in project root'); }} className="info-link">
              🧩 Component Reference
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Check CLAUDE.md in project root'); }} className="info-link">
              📚 Technical Documentation
            </a>
          </div>
        </section>

        {/* Footer */}
        <section className="about-footer">
          <p>
            <strong>Version:</strong> 1.0.0
          </p>
          <p>
            <strong>Status:</strong> Production Ready
          </p>
          <p>
            Built with ❤️ for production teams who need faster incident response
          </p>
        </section>
      </div>
    </div>
  );
}
