import { useState, useEffect } from 'react';
import api from '../api/client';
import { useTheme } from '../contexts/ThemeContext';

function Settings() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [currentVersion, setCurrentVersion] = useState('Loading...');
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [applyingUpdate, setApplyingUpdate] = useState(false);
  const [updateBranch, setUpdateBranch] = useState('main');
  const { theme, setTheme } = useTheme();

  // Content upload states
  const [uploadingTrack, setUploadingTrack] = useState(false);
  const [uploadingCar, setUploadingCar] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);

  // Steam/AC server download states
  const [steamcmdInstalled, setSteamcmdInstalled] = useState(null);
  const [checkingSteamCmd, setCheckingSteamCmd] = useState(false);
  const [installingSteamCmd, setInstallingSteamCmd] = useState(false);
  const [downloadingACServer, setDownloadingACServer] = useState(false);
  const [acServerPath, setAcServerPath] = useState('/opt/acserver');
  const [steamUser, setSteamUser] = useState('');
  const [steamPass, setSteamPass] = useState('');
  const [steamMessage, setSteamMessage] = useState(null);

  useEffect(() => {
    // Load current version on mount
    loadCurrentVersion();
    // Check SteamCMD status on mount
    checkSteamCMDStatus();
  }, []);

  const loadCurrentVersion = async () => {
    try {
      console.log('[Settings] Loading current version...');
      const data = await api.getCurrentVersion();
      console.log('[Settings] Version data received:', data);
      setCurrentVersion(data.version);
    } catch (error) {
      console.error('[Settings] Failed to load version:', error);
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

  const handleApplyUpdate = async () => {
    setApplyingUpdate(true);
    try {
      const result = await api.applyUpdate(updateBranch);

      if (result.success) {
        // Show success message
        setUploadMessage({
          type: 'success',
          text: result.message || 'Update applied successfully! Restarting...',
        });

        // If server is restarting, reload page after delay
        if (result.requiresRestart) {
          setTimeout(() => {
            window.location.reload();
          }, 5000);
        } else {
          // Just close modal and refresh update status
          setShowUpdateConfirm(false);
          await handleCheckForUpdates();
        }
      }
    } catch (error) {
      console.error('Failed to apply update:', error);
      setUploadMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to apply update',
      });
    } finally {
      setApplyingUpdate(false);
    }
  };

  const handleTrackUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingTrack(true);
    setUploadMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:3001/api/content/upload/track', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadMessage({
          type: 'success',
          message: `Track "${result.name}" installed successfully!`,
        });
      } else {
        setUploadMessage({
          type: 'error',
          message: result.error || 'Failed to upload track',
        });
      }
    } catch (error) {
      setUploadMessage({
        type: 'error',
        message: 'Failed to upload track: ' + error.message,
      });
    } finally {
      setUploadingTrack(false);
      event.target.value = ''; // Reset file input
    }
  };

  const handleCarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingCar(true);
    setUploadMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:3001/api/content/upload/car', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadMessage({
          type: 'success',
          message: `Car "${result.name}" installed successfully!`,
        });
      } else {
        setUploadMessage({
          type: 'error',
          message: result.error || 'Failed to upload car',
        });
      }
    } catch (error) {
      setUploadMessage({
        type: 'error',
        message: 'Failed to upload car: ' + error.message,
      });
    } finally {
      setUploadingCar(false);
      event.target.value = ''; // Reset file input
    }
  };

  const checkSteamCMDStatus = async () => {
    setCheckingSteamCmd(true);
    setSteamMessage(null);
    try {
      const result = await api.checkSteamCMD();
      setSteamcmdInstalled(result.installed);
    } catch (error) {
      console.error('Failed to check SteamCMD status:', error);
      setSteamMessage({
        type: 'error',
        text: 'Failed to check SteamCMD status',
      });
    } finally {
      setCheckingSteamCmd(false);
    }
  };

  const handleInstallSteamCMD = async () => {
    setInstallingSteamCmd(true);
    setSteamMessage(null);
    try {
      const result = await api.installSteamCMD();
      if (result.success) {
        setSteamMessage({
          type: 'success',
          text: result.message || 'SteamCMD installed successfully!',
        });
        setSteamcmdInstalled(true);
      } else {
        setSteamMessage({
          type: 'error',
          text: result.message || 'Failed to install SteamCMD',
        });
      }
    } catch (error) {
      console.error('Failed to install SteamCMD:', error);
      setSteamMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to install SteamCMD',
      });
    } finally {
      setInstallingSteamCmd(false);
    }
  };

  const handleDownloadACServer = async () => {
    if (!acServerPath.trim()) {
      setSteamMessage({
        type: 'error',
        text: 'Please enter an installation path',
      });
      return;
    }

    if (!steamUser.trim() || !steamPass.trim()) {
      setSteamMessage({
        type: 'error',
        text: 'Steam credentials are required to download AC Dedicated Server (you must own Assetto Corsa)',
      });
      return;
    }

    setDownloadingACServer(true);
    setSteamMessage(null);
    try {
      const result = await api.downloadACServer(
        acServerPath,
        steamUser,
        steamPass
      );
      if (result.success) {
        setSteamMessage({
          type: 'success',
          text: `AC Server installed successfully! Version: ${result.version || 'Unknown'}`,
        });
      } else {
        setSteamMessage({
          type: 'error',
          text: result.message || 'Failed to download AC server',
        });
      }
    } catch (error) {
      console.error('Failed to download AC server:', error);
      setSteamMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to download AC server',
      });
    } finally {
      setDownloadingACServer(false);
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

          {/* AC Server Download Section */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Download AC Dedicated Server</h2>

            <div className="space-y-4">
              {steamMessage && (
                <div
                  className={`p-3 rounded-lg ${
                    steamMessage.type === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      steamMessage.type === 'success'
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-red-700 dark:text-red-400'
                    }`}
                  >
                    {steamMessage.text}
                  </p>
                </div>
              )}

              {/* SteamCMD Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <p className="font-medium">SteamCMD Status</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {checkingSteamCmd
                      ? 'Checking...'
                      : steamcmdInstalled === null
                      ? 'Unknown'
                      : steamcmdInstalled
                      ? '✅ Installed'
                      : '❌ Not Installed'}
                  </p>
                </div>
                {!steamcmdInstalled && steamcmdInstalled !== null && (
                  <button
                    onClick={handleInstallSteamCMD}
                    disabled={installingSteamCmd}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {installingSteamCmd ? 'Installing...' : 'Install SteamCMD'}
                  </button>
                )}
              </div>

              {/* AC Server Download Form */}
              {steamcmdInstalled && (
                <>
                  <div>
                    <label className="label">Installation Path</label>
                    <input
                      type="text"
                      value={acServerPath}
                      onChange={(e) => setAcServerPath(e.target.value)}
                      disabled={downloadingACServer}
                      className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="/opt/acserver"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Directory where the AC dedicated server will be installed
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Steam Username <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={steamUser}
                        onChange={(e) => setSteamUser(e.target.value)}
                        disabled={downloadingACServer}
                        className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="username"
                        required
                      />
                    </div>

                    <div>
                      <label className="label">Steam Password <span className="text-red-500">*</span></label>
                      <input
                        type="password"
                        value={steamPass}
                        onChange={(e) => setSteamPass(e.target.value)}
                        disabled={downloadingACServer}
                        className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="password"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                      🔐 Steam Account Required
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      You must own Assetto Corsa on Steam to download the dedicated server. Your credentials are used only for this download and are NOT stored. After download completes, the server runs independently without any Steam connection.
                    </p>
                  </div>

                  <button
                    onClick={handleDownloadACServer}
                    disabled={downloadingACServer || !acServerPath.trim() || !steamUser.trim() || !steamPass.trim()}
                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {downloadingACServer ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Downloading AC Server... This may take several minutes
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        Download AC Dedicated Server
                      </>
                    )}
                  </button>
                </>
              )}

              {!steamcmdInstalled && steamcmdInstalled !== null && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ SteamCMD is required to download the Assetto Corsa dedicated server. Click
                    "Install SteamCMD" above to install it first.
                  </p>
                </div>
              )}
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

          {/* Content Upload Section */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Content Management</h2>

            <div className="space-y-4">
              {uploadMessage && (
                <div
                  className={`p-3 rounded-lg ${
                    uploadMessage.type === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      uploadMessage.type === 'success'
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-red-700 dark:text-red-400'
                    }`}
                  >
                    {uploadMessage.message}
                  </p>
                </div>
              )}

              <div>
                <label className="label">Upload Track (ZIP)</label>
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleTrackUpload}
                  disabled={uploadingTrack}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary-600 file:text-white
                    hover:file:bg-primary-700
                    file:cursor-pointer
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {uploadingTrack
                    ? 'Uploading and installing track...'
                    : 'Upload a track ZIP file. Max 500MB.'}
                </p>
              </div>

              <div>
                <label className="label">Upload Car (ZIP)</label>
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleCarUpload}
                  disabled={uploadingCar}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary-600 file:text-white
                    hover:file:bg-primary-700
                    file:cursor-pointer
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {uploadingCar
                    ? 'Uploading and installing car...'
                    : 'Upload a car ZIP file. Max 500MB.'}
                </p>
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
                        <div className="flex gap-2">
                          <button
                            onClick={openReleaseUrl}
                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm font-medium"
                          >
                            View Release
                          </button>
                          <button
                            onClick={() => setShowUpdateConfirm(true)}
                            disabled={applyingUpdate}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {applyingUpdate ? 'Installing...' : 'Install Update'}
                          </button>
                        </div>
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

      {/* Update Confirmation Modal */}
      {showUpdateConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Confirm Update
              </h3>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-gray-700 dark:text-gray-300">
                    Update from <span className="font-semibold">v{currentVersion}</span> to{' '}
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      v{updateInfo?.latestVersion}
                    </span>
                    ?
                  </p>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">⚠️ This will:</p>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 ml-4 list-disc space-y-1">
                    <li>Stash any local changes</li>
                    <li>Pull the latest code from Git ({updateBranch} branch)</li>
                    <li>Install updated dependencies</li>
                    <li>Rebuild the frontend</li>
                    <li>Restart the application</li>
                  </ul>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-3">
                    The page will automatically reload when the update is complete.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Update Branch
                  </label>
                  <select
                    value={updateBranch}
                    onChange={(e) => setUpdateBranch(e.target.value)}
                    disabled={applyingUpdate}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="main">main (production)</option>
                    <option value="develop">develop (latest features)</option>
                  </select>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Choose which branch to pull from. Use 'develop' for latest features or 'main'
                    for stable releases.
                  </p>
                </div>

                {updateInfo?.releaseNotes && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-4 max-h-40 overflow-y-auto">
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">
                      Release Notes:
                    </p>
                    <div className="text-sm text-blue-600 dark:text-blue-500 whitespace-pre-wrap">
                      {updateInfo.releaseNotes}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowUpdateConfirm(false)}
                  disabled={applyingUpdate}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyUpdate}
                  disabled={applyingUpdate}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {applyingUpdate ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Installing...
                    </>
                  ) : (
                    'Install Update & Restart'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
