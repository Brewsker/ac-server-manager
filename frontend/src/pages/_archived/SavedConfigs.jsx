import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useKeyboardNav } from '../hooks/useKeyboardNav';

function SavedConfigs() {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [selectedPresets, setSelectedPresets] = useState(new Set());
  const [activeTab, setActiveTab] = useState('view'); // 'view', 'duplicate', 'delete'
  const navigate = useNavigate();

  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    try {
      const data = await api.getPresets();
      setPresets(data.presets || []);
    } catch (error) {
      console.error('Failed to fetch presets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadPreset = async (presetId) => {
    try {
      await api.loadPreset(presetId);
      navigate('/config', { state: { presetLoaded: true, timestamp: Date.now() } });
    } catch (error) {
      console.error('Failed to load preset:', error);
    }
  };

  const handleDuplicate = async (preset) => {
    const name = prompt(`Duplicate "${preset.name}" as:`, `${preset.name} (Copy)`);
    if (!name) return;

    try {
      await api.duplicatePreset(preset.id, name);
      await fetchPresets();
      console.log('Configuration duplicated:', name);

      // Notify sidebar to refresh
      window.dispatchEvent(new CustomEvent('presetSaved'));
    } catch (error) {
      console.error('Failed to duplicate preset:', error);
    }
  };

  const togglePresetSelection = (presetId) => {
    setSelectedPresets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(presetId)) {
        newSet.delete(presetId);
      } else {
        newSet.add(presetId);
      }
      return newSet;
    });
  };

  const selectAllPresets = () => {
    setSelectedPresets(new Set(presets.map((p) => p.id)));
  };

  const clearSelection = () => {
    setSelectedPresets(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedPresets.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedPresets.size} preset(s)? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await Promise.all(Array.from(selectedPresets).map((id) => api.deletePreset(id)));
      await fetchPresets();
      clearSelection();
      setActiveTab('view');
      console.log(`Deleted ${selectedPresets.size} preset(s)`);

      // Notify sidebar to refresh
      window.dispatchEvent(new CustomEvent('presetSaved'));
    } catch (error) {
      console.error('Failed to delete presets:', error);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteModal) return;

    try {
      await api.deletePreset(showDeleteModal.id);
      await fetchPresets();
      setShowDeleteModal(null);
      console.log('Configuration deleted');

      // Notify sidebar to refresh
      window.dispatchEvent(new CustomEvent('presetSaved'));
    } catch (error) {
      console.error('Failed to delete preset:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading configurations...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Preset Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Organize and maintain your server configuration presets
          </p>
        </div>
        <button
          onClick={fetchPresets}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Refresh preset list"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Tab Navigation */}
      {presets.length > 0 && (
        <div className="mb-6">
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setActiveTab('view');
                clearSelection();
              }}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'view'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              📋 View All
            </button>
            <button
              onClick={() => {
                setActiveTab('duplicate');
                clearSelection();
              }}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'duplicate'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              📋 Duplicate
            </button>
            <button
              onClick={() => {
                setActiveTab('delete');
                clearSelection();
              }}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'delete'
                  ? 'border-red-500 text-red-600 dark:text-red-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              🗑️ Delete
            </button>
          </div>

          {/* Tab-specific controls */}
          {activeTab === 'delete' && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-800 dark:text-red-300 font-medium">
                    Delete Mode - Select presets to delete
                  </p>
                  {selectedPresets.size > 0 && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {selectedPresets.size} preset(s) selected
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllPresets}
                    className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={selectedPresets.size === 0}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                  >
                    Delete Selected
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'duplicate' && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded">
              <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                Duplicate Mode - Click on a preset to duplicate it
              </p>
            </div>
          )}
        </div>
      )}

      {presets.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
            No saved configurations
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Use the "+ New" button in the sidebar to create your first preset
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presets.map((preset) => (
            <div
              key={preset.id}
              onClick={() => {
                if (activeTab === 'duplicate') {
                  handleDuplicate(preset);
                } else if (activeTab === 'delete') {
                  togglePresetSelection(preset.id);
                }
              }}
              className={`card transition-all ${
                activeTab === 'delete'
                  ? selectedPresets.has(preset.id)
                    ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-950/20'
                    : 'cursor-pointer hover:ring-2 hover:ring-red-300 dark:hover:ring-red-800'
                  : activeTab === 'duplicate'
                  ? 'cursor-pointer hover:shadow-lg hover:ring-2 hover:ring-blue-300 dark:hover:ring-blue-800'
                  : 'hover:shadow-lg'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {activeTab === 'delete' && (
                      <input
                        type="checkbox"
                        checked={selectedPresets.has(preset.id)}
                        onChange={() => togglePresetSelection(preset.id)}
                        className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {preset.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Created: {new Date(preset.created).toLocaleDateString()}
                  </p>
                </div>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-medium rounded border border-blue-200 dark:border-blue-800">
                  Preset
                </span>
              </div>

              {preset.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {preset.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800">
                {preset.track && (
                  <div>
                    <span className="font-medium">Track:</span> {preset.track}
                  </div>
                )}
                {preset.cars && (
                  <div>
                    <span className="font-medium">Cars:</span> {preset.cars}
                  </div>
                )}
                {preset.maxClients && (
                  <div>
                    <span className="font-medium">Max Clients:</span> {preset.maxClients}
                  </div>
                )}
                {preset.sessions && (
                  <div>
                    <span className="font-medium">Sessions:</span> {preset.sessions}
                  </div>
                )}
              </div>

              {activeTab === 'view' && (
                <button
                  onClick={() => setShowDeleteModal(preset)}
                  className="w-full px-3 py-2 bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm font-medium rounded hover:bg-red-200 dark:hover:bg-red-950/50 transition-colors border border-red-200 dark:border-red-800"
                  title="Delete this preset"
                >
                  🗑️ Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteModal
          preset={showDeleteModal}
          onClose={() => setShowDeleteModal(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

// Delete Confirmation Modal Component
function DeleteModal({ preset, onClose, onConfirm }) {
  const { selectedIndex, buttonRefs } = useKeyboardNav(
    2,
    (index) => {
      if (index === 0) onClose();
      else if (index === 1) onConfirm();
    },
    onClose,
    1 // Default to Delete button
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Delete Configuration?
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to delete "{preset.name}"? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            ref={(el) => (buttonRefs.current[0] = el)}
            onClick={onClose}
            className={`px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
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
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default SavedConfigs;
