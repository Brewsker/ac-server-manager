import { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import ServerControls from '../components/ServerControls';
import ServerStatus from '../components/ServerStatus';

function Dashboard() {
  const [serverStatus, setServerStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    fetchServerStatus();
    // Poll every 5 seconds
    const interval = setInterval(fetchServerStatus, 5000);
    
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  const fetchServerStatus = async () => {
    try {
      const data = await api.getServerStatus();
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setServerStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch server status:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ServerStatus status={serverStatus} />
        <ServerControls onStatusChange={fetchServerStatus} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Quick Stats</h3>
          <p className="text-gray-600">Server uptime, players, etc.</p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Recent Sessions</h3>
          <p className="text-gray-600">Last race results</p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
          <p className="text-gray-600">Common tasks</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
