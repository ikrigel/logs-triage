import type { ReactNode } from 'react';

// Placeholder views - to be implemented in Phase 2-3
const DashboardView = () => <div className="view-placeholder">📊 Dashboard - Coming Soon</div>;
const TriageView = () => <div className="view-placeholder">🔍 Triage - Coming Soon</div>;
const LogsView = () => <div className="view-placeholder">📝 Logs - Coming Soon</div>;
const TicketsView = () => <div className="view-placeholder">🎫 Tickets - Coming Soon</div>;
const SettingsView = () => <div className="view-placeholder">⚙️ Settings - Coming Soon</div>;

export type ViewComponent = {
  [key: string]: () => ReactNode;
};

export const views: ViewComponent = {
  dashboard: DashboardView,
  triage: TriageView,
  logs: LogsView,
  tickets: TicketsView,
  settings: SettingsView,
};

export function renderView(viewName: string): ReactNode {
  const ViewComponent = views[viewName];
  if (!ViewComponent) {
    return <div className="view-placeholder">404 - View not found</div>;
  }
  return <ViewComponent />;
}
