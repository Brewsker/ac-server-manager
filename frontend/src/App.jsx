import { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Dashboard from './pages/Dashboard';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Brief loading check for setup status
    const checkSetup = async () => {
      try {
        await fetch('/api/setup/status');
      } catch (error) {
        console.error('Failed to check setup status:', error);
      }
      setLoading(false);
    };

    checkSetup();
  }, []);

  if (loading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Dashboard is now the entire app
  return (
    <ThemeProvider>
      <div className="h-screen w-screen overflow-hidden bg-gray-900">
        <Dashboard />
      </div>
    </ThemeProvider>
  );
}

export default App;
