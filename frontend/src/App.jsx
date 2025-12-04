import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ServerConfig from './pages/ServerConfig';
import ActiveDrivers from './pages/ActiveDrivers';
import Monitoring from './pages/Monitoring';
import Settings from './pages/Settings';

function App() {
  const [setupComplete, setSetupComplete] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();

    checkSetup(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, []);

  const checkSetup = async (signal) => {
    try {
      const response = await fetch('/api/setup/status', { signal });
      const data = await response.json();
      if (!signal.aborted) {
        // Always consider setup complete - redirect to Settings if not configured
        setSetupComplete(true);
      }
    } catch (error) {
      // Ignore AbortError when component unmounts
      if (error.name === 'AbortError') return;

      console.error('Failed to check setup status:', error);
      if (!signal.aborted) {
        // On error, allow access but user will see setup tab in Settings
        setSetupComplete(true);
      }
    }
  };

  // Show loading while checking setup status
  if (setupComplete === null) {
    return (
      <ThemeProvider>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Always show main app - redirect to Settings on first load
  return (
    <ThemeProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/settings" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/config" element={<ServerConfig />} />
            <Route path="/active-drivers" element={<ActiveDrivers />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
