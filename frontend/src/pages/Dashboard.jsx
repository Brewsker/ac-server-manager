import { useState, useEffect, useRef } from 'react';
import api from '../api/client';

function Dashboard() {
  const [runningServers, setRunningServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedServer, setSelectedServer] = useState(null);
  const [monitoringData, setMonitoringData] = useState({
    players: [],
    session: null,
    logs: [],
  });
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    fetchRunningServers();
    // Poll every 3 seconds
    const interval = setInterval(fetchRunningServers, 3000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch monitoring data when selected server changes
  useEffect(() => {
    if (selectedServer) {
      fetchMonitoringData();
      const interval = setInterval(fetchMonitoringData, 2000);
      return () => clearInterval(interval);
    }
  }, [selectedServer]);

  const fetchRunningServers = async () => {
    try {
      const statuses = await api.getAllServerStatuses();
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        const running = statuses.servers.filter((s) => s.running);
        setRunningServers(running);

        // Auto-select first running server if none selected
        if (running.length > 0 && !selectedServer) {
          setSelectedServer(running[0].presetId);
        }
        // Clear selection if selected server is no longer running
        if (selectedServer && !running.find((s) => s.presetId === selectedServer)) {
          setSelectedServer(running.length > 0 ? running[0].presetId : null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch server statuses:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const fetchMonitoringData = async () => {
    if (!selectedServer) return;

    try {
      // Fetch logs for selected server
      const logsData = await api.getServerInstanceLogs(selectedServer, 50);
      // Fetch players for selected server (placeholder - will need UDP integration)
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

  const handleStopAll = async () => {
    setActionLoading(true);
    try {
      await api.stopAllServerInstances();
      console.log('All servers stopped');
      await fetchRunningServers();
    } catch (error) {
      console.error('Failed to stop all servers:', error);
      alert(
        'Failed to stop all servers: ' + (error.response?.data?.error?.message || error.message)
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestartAll = async () => {
    if (runningServers.length === 0) {
      alert('No servers are currently running');
      return;
    }

    if (!confirm(`Restart all ${runningServers.length} running server instance(s)?`)) return;

    setActionLoading(true);
    try {
      // Restart each one
      for (const server of runningServers) {
        await api.restartServerInstance(server.presetId);
      }

      console.log('All servers restarted');
      await fetchRunningServers();
      alert(`Successfully restarted ${runningServers.length} server(s)`);
    } catch (error) {
      console.error('Failed to restart all servers:', error);
      alert(
        'Failed to restart all servers: ' + (error.response?.data?.error?.message || error.message)
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <>
      <div className="pb-24">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">Dashboard</h1>

        {/* Running Servers Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Running Servers
          </h2>

          {runningServers.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No servers are currently running. Start a server from the Config Editor.
            </p>
          ) : (
            <div className="space-y-3">
              {runningServers.map((server) => (
                <div
                  key={server.presetId}
                  onClick={() => setSelectedServer(server.presetId)}
                  className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all ${
                    selectedServer === server.presetId
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 dark:border-blue-500'
                      : 'bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-green-400">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {server.name || 'Unknown Server'}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        PID: {server.pid} • Port: {server.port || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Preset ID: {server.presetId.slice(0, 8)}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Monitoring Section */}
        {runningServers.length > 0 && selectedServer && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Live Monitoring
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-3">
                {runningServers.find((s) => s.presetId === selectedServer)?.name ||
                  'Unknown Server'}
              </span>
            </h2>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Connected Players</h2>
            {selectedServer ? (
              <div className="space-y-2">
                {monitoringData.players.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No players connected</p>
                ) : (
                  monitoringData.players.map((player, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                    >
                      <span className="text-sm font-medium">{player.name || 'Unknown'}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {player.carModel || 'N/A'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Select a running server to view players
              </p>
            )}
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Session Progress</h2>
            {selectedServer && monitoringData.session ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Session Type</p>
                  <p className="text-lg font-semibold">{monitoringData.session.type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Time Remaining</p>
                  <p className="text-lg font-semibold">
                    {monitoringData.session.timeRemaining || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Laps</p>
                  <p className="text-lg font-semibold">{monitoringData.session.laps || 'N/A'}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {selectedServer ? 'No session data available' : 'Select a running server'}
              </p>
            )}
          </div>

          <div className="card lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Live Timing</h2>
            {selectedServer ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3">Pos</th>
                      <th className="text-left py-2 px-3">Driver</th>
                      <th className="text-left py-2 px-3">Best Lap</th>
                      <th className="text-left py-2 px-3">Last Lap</th>
                      <th className="text-left py-2 px-3">Gap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monitoringData.players.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="text-center py-4 text-gray-500 dark:text-gray-400"
                        >
                          No timing data available
                        </td>
                      </tr>
                    ) : (
                      monitoringData.players.map((player, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-gray-100 dark:border-gray-700 last:border-0"
                        >
                          <td className="py-2 px-3">{idx + 1}</td>
                          <td className="py-2 px-3 font-medium">{player.name || 'Unknown'}</td>
                          <td className="py-2 px-3">--:--:---</td>
                          <td className="py-2 px-3">--:--:---</td>
                          <td className="py-2 px-3">--:--</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Select a running server to view timing
              </p>
            )}
          </div>

          <div className="card lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Server Logs</h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto">
              {selectedServer ? (
                monitoringData.logs.length === 0 ? (
                  <div className="text-gray-500">No logs available</div>
                ) : (
                  monitoringData.logs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed">
                      {log}
                    </div>
                  ))
                )
              ) : (
                <div className="text-gray-500">Select a running server to view logs</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Controls */}
      <div className="fixed bottom-0 left-64 right-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-700 shadow-lg z-10">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleRestartAll}
              disabled={actionLoading || runningServers.length === 0}
              className="px-6 py-2 bg-orange-600 dark:bg-orange-700 text-white rounded hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
              title="Restart all running servers"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Restart All
            </button>

            <button
              onClick={handleStopAll}
              disabled={actionLoading || runningServers.length === 0}
              className="px-6 py-2 bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
              title="Stop all running servers"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
              Stop All
            </button>
          </div>
          {actionLoading && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-right">
              Processing...
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default Dashboard;
