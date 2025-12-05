function Monitoring() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Live Monitoring</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Connected Players</h2>
          <p className="text-gray-600">Real-time player list will appear here</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Session Progress</h2>
          <p className="text-gray-600">Session timer and progress</p>
        </div>

        <div className="card lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Live Timing</h2>
          <p className="text-gray-600">Lap times and positions</p>
        </div>

        <div className="card lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Server Logs</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto">
            <div>[Server] Waiting for connections...</div>
            <div>[Info] Server started successfully</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Monitoring;
