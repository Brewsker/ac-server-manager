import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';
import { useKeyboardNav } from '../hooks/useKeyboardNav';

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
    { id: 'MAIN', label: 'Main', icon: '⚙️' },
    { id: 'ENTRY_LIST', label: 'Entry List', icon: '🏁' },
    { id: 'RULES', label: 'Rules', icon: '📋' },
    { id: 'CONDITIONS', label: 'Conditions', icon: '🌤️' },
    { id: 'SESSIONS', label: 'Sessions', icon: '⏱️' },
    { id: 'ADVANCED', label: 'Advanced', icon: '🔧' },
    { id: 'DETAILS', label: 'Details', icon: 'ℹ️' },
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

  const fetchData = async () => {
    try {
      const [configData, tracksData, carsData, presetsData] = await Promise.all([
        api.getConfig(),
        api.getTracks(),
        api.getCars(),
        api.getPresets(),
      ]);

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
        tracks: tracksData,
        cars: carsData,
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
      await api.updateConfig(updatedConfig);
      await api.savePreset(data.config.SERVER.NAME);
      console.log('Configuration saved to preset');
      
      // Dispatch event to refresh sidebar
      window.dispatchEvent(new CustomEvent('presetSaved'));
    } catch (error) {
      console.error('Failed to save config:', error);
      alert('Failed to save configuration');
    }
  };

  const handleOpenFolder = async () => {
    try {
      await api.openPresetsFolder();
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
      
      // Then start server (API to be implemented)
      // await api.startServer(data.currentPresetId);
      console.log('Starting server for preset:', data.currentPresetId);
      alert('Server start functionality coming soon!');
    } catch (error) {
      console.error('Failed to start server:', error);
      alert('Failed to start server');
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
    <div>
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

        {/* Action Buttons - CM Style */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleOpenFolder}
              className="px-4 py-2 bg-gray-700 dark:bg-gray-600 text-white rounded hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
              title="Open presets folder (Ctrl+F)"
            >
              📁 Folder
            </button>
            <button
              type="button"
              onClick={() => data.currentPresetId && updateModals({ showClone: true })}
              disabled={!data.currentPresetId}
              className="px-4 py-2 bg-gray-700 dark:bg-gray-600 text-white rounded hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Clone this preset"
            >
              📋 Clone
            </button>
            
            <div className="flex-1"></div>
            
            <button
              type="button"
              onClick={handleSaveConfig}
              className="px-6 py-2 bg-green-600 dark:bg-green-700 text-white rounded hover:bg-green-700 dark:hover:bg-green-600 transition-colors font-semibold"
              title="Save configuration (Ctrl+S)"
            >
              💾 Save
            </button>
            <button
              type="button"
              onClick={() => data.currentPresetId && updateModals({ showDelete: true })}
              disabled={!data.currentPresetId}
              className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete this preset"
            >
              🗑️ Delete
            </button>
            <button
              type="button"
              onClick={handleRunServer}
              disabled={!data.currentPresetId}
              className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              title="Start server instance"
            >
              ▶️ Run
            </button>
          </div>
        </div>
      </form>

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
      </Suspense>
    </div>
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
