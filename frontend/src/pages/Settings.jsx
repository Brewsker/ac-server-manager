import { useState, useEffect } from 'react';
import api from '../api/client';
import { useTheme } from '../contexts/ThemeContext';

function Settings() {
  // Tab state
  const [activeTab, setActiveTab] = useState('setup'); // 'setup' | 'system'

  const [updateInfo, setUpdateInfo] = useState(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [currentVersion, setCurrentVersion] = useState('Loading...');
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [applyingUpdate, setApplyingUpdate] = useState(false);
  const [updateBranch, setUpdateBranch] = useState('main');
  const { theme, setTheme } = useTheme();

  // Download progress states
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [speedUnit, setSpeedUnit] = useState('mbps'); // 'mbps' or 'MBps'

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
  const [steamGuardCode, setSteamGuardCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saveUsername, setSaveUsername] = useState(false);
  const [steamMessage, setSteamMessage] = useState(null);
  const [cacheStatus, setCacheStatus] = useState(null);
  const [checkingCache, setCheckingCache] = useState(false);
  const [copyingFromCache, setCopyingFromCache] = useState(false);

  // Base game download states
  const [downloadingBaseGame, setDownloadingBaseGame] = useState(false);
  const [extractingContent, setExtractingContent] = useState(false);
  const [cleaningUpBaseGame, setCleaningUpBaseGame] = useState(false);
  const [baseGamePath, setBaseGamePath] = useState('/tmp/ac-basegame');
  const [autoCleanup, setAutoCleanup] = useState(true);
  const [baseGameMessage, setBaseGameMessage] = useState(null);

  // Content status states
  const [contentStatus, setContentStatus] = useState(null);
  const [checkingContent, setCheckingContent] = useState(false);

  useEffect(() => {
    // Load current version on mount
    loadCurrentVersion();
    // Check SteamCMD status on mount
    checkSteamCMDStatus();
    // Check cache status on mount
    checkCacheStatus();
    // Check content status on mount
    checkContentStatus();
    // Load saved username if exists
    const saved = localStorage.getItem('steamUsername');
    if (saved) {
      setSteamUser(saved);
      setSaveUsername(true);
    }
  }, []);

  // Save username to localStorage when checkbox changes
  useEffect(() => {
    if (saveUsername && steamUser.trim()) {
      localStorage.setItem('steamUsername', steamUser);
    } else if (!saveUsername) {
      localStorage.removeItem('steamUsername');
    }
  }, [saveUsername, steamUser]);

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

  const checkCacheStatus = async () => {
    setCheckingCache(true);
    try {
      const result = await api.checkACServerCache();
      setCacheStatus(result);
    } catch (error) {
      console.error('Failed to check cache status:', error);
      setCacheStatus({ exists: false, error: error.message });
    } finally {
      setCheckingCache(false);
    }
  };

  const checkContentStatus = async () => {
    setCheckingContent(true);
    try {
      const result = await api.getContentStatus();
      setContentStatus(result);
    } catch (error) {
      console.error('Failed to check content status:', error);
      setContentStatus({ installed: false, error: error.message });
    } finally {
      setCheckingContent(false);
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
      const result = await api.downloadACServer(acServerPath, steamUser, steamPass, steamGuardCode);
      if (result.success) {
        setSteamMessage({
          type: 'success',
          text: `AC Server installed successfully! Version: ${result.version || 'Unknown'}`,
        });
        // Refresh cache status after successful download
        await checkCacheStatus();
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

  const handleCopyFromCache = async () => {
    if (!acServerPath.trim()) {
      setSteamMessage({
        type: 'error',
        text: 'Please enter an installation path',
      });
      return;
    }

    setCopyingFromCache(true);
    setSteamMessage(null);
    try {
      const result = await api.copyACServerFromCache(acServerPath);
      if (result.success) {
        setSteamMessage({
          type: 'success',
          text: result.message || 'AC Dedicated Server copied from cache successfully!',
        });
      } else {
        setSteamMessage({
          type: 'error',
          text: result.message || 'Failed to copy AC Dedicated Server from cache',
        });
      }
    } catch (error) {
      console.error('Failed to copy AC server from cache:', error);
      setSteamMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to copy AC Dedicated Server from cache',
      });
    } finally {
      setCopyingFromCache(false);
    }
  };

  const handleFormKeyPress = (event) => {
    // Handle Enter or NumpadEnter key
    if (event.key === 'Enter') {
      event.preventDefault();
      // Check if download button would be enabled
      if (!downloadingACServer && acServerPath.trim() && steamUser.trim() && steamPass.trim()) {
        handleDownloadACServer();
      }
    }
  };

  const handleDownloadBaseGame = async () => {
    if (!baseGamePath.trim()) {
      setBaseGameMessage({
        type: 'error',
        text: 'Please enter an installation path',
      });
      return;
    }

    if (!steamUser.trim() || !steamPass.trim()) {
      setBaseGameMessage({
        type: 'error',
        text: 'Steam credentials are required',
      });
      return;
    }

    setDownloadingBaseGame(true);
    setBaseGameMessage(null);

    try {
      // Step 1: Download base game
      setBaseGameMessage({
        type: 'info',
        text: '📥 Downloading AC base game (~12GB). This may take 10-30 minutes...',
      });

      const downloadResult = await api.downloadACBaseGame(
        baseGamePath,
        steamUser,
        steamPass,
        steamGuardCode
      );

      if (!downloadResult.success) {
        throw new Error(downloadResult.message || 'Download failed');
      }

      // Step 2: Extract content
      setBaseGameMessage({
        type: 'info',
        text: `✅ Downloaded! Now extracting ${downloadResult.carCount} cars and ${downloadResult.trackCount} tracks...`,
      });

      setExtractingContent(true);
      const serverContentPath = process.env.AC_CONTENT_PATH || '/opt/acserver/content';

      const extractResult = await api.extractACContent(baseGamePath, serverContentPath);

      if (!extractResult.success) {
        throw new Error(extractResult.message || 'Content extraction failed');
      }

      setExtractingContent(false);

      // Step 3: Cleanup if auto-cleanup enabled
      if (autoCleanup) {
        setBaseGameMessage({
          type: 'info',
          text: `✅ Content extracted! Cleaning up base game files...`,
        });

        setCleaningUpBaseGame(true);
        const cleanupResult = await api.cleanupACBaseGame(baseGamePath);

        if (cleanupResult.success) {
          setBaseGameMessage({
            type: 'success',
            text: `🎉 Success! Installed ${extractResult.carCount} cars and ${extractResult.trackCount} tracks. Freed ${cleanupResult.freedSpace}.`,
          });
        } else {
          setBaseGameMessage({
            type: 'success',
            text: `✅ Content installed successfully! ${extractResult.carCount} cars, ${extractResult.trackCount} tracks. (Cleanup skipped)`,
          });
        }

        setCleaningUpBaseGame(false);
      } else {
        setBaseGameMessage({
          type: 'success',
          text: `✅ Content installed successfully! ${extractResult.carCount} cars, ${extractResult.trackCount} tracks. Base game files kept at ${baseGamePath}`,
        });
      }

      // Clear content cache so new content appears in UI
      await api.post('/content/clear-cache');

      // Refresh content status to show new content
      await checkContentStatus();
    } catch (error) {
      console.error('Failed to download/extract base game:', error);
      setBaseGameMessage({
        type: 'error',
        text: error.response?.data?.message || error.message || 'Failed to download base game',
      });
    } finally {
      setDownloadingBaseGame(false);
      setExtractingContent(false);
      setCleaningUpBaseGame(false);
    }
  };

  const handleCleanupOnly = async () => {
    if (!baseGamePath.trim()) {
      setBaseGameMessage({
        type: 'error',
        text: 'Please enter the base game path to cleanup',
      });
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete all files in:\n${baseGamePath}\n\nThis cannot be undone!`
      )
    ) {
      return;
    }

    setCleaningUpBaseGame(true);
    setBaseGameMessage(null);

    try {
      const cleanupResult = await api.cleanupACBaseGame(baseGamePath);

      if (cleanupResult.success) {
        setBaseGameMessage({
          type: 'success',
          text: `Cleanup complete! Freed ${cleanupResult.freedSpace}`,
        });
      }
    } catch (error) {
      console.error('Failed to cleanup base game:', error);
      setBaseGameMessage({
        type: 'error',
        text: error.response?.data?.message || error.message || 'Failed to cleanup base game',
      });
    } finally {
      setCleaningUpBaseGame(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('setup')}
            className={`py-4 px-2 border-b-2 font-medium transition-colors ${
              activeTab === 'setup'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Setup
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`py-4 px-2 border-b-2 font-medium transition-colors ${
              activeTab === 'system'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            System
          </button>
        </nav>
      </div>

      {/* Setup Tab */}
      {activeTab === 'setup' && (
        <div className="space-y-6">
          {/* AC Installation Paths */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">AC Installation Paths</h2>

            <div className="space-y-4">
              <div>
                <label className="label">AC Server Executable</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="/opt/acserver/acServer"
                />
              </div>

              <div>
                <label className="label">AC Content Folder</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="/opt/acserver/content"
                />
              </div>

              <div>
                <label className="label">Server Config Path</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="/opt/acserver/cfg"
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
                      onKeyPress={handleFormKeyPress}
                      disabled={downloadingACServer || copyingFromCache}
                      className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="/opt/acserver"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Directory where the AC dedicated server will be installed
                    </p>
                  </div>

                  {/* Cache Status */}
                  {cacheStatus && cacheStatus.exists && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Cache Available - Fast Installation
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            AC server cache found ({cacheStatus.size || 'Unknown size'},{' '}
                            {cacheStatus.fileCount || '0'} files). Copy from cache in ~10 seconds
                            instead of downloading (~5-10 minutes).
                          </p>
                        </div>
                        <button
                          onClick={handleCopyFromCache}
                          disabled={copyingFromCache || !acServerPath.trim()}
                          className="btn-primary ml-4 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {copyingFromCache ? 'Copying...' : '⚡ Copy from Cache'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Divider when cache exists */}
                  {cacheStatus && cacheStatus.exists && (
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                          Or download from Steam
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="label">
                      Steam Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={steamUser}
                      onChange={(e) => setSteamUser(e.target.value)}
                      onKeyPress={handleFormKeyPress}
                      disabled={downloadingACServer}
                      className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="username"
                      required
                    />
                    <div className="flex items-center mt-2">
                      <input
                        type="checkbox"
                        id="save-username"
                        checked={saveUsername}
                        onChange={(e) => setSaveUsername(e.target.checked)}
                        className="rounded"
                      />
                      <label
                        htmlFor="save-username"
                        className="ml-2 text-sm text-gray-600 dark:text-gray-400"
                      >
                        Remember username for next session
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="label">
                      Steam Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={steamPass}
                        onChange={(e) => setSteamPass(e.target.value)}
                        onKeyPress={handleFormKeyPress}
                        disabled={downloadingACServer}
                        className="input-field disabled:opacity-50 disabled:cursor-not-allowed pr-10"
                        placeholder="password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        tabIndex={-1}
                      >
                        {showPassword ? (
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
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          </svg>
                        ) : (
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
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="label">Steam Guard Code (if prompted)</label>
                    <input
                      type="text"
                      value={steamGuardCode}
                      onChange={(e) => setSteamGuardCode(e.target.value.toUpperCase())}
                      onKeyPress={handleFormKeyPress}
                      disabled={downloadingACServer}
                      className="input-field disabled:opacity-50 disabled:cursor-not-allowed font-mono text-center tracking-widest"
                      placeholder="XXXXX"
                      maxLength={5}
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      ⏱️ Leave empty on first try. If Steam requires a code, you'll get an error -
                      then enter your current 5-digit code from your email/app and retry. Codes
                      expire every 30 seconds.
                    </p>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                      🔐 Steam Account Required
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      You must own Assetto Corsa on Steam to download the dedicated server. Your
                      credentials are used only for this download and are NOT stored. After download
                      completes, the server runs independently without any Steam connection.
                    </p>
                  </div>

                  <button
                    onClick={handleDownloadACServer}
                    disabled={
                      downloadingACServer ||
                      !acServerPath.trim() ||
                      !steamUser.trim() ||
                      !steamPass.trim()
                    }
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

          {/* Base Game Download Section */}
          {steamcmdInstalled && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Download AC Base Game (Optional)</h2>

              <div className="space-y-4">
                {/* Base Game Content Status */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="font-medium">Base Game Content Status</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {checkingContent
                        ? 'Checking...'
                        : contentStatus === null
                        ? 'Unknown'
                        : contentStatus.installed
                        ? `✅ Installed (${contentStatus.carCount} cars, ${contentStatus.trackCount} tracks)`
                        : '❌ Not Installed'}
                    </p>
                  </div>
                  <button
                    onClick={checkContentStatus}
                    disabled={checkingContent}
                    className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkingContent ? 'Checking...' : 'Refresh'}
                  </button>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
                    ℹ️ Optional Content Download
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    The AC Dedicated Server doesn't include official cars and tracks. You have two
                    options:
                  </p>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 ml-4 list-disc space-y-1">
                    <li>
                      <strong>Download base game content</strong> (~12GB) to get official Kunos cars
                      and tracks with preview images
                    </li>
                    <li>
                      <strong>Upload custom content</strong> using the Content Management section
                      below - many admins prefer 3rd party mods
                    </li>
                  </ul>
                </div>

                {baseGameMessage && (
                  <div
                    className={`p-3 rounded-lg ${
                      baseGameMessage.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : baseGameMessage.type === 'info'
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    }`}
                  >
                    <p
                      className={`text-sm font-medium ${
                        baseGameMessage.type === 'success'
                          ? 'text-green-700 dark:text-green-400'
                          : baseGameMessage.type === 'info'
                          ? 'text-blue-700 dark:text-blue-400'
                          : 'text-red-700 dark:text-red-400'
                      }`}
                    >
                      {baseGameMessage.text}
                    </p>
                  </div>
                )}

                <div>
                  <label className="label">Download Path (Temporary)</label>
                  <input
                    type="text"
                    value={baseGamePath}
                    onChange={(e) => setBaseGamePath(e.target.value)}
                    disabled={downloadingBaseGame}
                    className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="/tmp/ac-basegame"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Temporary location for download. Content will be extracted to server, then this
                    can be deleted.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="auto-cleanup"
                    checked={autoCleanup}
                    onChange={(e) => setAutoCleanup(e.target.checked)}
                    disabled={downloadingBaseGame}
                    className="rounded"
                  />
                  <label htmlFor="auto-cleanup" className="text-sm font-medium">
                    Automatically remove game files after extraction (saves ~10GB disk space)
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleDownloadBaseGame}
                    disabled={
                      downloadingBaseGame ||
                      extractingContent ||
                      cleaningUpBaseGame ||
                      !baseGamePath.trim() ||
                      !steamUser.trim() ||
                      !steamPass.trim()
                    }
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {downloadingBaseGame ? (
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
                        {extractingContent
                          ? 'Extracting Content...'
                          : cleaningUpBaseGame
                          ? 'Cleaning Up...'
                          : 'Downloading...'}
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
                        Download & Extract Base Game
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleCleanupOnly}
                    disabled={
                      downloadingBaseGame ||
                      extractingContent ||
                      cleaningUpBaseGame ||
                      !baseGamePath.trim()
                    }
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {cleaningUpBaseGame ? (
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
                        Cleaning...
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Cleanup Only
                      </>
                    )}
                  </button>
                </div>

                {!steamUser.trim() || !steamPass.trim() ? (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                      ⚠️ Steam Credentials Required
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Please scroll up and enter your <strong>Steam Username</strong> and{' '}
                      <strong>Password</strong> in the "Download AC Dedicated Server" section above.
                      The same credentials will be used for base game download.
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                      ⚙️ How it works
                    </p>
                    <ol className="text-sm text-yellow-700 dark:text-yellow-300 ml-4 list-decimal space-y-1">
                      <li>Downloads full AC game (~12GB, 10-30 minutes depending on connection)</li>
                      <li>Extracts cars and tracks to your server installation</li>
                      <li>Optionally deletes game files to save ~10GB disk space</li>
                    </ol>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                      💡 Using Steam credentials: <strong>{steamUser}</strong>. You must own Assetto
                      Corsa on Steam.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Application Settings */}
          <div className="col-span-2 space-y-6">
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

          {/* Right Column - Updates & Appearance */}
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
      )}

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
