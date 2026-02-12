import { useState, useMemo } from 'react';
import './LogsView.css';

interface Log {
  id: string;
  timestamp: string;
  level: string;
  service: string;
  message: string;
}

const SAMPLE_LOGS: Log[] = [
  {
    id: '1',
    timestamp: '2024-02-11T14:23:45Z',
    level: 'ERROR',
    service: 'auth-service',
    message: 'Failed to authenticate user: invalid token',
  },
  {
    id: '2',
    timestamp: '2024-02-11T14:22:10Z',
    level: 'WARNING',
    service: 'api-gateway',
    message: 'High latency detected: 2500ms',
  },
  {
    id: '3',
    timestamp: '2024-02-11T14:20:55Z',
    level: 'INFO',
    service: 'database',
    message: 'Connection pool: 45/50 active connections',
  },
  {
    id: '4',
    timestamp: '2024-02-11T14:19:30Z',
    level: 'ERROR',
    service: 'payment-service',
    message: 'Payment processing failed: timeout',
  },
  {
    id: '5',
    timestamp: '2024-02-11T14:18:15Z',
    level: 'WARNING',
    service: 'cache-service',
    message: 'Cache miss rate exceeds threshold: 35%',
  },
];

const LOG_LEVELS = ['ALL', 'ERROR', 'WARNING', 'INFO', 'DEBUG'];
const SERVICES = [
  'ALL',
  'auth-service',
  'api-gateway',
  'database',
  'payment-service',
  'cache-service',
];

export function LogsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [selectedService, setSelectedService] = useState('ALL');

  const filteredLogs = useMemo(() => {
    return SAMPLE_LOGS.filter((log) => {
      const matchesSearch =
        searchTerm === '' ||
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.service.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLevel =
        selectedLevel === 'ALL' || log.level === selectedLevel;

      const matchesService =
        selectedService === 'ALL' || log.service === selectedService;

      return matchesSearch && matchesLevel && matchesService;
    });
  }, [searchTerm, selectedLevel, selectedService]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'error';
      case 'WARNING':
        return 'warning';
      case 'INFO':
        return 'info';
      case 'DEBUG':
        return 'debug';
      default:
        return 'default';
    }
  };

  return (
    <div className="logs-view">
      <div className="logs-header">
        <h2>Logs</h2>
        <p>Browse and filter production logs</p>
      </div>

      <div className="logs-filters">
        <div className="filter-group">
          <label htmlFor="search-input">Search</label>
          <input
            id="search-input"
            type="text"
            placeholder="Search logs by message or service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="level-select">Level</label>
          <select
            id="level-select"
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="filter-select"
          >
            {LOG_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="service-select">Service</label>
          <select
            id="service-select"
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="filter-select"
          >
            {SERVICES.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="logs-summary">
        <span>{filteredLogs.length} logs found</span>
        {(searchTerm || selectedLevel !== 'ALL' || selectedService !== 'ALL') && (
          <button
            className="reset-filters-btn"
            onClick={() => {
              setSearchTerm('');
              setSelectedLevel('ALL');
              setSelectedService('ALL');
            }}
          >
            Reset filters
          </button>
        )}
      </div>

      <div className="logs-table">
        <div className="logs-table-header">
          <div className="col-timestamp">Timestamp</div>
          <div className="col-level">Level</div>
          <div className="col-service">Service</div>
          <div className="col-message">Message</div>
        </div>

        <div className="logs-table-body">
          {filteredLogs.length === 0 ? (
            <div className="no-logs">
              <p>No logs match your filters</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="log-row">
                <div className="col-timestamp">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
                <div className="col-level">
                  <span className={`badge badge-${getLevelColor(log.level)}`}>
                    {log.level}
                  </span>
                </div>
                <div className="col-service">
                  <code>{log.service}</code>
                </div>
                <div className="col-message">{log.message}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
