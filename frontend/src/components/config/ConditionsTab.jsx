import React from 'react';

export default function ConditionsTab({ config, updateConfigValue, loadTabDefaults }) {
  return (
    <>
      <div className="flex justify-end mb-6">
        <button
          type="button"
          onClick={() => loadTabDefaults('CONDITIONS')}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          🔄 Load Defaults
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Settings */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Time</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="label whitespace-nowrap min-w-[5rem]">
                Time of day: <span className="font-semibold text-blue-600 dark:text-blue-400">{config?.SERVER?.TIME_OF_DAY_MULT || 16} min</span>
              </label>
              <div className="flex-1 relative" style={{ top: '-7px' }}>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  min="8"
                  max="18"
                  value={config?.SERVER?.TIME_OF_DAY_MULT || 16}
                  onChange={(e) => updateConfigValue('SERVER', 'TIME_OF_DAY_MULT', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="label whitespace-nowrap min-w-[5rem]">
                Time multiplier: <span className="font-semibold text-blue-600 dark:text-blue-400">{(config?.SERVER?.TIME_MULT || 1).toFixed(1)}×</span>
              </label>
              <div className="flex-1 relative" style={{ top: '-7px' }}>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  min="0"
                  max="60"
                  step="0.1"
                  value={config?.SERVER?.TIME_MULT || 1}
                  onChange={(e) => updateConfigValue('SERVER', 'TIME_MULT', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Track */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Dynamic Track</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
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
              <span className="text-gray-900 dark:text-gray-100">Enable dynamic track</span>
            </label>

            {config?.DYNAMIC_TRACK?.SESSION_START !== undefined && (
              <>
                <div className="flex items-center gap-4">
                  <label className="label whitespace-nowrap min-w-[5rem]">
                    Start grip: <span className="font-semibold text-blue-600 dark:text-blue-400">{config?.DYNAMIC_TRACK?.SESSION_START || 95}%</span>
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
                  <label className="label whitespace-nowrap min-w-[5rem]">
                    Randomness: <span className="font-semibold text-blue-600 dark:text-blue-400">{config?.DYNAMIC_TRACK?.RANDOMNESS || 2}%</span>
                  </label>
                  <div className="flex-1 relative" style={{ top: '-7px' }}>
                    <input
                      type="range"
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      min="0"
                      max="10"
                      value={config?.DYNAMIC_TRACK?.RANDOMNESS || 2}
                      onChange={(e) => updateConfigValue('DYNAMIC_TRACK', 'RANDOMNESS', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="label whitespace-nowrap min-w-[5rem]">
                    Transferred grip: <span className="font-semibold text-blue-600 dark:text-blue-400">{config?.DYNAMIC_TRACK?.SESSION_TRANSFER || 90}%</span>
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
                  <label className="label whitespace-nowrap min-w-[5rem]">
                    Laps to gain: <span className="font-semibold text-blue-600 dark:text-blue-400">{config?.DYNAMIC_TRACK?.LAP_GAIN || 10}</span>
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
              </>
            )}
          </div>
        </div>

        {/* Weather - Placeholder */}
        <div className="card lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Weather</h2>
          <p className="text-gray-600 dark:text-gray-400">Weather configuration coming soon...</p>
        </div>
      </div>
    </>
  );
}
