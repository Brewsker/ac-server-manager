import React, { lazy, Suspense } from 'react';
import api from '../api/client';
import FolderBrowserModal from '../components/FolderBrowserModal';
import CMPackImportModal from '../components/CMPackImportModal';

// Lazy load heavy config editor components
const CarSelectionModal = lazy(() => import('../components/CarSelectionModal'));
const TrackSelectionModal = lazy(() => import('../components/TrackSelectionModal'));
const MainTab = lazy(() => import('../components/config/MainTab'));
const RulesTab = lazy(() => import('../components/config/RulesTab'));
const ConditionsTab = lazy(() => import('../components/config/ConditionsTab'));
const SessionsTab = lazy(() => import('../components/config/SessionsTab'));
const AdvancedTab = lazy(() => import('../components/config/AdvancedTab'));
const EntryListTab = lazy(() => import('../components/config/EntryListTab'));
const DetailsTab = lazy(() => import('../components/config/DetailsTab'));

// ============================================================================
// EDITOR VIEW (Config Editor)
// ============================================================================

function EditorView() {
  const isMountedRef = React.useRef(true);

  // Editor state
  const [data, setData] = React.useState({
    config: null,
    tracks: [],
    cars: [],
    selectedCars: [],
    presets: [],
    currentPresetId: null,
    loading: true,
    serverStatus: null,
  });

  // Modal state
  const [modals, setModals] = React.useState({
    showSave: false,
    showCar: false,
    showTrack: false,
    showCspOptions: false,
    showFolderBrowser: false,
    showCMImport: false,
    showClone: false,
    showRename: false,
    showDelete: false,
    folderPath: '',
  });

  // UI state
  const [ui, setUi] = React.useState({
    presetName: '',
    cspOptionsInput: '',
    showPassword: false,
    showAdminPassword: false,
    activeTab: localStorage.getItem('dashboardEditorActiveTab') || 'MAIN',
  });

  // Save activeTab to localStorage
  React.useEffect(() => {
    localStorage.setItem('dashboardEditorActiveTab', ui.activeTab);
  }, [ui.activeTab]);

  // Helper functions for state updates
  const updateData = (updates) => setData((prev) => ({ ...prev, ...updates }));
  const updateModals = (updates) => setModals((prev) => ({ ...prev, ...updates }));
  const updateUi = (updates) => setUi((prev) => ({ ...prev, ...updates }));

  const tabs = [
    { id: 'MAIN', label: 'Main', icon: '🏠' },
    { id: 'ENTRY_LIST', label: 'Entry List', icon: '📋' },
    { id: 'RULES', label: 'Rules', icon: '📜' },
    { id: 'CONDITIONS', label: 'Conditions', icon: '🌤️' },
    { id: 'SESSIONS', label: 'Sessions', icon: '⏱️' },
    { id: 'ADVANCED', label: 'Advanced', icon: '⚙️' },
    { id: 'DETAILS', label: 'Details', icon: 'ℹ️' },
  ];

  // Initial data fetch
  React.useEffect(() => {
    isMountedRef.current = true;
    fetchData();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Check server status when preset changes
  React.useEffect(() => {
    const checkStatus = async () => {
      if (!data.currentPresetId) {
        updateData({ serverStatus: null });
        return;
      }
      try {
        const status = await api.getServerInstanceStatus(data.currentPresetId);
        updateData({ serverStatus: status.running ? { running: true, pid: status.pid } : null });
      } catch (error) {
        updateData({ serverStatus: null });
      }
    };
    checkStatus();
  }, [data.currentPresetId]);

  const fetchData = async () => {
    try {
      const [configData, presetsData] = await Promise.all([api.getConfig(), api.getPresets()]);

      let tracksData = [];
      let carsData = [];

      try {
        tracksData = await api.getTracks();
      } catch (error) {
        console.warn('[EditorView] Failed to load tracks:', error.message);
      }

      try {
        carsData = await api.getCars();
      } catch (error) {
        console.warn('[EditorView] Failed to load cars:', error.message);
      }

      if (!isMountedRef.current) return;

      // Normalize config
      const normalizedConfig = {
        ...configData,
        SERVER: {
          ...configData?.SERVER,
          SUN_ANGLE: configData?.SERVER?.SUN_ANGLE ?? 960,
          TIME_OF_DAY_MULT: configData?.SERVER?.TIME_OF_DAY_MULT ?? 1,
          REGISTER_TO_LOBBY: configData?.SERVER?.REGISTER_TO_LOBBY ?? 1,
          ADMIN_PASSWORD: configData?.SERVER?.ADMIN_PASSWORD ?? 'mypassword',
          MAX_CLIENTS: configData?.SERVER?.MAX_CLIENTS ?? 18,
        },
        DYNAMIC_TRACK: {
          ...configData?.DYNAMIC_TRACK,
          SESSION_START: configData?.DYNAMIC_TRACK?.SESSION_START ?? 95,
          RANDOMNESS: configData?.DYNAMIC_TRACK?.RANDOMNESS ?? 2,
          SESSION_TRANSFER: configData?.DYNAMIC_TRACK?.SESSION_TRANSFER ?? 90,
          LAP_GAIN: configData?.DYNAMIC_TRACK?.LAP_GAIN ?? 10,
        },
        WEATHER_0: configData?.WEATHER_0 || {},
      };

      // Get selected cars
      const carsInConfig = normalizedConfig?.SERVER?.CARS || '';
      let selectedCars =
        typeof carsInConfig === 'string'
          ? carsInConfig.split(';').filter((c) => c.trim())
          : Array.isArray(carsInConfig)
          ? carsInConfig
          : [];

      // Also extract car models from entry sections
      const entryCars = [];
      for (let i = 0; i < 100; i++) {
        const carSection = normalizedConfig[`CAR_${i}`];
        if (carSection?.MODEL) entryCars.push(carSection.MODEL);
      }
      selectedCars = [...new Set([...selectedCars, ...entryCars])];

      // Match current config to a preset
      const currentPreset = presetsData.presets?.find(
        (p) => p.name === normalizedConfig?.SERVER?.NAME
      );

      updateData({
        config: normalizedConfig,
        tracks: Array.isArray(tracksData) ? tracksData : [],
        cars: Array.isArray(carsData) ? carsData : [],
        selectedCars,
        presets: presetsData.presets || [],
        currentPresetId: currentPreset?.id || null,
        loading: false,
      });
    } catch (error) {
      console.error('Failed to fetch editor data:', error);
      if (isMountedRef.current) updateData({ loading: false });
    }
  };

  const handleSaveConfig = async () => {
    if (!data.config) return;
    
    // If we already have a preset loaded, save directly without showing modal
    if (data.currentPresetId) {
      await confirmSavePreset(false);
    } else {
      // First-time save: show modal to get preset name
      updateUi({ presetName: data.config?.SERVER?.NAME || '' });
      updateModals({ showSave: true });
    }
  };

  const confirmSavePreset = async (applyToServer = false) => {
    if (!ui.presetName.trim()) return;

    try {
      const configToSave = {
        ...data.config,
        SERVER: {
          ...data.config.SERVER,
          NAME: ui.presetName,
          CARS: data.selectedCars.join(';'),
        },
      };

      await api.updateConfig(configToSave);

      // Check if we're renaming an existing preset
      const currentPreset = data.presets.find((p) => p.id === data.currentPresetId);
      const isRename = currentPreset && currentPreset.name !== ui.presetName.trim();

      let result;
      if (isRename) {
        // Rename the existing preset and save the updated config
        result = await api.renamePreset(data.currentPresetId, ui.presetName.trim());
        // Save the config to the renamed preset
        await api.savePreset(ui.presetName, configToSave);
        console.log('Preset renamed and saved:', currentPreset.name, '→', ui.presetName);
      } else {
        // Save as new or update existing preset with same name
        result = await api.savePreset(ui.presetName, configToSave);
      }

      if (applyToServer) {
        await api.applyConfig();
      }

      // Refresh presets
      const presetsData = await api.getPresets();
      const savedPreset = presetsData.presets?.find((p) => p.name === ui.presetName);

      updateData({
        config: { ...data.config, SERVER: { ...data.config.SERVER, NAME: ui.presetName } },
        presets: presetsData.presets || [],
        currentPresetId: savedPreset?.id || result?.preset?.id || result?.id || data.currentPresetId,
      });

      updateModals({ showSave: false });
      console.log('Preset saved:', ui.presetName);
    } catch (error) {
      console.error('Failed to save preset:', error);
      alert('Failed to save: ' + error.message);
    }
  };

  const updateConfigValue = (section, key, value) => {
    setData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [section]: {
          ...prev.config[section],
          [key]: value,
        },
      },
    }));
  };

  const deleteConfigSection = (section) => {
    setData((prev) => {
      const newConfig = { ...prev.config };
      delete newConfig[section];
      return { ...prev, config: newConfig };
    });
  };

  const handleTrackSelect = (trackId, trackConfig) => {
    updateConfigValue('SERVER', 'TRACK', trackId);
    if (trackConfig) {
      updateConfigValue('SERVER', 'CONFIG_TRACK', trackConfig);
    }
    updateModals({ showTrack: false });
  };

  const handleCarsUpdate = (newCars) => {
    updateData({ selectedCars: newCars });
  };

  // Helper functions required by MainTab
  const loadTabDefaults = async (tabId) => {
    try {
      const defaultConfig = await api.getDefaultConfig();
      const tabSectionMap = {
        MAIN: ['SERVER'],
        RULES: ['SERVER'],
        CONDITIONS: ['SERVER', 'DYNAMIC_TRACK', 'WEATHER_0'],
        SESSIONS: ['SERVER', 'BOOKING', 'PRACTICE', 'QUALIFY', 'RACE'],
        ADVANCED: ['SERVER', 'FTP'],
        DETAILS: ['SERVER'],
      };
      const sectionsToUpdate = tabSectionMap[tabId] || [];
      if (sectionsToUpdate.length === 0) return;

      setData((prev) => {
        const updated = { ...prev.config };
        sectionsToUpdate.forEach((section) => {
          if (defaultConfig[section]) {
            updated[section] = { ...updated[section], ...defaultConfig[section] };
          }
        });
        return { ...prev, config: updated };
      });
    } catch (error) {
      console.error('[EditorView] Failed to load tab defaults:', error);
    }
  };

  const loadAllDefaults = async () => {
    try {
      await api.loadDefaultConfig();
      await fetchData();
    } catch (error) {
      console.error('[EditorView] Failed to load all defaults:', error);
    }
  };

  const getSelectedTrackName = () => {
    const trackId = data.config?.SERVER?.TRACK;
    if (!trackId) {
      return data.tracks.length === 0 ? 'No content available' : 'No track selected';
    }
    const track = data.tracks.find((t) => t.id === trackId);
    return track ? track.name : trackId;
  };

  const getCarPreviewUrl = (carId) => {
    return `/api/content/car-preview/${carId}`;
  };

  const handleOpenFolder = async () => {
    try {
      const result = await api.openPresetsFolder();
      updateModals({ folderPath: result.path, showFolderBrowser: true });
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  };

  const handleCMPackImport = (importedData) => {
    if (!importedData || !data.config) return;

    const updates = {};

    if (importedData.track) {
      updates.SERVER = {
        ...data.config.SERVER,
        TRACK: importedData.track.folderName || data.config.SERVER?.TRACK,
        CONFIG_TRACK: importedData.track.config || data.config.SERVER?.CONFIG_TRACK || '',
      };
    }

    if (importedData.cars && importedData.cars.length > 0) {
      const newCars = importedData.cars.map((c) => c.folderName);
      const mergedCars = [...new Set([...data.selectedCars, ...newCars])];
      updateData({ selectedCars: mergedCars });
      updates.SERVER = {
        ...(updates.SERVER || data.config.SERVER),
        CARS: mergedCars.join(';'),
      };
    }

    if (Object.keys(updates).length > 0) {
      setData((prev) => ({
        ...prev,
        config: { ...prev.config, ...updates },
      }));
    }

    updateModals({ showCMImport: false });
    fetchData(); // Refresh to get new content
  };

  // Clone preset handler
  const handleClonePreset = async (newName) => {
    if (!newName?.trim() || !data.config) return;
    try {
      const clonedConfig = {
        ...data.config,
        SERVER: { ...data.config.SERVER, NAME: newName.trim() },
      };
      await api.savePreset(newName.trim(), clonedConfig);
      const presetsData = await api.getPresets();
      const newPreset = presetsData.presets?.find((p) => p.name === newName.trim());
      updateData({
        config: clonedConfig,
        presets: presetsData.presets || [],
        currentPresetId: newPreset?.id || null,
      });
      updateModals({ showClone: false });
    } catch (error) {
      console.error('Failed to clone preset:', error);
      alert('Failed to clone: ' + error.message);
    }
  };

  // Rename preset handler
  const handleRenamePreset = async (newName) => {
    if (!newName?.trim() || !data.config || !data.currentPresetId) return;
    try {
      const renamedConfig = {
        ...data.config,
        SERVER: { ...data.config.SERVER, NAME: newName.trim() },
      };
      // Delete old preset then save with new name
      await api.deletePreset(data.currentPresetId);
      await api.savePreset(newName.trim(), renamedConfig);
      const presetsData = await api.getPresets();
      const newPreset = presetsData.presets?.find((p) => p.name === newName.trim());
      updateData({
        config: renamedConfig,
        presets: presetsData.presets || [],
        currentPresetId: newPreset?.id || null,
      });
      updateModals({ showRename: false });
    } catch (error) {
      console.error('Failed to rename preset:', error);
      alert('Failed to rename: ' + error.message);
    }
  };

  // Delete preset handler
  const handleDeletePreset = async () => {
    if (!data.currentPresetId) return;
    try {
      await api.deletePreset(data.currentPresetId);
      const presetsData = await api.getPresets();
      // Load default config after delete
      const configData = await api.getConfig();
      updateData({
        config: configData,
        presets: presetsData.presets || [],
        currentPresetId: null,
      });
      updateModals({ showDelete: false });
    } catch (error) {
      console.error('Failed to delete preset:', error);
      alert('Failed to delete: ' + error.message);
    }
  };

  // Server control handlers
  const handleRunServer = async () => {
    if (!data.currentPresetId) return;
    try {
      await api.startServerInstance(data.currentPresetId);
      const status = await api.getServerInstanceStatus(data.currentPresetId);
      updateData({ serverStatus: status.running ? { running: true, pid: status.pid } : null });
    } catch (error) {
      console.error('Failed to start server:', error);
      alert('Failed to start server: ' + error.message);
    }
  };

  const handleStopServer = async () => {
    if (!data.currentPresetId) return;
    try {
      await api.stopServerInstance(data.currentPresetId);
      updateData({ serverStatus: null });
    } catch (error) {
      console.error('Failed to stop server:', error);
      alert('Failed to stop server: ' + error.message);
    }
  };

  const handleRestartServer = async () => {
    if (!data.currentPresetId) return;
    try {
      await api.restartServerInstance(data.currentPresetId);
      const status = await api.getServerInstanceStatus(data.currentPresetId);
      updateData({ serverStatus: status.running ? { running: true, pid: status.pid } : null });
    } catch (error) {
      console.error('Failed to restart server:', error);
      alert('Failed to restart server: ' + error.message);
    }
  };

  // Loading state
  if (data.loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // No config loaded
  if (!data.config) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-full">
        <div className="text-gray-500 mb-4">No configuration loaded</div>
        <p className="text-gray-600 text-sm">Select a preset from the Presets view to edit</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden pb-14 relative">
      {/* Header - Minimal, just title/info */}
      <div className="px-4 py-3 border-b border-gray-700 bg-gray-800/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✏️</span>
          <div>
            <h1 className="text-lg font-semibold text-white">
              {data.config?.SERVER?.NAME || 'Untitled Configuration'}
            </h1>
            <span className="text-xs text-gray-400">
              {data.currentPresetId ? 'Saved Preset' : 'Unsaved Configuration'}
              {data.serverStatus?.running && (
                <span className="ml-2 text-emerald-400">● Running</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700 bg-gray-800/30 shrink-0 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => updateUi({ activeTab: tab.id })}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              ui.activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700/30'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/20'
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
              tracks={data.tracks}
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
              deleteConfigSection={deleteConfigSection}
              cars={data.cars}
              selectedCars={data.selectedCars}
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
              deleteConfigSection={deleteConfigSection}
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
      </div>

      {/* Bottom Action Bar - Constrained to Editor */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 shadow-lg z-10">
        <div className="px-4 py-3">
          <div className="flex gap-2 flex-wrap items-center">
            {/* Folder Button */}
            <button
              type="button"
              onClick={handleOpenFolder}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors flex items-center gap-2"
              title="Open presets folder"
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

            {/* Import CM Button */}
            <button
              type="button"
              onClick={() => updateModals({ showCMImport: true })}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors flex items-center gap-2"
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

            {/* Clone Button */}
            <button
              type="button"
              onClick={() => data.config && updateModals({ showClone: true })}
              disabled={!data.config}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

            {/* Rename Button */}
            <button
              type="button"
              onClick={() =>
                data.config && data.currentPresetId && updateModals({ showRename: true })
              }
              disabled={!data.config || !data.currentPresetId}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title="Rename this preset"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Rename
            </button>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={!data.config}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title="Save configuration"
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

            {/* Delete Button */}
            <button
              type="button"
              onClick={() =>
                data.config && data.currentPresetId && updateModals({ showDelete: true })
              }
              disabled={!data.config || !data.currentPresetId}
              className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

            {/* Separator */}
            <div className="w-px h-8 bg-gray-600 mx-1 self-center"></div>

            {/* Server Control Buttons */}
            {!data.serverStatus?.running ? (
              <button
                type="button"
                onClick={handleRunServer}
                disabled={!data.currentPresetId}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-500 transition-colors flex items-center gap-2"
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
                  className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-500 transition-colors font-semibold flex items-center gap-2"
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

      {/* Modals */}
      {modals.showTrack && (
        <Suspense fallback={null}>
          <TrackSelectionModal
            tracks={data.tracks}
            currentTrack={data.config?.SERVER?.TRACK}
            onSelect={handleTrackSelect}
            onClose={() => updateModals({ showTrack: false })}
          />
        </Suspense>
      )}

      {modals.showCar && (
        <Suspense fallback={null}>
          <CarSelectionModal
            cars={data.cars}
            selectedCars={data.selectedCars}
            onUpdate={handleCarsUpdate}
            onClose={() => updateModals({ showCar: false })}
          />
        </Suspense>
      )}

      {modals.showSave && (
        <EditorSavePresetModal
          presetName={ui.presetName}
          setPresetName={(name) => updateUi({ presetName: name })}
          onConfirm={confirmSavePreset}
          onClose={() => updateModals({ showSave: false })}
        />
      )}

      {modals.showClone && (
        <EditorInputModal
          title="Clone Preset"
          placeholder="Enter new preset name..."
          initialValue={`${data.config?.SERVER?.NAME || 'Untitled'} (Copy)`}
          confirmLabel="Clone"
          onConfirm={handleClonePreset}
          onClose={() => updateModals({ showClone: false })}
        />
      )}

      {modals.showRename && (
        <EditorInputModal
          title="Rename Preset"
          placeholder="Enter new name..."
          initialValue={data.config?.SERVER?.NAME || ''}
          confirmLabel="Rename"
          onConfirm={handleRenamePreset}
          onClose={() => updateModals({ showRename: false })}
        />
      )}

      {modals.showDelete && (
        <EditorConfirmModal
          title="Delete Preset"
          message={`Are you sure you want to delete "${data.config?.SERVER?.NAME}"? This action cannot be undone.`}
          confirmLabel="Delete"
          confirmColor="red"
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
          onImport={handleCMPackImport}
          onClose={() => updateModals({ showCMImport: false })}
        />
      )}
    </div>
  );
}

// ============================================================================
// EDITOR MODALS
// ============================================================================

function EditorSavePresetModal({ presetName, setPresetName, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-white">Save Configuration as Preset</h2>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Preset Name</label>
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
            className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => onConfirm(true)}
            disabled={!presetName.trim()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            Save & Apply to Server
          </button>
          <button
            onClick={() => onConfirm(false)}
            disabled={!presetName.trim()}
            className="w-full px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            Save Only
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function EditorInputModal({ title, placeholder, initialValue, confirmLabel, onConfirm, onClose }) {
  const [value, setValue] = React.useState(initialValue || '');

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-white">{title}</h2>

        <div className="mb-6">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && value.trim()) {
                e.preventDefault();
                onConfirm(value.trim());
              }
              if (e.key === 'Escape') {
                onClose();
              }
            }}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(value.trim())}
            disabled={!value.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditorConfirmModal({ title, message, confirmLabel, confirmColor, onConfirm, onClose }) {
  const colorClasses = {
    red: 'bg-red-600 hover:bg-red-500',
    blue: 'bg-blue-600 hover:bg-blue-500',
    green: 'bg-green-600 hover:bg-green-500',
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-white">{title}</h2>
        <p className="text-gray-300 mb-6">{message}</p>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded transition-colors ${
              colorClasses[confirmColor] || colorClasses.blue
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditorView;
