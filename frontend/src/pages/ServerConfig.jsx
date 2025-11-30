import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';
import { useKeyboardNav } from '../hooks/useKeyboardNav';
import CarSelectionModal from '../components/CarSelectionModal';
import TrackSelectionModal from '../components/TrackSelectionModal';
import MainTab from '../components/config/MainTab';
import RulesTab from '../components/config/RulesTab';
import ConditionsTab from '../components/config/ConditionsTab';
import SessionsTab from '../components/config/SessionsTab';

function ServerConfig() {
  const navigate = useNavigate();
  const location = useLocation();
  const [config, setConfig] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [cars, setCars] = useState([]);
  const [selectedCars, setSelectedCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showLoadActiveModal, setShowLoadActiveModal] = useState(false);
  const [showCarModal, setShowCarModal] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [activeTab, setActiveTab] = useState('MAIN');
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showCspOptionsModal, setShowCspOptionsModal] = useState(false);
  const [cspOptionsInput, setCspOptionsInput] = useState('');

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
    console.log('[ServerConfig] Navigation detected, fetching data...', location.state);
    fetchData();
  }, [location.key, location.state]);

  const fetchData = async () => {
    try {
      const [configData, tracksData, carsData] = await Promise.all([
        api.getConfig(),
        api.getTracks(),
        api.getCars(),
      ]);
      
      // Ensure all sections exist in config with defaults if backend values missing
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
      
      setConfig(normalizedConfig);
      setTracks(tracksData);
      setCars(carsData);
      
      const carsInConfig = normalizedConfig?.SERVER?.CARS || '';
      if (typeof carsInConfig === 'string') {
        setSelectedCars(carsInConfig.split(';').filter(c => c.trim()));
      } else if (Array.isArray(carsInConfig)) {
        setSelectedCars(carsInConfig);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedConfig = {
        ...config,
        SERVER: {
          ...config.SERVER,
          CARS: selectedCars.join(';')
        }
      };
      
      await api.updateConfig(updatedConfig);
      await api.applyConfig();
      
      console.log('Configuration applied to server');
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  };

  const handleSaveAsPreset = () => {
    setPresetName(config?.SERVER?.NAME || '');
    setShowSaveModal(true);
  };

  const confirmSavePreset = async (applyToServer = false) => {
    if (!presetName.trim()) return;

    try {
      const updatedConfig = {
        ...config,
        SERVER: {
          ...config.SERVER,
          CARS: selectedCars.join(';')
        }
      };
      await api.updateConfig(updatedConfig);
      await api.savePreset(presetName);
      console.log('Configuration saved as preset:', presetName);
      
      setShowSaveModal(false);
      setPresetName('');
      
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
      setShowLoadActiveModal(false);
      console.log('Loaded active server configuration');
    } catch (error) {
      console.error('Failed to load active config:', error);
    }
  };

  const updateConfigValue = (section, key, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const getAllDefaults = () => {
    return {
      MAIN: {
        SERVER: {
          MAX_CLIENTS: 18,
          PASSWORD: '',
          ADMIN_PASSWORD: 'mypassword',
          UDP_PORT: 9600,
          TCP_PORT: 9600,
          HTTP_PORT: 8081,
          PICKUP_MODE_ENABLED: 0,
          WELCOME_MESSAGE: '',
          CLIENT_SEND_INTERVAL_HZ: 18,
          NUM_THREADS: 2,
          REGISTER_TO_LOBBY: 1,
          CSP_PHYSICS_LEVEL: 0,
          CSP_USE_RAIN_CLOUDS: 0,
          CSP_RAIN_CLOUDS_CONTROL: 0,
          CSP_SHADOWS_STATE: 0,
          CSP_EXTRA_OPTIONS: '',
        }
      },
      RULES: {
        SERVER: {
          ABS_ALLOWED: 1,
          TC_ALLOWED: 1,
          STABILITY_ALLOWED: 0,
          AUTOCLUTCH_ALLOWED: 0,
          TYRE_BLANKETS_ALLOWED: 0,
          FORCE_VIRTUAL_MIRROR: 1,
          FUEL_RATE: 100,
          DAMAGE_MULTIPLIER: 100,
          TYRE_WEAR_RATE: 100,
          ALLOWED_TYRES_OUT: 2,
          START_RULE: 1,
          RACE_GAS_PENALTY_DISABLED: 0,
          KICK_QUORUM: 85,
          VOTING_QUORUM: 80,
          VOTE_DURATION: 20,
          BLACKLIST_MODE: 1,
          MAX_CONTACTS_PER_KM: -1,
        }
      },
      CONDITIONS: {
        SERVER: {
          SUN_ANGLE: 960,
          TIME_OF_DAY_MULT: 1,
        },
        DYNAMIC_TRACK: {
          SESSION_START: 95,
          RANDOMNESS: 2,
          SESSION_TRANSFER: 90,
          LAP_GAIN: 10,
        }
      },
      SESSIONS: {
        SERVER: {
          PICKUP_MODE_ENABLED: 0,
          LOCKED_ENTRY_LIST: 0,
          LOOP_MODE: 1,
          RACE_OVER_TIME: 180,
        },
        BOOKING: {
          IS_OPEN: 0,
          TIME: 10,
        },
        PRACTICE: {
          IS_OPEN: 1,
          TIME: 10,
          CAN_JOIN: 1,
        },
        QUALIFY: {
          IS_OPEN: 1,
          TIME: 10,
          CAN_JOIN: 1,
          QUALIFY_MAX_WAIT_PERC: 120,
        },
        RACE: {
          IS_OPEN: 1,
          LAPS: 5,
          WAIT_TIME: 60,
          RESULT_SCREEN_TIME: 60,
          RACE_JOIN_TYPE: 0,
          MANDATORY_PIT: 0,
          MANDATORY_PIT_FROM: 0,
          MANDATORY_PIT_TO: 0,
          REVERSED_GRID_RACE_POSITIONS: 0,
        }
      },
    };
  };

  const loadTabDefaults = (tabId) => {
    const defaults = getAllDefaults();
    const tabDefaults = defaults[tabId];
    if (tabDefaults) {
      console.log('[loadTabDefaults] Loading defaults for tab:', tabId, tabDefaults);
      setConfig(prev => {
        const updated = { ...prev };
        Object.keys(tabDefaults).forEach(section => {
          updated[section] = {
            ...updated[section],
            ...tabDefaults[section]
          };
        });
        console.log('[loadTabDefaults] Updated config:', updated);
        return updated;
      });
    }
  };

  const loadAllDefaults = () => {
    const defaults = getAllDefaults();
    console.log('[loadAllDefaults] Loading all defaults:', defaults);
    setConfig(prev => {
      const updated = { ...prev };
      Object.keys(defaults).forEach(tabId => {
        Object.keys(defaults[tabId]).forEach(section => {
          updated[section] = {
            ...updated[section],
            ...defaults[tabId][section]
          };
        });
      });
      console.log('[loadAllDefaults] Updated config:', updated);
      return updated;
    });
  };

  const toggleCar = (carId) => {
    setSelectedCars(prev => {
      if (prev.includes(carId)) {
        return prev.filter(id => id !== carId);
      } else {
        return [...prev, carId];
      }
    });
  };

  const selectAllCars = () => {
    setSelectedCars(cars.map(car => car.id));
  };

  const clearAllCars = () => {
    setSelectedCars([]);
  };

  const confirmCarSelection = (newSelection) => {
    setSelectedCars(newSelection);
    setShowCarModal(false);
  };

  const confirmTrackSelection = (trackId) => {
    updateConfigValue('SERVER', 'TRACK', trackId);
    setShowTrackModal(false);
  };

  const getTrackPreviewUrl = (trackId) => {
    return `/api/content/track-preview/${trackId}`;
  };

  const getCarPreviewUrl = (carId) => {
    return `/api/content/car-preview/${carId}`;
  };

  const getSelectedTrackName = () => {
    const trackId = config?.SERVER?.TRACK;
    if (!trackId) return 'No track selected';
    const track = tracks.find(t => t.id === trackId);
    return track ? track.name : trackId;
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Configuration Editor</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Edit settings and apply to server</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowLoadActiveModal(true)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            🔄 Load Active Config
          </button>
          <button 
            type="button" 
            className="px-4 py-2 bg-purple-600 dark:bg-purple-700 text-white rounded hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors"
            onClick={handleSaveAsPreset}
          >
            📋 Save as Preset
          </button>
          <button 
            type="submit" 
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-semibold"
          >
            ✅ Apply Config
          </button>
        </div>
      </div>

      {/* Horizontal Tab Navigation with Server Name */}
      <div className="mb-6">
        <div className="flex items-end gap-4 border-b border-gray-200 dark:border-gray-700">
          {/* Server Name Field - 1/3 Width */}
          <div className="w-1/3">
            <input
              type="text"
              className="w-full text-lg font-semibold bg-transparent border-none outline-none focus:bg-white dark:focus:bg-gray-800 focus:border focus:border-blue-500 dark:focus:border-blue-400 rounded px-3 py-2 transition-all h-[42px]"
              placeholder="Server Name"
              value={config?.SERVER?.NAME || ''}
              onChange={(e) => updateConfigValue('SERVER', 'NAME', e.target.value)}
            />
          </div>
          
          {/* Tab Navigation - 2/3 Width, Right Aligned */}
          <nav className="flex gap-0.5 overflow-x-auto w-2/3 justify-end">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
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
        {activeTab === 'MAIN' && (
          <MainTab 
            config={config} 
            updateConfigValue={updateConfigValue} 
            loadTabDefaults={loadTabDefaults}
            loadAllDefaults={loadAllDefaults}
            setShowTrackModal={setShowTrackModal}
            setShowCarModal={setShowCarModal}
            getSelectedTrackName={getSelectedTrackName}
            selectedCars={selectedCars}
            cars={cars}
            getCarPreviewUrl={getCarPreviewUrl}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showAdminPassword={showAdminPassword}
            setShowAdminPassword={setShowAdminPassword}
            setShowCspOptionsModal={setShowCspOptionsModal}
          />
        )}

        {activeTab === 'ENTRY_LIST' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-gray-500 dark:text-gray-400">Entry List configuration coming soon...</p>
          </div>
        )}

        {activeTab === 'RULES' && (
          <RulesTab 
            config={config} 
            updateConfigValue={updateConfigValue} 
            loadTabDefaults={loadTabDefaults}
          />
        )}

        {activeTab === 'CONDITIONS' && (
          <ConditionsTab 
            config={config} 
            updateConfigValue={updateConfigValue} 
            loadTabDefaults={loadTabDefaults}
          />
        )}

        {activeTab === 'SESSIONS' && (
          <SessionsTab 
            config={config} 
            updateConfigValue={updateConfigValue} 
            loadTabDefaults={loadTabDefaults}
          />
        )}

        {activeTab === 'ADVANCED' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-gray-500 dark:text-gray-400">Advanced settings coming soon...</p>
          </div>
        )}

        {activeTab === 'DETAILS' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-gray-500 dark:text-gray-400">Server details coming soon...</p>
          </div>
        )}
      </form>

      {/* Modals */}
      {showLoadActiveModal && (
        <ConfirmModal
          title="Load Active Configuration"
          message="This will replace your current working configuration with the server's active configuration. Any unsaved changes will be lost."
          onConfirm={handleLoadActiveConfig}
          onClose={() => setShowLoadActiveModal(false)}
        />
      )}

      {showSaveModal && (
        <SavePresetModal
          presetName={presetName}
          setPresetName={setPresetName}
          onConfirm={confirmSavePreset}
          onClose={() => {
            setShowSaveModal(false);
            setPresetName('');
          }}
        />
      )}

      {showCarModal && (
        <CarSelectionModal
          cars={cars}
          selectedCars={selectedCars}
          onConfirm={confirmCarSelection}
          onClose={() => setShowCarModal(false)}
          getCarPreviewUrl={getCarPreviewUrl}
        />
      )}

      {showTrackModal && (
        <TrackSelectionModal
          tracks={tracks}
          selectedTrack={config?.SERVER?.TRACK}
          onConfirm={confirmTrackSelection}
          onClose={() => setShowTrackModal(false)}
          getTrackPreviewUrl={getTrackPreviewUrl}
        />
      )}

      {showCspOptionsModal && (
        <CspOptionsModal
          currentValue={config?.SERVER?.CSP_EXTRA_OPTIONS || ''}
          onConfirm={(value) => {
            updateConfigValue('SERVER', 'CSP_EXTRA_OPTIONS', value);
            setShowCspOptionsModal(false);
          }}
          onClose={() => setShowCspOptionsModal(false)}
        />
      )}
    </div>
  );
}

// Confirm Modal Component
function ConfirmModal({ title, message, onConfirm, onClose }) {
  const buttonRefs = useRef([]);
  const selectedIndex = useKeyboardNav(2, () => onClose());

  useEffect(() => {
    if (buttonRefs.current[selectedIndex]) {
      buttonRefs.current[selectedIndex].focus();
    }
  }, [selectedIndex]);

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
  const buttonRefs = useRef([]);
  const selectedIndex = useKeyboardNav(3, () => onClose());

  useEffect(() => {
    if (buttonRefs.current[selectedIndex]) {
      buttonRefs.current[selectedIndex].focus();
    }
  }, [selectedIndex]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Save Configuration as Preset</h2>
        
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
            className={`w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors ${
              selectedIndex === 0 ? 'ring-2 ring-blue-800' : ''
            }`}
          >
            Save & Apply to Server
          </button>
          <button
            ref={(el) => (buttonRefs.current[1] = el)}
            onClick={() => onConfirm(false)}
            disabled={!presetName.trim()}
            className={`w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors ${
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
  const buttonRefs = useRef([]);
  const selectedIndex = useKeyboardNav(2, () => onClose());

  useEffect(() => {
    if (buttonRefs.current[selectedIndex]) {
      buttonRefs.current[selectedIndex].focus();
    }
  }, [selectedIndex]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">CSP Extra Options</h2>
        
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
