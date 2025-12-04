import React, { useState, useEffect, useRef } from 'react';
import api from '../api/client';

// ============================================================================
// PROXMOX-STYLE DASHBOARD
// Three-column layout: Resource Tree | Context Menu | Content Panel
// ============================================================================

function Dashboard() {
  // State Management
  const [loading, setLoading] = useState(true);
  const [runningServers, setRunningServers] = useState([]);
  const [selectedItem, setSelectedItem] = useState({ type: 'datacenter', id: null });
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
    if (selectedItem.type === 'datacenter') {
      return [
        { id: 'summary', label: 'Summary', icon: '📊' },
        { id: 'cluster', label: 'Cluster', icon: '🔗' },
        { id: 'options', label: 'Options', icon: '⚙️' },
        { id: 'storage', label: 'Storage', icon: '💾' },
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
            {/* Datacenter Node */}
            <div
              onClick={() => {
                setSelectedItem({ type: 'datacenter', id: null });
                setSelectedView('summary');
              }}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                selectedItem.type === 'datacenter'
                  ? 'bg-blue-600/30 border-l-2 border-blue-500'
                  : 'hover:bg-gray-700/50 border-l-2 border-transparent'
              }`}
            >
              <span className="text-lg">🖧</span>
              <span className="text-sm font-medium">Datacenter</span>
            </div>

            {/* Server Instances */}
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
              {selectedItem.type === 'datacenter' ? 'Datacenter' : selectedServer?.name || 'Server'}
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
  // Datacenter Views
  if (selectedItem.type === 'datacenter') {
    return <DatacenterView view={selectedView} servers={runningServers} />;
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
// DATACENTER VIEW
// ============================================================================

function DatacenterView({ view, servers }) {
  if (view === 'summary') {
    const totalPlayers = 0; // Would aggregate from all servers

    return (
      <div className="p-4 overflow-y-auto h-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">🖧</span>
          <div>
            <h1 className="text-xl font-semibold text-white">Datacenter</h1>
            <span className="text-sm text-gray-400">AC Server Manager</span>
          </div>
        </div>

        {/* Status Row */}
        <div className="flex gap-4 mb-6 text-sm">
          <StatusPill label="Status" value="running" color="emerald" />
          <StatusPill label="Servers" value={`${servers.length} online`} color="blue" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard label="Running Servers" value={servers.length} unit="" icon="🖥️" />
          <StatCard label="Total Players" value={totalPlayers} unit="" icon="👥" />
          <StatCard label="CPU Usage" value="--" unit="%" icon="📊" />
          <StatCard label="Memory" value="--" unit="MB" icon="💾" />
        </div>

        {/* Server List */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div
            className="px-4 py-2 bg-gray-750 border-b border-gray-700"
            style={{ backgroundColor: '#2d333b' }}
          >
            <span className="text-sm font-medium text-gray-200">Server Instances</span>
          </div>
          <div className="divide-y divide-gray-700">
            {servers.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                No servers running. Start a server from the Config Editor.
              </div>
            ) : (
              servers.map((server) => (
                <div
                  key={server.presetId}
                  className="px-4 py-3 flex items-center justify-between hover:bg-gray-750/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    <div>
                      <div className="text-sm font-medium text-white">
                        {server.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-400">Port: {server.port || 'N/A'}</div>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400">running</span>
                </div>
              ))
            )}
          </div>
        </div>
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

export default Dashboard;
