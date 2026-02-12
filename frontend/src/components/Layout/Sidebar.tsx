import { useUIStore } from '../../store/uiStore';
import type { View } from '../../types/index';
import './Sidebar.css';

const navigationItems: Array<{ id: View; label: string; icon: string }> = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'triage', label: 'Triage', icon: '🔍' },
  { id: 'logs', label: 'Logs', icon: '📝' },
  { id: 'tickets', label: 'Tickets', icon: '🎫' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
  { id: 'about', label: 'About', icon: 'ℹ️' },
];

export function Sidebar() {
  const { currentView, setCurrentView, sidebarOpen, setSidebarOpen } =
    useUIStore();

  const handleNavigate = (view: View) => {
    setCurrentView(view);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && window.innerWidth < 768 && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${currentView === item.id ? 'active' : ''}`}
              onClick={() => handleNavigate(item.id)}
              aria-current={currentView === item.id ? 'page' : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p className="sidebar-version">v1.0.0</p>
        </div>
      </aside>
    </>
  );
}
