// API configuration for frontend

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const API_ENDPOINTS = {
  // Chat endpoints
  CHAT_START: `${API_BASE_URL}/chat/start`,
  CHAT_MESSAGE: (sessionId: string) => `${API_BASE_URL}/chat/${sessionId}/message`,
  CHAT_SESSION: (sessionId: string) => `${API_BASE_URL}/chat/${sessionId}`,

  // Logs endpoints
  LOGS: `${API_BASE_URL}/logs`,
  LOGS_BY_SET: (setNumber: number) => `${API_BASE_URL}/logs/${setNumber}`,

  // Tickets endpoints
  TICKETS: `${API_BASE_URL}/tickets`,
  TICKET_BY_ID: (id: string) => `${API_BASE_URL}/tickets/${id}`,
  TICKET_COMMENTS: (id: string) => `${API_BASE_URL}/tickets/${id}/comments`,

  // Triage endpoints
  TRIAGE_RUN: `${API_BASE_URL}/triage/run`,
};

export const REQUEST_TIMEOUT = 30000; // 30 seconds
