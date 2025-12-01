import { useState } from 'react';
import PropTypes from 'prop-types';
import api from '../api/client';

function ServerControls({ onStatusChange }) {
  const [loading, setLoading] = useState(false);

  const handleStopAll = async () => {
    setLoading(true);
    try {
      await api.stopAllServerInstances();
      console.log('All servers stopped');
      onStatusChange();
    } catch (error) {
      console.error('Failed to stop all servers:', error);
      alert(
        'Failed to stop all servers: ' + (error.response?.data?.error?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestartAll = async () => {
    if (!confirm('Restart all running server instances?')) return;

    setLoading(true);
    try {
      // Get all running servers
      const statuses = await api.getAllServerStatuses();
      const runningServers = statuses.servers.filter((s) => s.running);

      if (runningServers.length === 0) {
        alert('No servers are currently running');
        setLoading(false);
        return;
      }

      // Restart each one
      for (const server of runningServers) {
        await api.restartServerInstance(server.presetId);
      }

      console.log('All servers restarted');
      onStatusChange();
      alert(`Successfully restarted ${runningServers.length} server(s)`);
    } catch (error) {
      console.error('Failed to restart all servers:', error);
      alert(
        'Failed to restart all servers: ' + (error.response?.data?.error?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Server Controls</h2>

      <div className="flex gap-3">
        <button
          onClick={handleRestartAll}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-orange-600 dark:bg-orange-700 text-white rounded hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🔄 Restart All
        </button>

        <button
          onClick={handleStopAll}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ⏹️ Stop All
        </button>
      </div>

      {loading && <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Processing...</p>}
    </div>
  );
}

ServerControls.propTypes = {
  onStatusChange: PropTypes.func.isRequired,
};

export default ServerControls;
