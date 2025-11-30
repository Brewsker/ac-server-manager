import { useState } from 'react';

export default function ConditionsTab({ config, updateConfigValue, loadTabDefaults }) {
  const [weatherSlots, setWeatherSlots] = useState([
    { id: 1, graphics: 'Clear', baseTemp: 18, tempVar: 5, roadTemp: 24, roadTempVar: 5, windSpeed: 0, windDir: 0 },
    { id: 2, graphics: 'Heavy Clouds', baseTemp: 15, tempVar: 5, roadTemp: 14, roadTempVar: 5, windSpeed: 0, windDir: 0 }
  ]);

  const weatherOptions = [
    'Clear', 'Few Clouds', 'Scattered Clouds', 'Broken Clouds', 'Overcast',
    'Fog', 'Mist', 'Light Drizzle', 'Drizzle', 'Heavy Drizzle',
    'Light Rain', 'Rain', 'Heavy Rain', 'Light Thunderstorm', 'Thunderstorm',
    'Heavy Thunderstorm', 'Light Snow', 'Snow', 'Heavy Snow', 'Heavy Clouds'
  ];

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const addWeatherSlot = () => {
    const newId = weatherSlots.length > 0 ? Math.max(...weatherSlots.map(w => w.id)) + 1 : 1;
    setWeatherSlots([...weatherSlots, {
      id: newId,
      graphics: 'Clear',
      baseTemp: 18,
      tempVar: 5,
      roadTemp: 24,
      roadTempVar: 5,
      windSpeed: 0,
      windDir: 0
    }]);
  };

  const deleteWeatherSlot = (id) => {
    setWeatherSlots(weatherSlots.filter(w => w.id !== id));
  };

  const updateWeatherSlot = (id, field, value) => {
    setWeatherSlots(weatherSlots.map(w => 
      w.id === id ? { ...w, [field]: value } : w
    ));
  };

  return (
    <>
      <div className="flex justify-end mb-6">
        <button
          type="button"
          onClick={() => loadTabDefaults('CONDITIONS')}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          🔄 Load Tab Defaults
        </button>
      </div>

      <div className="space-y-6">
        {/* Time Settings */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Time</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="label whitespace-nowrap min-w-[8rem]">
                Time: <span className="font-semibold text-blue-600 dark:text-blue-400">{formatTime(config?.SERVER?.SUN_ANGLE || 960)}</span>
              </label>
              <div className="flex-1 relative" style={{ top: '-7px' }}>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  min="480"
                  max="1080"
                  value={config?.SERVER?.SUN_ANGLE || 960}
                  onChange={(e) => updateConfigValue('SERVER', 'SUN_ANGLE', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="label whitespace-nowrap min-w-[8rem]">
                Time multiplier: <span className="font-semibold text-blue-600 dark:text-blue-400">{config?.SERVER?.TIME_OF_DAY_MULT || 1}×</span>
              </label>
              <div className="flex-1 relative" style={{ top: '-7px' }}>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  min="0"
                  max="60"
                  value={config?.SERVER?.TIME_OF_DAY_MULT || 1}
                  onChange={(e) => updateConfigValue('SERVER', 'TIME_OF_DAY_MULT', parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Track */}
        <div className="card">
          <label className="flex items-center gap-2 cursor-pointer mb-4">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600"
              checked={config?.DYNAMIC_TRACK?.SESSION_START !== undefined}
              onChange={(e) => {
                if (e.target.checked) {
                  updateConfigValue('DYNAMIC_TRACK', 'SESSION_START', 95);
                  updateConfigValue('DYNAMIC_TRACK', 'RANDOMNESS', 2);
                  updateConfigValue('DYNAMIC_TRACK', 'SESSION_TRANSFER', 90);
                  updateConfigValue('DYNAMIC_TRACK', 'LAP_GAIN', 10);
                } else {
                  updateConfigValue('DYNAMIC_TRACK', 'SESSION_START', undefined);
                  updateConfigValue('DYNAMIC_TRACK', 'RANDOMNESS', undefined);
                  updateConfigValue('DYNAMIC_TRACK', 'SESSION_TRANSFER', undefined);
                  updateConfigValue('DYNAMIC_TRACK', 'LAP_GAIN', undefined);
                }
              }}
            />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Dynamic track</h2>
          </label>
          
          {config?.DYNAMIC_TRACK?.SESSION_START !== undefined && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="label whitespace-nowrap min-w-[8rem]">
                  Start value: <span className="font-semibold text-blue-600 dark:text-blue-400">{config?.DYNAMIC_TRACK?.SESSION_START || 95}%</span>
                </label>
                <div className="flex-1 relative" style={{ top: '-7px' }}>
                  <input
                    type="range"
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    min="0"
                    max="100"
                    value={config?.DYNAMIC_TRACK?.SESSION_START || 95}
                    onChange={(e) => updateConfigValue('DYNAMIC_TRACK', 'SESSION_START', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="label whitespace-nowrap min-w-[8rem]">
                  Transferred: <span className="font-semibold text-blue-600 dark:text-blue-400">{config?.DYNAMIC_TRACK?.SESSION_TRANSFER || 90}%</span>
                </label>
                <div className="flex-1 relative" style={{ top: '-7px' }}>
                  <input
                    type="range"
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    min="0"
                    max="100"
                    value={config?.DYNAMIC_TRACK?.SESSION_TRANSFER || 90}
                    onChange={(e) => updateConfigValue('DYNAMIC_TRACK', 'SESSION_TRANSFER', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="label whitespace-nowrap min-w-[8rem]">
                  Randomness: <span className="font-semibold text-blue-600 dark:text-blue-400">{config?.DYNAMIC_TRACK?.RANDOMNESS || 2}%</span>
                </label>
                <div className="flex-1 relative" style={{ top: '-7px' }}>
                  <input
                    type="range"
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    min="0"
                    max="100"
                    value={config?.DYNAMIC_TRACK?.RANDOMNESS || 2}
                    onChange={(e) => updateConfigValue('DYNAMIC_TRACK', 'RANDOMNESS', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="label whitespace-nowrap min-w-[8rem]">
                  Laps to improve: <span className="font-semibold text-blue-600 dark:text-blue-400">{config?.DYNAMIC_TRACK?.LAP_GAIN || 10} laps</span>
                </label>
                <div className="flex-1 relative" style={{ top: '-7px' }}>
                  <input
                    type="range"
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    min="1"
                    max="81"
                    value={config?.DYNAMIC_TRACK?.LAP_GAIN || 10}
                    onChange={(e) => updateConfigValue('DYNAMIC_TRACK', 'LAP_GAIN', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Weather */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Weather</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Weather settings are unrelated to the number of enabled sessions: each session will use a randomly selected weather from these.
          </p>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {weatherSlots.map((slot) => (
                <div key={slot.id} className="border border-gray-300 dark:border-gray-600 rounded p-4 space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">#{slot.id}</span>
                  
                  <div className="flex items-center gap-4 flex-1">
                    <label className="label whitespace-nowrap">Basic weather</label>
                    <select
                      className="input bg-gray-800 border-gray-700 text-gray-100 flex-1"
                      style={{ position: 'relative', top: '-4px' }}
                      value={slot.graphics}
                      onChange={(e) => updateWeatherSlot(slot.id, 'graphics', e.target.value)}
                    >
                      {weatherOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Temperature */}
                  <div className="flex items-center gap-4">
                    <label className="label whitespace-nowrap min-w-[10rem]">
                      Temperature: <span className="font-semibold text-blue-600 dark:text-blue-400">{slot.baseTemp}±{slot.tempVar} °C</span>
                    </label>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="range"
                        className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        min="-10"
                        max="50"
                        value={slot.baseTemp}
                        onChange={(e) => updateWeatherSlot(slot.id, 'baseTemp', parseInt(e.target.value))}
                      />
                      <input
                        type="range"
                        className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        min="0"
                        max="20"
                        value={slot.tempVar}
                        onChange={(e) => updateWeatherSlot(slot.id, 'tempVar', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* Road Temperature */}
                  <div className="flex items-center gap-4">
                    <label className="label whitespace-nowrap min-w-[10rem]">
                      Road temperature: <span className="font-semibold text-blue-600 dark:text-blue-400">{slot.roadTemp}±{slot.roadTempVar} °C</span>
                    </label>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="range"
                        className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        min="-10"
                        max="60"
                        value={slot.roadTemp}
                        onChange={(e) => updateWeatherSlot(slot.id, 'roadTemp', parseInt(e.target.value))}
                      />
                      <input
                        type="range"
                        className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        min="0"
                        max="20"
                        value={slot.roadTempVar}
                        onChange={(e) => updateWeatherSlot(slot.id, 'roadTempVar', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* Wind Speed */}
                  <div className="flex items-center gap-4">
                    <label className="label whitespace-nowrap min-w-[10rem]">
                      Wind: <span className="font-semibold text-blue-600 dark:text-blue-400">{slot.windSpeed} km/h</span>
                    </label>
                    <div className="flex-1 relative" style={{ top: '-7px' }}>
                      <input
                        type="range"
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        min="0"
                        max="100"
                        value={slot.windSpeed}
                        onChange={(e) => updateWeatherSlot(slot.id, 'windSpeed', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* Wind Direction Variation */}
                  <div className="flex items-center gap-4">
                    <label className="label whitespace-nowrap min-w-[10rem]">
                      Wind direction variation: <span className="font-semibold text-blue-600 dark:text-blue-400">{slot.windDir}°</span>
                    </label>
                    <div className="flex-1 relative" style={{ top: '-7px' }}>
                      <input
                        type="range"
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        min="0"
                        max="360"
                        value={slot.windDir}
                        onChange={(e) => updateWeatherSlot(slot.id, 'windDir', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => deleteWeatherSlot(slot.id)}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
            </div>

            <button
              type="button"
              onClick={addWeatherSlot}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-xl">+</span>
              <span>Create new</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
