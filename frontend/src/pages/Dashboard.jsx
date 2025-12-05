import React, { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import { useTheme } from '../contexts/ThemeContext';

// ============================================================================
// PROXMOX-STYLE DASHBOARD
// Three-column layout: Resource Tree | Context Menu | Content Panel
// ============================================================================

function Dashboard() {
  // State Management
  const [loading, setLoading] = useState(true);
  const [runningServers, setRunningServers] = useState([]);
  const [selectedItem, setSelectedItem] = useState({ type: 'host', id: null });
  const [selectedView, setSelectedView] = useState('summary');
  const [monitoringData, setMonitoringData] = useState({
    players: [],
    session: null,
    logs: [],
  });
  const isMountedRef = useRef(true);

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
    return <AppView view={selectedView} servers={runningServers} />;
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
// HOST VIEW (System-level stats)
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
    const runningCount = servers.length;
    const stoppedCount = 0; // Would come from presets not running
    const totalPlayers = servers.reduce((sum, s) => sum + (s.players || 0), 0);

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

    return (
      <div className="p-4 overflow-y-auto h-full">
        {/* Health + Guests Row - side by side on wide, stacked on narrow */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Health Section */}
          <SectionPanel title="Health">
            <div className="flex items-center justify-around py-4">
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-2">Status</div>
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
                  {statsLoading ? 'Connecting...' : 'Server Manager Online'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-3">Nodes</div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-emerald-400">✓</span>
                  <span className="text-gray-300">Online</span>
                  <span className="text-white font-medium ml-2">1</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <span className="text-red-400">✗</span>
                  <span className="text-gray-300">Offline</span>
                  <span className="text-white font-medium ml-2">0</span>
                </div>
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

        {/* Nodes Table */}
        <SectionPanel title="Nodes">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">ID</th>
                  <th className="px-3 py-2 font-medium">Online</th>
                  <th className="px-3 py-2 font-medium">Server Address</th>
                  <th className="px-3 py-2 font-medium">CPU usage</th>
                  <th className="px-3 py-2 font-medium">Memory usage</th>
                  <th className="px-3 py-2 font-medium">Uptime</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-800/50">
                  <td className="px-3 py-2 text-gray-200">{hostname}</td>
                  <td className="px-3 py-2 text-gray-300">999</td>
                  <td className="px-3 py-2">
                    <span className="text-emerald-400">✓</span>
                  </td>
                  <td className="px-3 py-2 text-gray-300">192.168.1.71</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-700 rounded overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-500"
                          style={{ width: `${cpuUsage}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-300 text-xs">{cpuUsage}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-700 rounded overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-500"
                          style={{ width: `${memoryUsage}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-300 text-xs">{memoryUsage}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-gray-300">{uptime}</td>
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

function AppView({ view, servers }) {
  const runningCount = servers.length;
  const totalPlayers = servers.reduce((sum, s) => sum + (s.players || 0), 0);

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

        {/* Status Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <SectionPanel title="Status">
            <div className="flex items-center justify-around py-4">
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-2">Application</div>
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
                <div className="text-xs text-gray-400 mt-2">Running</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-3">Version</div>
                <div className="text-xl font-medium text-white">0.16.0</div>
                <div className="text-xs text-gray-400 mt-1">Latest</div>
              </div>
            </div>
          </SectionPanel>

          <SectionPanel title="Server Instances">
            <div className="flex items-center justify-around py-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{runningCount}</div>
                <div className="text-sm text-gray-400">Running</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{totalPlayers}</div>
                <div className="text-sm text-gray-400">Total Players</div>
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

  // Placeholder views for servers/presets
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
// SETUP VIEW (Settings/Configuration)
// ============================================================================

function SetupView() {
  const [activeTab, setActiveTab] = React.useState('server'); // 'server' | 'content' | 'updates' | 'appearance'
  const [currentVersion, setCurrentVersion] = React.useState('Loading...');
  const [updateInfo, setUpdateInfo] = React.useState(null);
  const [checkingUpdate, setCheckingUpdate] = React.useState(false);
  const { theme, setTheme } = useTheme();

  // Steam/Server states
  const [steamcmdInstalled, setSteamcmdInstalled] = React.useState(null);
  const [checkingSteamCmd, setCheckingSteamCmd] = React.useState(false);
  const [installingSteamCmd, setInstallingSteamCmd] = React.useState(false);
  const [acServerPath, setAcServerPath] = React.useState('/opt/acserver');
  const [acServerInstalled, setAcServerInstalled] = React.useState(null);
  const [checkingAcServer, setCheckingAcServer] = React.useState(false);
  const [steamUser, setSteamUser] = React.useState('');
  const [steamPass, setSteamPass] = React.useState('');
  const [steamGuardCode, setSteamGuardCode] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [downloadingACServer, setDownloadingACServer] = React.useState(false);
  const [steamMessage, setSteamMessage] = React.useState(null);
  const [cacheStatus, setCacheStatus] = React.useState(null);
  const [copyingFromCache, setCopyingFromCache] = React.useState(false);

  // Content states
  const [contentStatus, setContentStatus] = React.useState(null);
  const [checkingContent, setCheckingContent] = React.useState(false);
  const [uploadingTrack, setUploadingTrack] = React.useState(false);
  const [uploadingCar, setUploadingCar] = React.useState(false);
  const [uploadMessage, setUploadMessage] = React.useState(null);

  // Base game download states
  const [baseGamePath, setBaseGamePath] = React.useState('/tmp/ac-basegame');
  const [downloadingBaseGame, setDownloadingBaseGame] = React.useState(false);
  const [extractingContent, setExtractingContent] = React.useState(false);
  const [cleaningUpBaseGame, setCleaningUpBaseGame] = React.useState(false);
  const [autoCleanup, setAutoCleanup] = React.useState(true);
  const [baseGameMessage, setBaseGameMessage] = React.useState(null);

  React.useEffect(() => {
    loadCurrentVersion();
    checkSteamCMDStatus();
    checkCacheStatus();
    checkContentStatus();
    checkAcServerStatus();

    // Load saved username
    const saved = localStorage.getItem('steamUsername');
    if (saved) setSteamUser(saved);
  }, []);

  const loadCurrentVersion = async () => {
    try {
      const data = await api.getCurrentVersion();
      setCurrentVersion(data.version);
    } catch (error) {
      setCurrentVersion('Unknown');
    }
  };

  const checkSteamCMDStatus = async () => {
    setCheckingSteamCmd(true);
    try {
      const result = await api.checkSteamCMD();
      setSteamcmdInstalled(result.installed);
    } catch (error) {
      console.error('Failed to check SteamCMD:', error);
    } finally {
      setCheckingSteamCmd(false);
    }
  };

  const checkCacheStatus = async () => {
    try {
      const result = await api.checkACServerCache();
      setCacheStatus(result);
    } catch (error) {
      setCacheStatus({ exists: false });
    }
  };

  const checkAcServerStatus = async () => {
    setCheckingAcServer(true);
    try {
      const result = await api.checkACServer(acServerPath);
      setAcServerInstalled(result);
    } catch (error) {
      console.error('Failed to check AC Server:', error);
      setAcServerInstalled({ installed: false });
    } finally {
      setCheckingAcServer(false);
    }
  };

  const checkContentStatus = async () => {
    setCheckingContent(true);
    try {
      const result = await api.getContentStatus();
      setContentStatus(result);
    } catch (error) {
      setContentStatus({ installed: false });
    } finally {
      setCheckingContent(false);
    }
  };

  const handleInstallSteamCMD = async () => {
    setInstallingSteamCmd(true);
    setSteamMessage(null);
    try {
      const result = await api.installSteamCMD();
      if (result.success) {
        setSteamMessage({ type: 'success', text: 'SteamCMD installed successfully!' });
        setSteamcmdInstalled(true);
      } else {
        setSteamMessage({ type: 'error', text: result.message || 'Failed to install SteamCMD' });
      }
    } catch (error) {
      setSteamMessage({ type: 'error', text: 'Failed to install SteamCMD' });
    } finally {
      setInstallingSteamCmd(false);
    }
  };

  const handleDownloadACServer = async () => {
    if (!acServerPath.trim() || !steamUser.trim() || !steamPass.trim()) {
      setSteamMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }
    setDownloadingACServer(true);
    setSteamMessage(null);
    try {
      const result = await api.downloadACServer(acServerPath, steamUser, steamPass, '');
      if (result.success) {
        setSteamMessage({
          type: 'success',
          text: `AC Server installed! Version: ${result.version || 'Unknown'}`,
        });
        await checkCacheStatus();
      } else {
        setSteamMessage({ type: 'error', text: result.message || 'Failed to download' });
      }
    } catch (error) {
      setSteamMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to download',
      });
    } finally {
      setDownloadingACServer(false);
      // Re-check installation status
      checkAcServerStatus();
    }
  };

  const handleCopyFromCache = async () => {
    if (!acServerPath.trim()) {
      setSteamMessage({ type: 'error', text: 'Please enter installation path' });
      return;
    }
    setCopyingFromCache(true);
    setSteamMessage(null);
    try {
      const result = await api.copyACServerFromCache(acServerPath);
      if (result.success) {
        setSteamMessage({ type: 'success', text: 'AC Server copied from cache!' });
      } else {
        setSteamMessage({ type: 'error', text: result.message || 'Failed to copy' });
      }
    } catch (error) {
      setSteamMessage({ type: 'error', text: 'Failed to copy from cache' });
    } finally {
      setCopyingFromCache(false);
      // Re-check installation status
      checkAcServerStatus();
    }
  };

  const handleCheckForUpdates = async () => {
    setCheckingUpdate(true);
    setUpdateInfo(null);
    try {
      const data = await api.checkForUpdates();
      setUpdateInfo(data);
    } catch (error) {
      setUpdateInfo({ error: true, message: 'Failed to check for updates' });
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleTrackUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingTrack(true);
    setUploadMessage(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('/api/content/upload/track', { method: 'POST', body: formData });
      const result = await response.json();
      if (result.success) {
        setUploadMessage({ type: 'success', message: `Track "${result.name}" installed!` });
        checkContentStatus();
      } else {
        setUploadMessage({ type: 'error', message: result.error || 'Failed to upload' });
      }
    } catch (error) {
      setUploadMessage({ type: 'error', message: 'Upload failed: ' + error.message });
    } finally {
      setUploadingTrack(false);
      event.target.value = '';
    }
  };

  const handleCarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingCar(true);
    setUploadMessage(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('/api/content/upload/car', { method: 'POST', body: formData });
      const result = await response.json();
      if (result.success) {
        setUploadMessage({ type: 'success', message: `Car "${result.name}" installed!` });
        checkContentStatus();
      } else {
        setUploadMessage({ type: 'error', message: result.error || 'Failed to upload' });
      }
    } catch (error) {
      setUploadMessage({ type: 'error', message: 'Upload failed: ' + error.message });
    } finally {
      setUploadingCar(false);
      event.target.value = '';
    }
  };

  const handleDownloadBaseGame = async () => {
    if (!steamUser.trim() || !steamPass.trim()) {
      setBaseGameMessage({ type: 'error', text: 'Steam credentials are required' });
      return;
    }

    setDownloadingBaseGame(true);
    setBaseGameMessage(null);

    try {
      // Step 1: Download base game
      setBaseGameMessage({
        type: 'info',
        text: '📥 Downloading AC base game (~12GB). This may take 10-30 minutes...',
      });

      const downloadResult = await api.downloadACBaseGame(
        baseGamePath,
        steamUser,
        steamPass,
        steamGuardCode
      );

      if (!downloadResult.success) {
        throw new Error(downloadResult.message || 'Download failed');
      }

      // Step 2: Extract content
      setBaseGameMessage({
        type: 'info',
        text: `✅ Downloaded! Now extracting ${downloadResult.carCount} cars and ${downloadResult.trackCount} tracks...`,
      });

      setExtractingContent(true);
      const serverContentPath = process.env.AC_CONTENT_PATH || '/opt/acserver/content';

      const extractResult = await api.extractACContent(baseGamePath, serverContentPath);

      if (!extractResult.success) {
        throw new Error(extractResult.message || 'Content extraction failed');
      }

      setExtractingContent(false);

      // Step 3: Cleanup if auto-cleanup enabled
      if (autoCleanup) {
        setBaseGameMessage({
          type: 'info',
          text: `✅ Content extracted! Cleaning up base game files...`,
        });

        setCleaningUpBaseGame(true);
        const cleanupResult = await api.cleanupACBaseGame(baseGamePath);

        if (cleanupResult.success) {
          setBaseGameMessage({
            type: 'success',
            text: `🎉 Success! Installed ${extractResult.carCount} cars and ${extractResult.trackCount} tracks. Freed ${cleanupResult.freedSpace}.`,
          });
        } else {
          setBaseGameMessage({
            type: 'success',
            text: `✅ Content installed successfully! ${extractResult.carCount} cars, ${extractResult.trackCount} tracks. (Cleanup skipped)`,
          });
        }

        setCleaningUpBaseGame(false);
      } else {
        setBaseGameMessage({
          type: 'success',
          text: `✅ Content installed successfully! ${extractResult.carCount} cars, ${extractResult.trackCount} tracks. Base game files kept at ${baseGamePath}`,
        });
      }

      // Clear content cache so new content appears in UI
      await api.post('/content/clear-cache');

      // Refresh content status to show new content
      await checkContentStatus();
    } catch (error) {
      console.error('Failed to download/extract base game:', error);
      setBaseGameMessage({
        type: 'error',
        text: error.response?.data?.message || error.message || 'Failed to download base game',
      });
    } finally {
      setDownloadingBaseGame(false);
      setExtractingContent(false);
      setCleaningUpBaseGame(false);
    }
  };

  const handleCleanupBaseGame = async () => {
    if (!baseGamePath.trim()) {
      setBaseGameMessage({ type: 'error', text: 'Please enter the base game path to cleanup' });
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete all files in:\n${baseGamePath}\n\nThis cannot be undone!`
      )
    ) {
      return;
    }

    setCleaningUpBaseGame(true);
    setBaseGameMessage(null);

    try {
      const cleanupResult = await api.cleanupACBaseGame(baseGamePath);

      if (cleanupResult.success) {
        setBaseGameMessage({
          type: 'success',
          text: `Cleanup complete! Freed ${cleanupResult.freedSpace}`,
        });
      } else {
        setBaseGameMessage({ type: 'error', text: cleanupResult.message || 'Cleanup failed' });
      }
    } catch (error) {
      console.error('Failed to cleanup base game:', error);
      setBaseGameMessage({
        type: 'error',
        text: error.response?.data?.message || error.message || 'Failed to cleanup base game',
      });
    } finally {
      setCleaningUpBaseGame(false);
    }
  };

  const tabs = [
    { id: 'server', label: 'AC Server', icon: '🖥️' },
    { id: 'content', label: 'Content', icon: '📦' },
    { id: 'updates', label: 'Updates', icon: '🔄' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
  ];

  return (
    <div className="p-4 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">⚙️</span>
        <div>
          <h1 className="text-xl font-semibold text-white">Setup</h1>
          <span className="text-sm text-gray-400">Configure AC Server Manager</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-4 border-b border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Server Tab */}
      {activeTab === 'server' && (
        <div className="space-y-4">
          {/* SteamCMD Status */}
          <SectionPanel title="SteamCMD">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      steamcmdInstalled ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  ></span>
                  <span className="text-gray-300">
                    {checkingSteamCmd
                      ? 'Checking...'
                      : steamcmdInstalled
                      ? 'Installed'
                      : 'Not Installed'}
                  </span>
                </div>
                {!steamcmdInstalled && (
                  <button
                    onClick={handleInstallSteamCMD}
                    disabled={installingSteamCmd}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
                  >
                    {installingSteamCmd ? 'Installing...' : 'Install SteamCMD'}
                  </button>
                )}
              </div>
            </div>
          </SectionPanel>

          {/* AC Server Download */}
          <SectionPanel title="AC Dedicated Server">
            <div className="p-4 space-y-4">
              {/* Installation Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      checkingAcServer
                        ? 'bg-yellow-500'
                        : acServerInstalled?.installed
                        ? 'bg-emerald-500'
                        : 'bg-red-500'
                    }`}
                  ></span>
                  <span className="text-gray-300">
                    {checkingAcServer
                      ? 'Checking...'
                      : acServerInstalled?.installed
                      ? `Installed${
                          acServerInstalled.version ? ` (v${acServerInstalled.version})` : ''
                        }`
                      : 'Not Installed'}
                  </span>
                </div>
                <button
                  onClick={checkAcServerStatus}
                  disabled={checkingAcServer}
                  className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                  title="Refresh status"
                >
                  ↻
                </button>
              </div>

              {cacheStatus?.exists && (
                <div className="flex items-center justify-between p-3 bg-emerald-900/30 border border-emerald-700 rounded">
                  <div>
                    <span className="text-emerald-400 font-medium">Cache Available</span>
                    <p className="text-xs text-gray-400 mt-1">
                      Version: {cacheStatus.version || 'Unknown'}
                    </p>
                  </div>
                  <button
                    onClick={handleCopyFromCache}
                    disabled={copyingFromCache}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
                  >
                    {copyingFromCache ? 'Copying...' : 'Use Cache'}
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-1">Installation Path</label>
                <input
                  type="text"
                  value={acServerPath}
                  onChange={(e) => setAcServerPath(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  placeholder="/opt/acserver"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Steam Username</label>
                  <input
                    type="text"
                    value={steamUser}
                    onChange={(e) => setSteamUser(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Steam Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={steamPass}
                      onChange={(e) => setSteamPass(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleDownloadACServer}
                disabled={downloadingACServer || !steamcmdInstalled}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white rounded transition-colors"
              >
                {downloadingACServer ? 'Downloading...' : 'Download AC Server'}
              </button>

              {steamMessage && (
                <div
                  className={`p-3 rounded text-sm ${
                    steamMessage.type === 'success'
                      ? 'bg-emerald-900/50 text-emerald-300'
                      : 'bg-red-900/50 text-red-300'
                  }`}
                >
                  {steamMessage.text}
                </div>
              )}
            </div>
          </SectionPanel>
        </div>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          {/* Content Status */}
          <SectionPanel title="Installed Content">
            <div className="p-4">
              {checkingContent ? (
                <div className="text-gray-400 text-center py-4">Checking content...</div>
              ) : contentStatus ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-800 rounded">
                    <div className="text-2xl font-bold text-white">
                      {contentStatus.trackCount || 0}
                    </div>
                    <div className="text-sm text-gray-400">Tracks</div>
                  </div>
                  <div className="text-center p-4 bg-gray-800 rounded">
                    <div className="text-2xl font-bold text-white">
                      {contentStatus.carCount || 0}
                    </div>
                    <div className="text-sm text-gray-400">Cars</div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">No content status available</div>
              )}
            </div>
          </SectionPanel>

          {/* Upload Content */}
          <SectionPanel title="Upload Content">
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Upload Track (.zip)</label>
                  <label className="block w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 border border-gray-600 border-dashed rounded text-center cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept=".zip"
                      onChange={handleTrackUpload}
                      disabled={uploadingTrack}
                      className="hidden"
                    />
                    <span className="text-gray-300">
                      {uploadingTrack ? 'Uploading...' : 'Choose Track File'}
                    </span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Upload Car (.zip)</label>
                  <label className="block w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 border border-gray-600 border-dashed rounded text-center cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept=".zip"
                      onChange={handleCarUpload}
                      disabled={uploadingCar}
                      className="hidden"
                    />
                    <span className="text-gray-300">
                      {uploadingCar ? 'Uploading...' : 'Choose Car File'}
                    </span>
                  </label>
                </div>
              </div>

              {uploadMessage && (
                <div
                  className={`p-3 rounded text-sm ${
                    uploadMessage.type === 'success'
                      ? 'bg-emerald-900/50 text-emerald-300'
                      : 'bg-red-900/50 text-red-300'
                  }`}
                >
                  {uploadMessage.message}
                </div>
              )}
            </div>
          </SectionPanel>

          {/* Official Content - Base Game */}
          <SectionPanel title="Official Content">
            <div className="p-4 space-y-4">
              <div className="text-sm text-gray-400 mb-2">
                Download and extract official cars and tracks from the AC base game via Steam.
                Requires owning Assetto Corsa on Steam.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Steam Username</label>
                  <input
                    type="text"
                    value={steamUser}
                    onChange={(e) => setSteamUser(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    placeholder="Your Steam username"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Steam Password</label>
                  <input
                    type="password"
                    value={steamPass}
                    onChange={(e) => setSteamPass(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    placeholder="Your Steam password"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Steam Guard Code (if 2FA enabled)
                  </label>
                  <input
                    type="text"
                    value={steamGuardCode}
                    onChange={(e) => setSteamGuardCode(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    placeholder="Leave empty if not needed"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Download Path</label>
                  <input
                    type="text"
                    value={baseGamePath}
                    onChange={(e) => setBaseGamePath(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    placeholder="/tmp/ac-basegame"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoCleanup"
                  checked={autoCleanup}
                  onChange={(e) => setAutoCleanup(e.target.checked)}
                  className="w-4 h-4 bg-gray-700 border-gray-600 rounded"
                />
                <label htmlFor="autoCleanup" className="text-sm text-gray-300">
                  Auto-cleanup base game files after extraction (~12GB saved)
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDownloadBaseGame}
                  disabled={downloadingBaseGame || extractingContent || cleaningUpBaseGame}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
                >
                  {downloadingBaseGame
                    ? 'Downloading...'
                    : extractingContent
                    ? 'Extracting...'
                    : cleaningUpBaseGame
                    ? 'Cleaning up...'
                    : '📥 Download & Extract Base Game'}
                </button>
                <button
                  onClick={handleCleanupBaseGame}
                  disabled={downloadingBaseGame || extractingContent || cleaningUpBaseGame}
                  className="px-4 py-2 bg-red-700 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
                  title="Clean up downloaded base game files"
                >
                  🗑️ Cleanup Only
                </button>
              </div>

              {baseGameMessage && (
                <div
                  className={`p-3 rounded text-sm ${
                    baseGameMessage.type === 'success'
                      ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700'
                      : baseGameMessage.type === 'info'
                      ? 'bg-blue-900/50 text-blue-300 border border-blue-700'
                      : 'bg-red-900/50 text-red-300 border border-red-700'
                  }`}
                >
                  {baseGameMessage.text}
                </div>
              )}
            </div>
          </SectionPanel>
        </div>
      )}

      {/* Updates Tab */}
      {activeTab === 'updates' && (
        <div className="space-y-4">
          <SectionPanel title="Application Updates">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-gray-300">Current Version</div>
                  <div className="text-xl font-medium text-white">{currentVersion}</div>
                </div>
                <button
                  onClick={handleCheckForUpdates}
                  disabled={checkingUpdate}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white rounded transition-colors"
                >
                  {checkingUpdate ? 'Checking...' : 'Check for Updates'}
                </button>
              </div>

              {updateInfo && (
                <div
                  className={`p-4 rounded ${
                    updateInfo.error
                      ? 'bg-red-900/50 border border-red-700'
                      : updateInfo.updateAvailable
                      ? 'bg-blue-900/50 border border-blue-700'
                      : 'bg-emerald-900/50 border border-emerald-700'
                  }`}
                >
                  {updateInfo.error ? (
                    <span className="text-red-300">{updateInfo.message}</span>
                  ) : updateInfo.updateAvailable ? (
                    <div>
                      <div className="text-blue-300 font-medium">
                        Update Available: {updateInfo.latestVersion}
                      </div>
                      <p className="text-gray-400 text-sm mt-1">
                        {updateInfo.releaseNotes || 'No release notes available'}
                      </p>
                      <a
                        href={updateInfo.releaseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-blue-400 hover:text-blue-300 text-sm"
                      >
                        View Release →
                      </a>
                    </div>
                  ) : (
                    <span className="text-emerald-300">You're running the latest version!</span>
                  )}
                </div>
              )}
            </div>
          </SectionPanel>
        </div>
      )}

      {/* Appearance Tab */}
      {activeTab === 'appearance' && (
        <div className="space-y-4">
          <SectionPanel title="Theme">
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Color Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setTheme('light')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        theme === 'light'
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-2xl mb-2">☀️</div>
                      <div className="text-sm text-gray-300">Light</div>
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        theme === 'dark'
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-2xl mb-2">🌙</div>
                      <div className="text-sm text-gray-300">Dark</div>
                    </button>
                    <button
                      onClick={() => setTheme('system')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        theme === 'system'
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-2xl mb-2">💻</div>
                      <div className="text-sm text-gray-300">System</div>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    System mode automatically matches your operating system's theme preference.
                  </p>
                </div>
              </div>
            </div>
          </SectionPanel>
        </div>
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
