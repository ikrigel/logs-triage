import type { ReactNode } from 'react';
import { TriageView } from './components/Views/TriageView';
import { DashboardView } from './components/Views/DashboardView';
import { LogsView } from './components/Views/LogsView';
import { TicketsView } from './components/Views/TicketsView';
import { SettingsView } from './components/Views/SettingsView';
import { AboutView } from './components/Views/AboutView';

export type ViewComponent = {
  [key: string]: () => ReactNode;
};

export const views: ViewComponent = {
  dashboard: () => <DashboardView />,
  triage: () => <TriageView />,
  logs: () => <LogsView />,
  tickets: () => <TicketsView />,
  settings: () => <SettingsView />,
  about: () => <AboutView />,
};

export function renderView(viewName: string): ReactNode {
  const ViewComponent = views[viewName];
  if (!ViewComponent) {
    return <div className="view-placeholder">404 - View not found</div>;
  }
  return <ViewComponent />;
}
