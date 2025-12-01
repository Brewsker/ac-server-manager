import { useState, useEffect, useRef } from 'react';
import api from '../api/client';

function Dashboard() {
  const [runningServers, setRunningServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
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

  const fetchRunningServers = async () => {
    try {
      const statuses = await api.getAllServerStatuses();
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setRunningServers(statuses.servers.filter((s) => s.running));
      }
    } catch (error) {
      console.error('Failed to fetch server statuses:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
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
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-green-500 text-lg">●</span>
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
      </div>

      {/* Fixed Bottom Controls */}
      <div className="fixed bottom-0 left-64 right-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-700 shadow-lg z-10">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleRestartAll}
              disabled={actionLoading || runningServers.length === 0}
              className="px-6 py-2 bg-orange-600 dark:bg-orange-700 text-white rounded hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              title="Restart all running servers"
            >
              🔄 Restart All
            </button>

            <button
              onClick={handleStopAll}
              disabled={actionLoading || runningServers.length === 0}
              className="px-6 py-2 bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              title="Stop all running servers"
            >
              ⏹️ Stop All
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
