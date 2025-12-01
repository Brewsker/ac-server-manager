import { Link, useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import api from '../api/client';

function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [presets, setPresets] = useState([]);
  const [loadingPresets, setLoadingPresets] = useState(true);
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [serverStatuses, setServerStatuses] = useState({}); // { presetId: { running: bool, pid: number } }

  const navItems = [
    { 
      path: '/', 
      label: 'Dashboard', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      path: '/config', 
      label: 'Config Editor', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    },
    { 
      path: '/active-drivers', 
      label: 'Active Drivers', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    { 
      path: '/settings', 
      label: 'Settings', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
  ];

  useEffect(() => {
    fetchPresets();
    checkAllServerStatuses(); // Initial check

    // Poll server statuses every 3 seconds
    const interval = setInterval(checkAllServerStatuses, 3000);
    return () => clearInterval(interval);
  }, []);

  // Refresh presets when navigating to config page (after potential preset changes)
  useEffect(() => {
    if (location.pathname === '/config') {
      fetchPresets();
    }
  }, [location.pathname]);

  // Also refresh when window regains focus (catches saves from modals)
  useEffect(() => {
    const handleFocus = () => {
      fetchPresets();
    };

    const handlePresetSaved = () => {
      console.log('[Layout] Preset saved event received, refreshing list');
      fetchPresets();
    };

    const handlePresetSelected = (event) => {
      console.log('[Layout] Preset selected event received:', event.detail.presetId);
      setSelectedPresetId(event.detail.presetId);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('presetSaved', handlePresetSaved);
    window.addEventListener('presetSelected', handlePresetSelected);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('presetSaved', handlePresetSaved);
      window.removeEventListener('presetSelected', handlePresetSelected);
    };
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

  const checkAllServerStatuses = async () => {
    try {
      const statuses = await api.getAllServerStatuses();
      // Convert array to object keyed by presetId
      const statusMap = {};
      statuses.servers.forEach((server) => {
        statusMap[server.presetId] = { running: server.running, pid: server.pid };
      });
      setServerStatuses(statusMap);
    } catch (error) {
      // Silently fail - don't spam console on polling
    }
  };

  const handleLoadPreset = async (presetId) => {
    try {
      setSelectedPresetId(presetId);
      await api.loadPreset(presetId);
      navigate('/config', { state: { presetLoaded: true, timestamp: Date.now() } });
    } catch (error) {
      console.error('Failed to load preset:', error);
    }
  };

  const handleNewPreset = async () => {
    try {
      // Clear selection since we're loading default config (not a preset)
      setSelectedPresetId(null);

      // First, load default config to working state
      await api.loadDefaultConfig();

      // Get the default config that was just loaded
      const defaultConfig = await api.getConfig();

      // Generate a unique name for the new preset
      const baseNewName = 'AC_Server';
      let newName = `${baseNewName}_0`;
      let counter = 0;

      // Find a unique name by checking existing presets
      while (presets.some((p) => p.name === newName)) {
        counter++;
        newName = `${baseNewName}_${counter}`;
      }

      // Update the SERVER.NAME to match the preset name
      const updatedConfig = {
        ...defaultConfig,
        SERVER: {
          ...defaultConfig.SERVER,
          NAME: newName,
        },
      };

      // Save the updated config to working state
      await api.updateConfig(updatedConfig);

      // Save as a new preset
      await api.savePreset(newName, 'Newly created preset from defaults');
      console.log('[Layout] Created new preset:', newName);

      // Refresh preset list to show the new preset
      await fetchPresets();

      // Load the newly created preset into the editor
      const updatedPresets = await api.getPresets();
      const newPreset = updatedPresets.presets.find((p) => p.name === newName);

      if (newPreset) {
        await api.loadPreset(newPreset.id);
        navigate('/config', { state: { presetLoaded: true, timestamp: Date.now() } });
      }
    } catch (error) {
      console.error('Failed to create new preset:', error);
    }
  };

  const handleStartServer = async (presetId, e) => {
    e.stopPropagation(); // Prevent preset selection when clicking start button
    try {
      await api.startServerInstance(presetId);
      console.log('[Layout] Started server for preset:', presetId);
      // Status will update via polling
    } catch (error) {
      console.error('Failed to start server:', error);
      alert('Failed to start server: ' + (error.response?.data?.error?.message || error.message));
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 dark:bg-black text-white flex flex-col border-r border-gray-800 dark:border-gray-900">
        <div className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AC Server Manager</h1>
            <p className="text-gray-400 text-sm mt-1">v0.13.6</p>
          </div>
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
              <span className="mr-3">{item.icon}</span>
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
            <div className="flex gap-1">
              <button
                onClick={fetchPresets}
                className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                title="Refresh preset list"
              >
                ↻
              </button>
              <button
                onClick={handleNewPreset}
                className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                title="Load default config to create new preset"
              >
                + New
              </button>
            </div>
          </div>

          {/* Preset List */}
          <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
            {loadingPresets ? (
              <div className="text-xs text-gray-500 text-center py-4">Loading...</div>
            ) : presets.length === 0 ? (
              <div className="text-xs text-gray-500 text-center py-4">No presets yet</div>
            ) : (
              presets.map((preset) => {
                const isRunning = serverStatuses[preset.id]?.running;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleLoadPreset(preset.id)}
                    className={`w-full text-left px-3 py-2 text-sm rounded transition-colors truncate flex items-center gap-2 ${
                      selectedPresetId === preset.id
                        ? 'bg-blue-600 text-white font-medium'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                    title={`Load ${preset.name} into editor${isRunning ? ' (Server Running)' : ''}`}
                  >
                    <span className={`text-xs ${isRunning ? 'text-green-400' : 'text-gray-400'}`}>
                      <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                    </span>
                    <span className="flex-1 truncate">{preset.name}</span>
                    {!isRunning && (
                      <button
                        onClick={(e) => handleStartServer(preset.id, e)}
                        className="text-green-500 hover:text-green-400 hover:bg-gray-700 rounded px-1.5 py-0.5 transition-colors flex items-center"
                        title="Start this server instance"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
