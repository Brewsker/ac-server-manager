import { useState, useEffect } from 'react';
import api from '../api/client';
import { useTheme } from '../contexts/ThemeContext';

function Settings() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [currentVersion, setCurrentVersion] = useState('Loading...');
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Load current version on mount
    loadCurrentVersion();
  }, []);

  const loadCurrentVersion = async () => {
    try {
      const data = await api.getCurrentVersion();
      setCurrentVersion(data.version);
    } catch (error) {
      console.error('Failed to load version:', error);
      setCurrentVersion('Unknown');
    }
  };

  const handleCheckForUpdates = async () => {
    setCheckingUpdate(true);
    setUpdateInfo(null);

    try {
      const data = await api.checkForUpdates();
      setUpdateInfo(data);
    } catch (error) {
      console.error('Failed to check for updates:', error);
      setUpdateInfo({
        error: true,
        message: 'Failed to connect to update server',
      });
    } finally {
      setCheckingUpdate(false);
    }
  };

  const openReleaseUrl = () => {
    if (updateInfo?.releaseUrl) {
      window.open(updateInfo.releaseUrl, '_blank');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Main Settings (2/3 width) */}
        <div className="col-span-2 space-y-6">
          {/* AC Installation Paths */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">AC Installation Paths</h2>

            <div className="space-y-4">
              <div>
                <label className="label">AC Server Executable</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="C:/Steam/steamapps/common/assettocorsa/server/acServer.exe"
                />
              </div>

              <div>
                <label className="label">AC Content Folder</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="C:/Steam/steamapps/common/assettocorsa/content"
                />
              </div>

              <div>
                <label className="label">Server Config Path</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="C:/Steam/steamapps/common/assettocorsa/server/cfg"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Application Settings</h2>

            <div className="space-y-4">
              <div className="flex items-center">
                <input type="checkbox" id="auto-start" className="mr-2" />
                <label htmlFor="auto-start">Auto-start server on app launch</label>
              </div>

              <div className="flex items-center">
                <input type="checkbox" id="notifications" className="mr-2" />
                <label htmlFor="notifications">Enable notifications</label>
              </div>
            </div>
          </div>

          <button className="btn-primary">Save Settings</button>
        </div>

        {/* Right Column - Updates & Appearance (1/3 width) */}
        <div className="col-span-1 space-y-6">
          {/* Update Section */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Application Updates</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Version</p>
                  <p className="text-lg font-semibold">{currentVersion}</p>
                </div>
                <button
                  onClick={handleCheckForUpdates}
                  disabled={checkingUpdate}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkingUpdate ? 'Checking...' : 'Check for Updates'}
                </button>
              </div>

              {updateInfo && (
                <div
                  className={`p-4 rounded-lg ${
                    updateInfo.error
                      ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                      : updateInfo.updateAvailable
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                      : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  }`}
                >
                  {updateInfo.error ? (
                    <div>
                      <p className="font-semibold text-red-700 dark:text-red-400">
                        Error checking for updates
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-500 mt-1">
                        {updateInfo.message}
                      </p>
                    </div>
                  ) : updateInfo.updateAvailable ? (
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-blue-700 dark:text-blue-400">
                            Update Available: v{updateInfo.latestVersion}
                          </p>
                          <p className="text-sm text-blue-600 dark:text-blue-500 mt-1">
                            Released: {new Date(updateInfo.publishedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={openReleaseUrl}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Download Update
                        </button>
                      </div>

                      {updateInfo.releaseNotes && (
                        <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                          <p className="font-semibold text-sm text-blue-700 dark:text-blue-400 mb-2">
                            Release Notes:
                          </p>
                          <div className="text-sm text-blue-600 dark:text-blue-500 whitespace-pre-wrap max-h-40 overflow-y-auto">
                            {updateInfo.releaseNotes}
                          </div>
                        </div>
                      )}

                      {updateInfo.assets && updateInfo.assets.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                          <p className="font-semibold text-sm text-blue-700 dark:text-blue-400 mb-2">
                            Available Downloads:
                          </p>
                          <div className="space-y-1">
                            {updateInfo.assets.map((asset, index) => (
                              <a
                                key={index}
                                href={asset.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                📦 {asset.name} ({(asset.size / 1024 / 1024).toFixed(2)} MB)
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-green-700 dark:text-green-400">
                        You're up to date!
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                        {updateInfo.message ||
                          `Version ${updateInfo.currentVersion} is the latest version`}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Appearance Settings */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Appearance</h2>

            <div className="space-y-4">
              <div>
                <label className="label">Theme</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="input-field"
                >
                  <option value="light">☀️ Light</option>
                  <option value="dark">🌙 Dark</option>
                  <option value="system">💻 System</option>
                </select>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Choose how the app looks. System mode uses your OS theme preference.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
