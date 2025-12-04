import { useMemo } from 'react';

export default function ConditionsTab({
  config,
  updateConfigValue,
  deleteConfigSection,
  loadTabDefaults,
}) {
  // Weather graphics options with their AC internal codes
  const weatherOptions = [
    { name: 'Clear', code: '3_clear' },
    { name: 'Few Clouds', code: '4_mid_clear' },
    { name: 'Scattered Clouds', code: '5_light_clouds' },
    { name: 'Broken Clouds', code: '6_mid_clouds' },
    { name: 'Overcast', code: '7_heavy_clouds' },
    { name: 'Fog', code: '1_fog' },
    { name: 'Mist', code: '2_mist' },
    { name: 'Light Drizzle', code: '8_light_drizzle' },
    { name: 'Drizzle', code: '9_drizzle' },
    { name: 'Heavy Drizzle', code: '10_heavy_drizzle' },
    { name: 'Light Rain', code: '11_light_rain' },
    { name: 'Rain', code: '12_rain' },
    { name: 'Heavy Rain', code: '13_heavy_rain' },
    { name: 'Light Thunderstorm', code: '14_light_thunderstorm' },
    { name: 'Thunderstorm', code: '15_thunderstorm' },
    { name: 'Heavy Thunderstorm', code: '16_heavy_thunderstorm' },
    { name: 'Light Snow', code: '17_light_snow' },
    { name: 'Snow', code: '18_snow' },
    { name: 'Heavy Snow', code: '19_heavy_snow' },
  ];

  // Helper to parse numeric values (config may store as strings)
  const parseNum = (val, fallback) => {
    if (val === undefined || val === null) return fallback;
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    return isNaN(num) ? fallback : num;
  };

  // Extract weather slots from config (WEATHER_0, WEATHER_1, etc.)
  const weatherSlots = useMemo(() => {
    const slots = [];
    if (!config) return slots;

    // Find all WEATHER_X sections
    for (let i = 0; i < 10; i++) {
      const key = `WEATHER_${i}`;
      if (config[key]) {
        slots.push({
          id: i,
          sectionKey: key,
          graphics: config[key].GRAPHICS || '3_clear',
          baseTemp: parseNum(config[key].BASE_TEMPERATURE_AMBIENT, 26),
          tempVar: parseNum(config[key].VARIATION_AMBIENT, 2),
          roadTemp: parseNum(config[key].BASE_TEMPERATURE_ROAD, 36),
          roadTempVar: parseNum(config[key].VARIATION_ROAD, 2),
        });
      }
    }

    // If no weather slots exist, create default WEATHER_0 in config
    if (slots.length === 0) {
      // Return a placeholder - the actual creation happens on first interaction
      return [
        {
          id: 0,
          sectionKey: 'WEATHER_0',
          graphics: '3_clear',
          baseTemp: 26,
          tempVar: 2,
          roadTemp: 36,
          roadTempVar: 2,
        },
      ];
    }

    return slots;
  }, [config]);

  // Get display name for a weather code
  const getWeatherDisplayName = (code) => {
    const option = weatherOptions.find((opt) => opt.code === code);
    return option ? option.name : code;
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  // Add a new weather slot
  const addWeatherSlot = () => {
    // Find the next available slot index
    const usedIndices = weatherSlots.map((s) => s.id);
    let nextIndex = 0;
    while (usedIndices.includes(nextIndex)) {
      nextIndex++;
    }

    const sectionKey = `WEATHER_${nextIndex}`;
    updateConfigValue(sectionKey, 'GRAPHICS', '3_clear');
    updateConfigValue(sectionKey, 'BASE_TEMPERATURE_AMBIENT', 26);
    updateConfigValue(sectionKey, 'VARIATION_AMBIENT', 2);
    updateConfigValue(sectionKey, 'BASE_TEMPERATURE_ROAD', 36);
    updateConfigValue(sectionKey, 'VARIATION_ROAD', 2);
  };

  // Delete a weather slot (remove entire section)
  const deleteWeatherSlot = (sectionKey) => {
    deleteConfigSection(sectionKey);
  };

  // Update a specific field in a weather slot
  const updateWeatherSlot = (sectionKey, field, value) => {
    const fieldMap = {
      graphics: 'GRAPHICS',
      baseTemp: 'BASE_TEMPERATURE_AMBIENT',
      tempVar: 'VARIATION_AMBIENT',
      roadTemp: 'BASE_TEMPERATURE_ROAD',
      roadTempVar: 'VARIATION_ROAD',
    };
    updateConfigValue(sectionKey, fieldMap[field], value);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Time Settings */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Time</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="label whitespace-nowrap min-w-[8rem]">
                Time:{' '}
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {formatTime(config?.SERVER?.SUN_ANGLE || 960)}
                </span>
              </label>
              <div className="flex-1 relative min-w-0" style={{ top: '-7px' }}>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  min="480"
                  max="1080"
                  value={config?.SERVER?.SUN_ANGLE || 960}
                  onChange={(e) =>
                    updateConfigValue('SERVER', 'SUN_ANGLE', parseInt(e.target.value))
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="label whitespace-nowrap min-w-[8rem]">
                Time multiplier:{' '}
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {config?.SERVER?.TIME_OF_DAY_MULT || 1}×
                </span>
              </label>
              <div className="flex-1 relative min-w-0" style={{ top: '-7px' }}>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  min="0"
                  max="60"
                  value={config?.SERVER?.TIME_OF_DAY_MULT || 1}
                  onChange={(e) =>
                    updateConfigValue('SERVER', 'TIME_OF_DAY_MULT', parseInt(e.target.value))
                  }
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Dynamic track
            </h2>
          </label>

          {config?.DYNAMIC_TRACK?.SESSION_START !== undefined && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="label whitespace-nowrap min-w-[8rem]">
                  Start value:{' '}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {config?.DYNAMIC_TRACK?.SESSION_START || 95}%
                  </span>
                </label>
                <div className="flex-1 relative min-w-0" style={{ top: '-7px' }}>
                  <input
                    type="range"
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    min="0"
                    max="100"
                    value={config?.DYNAMIC_TRACK?.SESSION_START || 95}
                    onChange={(e) =>
                      updateConfigValue('DYNAMIC_TRACK', 'SESSION_START', parseInt(e.target.value))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="label whitespace-nowrap min-w-[8rem]">
                  Transferred:{' '}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {config?.DYNAMIC_TRACK?.SESSION_TRANSFER || 90}%
                  </span>
                </label>
                <div className="flex-1 relative min-w-0" style={{ top: '-7px' }}>
                  <input
                    type="range"
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    min="0"
                    max="100"
                    value={config?.DYNAMIC_TRACK?.SESSION_TRANSFER || 90}
                    onChange={(e) =>
                      updateConfigValue(
                        'DYNAMIC_TRACK',
                        'SESSION_TRANSFER',
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="label whitespace-nowrap min-w-[8rem]">
                  Randomness:{' '}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {config?.DYNAMIC_TRACK?.RANDOMNESS || 2}%
                  </span>
                </label>
                <div className="flex-1 relative min-w-0" style={{ top: '-7px' }}>
                  <input
                    type="range"
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    min="0"
                    max="100"
                    value={config?.DYNAMIC_TRACK?.RANDOMNESS || 2}
                    onChange={(e) =>
                      updateConfigValue('DYNAMIC_TRACK', 'RANDOMNESS', parseInt(e.target.value))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="label whitespace-nowrap min-w-[8rem]">
                  Laps to improve:{' '}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {config?.DYNAMIC_TRACK?.LAP_GAIN || 10} laps
                  </span>
                </label>
                <div className="flex-1 relative min-w-0" style={{ top: '-7px' }}>
                  <input
                    type="range"
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    min="1"
                    max="81"
                    value={config?.DYNAMIC_TRACK?.LAP_GAIN || 10}
                    onChange={(e) =>
                      updateConfigValue('DYNAMIC_TRACK', 'LAP_GAIN', parseInt(e.target.value))
                    }
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
            Weather settings are unrelated to the number of enabled sessions: each session will use
            a randomly selected weather from these.
          </p>

          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {weatherSlots.map((slot) => (
                <div
                  key={slot.sectionKey}
                  className="border border-gray-300 dark:border-gray-600 rounded p-4 space-y-4"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">#{slot.id}</span>

                    <div className="flex items-center gap-4 flex-1">
                      <label className="label whitespace-nowrap">Weather</label>
                      <select
                        className="input bg-gray-800 border-gray-700 text-gray-100 flex-1"
                        style={{ position: 'relative', top: '-4px' }}
                        value={slot.graphics}
                        onChange={(e) =>
                          updateWeatherSlot(slot.sectionKey, 'graphics', e.target.value)
                        }
                      >
                        {weatherOptions.map((opt) => (
                          <option key={opt.code} value={opt.code}>
                            {opt.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Temperature */}
                    <div className="flex items-center gap-4">
                      <label className="label whitespace-nowrap min-w-[10rem]">
                        Temperature:{' '}
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {slot.baseTemp}±{slot.tempVar} °C
                        </span>
                      </label>
                      <div className="flex-1 flex gap-2">
                        <input
                          type="range"
                          className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          min="-10"
                          max="50"
                          value={slot.baseTemp}
                          onChange={(e) =>
                            updateWeatherSlot(slot.sectionKey, 'baseTemp', parseInt(e.target.value))
                          }
                        />
                        <input
                          type="range"
                          className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          min="0"
                          max="20"
                          value={slot.tempVar}
                          onChange={(e) =>
                            updateWeatherSlot(slot.sectionKey, 'tempVar', parseInt(e.target.value))
                          }
                        />
                      </div>
                    </div>

                    {/* Road Temperature */}
                    <div className="flex items-center gap-4">
                      <label className="label whitespace-nowrap min-w-[10rem]">
                        Road temperature:{' '}
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {slot.roadTemp}±{slot.roadTempVar} °C
                        </span>
                      </label>
                      <div className="flex-1 flex gap-2">
                        <input
                          type="range"
                          className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          min="-10"
                          max="60"
                          value={slot.roadTemp}
                          onChange={(e) =>
                            updateWeatherSlot(slot.sectionKey, 'roadTemp', parseInt(e.target.value))
                          }
                        />
                        <input
                          type="range"
                          className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          min="0"
                          max="20"
                          value={slot.roadTempVar}
                          onChange={(e) =>
                            updateWeatherSlot(
                              slot.sectionKey,
                              'roadTempVar',
                              parseInt(e.target.value)
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {weatherSlots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => deleteWeatherSlot(slot.sectionKey)}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  )}
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
