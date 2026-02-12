import { useUIStore } from '../../store/uiStore';
import './Header.css';

export function Header() {
  const { darkMode, toggleDarkMode, toggleSidebar, sidebarOpen } =
    useUIStore();

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="sidebar-toggle"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          ☰
        </button>
        <h1 className="header-title">🤖 Production Logs Triage</h1>
      </div>

      <div className="header-right">
        <button
          className="theme-toggle btn btn-small"
          onClick={toggleDarkMode}
          title={darkMode ? 'Light mode' : 'Dark mode'}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}
