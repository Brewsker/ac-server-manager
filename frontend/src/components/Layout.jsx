import { Link, useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';
import api from '../api/client';

function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [presets, setPresets] = useState([]);
  const [loadingPresets, setLoadingPresets] = useState(true);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/config', label: 'Config Editor', icon: '✏️' },
    { path: '/saved-configs', label: 'Preset Management', icon: '📋' },
    { path: '/active-drivers', label: 'Active Drivers', icon: '🏎️' },
    { path: '/monitoring', label: 'Monitoring', icon: '📈' },
    { path: '/settings', label: 'Settings', icon: '🔧' },
  ];

  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    try {
      const data = await api.getPresets();
      setPresets(data.presets || []);
    } catch (error) {
      console.error('Failed to fetch presets:', error);
    } finally {
      setLoadingPresets(false);
    }
  };

  const handleLoadPreset = async (presetId) => {
    try {
      await api.loadPreset(presetId);
      navigate('/config', { state: { presetLoaded: true, timestamp: Date.now() } });
    } catch (error) {
      console.error('Failed to load preset:', error);
    }
  };

  const handleNewPreset = async () => {
    try {
      // Load default config into editor
      await api.loadDefaultConfig();
      navigate('/config', { state: { defaultLoaded: true, timestamp: Date.now() } });
    } catch (error) {
      console.error('Failed to load default config:', error);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 dark:bg-black text-white flex flex-col border-r border-gray-800 dark:border-gray-900">
        <div className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AC Server Manager</h1>
            <p className="text-gray-400 text-sm mt-1">v0.1.0</p>
          </div>
        </div>
        
        {/* Theme Toggle at top of sidebar */}
        <div className="px-6 pb-4 border-b border-gray-800 dark:border-gray-900">
          <ThemeToggle />
        </div>
        
        <nav className="mt-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="mr-3 text-xl">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Presets Section */}
        <div className="mt-6 px-6 pb-6 flex-1 flex flex-col border-t border-gray-800 dark:border-gray-900 pt-4 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Presets
            </h3>
            <button
              onClick={handleNewPreset}
              className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              title="Create new preset from default config"
            >
              + New
            </button>
          </div>

          {/* Preset List */}
          <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
            {loadingPresets ? (
              <div className="text-xs text-gray-500 text-center py-4">
                Loading...
              </div>
            ) : presets.length === 0 ? (
              <div className="text-xs text-gray-500 text-center py-4">
                No presets yet
              </div>
            ) : (
              presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleLoadPreset(preset.id)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded transition-colors truncate"
                  title={`Load ${preset.name} into editor`}
                >
                  {preset.name}
                </button>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
