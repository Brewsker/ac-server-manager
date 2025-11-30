import PropTypes from 'prop-types';

function ServerStatus({ status }) {
  if (!status) {
    return (
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Server Status</h2>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const formatUptime = (ms) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Server Status</h2>
      
      <div className="space-y-3">
        <div className="flex items-center">
          <span className="font-medium w-24">Status:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            status.running 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {status.running ? '🟢 Running' : '🔴 Stopped'}
          </span>
        </div>

        <div className="flex items-center">
          <span className="font-medium w-24">PID:</span>
          <span className="text-gray-700">{status.pid || 'N/A'}</span>
        </div>

        <div className="flex items-center">
          <span className="font-medium w-24">Uptime:</span>
          <span className="text-gray-700">{formatUptime(status.uptime)}</span>
        </div>
      </div>
    </div>
  );
}

ServerStatus.propTypes = {
  status: PropTypes.shape({
    running: PropTypes.bool,
    pid: PropTypes.number,
    uptime: PropTypes.number,
  }),
};

export default ServerStatus;
