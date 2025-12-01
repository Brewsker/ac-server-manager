import { useState, useEffect, useRef } from 'react';
import api from '../api/client';

function ActiveDrivers() {
  const [players, setPlayers] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    fetchPlayers();
    const interval = setInterval(fetchPlayers, 5000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  const fetchPlayers = async () => {
    try {
      const data = await api.getPlayers();
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setPlayers(data.players || []);
        setSession(data.session);
        setError(null);
      }
    } catch (error) {
      console.error('Failed to fetch players:', error);
      if (isMountedRef.current) {
        setError(error.message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div className="text-gray-600">Loading Active Drivers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">Active Drivers</h1>
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2 text-red-600">Unable to Connect</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Make sure the AC server is running</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Active Drivers</h1>

      {session && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <div className="text-sm text-gray-600 dark:text-gray-400">Session</div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{session.type}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600 dark:text-gray-400">Track</div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {session.trackName || session.track}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600 dark:text-gray-400">Players</div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {session.currentPlayers}/{session.maxPlayers}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600 dark:text-gray-400">Time Remaining</div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {session.timeRemaining}s
            </div>
          </div>
        </div>
      )}

      <div className="card">
        {players.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
              No Active Drivers
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Players will appear here when they connect to the server
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Car
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Ping
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-950 divide-y divide-gray-200 dark:divide-gray-800">
                {players.map((player) => (
                  <tr
                    key={player.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <td className="px-6 py-4 text-gray-900 dark:text-gray-100">{player.name}</td>
                    <td className="px-6 py-4 text-gray-900 dark:text-gray-100">
                      {player.carName || player.car}
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-gray-100">
                      {player.position}
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-gray-100">{player.ping}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ActiveDrivers;
