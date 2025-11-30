import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useKeyboardNav } from '../hooks/useKeyboardNav';

function SavedConfigs() {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showRenameModal, setShowRenameModal] = useState(null);
  const [newName, setNewName] = useState('');
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

  const handleEdit = async (presetId) => {
    try {
      await api.loadPreset(presetId);
      navigate('/config', { state: { presetLoaded: true, timestamp: Date.now() } });
    } catch (error) {
      console.error('Failed to load preset for editing:', error);
    }
  };

  const handleDuplicate = async (preset) => {
    const name = prompt(`Duplicate "${preset.name}" as:`, `${preset.name} (Copy)`);
    if (!name) return;

    try {
      await api.duplicatePreset(preset.id, name);
      await fetchPresets();
      console.log('Configuration duplicated:', name);
    } catch (error) {
      console.error('Failed to duplicate preset:', error);
    }
  };

  const handleRename = async () => {
    if (!newName.trim() || !showRenameModal) return;

    try {
      await api.renamePreset(showRenameModal.id, newName);
      await fetchPresets();
      setShowRenameModal(null);
      setNewName('');
    } catch (error) {
      console.error('Failed to rename preset:', error);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteModal) return;

    try {
      await api.deletePreset(showDeleteModal.id);
      await fetchPresets();
      setShowDeleteModal(null);
      console.log('Configuration deleted');
    } catch (error) {
      console.error('Failed to delete preset:', error);
    }
  };

  const handleSaveCurrent = async () => {
    const name = prompt('Save current configuration as:');
    if (!name) return;

    try {
      await api.savePreset(name);
      await fetchPresets();
      console.log('Current configuration saved as:', name);
    } catch (error) {
      console.error('Failed to save preset:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading configurations...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Saved Configurations</h1>
          <p className="text-gray-600 mt-2">Manage your configuration presets</p>
        </div>
        <button
          onClick={handleSaveCurrent}
          className="btn-primary"
        >
          + Save Current Config
        </button>
      </div>

      {presets.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold mb-2">No saved configurations</h3>
          <p className="text-gray-600 mb-6">
            Create your first preset by configuring your server and clicking "Save Current Config"
          </p>
          <button
            onClick={() => navigate('/config')}
            className="btn-primary"
          >
            Go to Config Editor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {preset.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(preset.created).toLocaleDateString()}
                  </p>
                </div>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-medium rounded border border-blue-200 dark:border-blue-800">
                  Preset
                </span>
              </div>

              {preset.description && (
                <p className="text-sm text-gray-600 mb-4">
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

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(preset.id)}
                  className="flex-1 px-3 py-2 bg-blue-600 dark:bg-blue-700 text-white text-sm font-medium rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  title="Open this preset in the editor"
                >
                  ✏️ Edit
                </button>
              </div>
              
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleDuplicate(preset)}
                  className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title="Duplicate"
                >
                  📋 Copy
                </button>
                <button
                  onClick={() => {
                    setShowRenameModal(preset);
                    setNewName(preset.name);
                  }}
                  className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title="Rename"
                >
                  ✏️ Rename
                </button>
                <button
                  onClick={() => setShowDeleteModal(preset)}
                  className="flex-1 px-3 py-2 bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm font-medium rounded hover:bg-red-200 dark:hover:bg-red-950/50 transition-colors border border-red-200 dark:border-red-800"
                  title="Delete"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && <DeleteModal preset={showDeleteModal} onClose={() => setShowDeleteModal(null)} onConfirm={handleDelete} />}

      {/* Rename Modal */}
      {showRenameModal && (
        <RenameModal 
          preset={showRenameModal} 
          currentName={newName}
          onNameChange={setNewName}
          onClose={() => {
            setShowRenameModal(null);
            setNewName('');
          }} 
          onConfirm={handleRename} 
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
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold mb-4">Delete Configuration?</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete "{preset.name}"? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            ref={(el) => (buttonRefs.current[0] = el)}
            onClick={onClose}
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
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Rename Modal Component
function RenameModal({ preset, currentName, onNameChange, onClose, onConfirm }) {
  const { selectedIndex, buttonRefs } = useKeyboardNav(
    2,
    (index) => {
      if (index === 0) onClose();
      else if (index === 1 && currentName.trim()) onConfirm();
    },
    onClose,
    1 // Default to Rename button (action)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold mb-4">Rename Configuration</h3>
        <input
          type="text"
          value={currentName}
          onChange={(e) => onNameChange(e.target.value)}
          className="input-field mb-6"
          placeholder="Enter new name"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && currentName.trim()) {
              e.preventDefault();
              onConfirm();
            }
          }}
        />
        <div className="flex gap-3 justify-end">
          <button
            ref={(el) => (buttonRefs.current[0] = el)}
            onClick={onClose}
            className={`px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors ${
              selectedIndex === 0 ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            Cancel
          </button>
          <button
            ref={(el) => (buttonRefs.current[1] = el)}
            onClick={onConfirm}
            disabled={!currentName.trim()}
            className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors ${
              selectedIndex === 1 ? 'ring-2 ring-blue-800' : ''
            }`}
          >
            Rename
          </button>
        </div>
      </div>
    </div>
  );
}

export default SavedConfigs;
