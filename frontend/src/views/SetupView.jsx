import React from 'react';
import api from '../api/client';
import { useTheme } from '../contexts/ThemeContext';

// ============================================================================
// SETUP VIEW (Settings/Configuration)
// ============================================================================

function SetupView() {
  const [activeTab, setActiveTab] = React.useState('server'); // 'server' | 'content' | 'updates' | 'appearance'
  const [currentVersion, setCurrentVersion] = React.useState('Loading...');
  const [updateInfo, setUpdateInfo] = React.useState(null);
  const [checkingUpdate, setCheckingUpdate] = React.useState(false);
  const { theme, setTheme } = useTheme();

  // Steam/Server states
  const [steamcmdInstalled, setSteamcmdInstalled] = React.useState(null);
  const [checkingSteamCmd, setCheckingSteamCmd] = React.useState(false);
  const [installingSteamCmd, setInstallingSteamCmd] = React.useState(false);
  const [acServerPath, setAcServerPath] = React.useState('/opt/acserver');
  const [acServerInstalled, setAcServerInstalled] = React.useState(null);
  const [checkingAcServer, setCheckingAcServer] = React.useState(false);
  const [steamUser, setSteamUser] = React.useState(
    () => localStorage.getItem('steamUsername') || ''
  );
  const [steamPass, setSteamPass] = React.useState(
    () => localStorage.getItem('steamPassword') || ''
  );
  const [steamGuardCode, setSteamGuardCode] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [downloadingACServer, setDownloadingACServer] = React.useState(false);
  const [steamMessage, setSteamMessage] = React.useState(null);
  const [cacheStatus, setCacheStatus] = React.useState(null);
  const [copyingFromCache, setCopyingFromCache] = React.useState(false);

  // Steam credentials verification
  const [steamVerified, setSteamVerified] = React.useState(
    () => localStorage.getItem('steamVerified') === 'true'
  );
  const [verifyingCreds, setVerifyingCreds] = React.useState(false);
  const [verifyMessage, setVerifyMessage] = React.useState(null);

  // Collapsible section states
  const [steamCredsExpanded, setSteamCredsExpanded] = React.useState(false);
  const [steamCmdExpanded, setSteamCmdExpanded] = React.useState(false);
  const [acServerExpanded, setAcServerExpanded] = React.useState(false);
  const [baseGameExpanded, setBaseGameExpanded] = React.useState(false);

  // Content states
  const [contentStatus, setContentStatus] = React.useState(null);
  const [checkingContent, setCheckingContent] = React.useState(false);
  const [uploadingTrack, setUploadingTrack] = React.useState(false);
  const [uploadingCar, setUploadingCar] = React.useState(false);
  const [uploadMessage, setUploadMessage] = React.useState(null);

  // Base game download states
  const [baseGamePath, setBaseGamePath] = React.useState('/tmp/ac-basegame');
  const [baseGameInstalled, setBaseGameInstalled] = React.useState(null);
  const [checkingBaseGame, setCheckingBaseGame] = React.useState(false);
  const [downloadingBaseGame, setDownloadingBaseGame] = React.useState(false);
  const [extractingContent, setExtractingContent] = React.useState(false);
  const [cleaningUpBaseGame, setCleaningUpBaseGame] = React.useState(false);
  const [autoCleanup, setAutoCleanup] = React.useState(true);
  const [baseGameMessage, setBaseGameMessage] = React.useState(null);

  // Track initial load to prevent reset during mount
  const isInitialMount = React.useRef(true);

  // Store initial credential values to compare against
  const initialCreds = React.useRef({
    user: localStorage.getItem('steamUsername') || '',
    pass: localStorage.getItem('steamPassword') || '',
    guard: '', // Guard codes never persist, always start empty
  });

  React.useEffect(() => {
    loadCurrentVersion();
    checkSteamCMDStatus();
    checkCacheStatus();
    checkContentStatus();
    checkAcServerStatus();
    checkBaseGameStatus();
  }, []);

  // Reset verification if credentials change (after initial mount)
  // Only reset verification if user changes credentials while verified
  React.useEffect(() => {
    // Skip reset on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Only reset if verified AND credentials actually changed from initial saved values
    if (steamVerified) {
      const userChanged = steamUser !== initialCreds.current.user;
      const passChanged = steamPass !== initialCreds.current.pass;

      if (userChanged || passChanged) {
        // User is changing credentials while verified - reset verification
        setSteamVerified(false);
        localStorage.removeItem('steamVerified');
        localStorage.removeItem('steamPassword');
        setVerifyMessage(null);
      }
    }
  }, [steamUser, steamPass]); // Don't include steamVerified - only watch credential changes

  const loadCurrentVersion = async () => {
    try {
      const data = await api.getCurrentVersion();
      setCurrentVersion(data.version);
    } catch (error) {
      setCurrentVersion('Unknown');
    }
  };

  const checkSteamCMDStatus = async () => {
    setCheckingSteamCmd(true);
    try {
      const result = await api.checkSteamCMD();
      setSteamcmdInstalled(result.installed);
    } catch (error) {
      console.error('Failed to check SteamCMD:', error);
    } finally {
      setCheckingSteamCmd(false);
    }
  };

  const checkCacheStatus = async () => {
    try {
      const result = await api.checkACServerCache();
      setCacheStatus(result);
    } catch (error) {
      setCacheStatus({ exists: false });
    }
  };

  const checkAcServerStatus = async () => {
    setCheckingAcServer(true);
    try {
      const result = await api.checkACServer(acServerPath);
      setAcServerInstalled(result);
    } catch (error) {
      console.error('Failed to check AC Server:', error);
      setAcServerInstalled({ installed: false });
    } finally {
      setCheckingAcServer(false);
    }
  };

  const checkContentStatus = async () => {
    setCheckingContent(true);
    try {
      const result = await api.getContentStatus();
      setContentStatus(result);
    } catch (error) {
      setContentStatus({ installed: false });
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
        setSteamMessage({ type: 'success', text: 'SteamCMD installed successfully!' });
        setSteamcmdInstalled(true);
      } else {
        setSteamMessage({ type: 'error', text: result.message || 'Failed to install SteamCMD' });
      }
    } catch (error) {
      setSteamMessage({ type: 'error', text: 'Failed to install SteamCMD' });
    } finally {
      setInstallingSteamCmd(false);
    }
  };

  const handleVerifyCredentials = async () => {
    if (!steamUser) {
      setVerifyMessage({ type: 'error', text: 'Please enter Steam username' });
      return;
    }

    if (!steamPass) {
      setVerifyMessage({ type: 'error', text: 'Please enter Steam password' });
      return;
    }

    setVerifyingCreds(true);
    setVerifyMessage(null);

    try {
      const result = await api.verifySteamCredentials(steamUser, steamPass, steamGuardCode);

      if (result.success) {
        setSteamVerified(true);
        localStorage.setItem('steamUsername', steamUser);
        localStorage.setItem('steamPassword', steamPass);
        localStorage.setItem('steamVerified', 'true');

        // Update initial creds to current values so changes are tracked from this baseline
        initialCreds.current = {
          user: steamUser,
          pass: steamPass,
          guard: steamGuardCode,
        };

        // Show session caching message if applicable
        const message =
          "✅ Credentials verified! Note: You'll need a fresh Steam Guard code for downloads (email codes are single-use).";

        setVerifyMessage({
          type: 'success',
          text: message,
        });
      } else {
        setSteamVerified(false);
        localStorage.removeItem('steamVerified');
        localStorage.removeItem('steamPassword');
        setVerifyMessage({ type: 'error', text: result.message || 'Verification failed' });

        // Clear guard code if it was invalid
        if (result.error?.includes('guard')) {
          setSteamGuardCode('');
        }
      }
    } catch (error) {
      setSteamVerified(false);
      localStorage.removeItem('steamVerified');
      setVerifyMessage({ type: 'error', text: error.message || 'Failed to verify credentials' });
    } finally {
      setVerifyingCreds(false);
    }
  };

  const handleClearCredentials = () => {
    setSteamUser('');
    setSteamPass('');
    setSteamGuardCode('');
    setSteamVerified(false);
    setVerifyMessage(null);
    localStorage.removeItem('steamUsername');
    localStorage.removeItem('steamPassword');
    localStorage.removeItem('steamVerified');
  };

  const handleDownloadACServer = async () => {
    if (!steamVerified) {
      setSteamMessage({
        type: 'error',
        text: 'AC Dedicated Server requires Steam login. Please verify your credentials first.',
      });
      return;
    }

    if (!acServerPath.trim()) {
      setSteamMessage({ type: 'error', text: 'Please enter installation path' });
      return;
    }
    setDownloadingACServer(true);
    setSteamMessage(null);
    try {
      // AC Dedicated Server requires owning Assetto Corsa - use verified credentials
      // Email 2FA codes are single-use, so we need a fresh code for download
      const result = await api.downloadACServer(acServerPath, steamUser, steamPass, steamGuardCode);
      if (result.success) {
        setSteamMessage({
          type: 'success',
          text: `AC Server installed! Version: ${result.version || 'Unknown'}`,
        });
        await checkCacheStatus();
      } else {
        setSteamMessage({ type: 'error', text: result.message || 'Failed to download' });
      }
    } catch (error) {
      setSteamMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to download',
      });
    } finally {
      setDownloadingACServer(false);
      // Re-check installation status
      checkAcServerStatus();
    }
  };

  const handleCopyFromCache = async () => {
    if (!acServerPath.trim()) {
      setSteamMessage({ type: 'error', text: 'Please enter installation path' });
      return;
    }
    setCopyingFromCache(true);
    setSteamMessage(null);
    try {
      const result = await api.copyACServerFromCache(acServerPath);
      if (result.success) {
        setSteamMessage({ type: 'success', text: 'AC Server copied from cache!' });
      } else {
        setSteamMessage({ type: 'error', text: result.message || 'Failed to copy' });
      }
    } catch (error) {
      setSteamMessage({ type: 'error', text: 'Failed to copy from cache' });
    } finally {
      setCopyingFromCache(false);
      // Re-check installation status
      checkAcServerStatus();
    }
  };

  const handleCheckForUpdates = async () => {
    setCheckingUpdate(true);
    setUpdateInfo(null);
    try {
      const data = await api.checkForUpdates();
      setUpdateInfo(data);
    } catch (error) {
      setUpdateInfo({ error: true, message: 'Failed to check for updates' });
    } finally {
      setCheckingUpdate(false);
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
      const response = await fetch('/api/content/upload/track', { method: 'POST', body: formData });
      const result = await response.json();
      if (result.success) {
        setUploadMessage({ type: 'success', message: `Track "${result.name}" installed!` });
        checkContentStatus();
      } else {
        setUploadMessage({ type: 'error', message: result.error || 'Failed to upload' });
      }
    } catch (error) {
      setUploadMessage({ type: 'error', message: 'Upload failed: ' + error.message });
    } finally {
      setUploadingTrack(false);
      event.target.value = '';
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
      const response = await fetch('/api/content/upload/car', { method: 'POST', body: formData });
      const result = await response.json();
      if (result.success) {
        setUploadMessage({ type: 'success', message: `Car "${result.name}" installed!` });
        checkContentStatus();
      } else {
        setUploadMessage({ type: 'error', message: result.error || 'Failed to upload' });
      }
    } catch (error) {
      setUploadMessage({ type: 'error', message: 'Upload failed: ' + error.message });
    } finally {
      setUploadingCar(false);
      event.target.value = '';
    }
  };

  const handleDownloadBaseGame = async () => {
    if (!steamVerified) {
      setBaseGameMessage({ type: 'error', text: 'Please verify your Steam credentials first' });
      return;
    }

    // Validate credentials are still available
    if (!steamUser || !steamPass) {
      setBaseGameMessage({
        type: 'error',
        text: 'Steam credentials missing. Please re-verify your credentials.',
      });
      setSteamVerified(false);
      localStorage.removeItem('steamVerified');
      return;
    }

    setDownloadingBaseGame(true);
    setBaseGameMessage(null);

    try {
      // Step 1: Download base game
      setBaseGameMessage({
        type: 'info',
        text: '📥 Downloading AC base game (~12-23GB). This may take 10-60 minutes depending on connection speed...',
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
      
      // Refresh base game status
      await checkBaseGameStatus();
    } catch (error) {
      console.error('Failed to download/extract base game:', error);
      const errorMsg =
        error.response?.data?.message || error.message || 'Failed to download base game';

      // Check if this is a session expiration error
      if (errorMsg.includes('Steam session expired') || errorMsg.includes('re-verify')) {
        // Reset verification state
        setSteamVerified(false);
        localStorage.removeItem('steamVerified');

        setBaseGameMessage({
          type: 'error',
          text: '🔐 Steam session expired. Please re-verify your credentials in the Setup → Server tab above, then try downloading again.',
        });
      } else {
        setBaseGameMessage({
          type: 'error',
          text: errorMsg,
        });
      }
      
      // Check if base game was downloaded but extraction failed
      await checkBaseGameStatus();
    } finally {
      setDownloadingBaseGame(false);
      setExtractingContent(false);
      setCleaningUpBaseGame(false);
    }
  };

  const checkBaseGameStatus = async () => {
    try {
      setCheckingBaseGame(true);
      const result = await api.get(`/steam/check-base-game?path=${encodeURIComponent(baseGamePath)}`);
      setBaseGameInstalled(result.data);
    } catch (error) {
      console.error('Failed to check base game status:', error);
      setBaseGameInstalled({ installed: false });
    } finally {
      setCheckingBaseGame(false);
    }
  };

  const handleResumeExtraction = async () => {
    setExtractingContent(true);
    setBaseGameMessage({
      type: 'info',
      text: `🔄 Resuming content extraction from ${baseGamePath}...`,
    });

    try {
      const serverContentPath = process.env.AC_CONTENT_PATH || '/opt/acserver/content';
      const extractResult = await api.extractACContent(baseGamePath, serverContentPath);

      if (!extractResult.success) {
        throw new Error(extractResult.message || 'Content extraction failed');
      }

      setBaseGameMessage({
        type: 'success',
        text: `✅ Extraction complete! ${extractResult.carCount} cars, ${extractResult.trackCount} tracks installed.`,
      });

      // Clear content cache and refresh
      await api.post('/content/clear-cache');
      await checkContentStatus();
      await checkBaseGameStatus();

      // Auto-cleanup if enabled
      if (autoCleanup) {
        setCleaningUpBaseGame(true);
        const cleanupResult = await api.cleanupACBaseGame(baseGamePath);
        if (cleanupResult.success) {
          setBaseGameMessage({
            type: 'success',
            text: `🎉 Content installed and cleanup complete! Freed ${cleanupResult.freedSpace}.`,
          });
        }
        setCleaningUpBaseGame(false);
      }
    } catch (error) {
      console.error('Failed to extract content:', error);
      setBaseGameMessage({
        type: 'error',
        text: error.response?.data?.message || error.message || 'Failed to extract content',
      });
    } finally {
      setExtractingContent(false);
    }
  };

  const handleCleanupBaseGame = async () => {
    if (!baseGamePath.trim()) {
      setBaseGameMessage({ type: 'error', text: 'Please enter the base game path to cleanup' });
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
      } else {
        setBaseGameMessage({ type: 'error', text: cleanupResult.message || 'Cleanup failed' });
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

  const handleUninstallSteamCMD = async () => {
    if (
      !window.confirm(
        'Are you sure you want to uninstall SteamCMD?\n\nThis will remove SteamCMD and all Steam data. This cannot be undone!'
      )
    ) {
      return;
    }

    setInstallingSteamCmd(true);
    setSteamMessage(null);

    try {
      const result = await api.uninstallSteamCMD();
      if (result.success) {
        setSteamMessage({ type: 'success', text: 'SteamCMD uninstalled successfully!' });
        setSteamcmdInstalled(false);
      } else {
        setSteamMessage({ type: 'error', text: result.message || 'Failed to uninstall SteamCMD' });
      }
    } catch (error) {
      setSteamMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to uninstall SteamCMD',
      });
    } finally {
      setInstallingSteamCmd(false);
    }
  };

  const handleUninstallACServer = async () => {
    if (!acServerPath.trim()) {
      setSteamMessage({ type: 'error', text: 'Please enter installation path' });
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to uninstall AC Dedicated Server from:\n${acServerPath}\n\nThis will delete all AC server files. This cannot be undone!`
      )
    ) {
      return;
    }

    setDownloadingACServer(true);
    setSteamMessage(null);

    try {
      const result = await api.uninstallACServer(acServerPath);
      if (result.success) {
        setSteamMessage({
          type: 'success',
          text: `AC Server uninstalled! Freed ${result.freedSpace}`,
        });
        await checkAcServerStatus();
      } else {
        setSteamMessage({ type: 'error', text: result.message || 'Failed to uninstall' });
      }
    } catch (error) {
      setSteamMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to uninstall AC server',
      });
    } finally {
      setDownloadingACServer(false);
    }
  };

  const handleDeleteContent = async (type) => {
    const contentPath = '/opt/acserver/content'; // Or make this configurable
    const typeLabel = type === 'both' ? 'all cars and tracks' : type;

    if (
      !window.confirm(
        `Are you sure you want to delete ${typeLabel}?\n\nThis will remove all ${typeLabel} from your AC server. This cannot be undone!`
      )
    ) {
      return;
    }

    setUploadMessage({ type: 'info', text: `Deleting ${typeLabel}...` });

    try {
      const result = await api.deleteACContent(contentPath, type);
      if (result.success) {
        const { results } = result;
        let message = `Deleted ${typeLabel} successfully!\n`;

        if (results.cars) {
          message += `\nCars: ${results.cars.deleted} items, freed ${results.cars.freedSpace}`;
        }
        if (results.tracks) {
          message += `\nTracks: ${results.tracks.deleted} items, freed ${results.tracks.freedSpace}`;
        }

        setUploadMessage({ type: 'success', text: message });
        await checkContentStatus();
      } else {
        setUploadMessage({ type: 'error', text: result.message || 'Failed to delete content' });
      }
    } catch (error) {
      setUploadMessage({
        type: 'error',
        text: error.response?.data?.message || `Failed to delete ${typeLabel}`,
      });
    }
  };

  const tabs = [
    { id: 'server', label: 'AC Server', icon: '🖥️' },
    { id: 'content', label: 'Content', icon: '📦' },
    { id: 'updates', label: 'Updates', icon: '🔄' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
  ];

  return (
    <div className="p-4 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">⚙️</span>
        <div>
          <h1 className="text-xl font-semibold text-white">Setup</h1>
          <span className="text-sm text-gray-400">Configure AC Server Manager</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-4 border-b border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Server Tab */}
      {activeTab === 'server' && (
        <div className="space-y-4">
          {/* Steam Credentials Section */}
          <div className="border border-gray-700 rounded-lg overflow-hidden">
            {/* Collapsed Header */}
            <button
              onClick={() => setSteamCredsExpanded(!steamCredsExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-800 hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-orange-400 font-medium">Steam Credentials</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      steamVerified ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  ></span>
                  <span className="text-sm text-gray-300">
                    {verifyingCreds
                      ? 'Logging in...'
                      : steamVerified
                      ? 'Logged In'
                      : 'Not Logged In'}
                  </span>
                </div>
                {!steamVerified ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVerifyCredentials();
                    }}
                    disabled={verifyingCreds || !steamUser || !steamPass}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
                  >
                    {verifyingCreds ? 'Logging in...' : 'Login'}
                  </button>
                ) : (
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      steamCredsExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </div>
            </button>

            {/* Expanded Details */}
            {steamCredsExpanded && (
              <div className="p-4 space-y-4 bg-gray-800/50 border-t border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-400">
                    Steam credentials required for downloading content
                  </p>
                  {steamVerified && (
                    <button
                      onClick={handleClearCredentials}
                      className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Clear & Re-login
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Steam Username</label>
                    <input
                      type="text"
                      value={steamUser}
                      onChange={(e) => setSteamUser(e.target.value)}
                      disabled={steamVerified}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="your_steam_username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Steam Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={steamPass}
                        onChange={(e) => setSteamPass(e.target.value)}
                        disabled={steamVerified}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="••••••••"
                      />
                      {!steamVerified && (
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Steam Guard Code {steamVerified && '(Required for download)'}
                    </label>
                    <input
                      type="text"
                      value={steamGuardCode}
                      onChange={(e) => setSteamGuardCode(e.target.value)}
                      placeholder={
                        steamVerified
                          ? 'Enter fresh code for download'
                          : 'Enter code if Steam Guard is enabled'
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-500">
                  {steamVerified
                    ? '⚠️ Email Steam Guard codes are single-use. Get a fresh code from your email for the download.'
                    : 'Steam Guard code required if your account has Steam Guard enabled. Get code from Steam app or email.'}
                </p>

                {verifyMessage && (
                  <div
                    className={`p-3 rounded text-sm ${
                      verifyMessage.type === 'success'
                        ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700'
                        : 'bg-red-900/50 text-red-300 border border-red-700'
                    }`}
                  >
                    {verifyMessage.text}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SteamCMD Status */}
          <div className="border border-gray-700 rounded-lg overflow-hidden">
            {/* Collapsed Header */}
            <button
              onClick={() => setSteamCmdExpanded(!steamCmdExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-800 hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-orange-400 font-medium">SteamCMD</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      steamcmdInstalled ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  ></span>
                  <span className="text-sm text-gray-300">
                    {checkingSteamCmd
                      ? 'Checking...'
                      : steamcmdInstalled
                      ? 'Installed'
                      : 'Not Installed'}
                  </span>
                </div>
                {!steamcmdInstalled ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInstallSteamCMD();
                    }}
                    disabled={installingSteamCmd}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
                  >
                    {installingSteamCmd ? 'Installing...' : 'Install'}
                  </button>
                ) : (
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      steamCmdExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </div>
            </button>

            {/* Expanded Details */}
            {steamCmdExpanded && steamcmdInstalled && (
              <div className="p-4 space-y-4 bg-gray-800/50 border-t border-gray-700">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Installation Path</label>
                  <select
                    value="/usr/games/steamcmd"
                    disabled
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm cursor-not-allowed opacity-75"
                  >
                    <option value="/usr/games/steamcmd">
                      /usr/games/steamcmd (System Package)
                    </option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    SteamCMD is installed via system package manager
                  </p>
                </div>

                <button
                  onClick={handleUninstallSteamCMD}
                  disabled={installingSteamCmd}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white rounded transition-colors"
                >
                  {installingSteamCmd ? 'Uninstalling...' : 'Uninstall SteamCMD'}
                </button>
              </div>
            )}
          </div>

          {/* AC Server Download */}
          <div className="border border-gray-700 rounded-lg overflow-hidden">
            {/* Collapsed Header */}
            <button
              onClick={() => setAcServerExpanded(!acServerExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-800 hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-orange-400 font-medium">AC Dedicated Server</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      checkingAcServer
                        ? 'bg-yellow-500'
                        : acServerInstalled?.installed
                        ? 'bg-emerald-500'
                        : 'bg-red-500'
                    }`}
                  ></span>
                  <span className="text-sm text-gray-300">
                    {checkingAcServer
                      ? 'Checking...'
                      : acServerInstalled?.installed
                      ? 'Installed'
                      : 'Not Installed'}
                  </span>
                </div>
                {!acServerInstalled?.installed ? (
                  <div className="relative group flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!steamVerified) {
                          setSteamMessage({
                            type: 'error',
                            text: 'Please verify your Steam credentials first',
                          });
                          setAcServerExpanded(true);
                          return;
                        }
                        if (!acServerPath.trim()) {
                          setSteamMessage({
                            type: 'error',
                            text: 'Please select installation path',
                          });
                          return;
                        }
                        handleDownloadACServer();
                      }}
                      disabled={downloadingACServer || !steamcmdInstalled || !steamVerified}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
                    >
                      {downloadingACServer ? 'Downloading...' : 'Download'}
                    </button>
                    {!steamVerified && (
                      <div
                        className="fixed bottom-auto top-auto right-0 mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 border border-yellow-600 rounded text-xs text-yellow-300 shadow-lg"
                        style={{ zIndex: 9999 }}
                      >
                        ⚠️ Steam credentials not verified
                      </div>
                    )}
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        acServerExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                ) : (
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      acServerExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </div>
            </button>

            {/* Expanded Details */}
            {acServerExpanded && acServerInstalled?.installed && (
              <div className="p-4 space-y-4 bg-gray-800/50 border-t border-gray-700">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Version</span>
                    <span className="text-sm text-gray-300">
                      {acServerInstalled.version || 'Unknown'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Installation Path</label>
                  <select
                    value={acServerPath}
                    onChange={(e) => setAcServerPath(e.target.value)}
                    disabled
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm cursor-not-allowed opacity-75"
                  >
                    <option value="/opt/acserver">/opt/acserver (Recommended)</option>
                    <option value="/home/acserver">/home/acserver</option>
                    <option value="/usr/local/acserver">/usr/local/acserver</option>
                    <option value="/srv/acserver">/srv/acserver</option>
                  </select>
                </div>

                <button
                  onClick={handleUninstallACServer}
                  disabled={downloadingACServer}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white rounded transition-colors"
                >
                  {downloadingACServer ? 'Uninstalling...' : 'Uninstall'}
                </button>
              </div>
            )}

            {/* Path selector when not installed */}
            {!acServerInstalled?.installed && (
              <div className="p-4 space-y-3 bg-gray-800/50 border-t border-gray-700">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Installation Path</label>
                  <select
                    value={acServerPath}
                    onChange={(e) => setAcServerPath(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  >
                    <option value="/opt/acserver">/opt/acserver (Recommended)</option>
                    <option value="/home/acserver">/home/acserver</option>
                    <option value="/usr/local/acserver">/usr/local/acserver</option>
                    <option value="/srv/acserver">/srv/acserver</option>
                  </select>
                </div>
              </div>
            )}

            {/* Steam messages */}
            {steamMessage && (
              <div className="p-4 bg-gray-800/50 border-t border-gray-700">
                <div
                  className={`p-3 rounded text-sm ${
                    steamMessage.type === 'success'
                      ? 'bg-emerald-900/50 text-emerald-300'
                      : 'bg-red-900/50 text-red-300'
                  }`}
                >
                  {steamMessage.text}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          {/* Content Status */}
          <SectionPanel title="Installed Content">
            <div className="p-4 space-y-4">
              {checkingContent ? (
                <div className="text-gray-400 text-center py-4">Checking content...</div>
              ) : contentStatus ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-800 rounded">
                    <div className="text-2xl font-bold text-white">
                      {contentStatus.trackCount || 0}
                    </div>
                    <div className="text-sm text-gray-400">Tracks</div>
                  </div>
                  <div className="text-center p-4 bg-gray-800 rounded">
                    <div className="text-2xl font-bold text-white">
                      {contentStatus.carCount || 0}
                    </div>
                    <div className="text-sm text-gray-400">Cars</div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">No content status available</div>
              )}

              {/* Delete Content Buttons */}
              {contentStatus && (contentStatus.trackCount > 0 || contentStatus.carCount > 0) && (
                <div className="flex gap-2 pt-2 border-t border-gray-700">
                  <button
                    onClick={() => handleDeleteContent('cars')}
                    disabled={!contentStatus.carCount}
                    className="flex-1 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 disabled:bg-gray-800 disabled:text-gray-600 text-red-300 text-sm rounded transition-colors"
                  >
                    🗑️ Delete All Cars
                  </button>
                  <button
                    onClick={() => handleDeleteContent('tracks')}
                    disabled={!contentStatus.trackCount}
                    className="flex-1 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 disabled:bg-gray-800 disabled:text-gray-600 text-red-300 text-sm rounded transition-colors"
                  >
                    🗑️ Delete All Tracks
                  </button>
                  <button
                    onClick={() => handleDeleteContent('both')}
                    disabled={!contentStatus.carCount && !contentStatus.trackCount}
                    className="flex-1 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 disabled:bg-gray-800 disabled:text-gray-600 text-red-300 text-sm rounded transition-colors"
                  >
                    🗑️ Delete All Content
                  </button>
                </div>
              )}
            </div>
          </SectionPanel>

          {/* Upload Content */}
          <SectionPanel title="Upload Content">
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Upload Track (.zip)</label>
                  <label className="block w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 border border-gray-600 border-dashed rounded text-center cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept=".zip"
                      onChange={handleTrackUpload}
                      disabled={uploadingTrack}
                      className="hidden"
                    />
                    <span className="text-gray-300">
                      {uploadingTrack ? 'Uploading...' : 'Choose Track File'}
                    </span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Upload Car (.zip)</label>
                  <label className="block w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 border border-gray-600 border-dashed rounded text-center cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept=".zip"
                      onChange={handleCarUpload}
                      disabled={uploadingCar}
                      className="hidden"
                    />
                    <span className="text-gray-300">
                      {uploadingCar ? 'Uploading...' : 'Choose Car File'}
                    </span>
                  </label>
                </div>
              </div>

              {uploadMessage && (
                <div
                  className={`p-3 rounded text-sm ${
                    uploadMessage.type === 'success'
                      ? 'bg-emerald-900/50 text-emerald-300'
                      : 'bg-red-900/50 text-red-300'
                  }`}
                >
                  {uploadMessage.message}
                </div>
              )}
            </div>
          </SectionPanel>

          {/* Official Content - Base Game */}
          <div className="border border-gray-700 rounded-lg overflow-hidden">
            {/* Collapsed Header */}
            <button
              onClick={() => setBaseGameExpanded(!baseGameExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-800 hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-orange-400 font-medium">Official Content (Base Game)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      checkingBaseGame
                        ? 'bg-yellow-500'
                        : baseGameInstalled?.installed
                        ? 'bg-emerald-500'
                        : 'bg-gray-500'
                    }`}
                  ></span>
                  <span className="text-sm text-gray-300">
                    {checkingBaseGame
                      ? 'Checking...'
                      : downloadingBaseGame
                      ? 'Downloading...'
                      : extractingContent
                      ? 'Extracting...'
                      : cleaningUpBaseGame
                      ? 'Cleaning...'
                      : baseGameInstalled?.installed
                      ? 'Downloaded'
                      : 'Not Downloaded'}
                  </span>
                </div>
                {!baseGameInstalled?.installed && !downloadingBaseGame && !extractingContent ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!steamVerified) {
                        setBaseGameMessage({
                          type: 'error',
                          text: 'Please verify your Steam credentials in the Server tab first',
                        });
                        return;
                      }
                      handleDownloadBaseGame();
                    }}
                    disabled={downloadingBaseGame || extractingContent || cleaningUpBaseGame || !steamVerified}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
                  >
                    {downloadingBaseGame || extractingContent || cleaningUpBaseGame
                      ? 'Processing...'
                      : 'Download'}
                  </button>
                ) : (
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      baseGameExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </div>
            </button>

            {/* Expanded Details */}
            {baseGameExpanded && (
              <div className="p-4 space-y-4 bg-gray-800/50 border-t border-gray-700">
                {/* Info Banner */}
                <div className="p-4 bg-blue-900/30 border-l-4 border-blue-500 rounded">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">ℹ️</span>
                    <div className="flex-1 space-y-2">
                      <div className="font-medium text-blue-300">Steam Ownership Required</div>
                      <div className="text-sm text-gray-300">
                        You must own <strong>Assetto Corsa</strong> (App ID 244210) on Steam to
                        download official content.
                      </div>
                      <div className="text-xs text-gray-400 space-y-1">
                        <div>
                          • The AC Dedicated Server (App 302550) is FREE, but game content requires
                          the full game
                        </div>
                        <div>
                          • Download size: ~12GB, may take 10-30 minutes depending on connection
                        </div>
                        <div>
                          • Alternative: Upload custom content manually from RaceDepartment,
                          AssettoLand, etc.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {!steamVerified && (
                  <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded text-sm text-yellow-300">
                    ⚠️ Please verify your Steam credentials in the Server tab before downloading
                  </div>
                )}

                {/* Download Path */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Download Path</label>
                  <input
                    type="text"
                    value={baseGamePath}
                    onChange={(e) => setBaseGamePath(e.target.value)}
                    disabled={downloadingBaseGame || extractingContent}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="/tmp/ac-basegame"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Temporary location for base game download (can be deleted after extraction)
                  </p>
                </div>

                {/* Auto-cleanup checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoCleanup"
                    checked={autoCleanup}
                    onChange={(e) => setAutoCleanup(e.target.checked)}
                    disabled={downloadingBaseGame || extractingContent}
                    className="w-4 h-4 bg-gray-700 border-gray-600 rounded"
                  />
                  <label htmlFor="autoCleanup" className="text-sm text-gray-300">
                    Auto-cleanup base game files after extraction (~12GB saved)
                  </label>
                </div>

                {/* Action Buttons */}
                {baseGameInstalled?.installed ? (
                  <div className="space-y-3">
                    {/* Resume Extraction Button - shows if base game downloaded but might not be fully extracted */}
                    <button
                      onClick={handleResumeExtraction}
                      disabled={extractingContent || cleaningUpBaseGame}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
                    >
                      {extractingContent
                        ? '⏳ Extracting...'
                        : `🔄 Resume/Re-Extract Content (${baseGameInstalled.carCount} cars, ${baseGameInstalled.trackCount} tracks available)`}
                    </button>
                    
                    {/* Cleanup Button */}
                    <button
                      onClick={handleCleanupBaseGame}
                      disabled={cleaningUpBaseGame || extractingContent}
                      className="w-full px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white rounded transition-colors"
                    >
                      {cleaningUpBaseGame ? 'Cleaning up...' : `🗑️ Cleanup Base Game Files (${baseGameInstalled.size || '~23GB'})`}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={handleDownloadBaseGame}
                      disabled={
                        downloadingBaseGame || extractingContent || cleaningUpBaseGame || !steamVerified
                      }
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
                    >
                      {downloadingBaseGame
                        ? 'Downloading...'
                        : extractingContent
                        ? 'Extracting...'
                        : cleaningUpBaseGame
                        ? 'Cleaning up...'
                        : '📥 Download & Extract'}
                    </button>
                    <button
                      onClick={handleCleanupBaseGame}
                      disabled={downloadingBaseGame || extractingContent || cleaningUpBaseGame}
                      className="px-4 py-2 bg-red-700 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
                      title="Clean up downloaded base game files"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            {baseGameMessage && (
              <div className="p-4 bg-gray-800/50 border-t border-gray-700">
                <div
                  className={`p-3 rounded text-sm ${
                    baseGameMessage.type === 'success'
                      ? 'bg-emerald-900/50 text-emerald-300'
                      : baseGameMessage.type === 'info'
                      ? 'bg-blue-900/50 text-blue-300'
                      : 'bg-red-900/50 text-red-300'
                  }`}
                >
                  {baseGameMessage.text}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Updates Tab */}
      {activeTab === 'updates' && (
        <div className="space-y-4">
          <SectionPanel title="Application Updates">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-gray-300">Current Version</div>
                  <div className="text-xl font-medium text-white">{currentVersion}</div>
                </div>
                <button
                  onClick={handleCheckForUpdates}
                  disabled={checkingUpdate}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white rounded transition-colors"
                >
                  {checkingUpdate ? 'Checking...' : 'Check for Updates'}
                </button>
              </div>

              {updateInfo && (
                <div
                  className={`p-4 rounded ${
                    updateInfo.error
                      ? 'bg-red-900/50 border border-red-700'
                      : updateInfo.updateAvailable
                      ? 'bg-blue-900/50 border border-blue-700'
                      : 'bg-emerald-900/50 border border-emerald-700'
                  }`}
                >
                  {updateInfo.error ? (
                    <span className="text-red-300">{updateInfo.message}</span>
                  ) : updateInfo.updateAvailable ? (
                    <div>
                      <div className="text-blue-300 font-medium">
                        Update Available: {updateInfo.latestVersion}
                      </div>
                      <p className="text-gray-400 text-sm mt-1">
                        {updateInfo.releaseNotes || 'No release notes available'}
                      </p>
                      <a
                        href={updateInfo.releaseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-blue-400 hover:text-blue-300 text-sm"
                      >
                        View Release →
                      </a>
                    </div>
                  ) : (
                    <span className="text-emerald-300">You're running the latest version!</span>
                  )}
                </div>
              )}
            </div>
          </SectionPanel>
        </div>
      )}

      {/* Appearance Tab */}
      {activeTab === 'appearance' && (
        <div className="space-y-4">
          <SectionPanel title="Theme">
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Color Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setTheme('light')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        theme === 'light'
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-2xl mb-2">☀️</div>
                      <div className="text-sm text-gray-300">Light</div>
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        theme === 'dark'
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-2xl mb-2">🌙</div>
                      <div className="text-sm text-gray-300">Dark</div>
                    </button>
                    <button
                      onClick={() => setTheme('system')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        theme === 'system'
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-2xl mb-2">💻</div>
                      <div className="text-sm text-gray-300">System</div>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    System mode automatically matches your operating system's theme preference.
                  </p>
                </div>
              </div>
            </div>
          </SectionPanel>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// UI HELPER COMPONENT
// ============================================================================

function SectionPanel({ title, children, className = '' }) {
  return (
    <div className={`bg-gray-800/50 rounded overflow-hidden ${className}`}>
      <div className="px-3 py-1.5 border-b border-gray-700">
        <span className="text-sm font-medium text-orange-400">{title}</span>
      </div>
      <div className="bg-gray-850" style={{ backgroundColor: '#1e2328' }}>
        {children}
      </div>
    </div>
  );
}

export default SetupView;
