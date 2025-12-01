import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';
import { useKeyboardNav } from '../hooks/useKeyboardNav';
import FolderBrowserModal from '../components/FolderBrowserModal';
import CMPackImportModal from '../components/CMPackImportModal';

// Lazy load heavy components
const CarSelectionModal = lazy(() => import('../components/CarSelectionModal'));
const TrackSelectionModal = lazy(() => import('../components/TrackSelectionModal'));
const MainTab = lazy(() => import('../components/config/MainTab'));
const RulesTab = lazy(() => import('../components/config/RulesTab'));
const ConditionsTab = lazy(() => import('../components/config/ConditionsTab'));
const SessionsTab = lazy(() => import('../components/config/SessionsTab'));
const AdvancedTab = lazy(() => import('../components/config/AdvancedTab'));
const EntryListTab = lazy(() => import('../components/config/EntryListTab'));
const DetailsTab = lazy(() => import('../components/config/DetailsTab'));

function ServerConfig() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMountedRef = useRef(true);

  // Consolidated data state
  const [data, setData] = useState({
    config: null,
    tracks: [],
    cars: [],
    selectedCars: [],
    presets: [],
    currentPresetId: null,
    loading: true,
    serverStatus: null, // { running: boolean, pid?: number }
  });

  // Consolidated modal state
  const [modals, setModals] = useState({
    showSave: false,
    showLoadActive: false,
    showCar: false,
    showTrack: false,
    showCspOptions: false,
    showClone: false,
    showDelete: false,
    showFolderBrowser: false,
    showCMImport: false,
    folderPath: '',
  });

  // Consolidated UI state
  const [ui, setUi] = useState({
    presetName: '',
    cspOptionsInput: '',
    showPassword: false,
    showAdminPassword: false,
    activeTab: localStorage.getItem('serverConfigActiveTab') || 'MAIN',
  });

  // Save activeTab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('serverConfigActiveTab', ui.activeTab);
  }, [ui.activeTab]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S - Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveConfig();
      }
      // Ctrl+F - Open Folder
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        handleOpenFolder();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [data.currentPresetId, data.config, data.selectedCars]);

  // Helper functions for state updates
  const updateData = (updates) => setData((prev) => ({ ...prev, ...updates }));
  const updateModals = (updates) => setModals((prev) => ({ ...prev, ...updates }));
  const updateUi = (updates) => setUi((prev) => ({ ...prev, ...updates }));

  const tabs = [
    {
      id: 'MAIN',
      label: 'Main',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      id: 'ENTRY_LIST',
      label: 'Entry List',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
    },
    {
      id: 'RULES',
      label: 'Rules',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      id: 'CONDITIONS',
      label: 'Conditions',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
          />
        </svg>
      ),
    },
    {
      id: 'SESSIONS',
      label: 'Sessions',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: 'ADVANCED',
      label: 'Advanced',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      id: 'DETAILS',
      label: 'Details',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  useEffect(() => {
    isMountedRef.current = true;

    // Only fetch data if we don't have it yet (first load)
    // This prevents overwriting user's working config on navigation
    if (!data.config) {
      console.log('[ServerConfig] Initial load, fetching data...');
      fetchData();
    } else {
      console.log('[ServerConfig] Config already loaded, preserving state');
    }

    return () => {
      isMountedRef.current = false;
    };
  }, []); // Only run on mount

  // Watch for preset/default config loads from sidebar
  useEffect(() => {
    if (location.state?.presetLoaded || location.state?.defaultLoaded) {
      console.log('[ServerConfig] Preset/default loaded, fetching data...');
      fetchData();
      // Clear the state to prevent re-fetching on subsequent renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.timestamp]); // Re-run when timestamp changes

  // Check server status when preset changes
  useEffect(() => {
    const checkStatus = async () => {
      if (!data.currentPresetId) {
        setData((prev) => ({ ...prev, serverStatus: null }));
        return;
      }

      try {
        const status = await api.getServerInstanceStatus(data.currentPresetId);
        setData((prev) => ({
          ...prev,
          serverStatus: status.running ? { running: true, pid: status.pid } : null,
        }));
      } catch (error) {
        // If error, assume not running
        setData((prev) => ({ ...prev, serverStatus: null }));
      }
    };

    checkStatus();
  }, [data.currentPresetId]);

  const fetchData = async () => {
    try {
      // Fetch config and presets first (these are critical)
      const [configData, presetsData] = await Promise.all([api.getConfig(), api.getPresets()]);

      // Try to fetch cars and tracks, but don't fail if AC server path is invalid
      let tracksData = { tracks: [] };
      let carsData = { cars: [] };

      try {
        tracksData = await api.getTracks();
      } catch (error) {
        console.warn(
          '[ServerConfig] Failed to load tracks (AC server path may be invalid):',
          error.message
        );
      }

      try {
        carsData = await api.getCars();
      } catch (error) {
        console.warn(
          '[ServerConfig] Failed to load cars (AC server path may be invalid):',
          error.message
        );
      }

      // Only update state if component is still mounted
      if (!isMountedRef.current) return;

      // AUTO-LOAD LOGIC: If this is initial load and no preset was explicitly loaded
      let configToUse = configData;
      let shouldShowEditor = true;

      if (!location.state?.presetLoaded && !location.state?.defaultLoaded && !data.config) {
        // First time loading the editor
        if (presetsData.presets && presetsData.presets.length > 0) {
          // Load first preset
          console.log('[ServerConfig] Auto-loading first preset:', presetsData.presets[0].name);
          try {
            await api.loadPreset(presetsData.presets[0].id);
            configToUse = await api.getConfig();
          } catch (error) {
            console.error('[ServerConfig] Failed to auto-load first preset:', error);
            // Fall back to current config
          }
        } else {
          // No presets exist, don't show editor - show empty state instead
          console.log('[ServerConfig] No presets found, showing empty state');
          shouldShowEditor = false;
        }
      }

      // Ensure all sections exist in config with defaults if backend values missing
      const normalizedConfig = {
        ...configToUse,
        SERVER: {
          ...configToUse?.SERVER,
          SUN_ANGLE: configToUse?.SERVER?.SUN_ANGLE ?? 960,
          TIME_OF_DAY_MULT: configToUse?.SERVER?.TIME_OF_DAY_MULT ?? 1,
          REGISTER_TO_LOBBY: configToUse?.SERVER?.REGISTER_TO_LOBBY ?? 1,
          ADMIN_PASSWORD: configToUse?.SERVER?.ADMIN_PASSWORD ?? 'mypassword',
          MAX_CLIENTS: configToUse?.SERVER?.MAX_CLIENTS ?? 18,
        },
        DYNAMIC_TRACK: {
          ...configToUse?.DYNAMIC_TRACK,
          SESSION_START: configToUse?.DYNAMIC_TRACK?.SESSION_START ?? 95,
          RANDOMNESS: configToUse?.DYNAMIC_TRACK?.RANDOMNESS ?? 2,
          SESSION_TRANSFER: configToUse?.DYNAMIC_TRACK?.SESSION_TRANSFER ?? 90,
          LAP_GAIN: configToUse?.DYNAMIC_TRACK?.LAP_GAIN ?? 10,
        },
        WEATHER_0: configToUse?.WEATHER_0 || {},
      };

      const carsInConfig = normalizedConfig?.SERVER?.CARS || '';
      const selectedCars =
        typeof carsInConfig === 'string'
          ? carsInConfig.split(';').filter((c) => c.trim())
          : Array.isArray(carsInConfig)
          ? carsInConfig
          : [];

      // Try to match current config name to a preset
      const currentPreset = presetsData.presets?.find(
        (p) => p.name === normalizedConfig?.SERVER?.NAME
      );

      updateData({
        config: shouldShowEditor ? normalizedConfig : null,
        tracks: tracksData.tracks || [],
        cars: carsData.cars || [],
        selectedCars: shouldShowEditor ? selectedCars : [],
        presets: presetsData.presets || [],
        currentPresetId: currentPreset?.id || null,
        loading: false,
      });

      // Emit event to notify Layout of selected preset
      window.dispatchEvent(
        new CustomEvent('presetSelected', { detail: { presetId: currentPreset?.id || null } })
      );
    } catch (error) {
      console.error('Failed to fetch data:', error);
      if (isMountedRef.current) {
        updateData({ loading: false });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedConfig = {
        ...data.config,
        SERVER: {
          ...data.config.SERVER,
          CARS: data.selectedCars.join(';'),
        },
      };

      await api.updateConfig(updatedConfig);
      await api.applyConfig();

      console.log('Configuration applied to server');
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  };

  const handleSaveAsPreset = () => {
    updateUi({ presetName: data.config?.SERVER?.NAME || '' });
    updateModals({ showSave: true });
  };

  const confirmSavePreset = async (applyToServer = false) => {
    if (!ui.presetName.trim()) return;

    try {
      const updatedConfig = {
        ...data.config,
        SERVER: {
          ...data.config.SERVER,
          NAME: ui.presetName,
          CARS: data.selectedCars.join(';'),
        },
      };
      await api.updateConfig(updatedConfig);
      await api.savePreset(ui.presetName);
      console.log('Configuration saved as preset:', ui.presetName);

      // Dispatch event to refresh preset list in sidebar
      window.dispatchEvent(new CustomEvent('presetSaved'));

      updateModals({ showSave: false });
      updateUi({ presetName: '' });

      if (applyToServer) {
        await api.updateConfig(updatedConfig);
        await api.applyConfig();
        console.log('Configuration applied to server');
      }
    } catch (error) {
      console.error('Failed to save preset:', error);
    }
  };

  const handleLoadActiveConfig = async () => {
    try {
      await api.loadActiveConfig();
      await fetchData();
      updateModals({ showLoadActive: false });
      console.log('Loaded active server configuration');
    } catch (error) {
      console.error('Failed to load active config:', error);
    }
  };

  const handleClonePreset = async () => {
    if (!data.currentPresetId) return;

    const currentPreset = data.presets.find((p) => p.id === data.currentPresetId);
    const defaultName = currentPreset ? `${currentPreset.name} (Copy)` : 'Cloned Preset';

    const name = prompt(`Clone "${currentPreset?.name || 'this preset'}" as:`, defaultName);
    if (!name) return;

    try {
      await api.duplicatePreset(data.currentPresetId, name);
      console.log('Preset cloned:', name);

      // Refresh presets list
      const presetsData = await api.getPresets();
      updateData({ presets: presetsData.presets || [] });

      // Dispatch event to refresh sidebar
      window.dispatchEvent(new CustomEvent('presetSaved'));

      updateModals({ showClone: false });
    } catch (error) {
      console.error('Failed to clone preset:', error);
    }
  };

  const handleDeletePreset = async () => {
    if (!data.currentPresetId) return;

    try {
      // Find the index of the current preset in the list
      const currentIndex = data.presets.findIndex((p) => p.id === data.currentPresetId);

      // Delete the preset
      await api.deletePreset(data.currentPresetId);
      console.log('Preset deleted');

      // Get updated presets list
      const presetsData = await api.getPresets();
      const updatedPresets = presetsData.presets || [];

      // Determine which preset to load next
      let nextPreset = null;

      if (updatedPresets.length > 0) {
        // Try to load the preset that took the deleted preset's position
        if (currentIndex < updatedPresets.length) {
          nextPreset = updatedPresets[currentIndex];
        } else {
          // If we deleted the last one, load the new last one
          nextPreset = updatedPresets[updatedPresets.length - 1];
        }
      }

      if (nextPreset) {
        // Load the next preset
        await api.loadPreset(nextPreset.id);
        await fetchData();
      } else {
        // No presets left, clear config to show empty state
        updateData({
          config: null,
          selectedCars: [],
          currentPresetId: null,
          presets: [],
        });
      }

      // Dispatch event to refresh sidebar
      window.dispatchEvent(new CustomEvent('presetSaved'));

      updateModals({ showDelete: false });
    } catch (error) {
      console.error('Failed to delete preset:', error);
    }
  };

  const updateConfigValue = (section, key, value) => {
    setData((prev) => {
      const newConfig = {
        ...prev.config,
        [section]: {
          ...prev.config[section],
          [key]: value,
        },
      };

      // If SERVER.NAME changed, check if it matches a preset and emit selection event
      if (section === 'SERVER' && key === 'NAME') {
        const matchedPreset = prev.presets?.find((p) => p.name === value);
        const newPresetId = matchedPreset?.id || null;

        // Update currentPresetId
        setTimeout(() => {
          updateData({ currentPresetId: newPresetId });
          window.dispatchEvent(
            new CustomEvent('presetSelected', { detail: { presetId: newPresetId } })
          );
        }, 0);
      }

      return {
        ...prev,
        config: newConfig,
      };
    });
  };

  const loadTabDefaults = async (tabId) => {
    try {
      // Get the default config from backend
      const defaultConfig = await api.getDefaultConfig();

      console.log('[loadTabDefaults] Loading defaults for tab:', tabId);

      // Map tab IDs to the sections they affect
      const tabSectionMap = {
        MAIN: ['SERVER'], // Main settings only
        RULES: ['SERVER'], // Rules settings (ABS, TC, fuel rate, etc.)
        CONDITIONS: ['SERVER', 'DYNAMIC_TRACK', 'WEATHER_0'], // Time, weather, track conditions
        SESSIONS: ['SERVER', 'BOOKING', 'PRACTICE', 'QUALIFY', 'RACE'], // Session configs
        ADVANCED: ['SERVER', 'FTP'], // Advanced settings
        DETAILS: ['SERVER'], // Server description and details
      };

      const sectionsToUpdate = tabSectionMap[tabId] || [];

      if (sectionsToUpdate.length === 0) {
        console.warn('[loadTabDefaults] No sections mapped for tab:', tabId);
        return;
      }

      // Update only the sections for this tab
      updateData((prev) => {
        const updated = { ...prev.config };

        sectionsToUpdate.forEach((section) => {
          if (defaultConfig[section]) {
            updated[section] = {
              ...updated[section],
              ...defaultConfig[section],
            };
          }
        });

        console.log('[loadTabDefaults] Updated config for tab', tabId);
        return { ...prev, config: updated };
      });
    } catch (error) {
      console.error('[loadTabDefaults] Failed to load defaults:', error);
    }
  };

  const loadAllDefaults = async () => {
    try {
      console.log('[loadAllDefaults] Loading all defaults from backend');
      await api.loadDefaultConfig();

      // Fetch the newly loaded config
      await fetchData();
    } catch (error) {
      console.error('[loadAllDefaults] Failed to load all defaults:', error);
    }
  };

  const toggleCar = (carId) => {
    updateData((prev) => {
      if (prev.selectedCars.includes(carId)) {
        return { selectedCars: prev.selectedCars.filter((id) => id !== carId) };
      } else {
        return { selectedCars: [...prev.selectedCars, carId] };
      }
    });
  };

  const selectAllCars = () => {
    updateData({ selectedCars: data.cars.map((car) => car.id) });
  };

  const clearAllCars = () => {
    updateData({ selectedCars: [] });
  };

  const confirmCarSelection = (newSelection) => {
    updateData({ selectedCars: newSelection });
    updateModals({ showCar: false });
  };

  const confirmTrackSelection = (trackId) => {
    updateConfigValue('SERVER', 'TRACK', trackId);
    updateModals({ showTrack: false });
  };

  const getTrackPreviewUrl = (trackId) => {
    return `/api/content/track-preview/${trackId}`;
  };

  const getCarPreviewUrl = (carId) => {
    return `/api/content/car-preview/${carId}`;
  };

  const getSelectedTrackName = () => {
    const trackId = data.config?.SERVER?.TRACK;
    if (!trackId) return 'No track selected';
    const track = data.tracks.find((t) => t.id === trackId);
    return track ? track.name : trackId;
  };

  // New button handlers for multi-instance manager
  const handleSaveConfig = async () => {
    if (!data.currentPresetId) {
      alert('Please save as a preset first');
      return;
    }

    try {
      const updatedConfig = {
        ...data.config,
        SERVER: {
          ...data.config.SERVER,
          CARS: data.selectedCars.join(';'),
        },
      };

      // Just update the working config and apply to the preset files
      await api.updateConfig(updatedConfig);
      await api.applyConfig();
      console.log('Configuration saved to preset');
    } catch (error) {
      console.error('Failed to save config:', error);
      alert('Failed to save configuration');
    }
  };
  const handleOpenFolder = async () => {
    try {
      const result = await api.openPresetsFolder();

      // Show folder browser modal with path
      updateModals({
        showFolderBrowser: true,
        folderPath: result.path,
      });
    } catch (error) {
      console.error('Failed to open folder:', error);
      alert('Failed to open presets folder');
    }
  };

  const handleRunServer = async () => {
    if (!data.currentPresetId) {
      alert('Please select a preset first');
      return;
    }

    try {
      // First save current config
      await handleSaveConfig();

      // Then start server
      const result = await api.startServerInstance(data.currentPresetId);
      console.log('Server started:', result);

      // Update status
      setData((prev) => ({ ...prev, serverStatus: { running: true, pid: result.pid } }));

      alert(`Server started for ${data.config.SERVER.NAME}\nPID: ${result.pid}`);
    } catch (error) {
      console.error('Failed to start server:', error);
      const errorMsg = error.response?.data?.error?.message || error.message;
      alert(`Failed to start server: ${errorMsg}`);
    }
  };

  const handleStopServer = async () => {
    if (!data.currentPresetId) return;

    try {
      await api.stopServerInstance(data.currentPresetId);
      setData((prev) => ({ ...prev, serverStatus: null }));
      alert(`Server stopped for ${data.config.SERVER.NAME}`);
    } catch (error) {
      console.error('Failed to stop server:', error);
      const errorMsg = error.response?.data?.error?.message || error.message;
      alert(`Failed to stop server: ${errorMsg}`);
    }
  };

  const handleRestartServer = async () => {
    if (!data.currentPresetId) return;

    try {
      // Save config first
      await handleSaveConfig();

      const result = await api.restartServerInstance(data.currentPresetId);
      setData((prev) => ({ ...prev, serverStatus: { running: true, pid: result.pid } }));
      alert(`Server restarted for ${data.config.SERVER.NAME}\nPID: ${result.pid}`);
    } catch (error) {
      console.error('Failed to restart server:', error);
      const errorMsg = error.response?.data?.error?.message || error.message;
      alert(`Failed to restart server: ${errorMsg}`);
    }
  };
  if (data.loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  // Show empty state if no presets exist and no config loaded
  if (!data.config && data.presets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-400 dark:text-gray-500 mb-6">
            Nothing to display
          </h2>
          <button
            onClick={async () => {
              try {
                // Load default config
                await api.loadDefaultConfig();
                const defaultConfig = await api.getConfig();

                // Generate unique name
                const newName = 'AC_Server_0';

                // Update SERVER.NAME
                const updatedConfig = {
                  ...defaultConfig,
                  SERVER: {
                    ...defaultConfig.SERVER,
                    NAME: newName,
                  },
                };

                // Save config
                await api.updateConfig(updatedConfig);

                // Save as new preset
                await api.savePreset(newName, 'Newly created preset from defaults');

                // Reload the page to show the new preset
                window.location.reload();
              } catch (error) {
                console.error('Failed to create new preset:', error);
              }
            }}
            className="px-6 py-3 bg-gray-700 dark:bg-gray-600 text-gray-200 rounded hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
          >
            + Create a new one
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        {/* Scrollable Content Area with bottom padding for fixed buttons */}
        <div className="pb-24">
          <div className="mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Server Manager
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Configure and manage server instances
              </p>
            </div>
          </div>

          {/* Server Name and Tab Navigation */}
          <div className="mb-6">
            <div className="flex flex-wrap items-end gap-4 border-b border-gray-200 dark:border-gray-700 pb-0">
              {/* Server Name Field */}
              <div className="flex-shrink-0 min-w-[250px]">
                <input
                  type="text"
                  className="w-full text-lg font-semibold bg-transparent border-none outline-none focus:bg-white dark:focus:bg-gray-800 focus:border focus:border-blue-500 dark:focus:border-blue-400 rounded px-3 py-2 transition-all h-[42px]"
                  placeholder="Server Name"
                  value={data.config?.SERVER?.NAME || ''}
                  onChange={(e) => updateConfigValue('SERVER', 'NAME', e.target.value)}
                />
              </div>

              {/* Tab Navigation - wraps underneath when needed */}
              <nav className="flex gap-0.5 overflow-x-auto flex-1 min-w-0">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => updateUi({ activeTab: tab.id })}
                    className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      ui.activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tab Content */}
            <Suspense
              fallback={
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
                  Loading...
                </div>
              }
            >
              {ui.activeTab === 'MAIN' && (
                <MainTab
                  config={data.config}
                  updateConfigValue={updateConfigValue}
                  loadTabDefaults={loadTabDefaults}
                  loadAllDefaults={loadAllDefaults}
                  setShowTrackModal={(show) => updateModals({ showTrack: show })}
                  setActiveTab={(tab) => updateUi({ activeTab: tab })}
                  getSelectedTrackName={getSelectedTrackName}
                  selectedCars={data.selectedCars}
                  cars={data.cars}
                  getCarPreviewUrl={getCarPreviewUrl}
                  showPassword={ui.showPassword}
                  setShowPassword={(show) => updateUi({ showPassword: show })}
                  showAdminPassword={ui.showAdminPassword}
                  setShowAdminPassword={(show) => updateUi({ showAdminPassword: show })}
                  setShowCspOptionsModal={(show) => updateModals({ showCspOptions: show })}
                />
              )}

              {ui.activeTab === 'ENTRY_LIST' && (
                <EntryListTab
                  config={data.config}
                  updateConfigValue={updateConfigValue}
                  cars={data.cars}
                  selectedCars={data.selectedCars}
                  setShowCarModal={(show) => updateModals({ showCar: show })}
                />
              )}

              {ui.activeTab === 'RULES' && (
                <RulesTab
                  config={data.config}
                  updateConfigValue={updateConfigValue}
                  loadTabDefaults={loadTabDefaults}
                />
              )}

              {ui.activeTab === 'CONDITIONS' && (
                <ConditionsTab
                  config={data.config}
                  updateConfigValue={updateConfigValue}
                  loadTabDefaults={loadTabDefaults}
                />
              )}

              {ui.activeTab === 'SESSIONS' && (
                <SessionsTab
                  config={data.config}
                  updateConfigValue={updateConfigValue}
                  loadTabDefaults={loadTabDefaults}
                />
              )}

              {ui.activeTab === 'ADVANCED' && (
                <AdvancedTab
                  config={data.config}
                  updateConfigValue={updateConfigValue}
                  loadTabDefaults={loadTabDefaults}
                  selectedCars={data.selectedCars}
                  cars={data.cars}
                />
              )}

              {ui.activeTab === 'DETAILS' && (
                <DetailsTab
                  config={data.config}
                  updateConfigValue={updateConfigValue}
                  loadTabDefaults={loadTabDefaults}
                />
              )}
            </Suspense>
          </form>
        </div>

        {/* Action Buttons - CM Style - Fixed at Bottom */}
        <div className="fixed bottom-0 left-64 right-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-700 shadow-lg z-10">
          <div className="max-w-7xl mx-auto px-8 py-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleOpenFolder}
                className="px-4 py-2 bg-gray-700 dark:bg-gray-600 text-white rounded hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors flex items-center gap-2"
                title="Open presets folder (Ctrl+F)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                Folder
              </button>
              <button
                type="button"
                onClick={() => updateModals({ showCMImport: true })}
                className="px-4 py-2 bg-gray-700 dark:bg-gray-600 text-white rounded hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors flex items-center gap-2"
                title="Import Content Manager pack"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Import CM
              </button>
              <button
                type="button"
                onClick={() => data.currentPresetId && updateModals({ showClone: true })}
                disabled={!data.currentPresetId}
                className="px-4 py-2 bg-gray-700 dark:bg-gray-600 text-white rounded hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title="Clone this preset"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Clone
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-4 py-2 bg-gray-700 dark:bg-gray-600 text-white rounded hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors flex items-center gap-2"
                title="Save configuration (Ctrl+S)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
                Save
              </button>
              <button
                type="button"
                onClick={() => data.currentPresetId && updateModals({ showDelete: true })}
                disabled={!data.currentPresetId}
                className="px-4 py-2 bg-gray-700 dark:bg-gray-600 text-white rounded hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title="Delete this preset"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete
              </button>

              <div className="flex-1"></div>

              {!data.serverStatus?.running ? (
                <button
                  type="button"
                  onClick={handleRunServer}
                  disabled={!data.currentPresetId}
                  className="px-6 py-2 bg-green-600 dark:bg-green-700 text-white rounded hover:bg-green-700 dark:hover:bg-green-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title="Start server instance"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Run
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleRestartServer}
                    className="px-4 py-2 bg-orange-600 dark:bg-orange-700 text-white rounded hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors flex items-center gap-2"
                    title="Restart server instance"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Restart
                  </button>
                  <button
                    type="button"
                    onClick={handleStopServer}
                    className="px-6 py-2 bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-600 transition-colors font-semibold flex items-center gap-2"
                    title="Stop server instance"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" rx="1" />
                    </svg>
                    Stop
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Suspense fallback={null}>
        {modals.showLoadActive && (
          <ConfirmModal
            title="Reset to Active Configuration"
            message="This will discard all your changes and reload the server's active configuration. This action cannot be undone."
            onConfirm={handleLoadActiveConfig}
            onClose={() => updateModals({ showLoadActive: false })}
          />
        )}

        {modals.showSave && (
          <SavePresetModal
            presetName={ui.presetName}
            setPresetName={(name) => updateUi({ presetName: name })}
            onConfirm={confirmSavePreset}
            onClose={() => {
              updateModals({ showSave: false });
              updateUi({ presetName: '' });
            }}
          />
        )}

        {modals.showCar && (
          <CarSelectionModal
            cars={data.cars}
            selectedCars={data.selectedCars}
            onConfirm={confirmCarSelection}
            onClose={() => updateModals({ showCar: false })}
            getCarPreviewUrl={getCarPreviewUrl}
          />
        )}

        {modals.showTrack && (
          <TrackSelectionModal
            tracks={data.tracks}
            selectedTrack={data.config?.SERVER?.TRACK}
            onConfirm={confirmTrackSelection}
            onClose={() => updateModals({ showTrack: false })}
            getTrackPreviewUrl={getTrackPreviewUrl}
          />
        )}

        {modals.showCspOptions && (
          <CspOptionsModal
            currentValue={data.config?.SERVER?.CSP_EXTRA_OPTIONS || ''}
            onConfirm={(value) => {
              updateConfigValue('SERVER', 'CSP_EXTRA_OPTIONS', value);
              updateModals({ showCspOptions: false });
            }}
            onClose={() => updateModals({ showCspOptions: false })}
          />
        )}

        {modals.showClone && (
          <ConfirmModal
            title="Clone Preset"
            message={`This will create a copy of "${data.config?.SERVER?.NAME}". You'll be prompted to name the clone.`}
            onConfirm={handleClonePreset}
            onClose={() => updateModals({ showClone: false })}
          />
        )}

        {modals.showDelete && (
          <ConfirmModal
            title="Delete Preset"
            message={`Are you sure you want to delete "${data.config?.SERVER?.NAME}"? This action cannot be undone. The default configuration will be loaded after deletion.`}
            onConfirm={handleDeletePreset}
            onClose={() => updateModals({ showDelete: false })}
          />
        )}

        {modals.showFolderBrowser && (
          <FolderBrowserModal
            folderPath={modals.folderPath}
            onClose={() => updateModals({ showFolderBrowser: false })}
          />
        )}

        {modals.showCMImport && (
          <CMPackImportModal
            onClose={() => updateModals({ showCMImport: false })}
            onImported={(preset) => {
              // Refresh presets list and load the newly imported preset
              fetchPresets();
              if (preset && preset.id) {
                handleLoadPreset(preset.id);
              }
            }}
          />
        )}
      </Suspense>
    </>
  );
}

// Confirm Modal Component
function ConfirmModal({ title, message, onConfirm, onClose }) {
  const { selectedIndex, buttonRefs } = useKeyboardNav(
    2,
    (index) => {
      if (index === 0) onConfirm();
      else if (index === 1) onClose();
    },
    onClose,
    0 // Default to Confirm button
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">{title}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            ref={(el) => (buttonRefs.current[0] = el)}
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${
              selectedIndex === 0 ? 'ring-2 ring-blue-800' : ''
            }`}
          >
            Confirm
          </button>
          <button
            ref={(el) => (buttonRefs.current[1] = el)}
            onClick={onClose}
            className={`flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors ${
              selectedIndex === 1 ? 'ring-2 ring-gray-500' : ''
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Save Preset Modal Component
function SavePresetModal({ presetName, setPresetName, onConfirm, onClose }) {
  const { selectedIndex, buttonRefs } = useKeyboardNav(
    3,
    (index) => {
      if (index === 0 && presetName.trim()) onConfirm(true);
      else if (index === 1 && presetName.trim()) onConfirm(false);
      else if (index === 2) onClose();
    },
    onClose,
    1 // Default to "Save Only" button
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Save Configuration as Preset
        </h2>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Preset Name
          </label>
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && presetName.trim()) {
                e.preventDefault();
                onConfirm(false);
              }
            }}
            placeholder="Enter preset name..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-2">
          <button
            ref={(el) => (buttonRefs.current[0] = el)}
            onClick={() => onConfirm(true)}
            disabled={!presetName.trim()}
            className={`w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors ${
              selectedIndex === 0 ? 'ring-2 ring-blue-800' : ''
            }`}
          >
            Save & Apply to Server
          </button>
          <button
            ref={(el) => (buttonRefs.current[1] = el)}
            onClick={() => onConfirm(false)}
            disabled={!presetName.trim()}
            className={`w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors ${
              selectedIndex === 1 ? 'ring-2 ring-green-800' : ''
            }`}
          >
            Save Only
          </button>
          <button
            ref={(el) => (buttonRefs.current[2] = el)}
            onClick={onClose}
            className={`w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors ${
              selectedIndex === 2 ? 'ring-2 ring-gray-500' : ''
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// CSP Options Modal Component
function CspOptionsModal({ currentValue, onConfirm, onClose }) {
  const [value, setValue] = useState(currentValue);
  const { selectedIndex, buttonRefs } = useKeyboardNav(
    2,
    (index) => {
      if (index === 0) onConfirm(value);
      else if (index === 1) onClose();
    },
    onClose,
    0 // Default to Confirm button
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          CSP Extra Options
        </h2>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Enter CSP Extra Options (semicolon-separated)
          </label>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="ALLOW_WRONG_WAY=0;USE_GROOVE_LEVEL=1"
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            autoFocus
          />
        </div>

        <div className="flex gap-3">
          <button
            ref={(el) => (buttonRefs.current[0] = el)}
            onClick={() => onConfirm(value)}
            className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${
              selectedIndex === 0 ? 'ring-2 ring-blue-800' : ''
            }`}
          >
            Confirm
          </button>
          <button
            ref={(el) => (buttonRefs.current[1] = el)}
            onClick={onClose}
            className={`flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors ${
              selectedIndex === 1 ? 'ring-2 ring-gray-500' : ''
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ServerConfig;
