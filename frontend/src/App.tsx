import { useEffect } from 'react';
import { Layout } from './components/Layout/Layout';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import { useUIStore } from './store/uiStore';
import { renderView } from './routes';
import './App.css';

function App() {
  const { currentView, darkMode } = useUIStore();

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // Handle sidebar closing on window resize
  useEffect(() => {
    const handleResize = () => {
      const { setSidebarOpen } = useUIStore.getState();
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ErrorBoundary>
      <Layout>
        <div className="view-container">
          {renderView(currentView)}
        </div>
      </Layout>
    </ErrorBoundary>
  );
}

export default App;
