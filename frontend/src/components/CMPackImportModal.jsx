import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import api from '../api/client';

function CMPackImportModal({ onClose, onImported }) {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(null);
  const [error, setError] = useState(null);
  const [presetName, setPresetName] = useState('');
  const [selectedPack, setSelectedPack] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  useEffect(() => {
    fetchPacks();
  }, []);

  const fetchPacks = async () => {
    try {
      setLoading(true);
      const result = await api.listCMPacks();
      setPacks(result.packs || []);
    } catch (error) {
      console.error('Failed to fetch CM packs:', error);
      setError('Failed to load CM packs');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedPack && !uploadedFile) {
      alert('Please select or upload a pack to import');
      return;
    }

    try {
      let result;

      if (uploadedFile) {
        // Upload from user's PC
        setImporting(uploadedFile.name);

        // Read file as base64
        const reader = new FileReader();
        const fileData = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result.split(',')[1]); // Get base64 part
          reader.onerror = reject;
          reader.readAsDataURL(uploadedFile);
        });

        result = await api.uploadCMPack(fileData, uploadedFile.name, presetName || null);
      } else {
        // Import from server folder
        setImporting(selectedPack.filename);
        result = await api.importCMPack(selectedPack.filename, presetName || null);
      }

      console.log('Pack imported:', result);

      // Close modal and notify parent
      if (onImported) {
        onImported(result.preset);
      }
      onClose();
    } catch (error) {
      console.error('Failed to import pack:', error);
      alert(`Failed to import pack: ${error.message || 'Unknown error'}`);
    } finally {
      setImporting(null);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validExtensions = ['.zip', '.tar.gz', '.tgz'];
      const isValid = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

      if (!isValid) {
        alert('Invalid file type. Please upload .zip, .tar.gz, or .tgz files.');
        return;
      }

      setUploadedFile(file);
      setSelectedPack(null); // Deselect server packs when uploading
      setPresetName(''); // Reset preset name
    }
  };

  const handleDelete = async (filename) => {
    if (!confirm(`Delete ${filename}?`)) return;

    try {
      await api.deleteCMPack(filename);
      setPacks(packs.filter((p) => p.filename !== filename));
    } catch (error) {
      console.error('Failed to delete pack:', error);
      alert('Failed to delete pack');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Import Content Manager Pack
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Select a CM pack to import as a preset
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* File Upload Section */}
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Upload from PC:
            </label>
            <input
              type="file"
              accept=".zip,.tar.gz,.tgz"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded cursor-pointer bg-gray-50 dark:bg-gray-700 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900 dark:file:text-blue-200 hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
            />
            {uploadedFile && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Selected: {uploadedFile.name}
              </div>
            )}
          </div>

          {/* Server Packs Section */}
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Loading packs...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600 dark:text-red-400">{error}</div>
          ) : (
            <>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Or select from server:
              </div>
              {packs.length === 0 ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                  <p className="mb-2">No packs in server folder</p>
                  <p className="text-xs">
                    Place .zip or .tar.gz files in{' '}
                    <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
                      backend/data/cm-packs/
                    </code>
                  </p>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {packs.map((pack) => (
                    <div
                      key={pack.filename}
                      onClick={() => setSelectedPack(pack)}
                      className={`flex items-center gap-3 px-4 py-3 rounded border cursor-pointer transition-colors ${
                        selectedPack?.filename === pack.filename
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <svg
                        className="w-5 h-5 text-blue-500 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {pack.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {pack.filename}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(pack.filename);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete pack file"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {(selectedPack || uploadedFile) && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preset Name (optional)
                  </label>
                  <input
                    type="text"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Leave empty to use pack name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Custom name for the imported preset
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
          <button
            onClick={handleImport}
            disabled={(!selectedPack && !uploadedFile) || importing}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {importing ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Importing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Import
              </>
            )}
          </button>
          <div className="flex-1"></div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 dark:bg-gray-600 text-white rounded hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

CMPackImportModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onImported: PropTypes.func,
};

export default CMPackImportModal;
