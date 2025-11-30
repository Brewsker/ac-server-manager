import { useState } from 'react';
import PropTypes from 'prop-types';
import api from '../api/client';

function ServerControls({ onStatusChange }) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (action) => {
    setLoading(true);
    try {
      let result;
      switch (action) {
        case 'start':
          result = await api.startServer();
          break;
        case 'stop':
          result = await api.stopServer();
          break;
        case 'restart':
          result = await api.restartServer();
          break;
      }
      
      console.log(result);
      onStatusChange();
    } catch (error) {
      console.error(`Failed to ${action} server:`, error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Server Controls</h2>
      
      <div className="flex gap-3">
        <button
          onClick={() => handleAction('start')}
          disabled={loading}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ▶️ Start
        </button>

        <button
          onClick={() => handleAction('stop')}
          disabled={loading}
          className="btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ⏹️ Stop
        </button>

        <button
          onClick={() => handleAction('restart')}
          disabled={loading}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🔄 Restart
        </button>
      </div>

      {loading && (
        <p className="text-sm text-gray-500 mt-4">Processing...</p>
      )}
    </div>
  );
}

ServerControls.propTypes = {
  onStatusChange: PropTypes.func.isRequired,
};

export default ServerControls;
