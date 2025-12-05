import React, { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import FolderBrowserModal from '../components/FolderBrowserModal';

// Extracted views
import EditorView from '../views/EditorView';
import SetupView from '../views/SetupView';

// ============================================================================
// PROXMOX-STYLE DASHBOARD
// Three-column layout: Resource Tree | Context Menu | Content Panel
// ============================================================================

// Helper to get initial state from sessionStorage or defaults
const getInitialSelection = () => {
  try {
    const saved = sessionStorage.getItem('dashboard_selection');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    // Ignore parse errors
  }
  // Default to AC Server Manager summary
  return { item: { type: 'app', id: 'acsm' }, view: 'summary' };
};

function Dashboard() {
  // State Management
  const [loading, setLoading] = useState(true);
  const [runningServers, setRunningServers] = useState([]);
  const initialSelection = getInitialSelection();
  const [selectedItem, setSelectedItem] = useState(initialSelection.item);
  const [selectedView, setSelectedView] = useState(initialSelection.view);
  const [monitoringData, setMonitoringData] = useState({
    players: [],
    session: null,
    logs: [],
  });
  const isMountedRef = useRef(true);

  // Persist selection to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(
      'dashboard_selection',
      JSON.stringify({
        item: selectedItem,
        view: selectedView,
      })
    );
  }, [selectedItem, selectedView]);

  // Fetch running servers periodically
  useEffect(() => {
    isMountedRef.current = true;
    fetchRunningServers();
    const interval = setInterval(fetchRunningServers, 3000);
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch monitoring data for selected server
  useEffect(() => {
    if (selectedItem.type === 'server' && selectedItem.id) {
      fetchMonitoringData();
      const interval = setInterval(fetchMonitoringData, 2000);
      return () => clearInterval(interval);
    }
  }, [selectedItem]);

  const fetchRunningServers = async () => {
    try {
      const statuses = await api.getAllServerStatuses();
      if (isMountedRef.current) {
        const running = statuses.servers.filter((s) => s.running);
        setRunningServers(running);
      }
    } catch (error) {
      console.error('Failed to fetch server statuses:', error);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  const fetchMonitoringData = async () => {
    if (selectedItem.type !== 'server' || !selectedItem.id) return;
    try {
      const logsData = await api.getServerInstanceLogs(selectedItem.id, 50);
      const playersData = await api.getPlayers();
      if (isMountedRef.current) {
        setMonitoringData({
          players: playersData.players || [],
          session: playersData.session || null,
          logs: logsData.logs || [],
        });
      }
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    }
  };

  const handleStopServer = async (presetId) => {
    try {
      await api.stopServerInstance(presetId);
      await fetchRunningServers();
    } catch (error) {
      console.error('Failed to stop server:', error);
    }
  };

  const handleRestartServer = async (presetId) => {
    try {
      await api.restartServerInstance(presetId);
      await fetchRunningServers();
    } catch (error) {
      console.error('Failed to restart server:', error);
    }
  };

  // Get menu items based on selected item type
  const getContextMenuItems = () => {
    if (selectedItem.type === 'host') {
      return [
        { id: 'summary', label: 'Summary', icon: '📊' },
        { id: 'cluster', label: 'Cluster', icon: '🔗' },
        { id: 'options', label: 'Options', icon: '⚙️' },
        { id: 'storage', label: 'Storage', icon: '💾' },
      ];
    }
    if (selectedItem.type === 'app') {
      return [
        { id: 'summary', label: 'Summary', icon: '📊' },
        { id: 'servers', label: 'Servers', icon: '🖥️' },
        { id: 'presets', label: 'Presets', icon: '📁' },
        { id: 'editor', label: 'Editor', icon: '✏️' },
        { id: 'setup', label: 'Setup', icon: '⚙️' },
      ];
    }
    if (selectedItem.type === 'server') {
      return [
        { id: 'summary', label: 'Summary', icon: '📊' },
        { id: 'console', label: 'Console', icon: '🖥️' },
        { id: 'resources', label: 'Resources', icon: '📈' },
        { id: 'network', label: 'Network', icon: '🌐' },
        { id: 'drivers', label: 'Drivers', icon: '👥' },
        { id: 'options', label: 'Options', icon: '⚙️' },
        { id: 'taskhistory', label: 'Task History', icon: '📜' },
      ];
    }
    return [];
  };

  const selectedServer = runningServers.find((s) => s.presetId === selectedItem.id);

  if (loading) {
    return (
      <div className="dashboard-layout flex items-center justify-center h-full bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout h-full flex flex-col bg-gray-900 text-gray-100 overflow-hidden">
      {/* Top Header Bar - Proxmox style */}
      <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-orange-500 font-bold text-lg">AC Server Manager</span>
          <span className="text-gray-400 text-sm">Virtual Environment</span>
        </div>
        <div className="flex items-center gap-2">
          {selectedItem.type === 'server' && selectedServer && (
            <>
              <button
                onClick={() => handleRestartServer(selectedServer.presetId)}
                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-xs rounded transition-colors"
              >
                Restart
              </button>
              <button
                onClick={() => handleStopServer(selectedServer.presetId)}
                className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
              >
                Shutdown
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Three-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN - Resource Tree */}
        <div
          className="w-52 bg-gray-850 border-r border-gray-700 flex flex-col shrink-0"
          style={{ backgroundColor: '#1e2328' }}
        >
          <div className="p-2 border-b border-gray-700 bg-gray-800">
            <span className="text-xs text-gray-400 font-medium">Server Pool</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* Host Node */}
            <div
              onClick={() => {
                setSelectedItem({ type: 'host', id: null });
                setSelectedView('summary');
              }}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                selectedItem.type === 'host'
                  ? 'bg-blue-600/30 border-l-2 border-blue-500'
                  : 'hover:bg-gray-700/50 border-l-2 border-transparent'
              }`}
            >
              <span className="text-lg">🖧</span>
              <span className="text-sm font-medium">Host</span>
            </div>

            {/* AC Server Manager - App Node (same level as Host) */}
            <div
              onClick={() => {
                setSelectedItem({ type: 'app', id: 'acsm' });
                setSelectedView('summary');
              }}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                selectedItem.type === 'app'
                  ? 'bg-blue-600/30 border-l-2 border-blue-500'
                  : 'hover:bg-gray-700/50 border-l-2 border-transparent'
              }`}
            >
              <span className="text-lg">🏎️</span>
              <span className="text-sm font-medium">AC Server Manager</span>
            </div>

            {/* Server Instances under AC Server Manager */}
            <div className="ml-4">
              {runningServers.length === 0 ? (
                <div className="px-3 py-4 text-gray-500 text-xs text-center">
                  No servers running
                </div>
              ) : (
                runningServers.map((server, index) => (
                  <div
                    key={server.presetId}
                    onClick={() => {
                      setSelectedItem({ type: 'server', id: server.presetId });
                      setSelectedView('summary');
                    }}
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                      selectedItem.type === 'server' && selectedItem.id === server.presetId
                        ? 'bg-blue-600/30 border-l-2 border-blue-500'
                        : 'hover:bg-gray-700/50 border-l-2 border-transparent'
                    }`}
                  >
                    <span className="text-lg">🖥️</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {server.name || `Server ${index + 1}`}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        running
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN - Context Menu */}
        <div className="w-40 bg-gray-800 border-r border-gray-700 flex flex-col shrink-0">
          <div
            className="p-2 border-b border-gray-700 bg-gray-750"
            style={{ backgroundColor: '#252a30' }}
          >
            <span className="text-xs text-gray-300 font-medium">
              {selectedItem.type === 'host'
                ? 'Host'
                : selectedItem.type === 'app'
                ? 'AC Server Manager'
                : selectedServer?.name || 'Server'}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {getContextMenuItems().map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedView(item.id)}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors text-sm ${
                  selectedView === item.id
                    ? 'bg-blue-600/40 text-white'
                    : 'hover:bg-gray-700/50 text-gray-300'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN - Content Panel */}
        <div
          className="flex-1 bg-gray-850 overflow-hidden flex flex-col"
          style={{ backgroundColor: '#1a1e22' }}
        >
          <ContentPanel
            selectedItem={selectedItem}
            selectedView={selectedView}
            setSelectedView={setSelectedView}
            selectedServer={selectedServer}
            runningServers={runningServers}
            monitoringData={monitoringData}
            onStopServer={handleStopServer}
            onRestartServer={handleRestartServer}
          />
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="h-6 bg-gray-800 border-t border-gray-700 flex items-center px-4 text-xs text-gray-400 shrink-0">
        <span>{runningServers.length} server(s) running</span>
        <span className="mx-2">|</span>
        <span>{monitoringData.players.length} players connected</span>
      </div>
    </div>
  );
}

// ============================================================================
// CONTENT PANEL - Renders content based on selection
// ============================================================================

function ContentPanel({
  selectedItem,
  selectedView,
  setSelectedView,
  selectedServer,
  runningServers,
  monitoringData,
  onStopServer,
  onRestartServer,
}) {
  // Host Views (system-level)
  if (selectedItem.type === 'host') {
    return <HostView view={selectedView} servers={runningServers} />;
  }

  // App Views (AC Server Manager level)
  if (selectedItem.type === 'app') {
    return (
      <AppView view={selectedView} servers={runningServers} setSelectedView={setSelectedView} />
    );
  }

  // Server Views
  if (selectedItem.type === 'server' && selectedServer) {
    return (
      <ServerView
        view={selectedView}
        server={selectedServer}
        monitoringData={monitoringData}
        onStop={() => onStopServer(selectedServer.presetId)}
        onRestart={() => onRestartServer(selectedServer.presetId)}
      />
    );
  }

  return (
    <div className="flex items-center justify-center h-full text-gray-500">
      Select an item from the left panel
    </div>
  );
}

// ============================================================================
// HOST VIEW (System-level stats - Container/Host information)
// ============================================================================

function HostView({ view, servers }) {
  const [systemStats, setSystemStats] = React.useState(null);
  const [statsLoading, setStatsLoading] = React.useState(true);

  // Fetch system stats on mount and periodically
  React.useEffect(() => {
    let mounted = true;

    const fetchStats = async () => {
      try {
        const stats = await api.getSystemStats();
        if (mounted) {
          setSystemStats(stats);
          setStatsLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch system stats:', error);
        if (mounted) setStatsLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Update every 5 seconds

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (view === 'summary') {
    // Use real stats or fallback
    const cpuUsage = systemStats?.cpu?.usage ?? 0;
    const cpuCores = systemStats?.cpu?.cores ?? 1;
    const memoryUsage = systemStats?.memory?.usage ?? 0;
    const memoryUsed = systemStats?.memory?.usedGiB ?? '0';
    const memoryTotal = systemStats?.memory?.totalGiB ?? '0';
    const storageUsage = systemStats?.storage?.usage ?? 0;
    const storageUsed = systemStats?.storage?.usedGiB ?? '0';
    const storageTotal = systemStats?.storage?.totalGiB ?? '0';
    const uptime = systemStats?.uptime?.formatted ?? '--';
    const hostname = systemStats?.hostname ?? 'ac-server';
    const platform = systemStats?.platform ?? 'linux';
    const arch = systemStats?.arch ?? 'x64';
    const nodeVersion = systemStats?.nodeVersion ?? '--';

    return (
      <div className="p-4 overflow-y-auto h-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">🖧</span>
          <div>
            <h1 className="text-xl font-semibold text-white">{hostname}</h1>
            <span className="text-sm text-gray-400">
              Container Host • {platform} ({arch})
            </span>
          </div>
        </div>

        {/* Status + System Info Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Status Section */}
          <SectionPanel title="Status">
            <div className="flex items-center justify-around py-4">
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-2">Health</div>
                <div
                  className={`w-12 h-12 rounded-full ${
                    statsLoading ? 'bg-yellow-500' : 'bg-emerald-500'
                  } flex items-center justify-center mx-auto`}
                >
                  {statsLoading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {statsLoading ? 'Connecting...' : 'Online'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-3">Uptime</div>
                <div className="text-xl font-medium text-white">{uptime}</div>
                <div className="text-xs text-gray-400 mt-1">Since last restart</div>
              </div>
            </div>
          </SectionPanel>

          {/* System Info Section */}
          <SectionPanel title="System Info">
            <div className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Hostname</span>
                <span className="text-gray-200">{hostname}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Platform</span>
                <span className="text-gray-200">{platform}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Architecture</span>
                <span className="text-gray-200">{arch}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Node.js</span>
                <span className="text-gray-200">{nodeVersion}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">CPU Cores</span>
                <span className="text-gray-200">{cpuCores}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Memory</span>
                <span className="text-gray-200">{memoryTotal} GiB</span>
              </div>
            </div>
          </SectionPanel>
        </div>

        {/* Resources Section */}
        <SectionPanel title="Resources" className="mb-4">
          <div className="flex flex-wrap items-center justify-around py-6 gap-8">
            <CircularGauge
              label="CPU"
              value={cpuUsage}
              subtitle={`of ${cpuCores} CPU(s)`}
              color="blue"
            />
            <CircularGauge
              label="Memory"
              value={memoryUsage}
              subtitle={`${memoryUsed} GiB of ${memoryTotal} GiB`}
              color="blue"
            />
            <CircularGauge
              label="Storage"
              value={storageUsage}
              subtitle={`${storageUsed} GiB of ${storageTotal} GiB`}
              color="blue"
            />
          </div>
        </SectionPanel>

        {/* Storage Details */}
        <SectionPanel title="Storage">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="px-3 py-2 font-medium">Path</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Used</th>
                  <th className="px-3 py-2 font-medium">Total</th>
                  <th className="px-3 py-2 font-medium">Usage</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-800/50">
                  <td className="px-3 py-2 text-gray-200">/</td>
                  <td className="px-3 py-2 text-gray-300">Root</td>
                  <td className="px-3 py-2 text-gray-300">{storageUsed} GiB</td>
                  <td className="px-3 py-2 text-gray-300">{storageTotal} GiB</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-700 rounded overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            storageUsage > 90
                              ? 'bg-red-500'
                              : storageUsage > 70
                              ? 'bg-yellow-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${storageUsage}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-300 text-xs">{storageUsage}%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </SectionPanel>
      </div>
    );
  }

  // Placeholder views
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold text-white mb-4 capitalize">{view}</h2>
      <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-500">
        {view} view coming soon
      </div>
    </div>
  );
}

// ============================================================================
// APP VIEW (AC Server Manager level)
// ============================================================================

function AppView({ view, servers, setSelectedView }) {
  const runningCount = servers.length;
  const stoppedCount = 0; // Would come from presets not running
  const totalPlayers = servers.reduce((sum, s) => sum + (s.players || 0), 0);
  const [currentVersion, setCurrentVersion] = React.useState('--');

  React.useEffect(() => {
    const loadVersion = async () => {
      try {
        const data = await api.getCurrentVersion();
        setCurrentVersion(data.version);
      } catch (error) {
        setCurrentVersion('Unknown');
      }
    };
    loadVersion();
  }, []);

  if (view === 'summary') {
    return (
      <div className="p-4 overflow-y-auto h-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">🏎️</span>
          <div>
            <h1 className="text-xl font-semibold text-white">AC Server Manager</h1>
            <span className="text-sm text-gray-400">Assetto Corsa Dedicated Server</span>
          </div>
        </div>

        {/* Health + Guests Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Health Section */}
          <SectionPanel title="Health">
            <div className="flex items-center justify-around py-4">
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-2">Status</div>
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center mx-auto">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div className="text-xs text-gray-400 mt-2">Server Manager Online</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-3">Version</div>
                <div className="text-xl font-medium text-white">{currentVersion}</div>
                <div className="text-xs text-gray-400 mt-1">Current</div>
              </div>
            </div>
          </SectionPanel>

          {/* Guests Section */}
          <SectionPanel title="Guests">
            <div className="flex items-center justify-around py-4">
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-3">AC Servers</div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-gray-300">Running</span>
                  <span className="text-white font-medium ml-2">{runningCount}</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                  <span className="text-gray-300">Stopped</span>
                  <span className="text-white font-medium ml-2">{stoppedCount}</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-3">Players</div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  <span className="text-gray-300">Connected</span>
                  <span className="text-white font-medium ml-2">{totalPlayers}</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                  <span className="text-gray-300">Spectators</span>
                  <span className="text-white font-medium ml-2">0</span>
                </div>
              </div>
            </div>
          </SectionPanel>
        </div>

        {/* Running Servers Table */}
        <SectionPanel title="Running Servers">
          <div className="overflow-x-auto">
            {servers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No servers currently running. Start a server from the preset list.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Players</th>
                    <th className="px-3 py-2 font-medium">Track</th>
                    <th className="px-3 py-2 font-medium">PID</th>
                  </tr>
                </thead>
                <tbody>
                  {servers.map((server) => (
                    <tr
                      key={server.presetId}
                      className="hover:bg-gray-800/50 border-b border-gray-700/50"
                    >
                      <td className="px-3 py-2 text-gray-200">{server.name || 'Unknown'}</td>
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                          Running
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-300">
                        {server.players || 0} / {server.maxPlayers || '?'}
                      </td>
                      <td className="px-3 py-2 text-gray-300">{server.track || 'Unknown'}</td>
                      <td className="px-3 py-2 text-gray-400">{server.pid || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </SectionPanel>
      </div>
    );
  }

  if (view === 'setup') {
    return <SetupView />;
  }

  if (view === 'presets') {
    return <PresetsView setSelectedView={setSelectedView} />;
  }

  if (view === 'editor') {
    return <EditorView />;
  }

  // Placeholder views for servers
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold text-white mb-4 capitalize">{view}</h2>
      <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-500">
        {view} view coming soon
      </div>
    </div>
  );
}

// ============================================================================
// PRESETS VIEW (Preset Management)
// ============================================================================

function PresetsView({ setSelectedView }) {
  const [presets, setPresets] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [serverStatuses, setServerStatuses] = React.useState({});
  const [selectedPresetId, setSelectedPresetId] = React.useState(null);
  const [showFolderBrowser, setShowFolderBrowser] = React.useState(false);
  const [folderPath, setFolderPath] = React.useState('');

  React.useEffect(() => {
    fetchPresets();
    checkAllServerStatuses();

    // Poll server statuses
    const interval = setInterval(checkAllServerStatuses, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchPresets = async () => {
    try {
      const data = await api.getPresets();
      setPresets(data.presets || []);
    } catch (error) {
      console.error('Failed to fetch presets:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAllServerStatuses = async () => {
    try {
      const statuses = await api.getAllServerStatuses();
      const statusMap = {};
      statuses.servers.forEach((server) => {
        statusMap[server.presetId] = { running: server.running, pid: server.pid };
      });
      setServerStatuses(statusMap);
    } catch (error) {
      // Silently fail
    }
  };

  const handleLoadPreset = async (presetId) => {
    try {
      setSelectedPresetId(presetId);
      await api.loadPreset(presetId);
      setSelectedView('editor');
    } catch (error) {
      console.error('Failed to load preset:', error);
    }
  };

  const handleNewPreset = async () => {
    try {
      setSelectedPresetId(null);
      await api.loadDefaultConfig();
      const defaultConfig = await api.getConfig();

      const baseNewName = 'AC_Server';
      let newName = `${baseNewName}_0`;
      let counter = 0;

      while (presets.some((p) => p.name === newName)) {
        counter++;
        newName = `${baseNewName}_${counter}`;
      }

      const updatedConfig = {
        ...defaultConfig,
        SERVER: {
          ...defaultConfig.SERVER,
          NAME: newName,
        },
      };

      await api.updateConfig(updatedConfig);
      await api.savePreset(newName, 'Newly created preset from defaults');
      await fetchPresets();

      const updatedPresets = await api.getPresets();
      const newPreset = updatedPresets.presets.find((p) => p.name === newName);

      if (newPreset) {
        await api.loadPreset(newPreset.id);
        setSelectedView('editor');
      }
    } catch (error) {
      console.error('Failed to create new preset:', error);
    }
  };

  const handleStartServer = async (presetId, e) => {
    e.stopPropagation();
    try {
      await api.startServerInstance(presetId);
    } catch (error) {
      console.error('Failed to start server:', error);
      alert('Failed to start server: ' + (error.response?.data?.error?.message || error.message));
    }
  };

  const handleStopServer = async (presetId, e) => {
    e.stopPropagation();
    try {
      await api.stopServerInstance(presetId);
    } catch (error) {
      console.error('Failed to stop server:', error);
    }
  };

  const handleOpenFolder = async () => {
    try {
      const result = await api.openPresetsFolder();
      setFolderPath(result.path);
      setShowFolderBrowser(true);
    } catch (error) {
      console.error('Failed to open folder:', error);
      alert('Failed to open presets folder');
    }
  };

  return (
    <div className="p-4 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📁</span>
          <div>
            <h1 className="text-xl font-semibold text-white">Presets</h1>
            <span className="text-sm text-gray-400">Manage server configurations</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOpenFolder}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors flex items-center gap-2"
            title="Open presets folder"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            Folder
          </button>
          <button
            onClick={fetchPresets}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            title="Refresh preset list"
          >
            ↻
          </button>
          <button
            onClick={handleNewPreset}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors flex items-center gap-2"
          >
            <span>+</span>
            New Preset
          </button>
        </div>
      </div>

      {/* Presets Table */}
      <SectionPanel title={`Server Presets (${presets.length})`}>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading presets...</div>
          ) : presets.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No presets yet. Click "New Preset" to create your first server configuration.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Modified</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {presets.map((preset) => {
                  const isRunning = serverStatuses[preset.id]?.running;
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <tr
                      key={preset.id}
                      onClick={() => handleLoadPreset(preset.id)}
                      className={`border-b border-gray-700/50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-600/20' : 'hover:bg-gray-800/50'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`flex items-center gap-2 ${
                            isRunning ? 'text-emerald-400' : 'text-gray-500'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
                            }`}
                          ></span>
                          {isRunning ? 'Running' : 'Stopped'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-200 font-medium">{preset.name}</td>
                      <td className="px-4 py-3 text-gray-400">{preset.description || '-'}</td>
                      <td className="px-4 py-3 text-gray-400">
                        {preset.updatedAt ? new Date(preset.updatedAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isRunning ? (
                            <button
                              onClick={(e) => handleStopServer(preset.id, e)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
                              title="Stop server"
                            >
                              Stop
                            </button>
                          ) : (
                            <button
                              onClick={(e) => handleStartServer(preset.id, e)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded transition-colors"
                              title="Start server"
                            >
                              Start
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoadPreset(preset.id);
                            }}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
                            title="Edit in config editor"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </SectionPanel>

      {/* Folder Browser Modal */}
      {showFolderBrowser && (
        <FolderBrowserModal folderPath={folderPath} onClose={() => setShowFolderBrowser(false)} />
      )}
    </div>
  );
}

// ============================================================================
// SERVER VIEW
// ============================================================================

function ServerView({ view, server, monitoringData, onStop, onRestart }) {
  if (view === 'summary') {
    const session = monitoringData.session || {};
    const players = monitoringData.players || [];

    return (
      <div className="p-4 overflow-y-auto h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🖥️</span>
            <div>
              <h1 className="text-xl font-semibold text-white">{server.name || 'Server'}</h1>
              <span className="text-sm text-gray-400">on AC Server Manager</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRestart}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-sm rounded transition-colors"
            >
              ↻ Restart
            </button>
            <button
              onClick={onStop}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded transition-colors"
            >
              ⏹ Shutdown
            </button>
          </div>
        </div>

        {/* Status Row */}
        <div className="flex flex-wrap gap-4 mb-6 text-sm">
          <StatusPill label="Status" value="running" color="emerald" />
          <StatusPill
            label="Players"
            value={`${players.length}/${session.maxPlayers || 18}`}
            color="blue"
          />
          <StatusPill label="Session" value={session.type || 'None'} color="violet" />
          <StatusPill label="Port" value={server.port || 'N/A'} color="gray" />
        </div>

        {/* Resource Graphs Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <ResourceGraph title="CPU Usage" value={0} max={100} unit="%" color="yellow" />
          <ResourceGraph title="Memory Usage" value={0} max={512} unit="MB" color="cyan" />
        </div>

        {/* Notes Section */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div
            className="px-4 py-2 bg-gray-750 border-b border-gray-700 flex justify-between items-center"
            style={{ backgroundColor: '#2d333b' }}
          >
            <span className="text-sm font-medium text-gray-200">Session Info</span>
          </div>
          <div className="p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Track</span>
              <span className="text-white">{session.trackName || session.track || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Session Type</span>
              <span className="text-white">{session.type || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Time Remaining</span>
              <span className="text-white">{session.timeRemaining || '--'}s</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'console') {
    return (
      <div className="p-4 h-full flex flex-col">
        <h2 className="text-lg font-semibold text-white mb-4">Console</h2>
        <div className="flex-1 bg-black rounded-lg p-4 font-mono text-sm text-green-400 overflow-y-auto">
          {monitoringData.logs.length === 0 ? (
            <span className="text-gray-500">No logs available</span>
          ) : (
            monitoringData.logs.map((log, idx) => (
              <div key={idx} className="leading-relaxed hover:bg-gray-900 px-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (view === 'drivers') {
    const players = monitoringData.players || [];
    return (
      <div className="p-4 overflow-y-auto h-full">
        <h2 className="text-lg font-semibold text-white mb-4">Active Drivers ({players.length})</h2>
        {players.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-500">
            <div className="text-4xl mb-3">🏎️</div>
            No drivers connected
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-750" style={{ backgroundColor: '#2d333b' }}>
                <tr className="text-left text-xs text-gray-400">
                  <th className="px-4 py-2">Pos</th>
                  <th className="px-4 py-2">Driver</th>
                  <th className="px-4 py-2">Car</th>
                  <th className="px-4 py-2">Best Lap</th>
                  <th className="px-4 py-2">Ping</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {players.map((player, idx) => (
                  <tr key={player.id || idx} className="hover:bg-gray-750/50">
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
                          idx === 0
                            ? 'bg-yellow-500 text-black'
                            : idx === 1
                            ? 'bg-gray-400 text-black'
                            : idx === 2
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-white">{player.name || 'Unknown'}</td>
                    <td className="px-4 py-2 text-sm text-gray-300">
                      {player.carName || player.car || 'N/A'}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-300">--:--:---</td>
                    <td className="px-4 py-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          player.ping < 50
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : player.ping < 100
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {player.ping || '--'}ms
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  if (view === 'resources') {
    return (
      <div className="p-4 overflow-y-auto h-full">
        <h2 className="text-lg font-semibold text-white mb-4">Resources</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard label="CPU Cores" value="1" unit="" icon="🔲" />
          <StatCard label="Memory" value="512" unit="MB" icon="💾" />
          <StatCard label="Disk" value="--" unit="GB" icon="💿" />
          <StatCard label="Network" value="--" unit="Mbps" icon="🌐" />
        </div>
        <ResourceGraph
          title="CPU Usage"
          value={0}
          max={100}
          unit="%"
          color="yellow"
          height="h-32"
        />
        <div className="mt-4">
          <ResourceGraph
            title="Memory Usage"
            value={0}
            max={512}
            unit="MB"
            color="cyan"
            height="h-32"
          />
        </div>
      </div>
    );
  }

  // Placeholder for other views
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold text-white mb-4 capitalize">{view}</h2>
      <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-500">
        {view} view coming soon
      </div>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function StatusPill({ label, value, color }) {
  const colors = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    violet: 'text-violet-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
    gray: 'text-gray-400',
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded">
      <span className="text-gray-400 text-xs">{label}:</span>
      <span className={`text-xs font-medium ${colors[color] || colors.gray}`}>{value}</span>
    </div>
  );
}

function StatCard({ label, value, unit, icon }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span>{icon}</span>
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">
        {value}
        <span className="text-sm text-gray-400 ml-1">{unit}</span>
      </div>
    </div>
  );
}

function ResourceGraph({ title, value, max, unit, color, height = 'h-24' }) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const colors = {
    yellow: 'bg-yellow-500',
    cyan: 'bg-cyan-500',
    emerald: 'bg-emerald-500',
    red: 'bg-red-500',
  };

  // Generate stable bar heights using useMemo to prevent memory leak from continuous re-renders
  const barHeights = React.useMemo(
    () => Array.from({ length: 20 }, (_, i) => 10 + ((i * 7 + 13) % 60)),
    []
  );

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-gray-300">{title}</span>
        <span className="text-sm text-white font-medium">
          {value}
          {unit}
        </span>
      </div>
      <div className={`${height} bg-gray-900 rounded relative overflow-hidden`}>
        {/* Graph placeholder - shows a simple bar for now */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around h-full px-1 py-1">
          {barHeights.map((h, i) => (
            <div
              key={i}
              className={`w-full mx-px ${colors[color] || colors.yellow} opacity-70`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        {/* Value overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-white drop-shadow-lg">
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

// Section Panel - Proxmox-style titled section
function SectionPanel({ title, children, className = '' }) {
  return (
    <div className={`bg-gray-800/50 rounded overflow-hidden ${className}`}>
      <div className="px-3 py-1.5 border-b border-gray-700">
        <span className="text-sm font-medium text-orange-400">{title}</span>
      </div>
      <div className="bg-gray-850" style={{ backgroundColor: '#1e2328' }}>
        {children}
      </div>
    </div>
  );
}

// Circular Gauge - Proxmox-style percentage display
function CircularGauge({ label, value, subtitle, color = 'blue' }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  const colors = {
    blue: { stroke: '#3b82f6', text: 'text-blue-400' },
    green: { stroke: '#10b981', text: 'text-emerald-400' },
    yellow: { stroke: '#f59e0b', text: 'text-yellow-400' },
    red: { stroke: '#ef4444', text: 'text-red-400' },
  };

  const colorConfig = colors[color] || colors.blue;

  return (
    <div className="text-center">
      <div className="text-sm text-gray-400 mb-2">{label}</div>
      <div className="relative w-28 h-28 mx-auto">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle cx="50" cy="50" r={radius} stroke="#374151" strokeWidth="8" fill="transparent" />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={colorConfig.stroke}
            strokeWidth="8"
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${colorConfig.text}`}>{value}%</span>
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
    </div>
  );
}

export default Dashboard;
