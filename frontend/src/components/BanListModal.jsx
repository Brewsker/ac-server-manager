import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import api from '../api/client';
import { useKeyboardNav } from '../hooks/useKeyboardNav';

function BanListModal({ onClose }) {
  const [bans, setBans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddBan, setShowAddBan] = useState(false);
  const [showUnbanModal, setShowUnbanModal] = useState(null);
  const [newBan, setNewBan] = useState({
    steamId: '',
    playerName: '',
    reason: '',
    duration: 0
  });

  // Keyboard navigation for main modal buttons (Add Ban / Close)
  const { selectedIndex: mainSelectedIndex, buttonRefs: mainButtonRefs } = useKeyboardNav(
    2,
    (index) => {
      if (index === 0) setShowAddBan(!showAddBan);
      else if (index === 1) onClose();
    },
    onClose,
    0 // Default to Add Ban button (action)
  );

  useEffect(() => {
    fetchBans();
  }, []);

  const fetchBans = async () => {
    try {
      const data = await api.getBans();
      setBans(data.bans || []);
    } catch (error) {
      console.error('Failed to fetch bans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnban = async () => {
    if (!showUnbanModal) return;
    
    try {
      await api.removeBan(showUnbanModal.id);
      console.log('Ban removed');
      setShowUnbanModal(null);
      fetchBans();
    } catch (error) {
      console.error('Failed to remove ban:', error);
    }
  };

  const handleAddBan = async () => {
    if (!newBan.steamId.trim()) {
      alert('Steam ID is required');
      return;
    }
    
    try {
      await api.addBan(newBan);
      console.log('Ban added');
      setNewBan({ steamId: '', playerName: '', reason: '', duration: 0 });
      setShowAddBan(false);
      fetchBans();
    } catch (error) {
      console.error('Failed to add ban:', error);
    }
  };

  const formatExpiry = (ban) => {
    if (ban.duration === 0) return 'Permanent';
    
    const expiresAt = new Date(ban.expiresAt);
    const now = new Date();
    const remaining = expiresAt - now;
    
    if (remaining <= 0) return 'Expired';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h remaining`;
    
    const days = Math.floor(hours / 24);
    return `${days}d remaining`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Ban List</h2>
          <div className="flex gap-2">
            <button
              ref={(el) => (mainButtonRefs.current[0] = el)}
              onClick={() => setShowAddBan(!showAddBan)}
              className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${
                mainSelectedIndex === 0 ? 'ring-2 ring-blue-800' : ''
              }`}
            >
              {showAddBan ? 'Cancel' : '+ Add Ban'}
            </button>
            <button
              ref={(el) => (mainButtonRefs.current[1] = el)}
              onClick={onClose}
              className={`px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors ${
                mainSelectedIndex === 1 ? 'ring-2 ring-gray-500' : ''
              }`}
            >
              Close
            </button>
          </div>
        </div>

        {showAddBan && (
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded mb-4 border border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Add New Ban</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                placeholder="Steam ID (required)"
                value={newBan.steamId}
                onChange={(e) => setNewBan({ ...newBan, steamId: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Player Name"
                value={newBan.playerName}
                onChange={(e) => setNewBan({ ...newBan, playerName: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Reason"
                value={newBan.reason}
                onChange={(e) => setNewBan({ ...newBan, reason: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newBan.duration}
                onChange={(e) => setNewBan({ ...newBan, duration: parseInt(e.target.value) })}
                className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Permanent</option>
                <option value={1}>1 hour</option>
                <option value={24}>24 hours</option>
                <option value={168}>7 days</option>
                <option value={720}>30 days</option>
              </select>
            </div>
            <button
              onClick={handleAddBan}
              className="w-full px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
            >
              Add Ban
            </button>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : bans.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-semibold mb-2">No Bans</h3>
              <p className="text-gray-600">No players are currently banned</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Player</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Steam ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Banned</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Expires</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bans.map((ban) => (
                  <tr key={ban.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{ban.playerName || 'Unknown'}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs text-gray-600">{ban.steamId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">{ban.reason || 'No reason provided'}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {new Date(ban.bannedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-sm ${ban.duration === 0 ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                        {formatExpiry(ban)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => setShowUnbanModal(ban)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Unban
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Unban Confirmation Modal */}
        {showUnbanModal && (
          <UnbanModal
            ban={showUnbanModal}
            onConfirm={handleUnban}
            onCancel={() => setShowUnbanModal(null)}
          />
        )}
      </div>
    </div>
  );
}

// Unban Confirmation Modal Component
function UnbanModal({ ban, onConfirm, onCancel }) {
  const { selectedIndex, buttonRefs } = useKeyboardNav(
    2,
    (index) => {
      if (index === 0) onCancel();
      else if (index === 1) onConfirm();
    },
    onCancel,
    1 // Default to Unban button (action)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold mb-4">Remove Ban?</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to unban <strong>{ban.playerName || ban.steamId}</strong>?
        </p>
        <div className="flex gap-3 justify-end">
          <button
            ref={(el) => (buttonRefs.current[0] = el)}
            onClick={onCancel}
            className={`px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors ${
              selectedIndex === 0 ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            Cancel
          </button>
          <button
            ref={(el) => (buttonRefs.current[1] = el)}
            onClick={onConfirm}
            className={`px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors ${
              selectedIndex === 1 ? 'ring-2 ring-red-800' : ''
            }`}
          >
            Unban
          </button>
        </div>
      </div>
    </div>
  );
}

BanListModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default BanListModal;
