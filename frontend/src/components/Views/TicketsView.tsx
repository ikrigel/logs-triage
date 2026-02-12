import { useState, useMemo } from 'react';
import './TicketsView.css';

interface Ticket {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'closed';
  service: string;
  createdAt: string;
  updatedAt: string;
}

const SAMPLE_TICKETS: Ticket[] = [
  {
    id: 'TKT-002847',
    title: 'Payment processing failures in production',
    severity: 'critical',
    status: 'open',
    service: 'payment-service',
    createdAt: '2024-02-11T14:19:30Z',
    updatedAt: '2024-02-11T14:19:30Z',
  },
  {
    id: 'TKT-002846',
    title: 'High API latency detected',
    severity: 'high',
    status: 'in-progress',
    service: 'api-gateway',
    createdAt: '2024-02-11T14:22:10Z',
    updatedAt: '2024-02-11T14:25:00Z',
  },
  {
    id: 'TKT-002845',
    title: 'Database connection pool exhaustion',
    severity: 'high',
    status: 'open',
    service: 'database',
    createdAt: '2024-02-11T13:45:20Z',
    updatedAt: '2024-02-11T13:45:20Z',
  },
  {
    id: 'TKT-002844',
    title: 'Cache miss rate exceeds threshold',
    severity: 'medium',
    status: 'closed',
    service: 'cache-service',
    createdAt: '2024-02-10T10:15:00Z',
    updatedAt: '2024-02-11T09:30:00Z',
  },
  {
    id: 'TKT-002843',
    title: 'Authentication token validation errors',
    severity: 'medium',
    status: 'in-progress',
    service: 'auth-service',
    createdAt: '2024-02-11T12:00:00Z',
    updatedAt: '2024-02-11T14:10:00Z',
  },
];

export function TicketsView() {
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'open' | 'in-progress' | 'closed'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const filteredTickets = useMemo(() => {
    return SAMPLE_TICKETS.filter((ticket) => {
      const matchesStatus =
        selectedStatus === 'all' || ticket.status === selectedStatus;
      const matchesSeverity =
        selectedSeverity === 'all' || ticket.severity === selectedSeverity;
      return matchesStatus && matchesSeverity;
    });
  }, [selectedStatus, selectedSeverity]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'open';
      case 'in-progress':
        return 'in-progress';
      case 'closed':
        return 'closed';
      default:
        return 'default';
    }
  };

  return (
    <div className="tickets-view">
      <div className="tickets-header">
        <h2>Tickets</h2>
        <p>Track and manage support tickets from log analysis</p>
      </div>

      <div className="tickets-filters">
        <div className="filter-group">
          <label>Status</label>
          <div className="filter-buttons">
            {['all', 'open', 'in-progress', 'closed'].map((status) => (
              <button
                key={status}
                className={`filter-btn ${selectedStatus === status ? 'active' : ''}`}
                onClick={() => setSelectedStatus(status as any)}
              >
                {status === 'all' ? 'All' : status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Severity</label>
          <div className="filter-buttons">
            {['all', 'low', 'medium', 'high', 'critical'].map((severity) => (
              <button
                key={severity}
                className={`filter-btn ${selectedSeverity === severity ? 'active' : ''}`}
                onClick={() => setSelectedSeverity(severity as any)}
              >
                {severity === 'all' ? 'All' : severity.charAt(0).toUpperCase() + severity.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="tickets-content">
        <div className="tickets-list">
          <div className="tickets-summary">
            <span>{filteredTickets.length} tickets found</span>
          </div>

          <div className="ticket-cards">
            {filteredTickets.length === 0 ? (
              <div className="no-tickets">
                <p>No tickets match your filters</p>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  className={`ticket-card ${
                    selectedTicket?.id === ticket.id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="ticket-header">
                    <h4>{ticket.id}</h4>
                    <span className={`badge severity-${getSeverityColor(ticket.severity)}`}>
                      {ticket.severity}
                    </span>
                  </div>
                  <p className="ticket-title">{ticket.title}</p>
                  <div className="ticket-footer">
                    <span className={`status status-${getStatusColor(ticket.status)}`}>
                      {ticket.status === 'in-progress' ? 'In Progress' : ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                    </span>
                    <span className="service">{ticket.service}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {selectedTicket && (
          <div className="ticket-details">
            <div className="details-header">
              <h3>{selectedTicket.id}</h3>
              <button
                className="close-btn"
                onClick={() => setSelectedTicket(null)}
              >
                ✕
              </button>
            </div>

            <div className="detail-section">
              <h4>Title</h4>
              <p>{selectedTicket.title}</p>
            </div>

            <div className="detail-section">
              <h4>Status</h4>
              <span className={`status status-${getStatusColor(selectedTicket.status)}`}>
                {selectedTicket.status === 'in-progress' ? 'In Progress' : selectedTicket.status.charAt(0).toUpperCase() + selectedTicket.status.slice(1)}
              </span>
            </div>

            <div className="detail-section">
              <h4>Severity</h4>
              <span className={`badge severity-${getSeverityColor(selectedTicket.severity)}`}>
                {selectedTicket.severity.charAt(0).toUpperCase() + selectedTicket.severity.slice(1)}
              </span>
            </div>

            <div className="detail-section">
              <h4>Service</h4>
              <code>{selectedTicket.service}</code>
            </div>

            <div className="detail-section">
              <h4>Created</h4>
              <p>{new Date(selectedTicket.createdAt).toLocaleString()}</p>
            </div>

            <div className="detail-section">
              <h4>Last Updated</h4>
              <p>{new Date(selectedTicket.updatedAt).toLocaleString()}</p>
            </div>

            <div className="detail-actions">
              <button className="action-btn primary">Update Status</button>
              <button className="action-btn">Add Comment</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
