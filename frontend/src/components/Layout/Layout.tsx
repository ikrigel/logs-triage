import type { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useUIStore } from '../../store/uiStore';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { darkMode } = useUIStore();

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
      <Header />
      <div className="app-main">
        <Sidebar />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
