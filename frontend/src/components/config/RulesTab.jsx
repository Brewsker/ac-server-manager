import React from 'react';

export default function RulesTab({ config, updateConfigValue, loadTabDefaults }) {
  return (
    <>
      <div className="flex justify-end mb-6">
        <button
          type="button"
          onClick={() => loadTabDefaults('RULES')}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          🔄 Load Defaults
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assists & Rules */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Assists & Rules</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="label whitespace-nowrap min-w-[5rem]">
                Abs: <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {config?.SERVER?.ABS_ALLOWED === 0 ? 'Forbidden' : config?.SERVER?.ABS_ALLOWED === 1 ? 'Factory' : 'Forced'}
                </span>
              </label>
              <div className="flex-1 relative" style={{ top: '-7px' }}>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  min="0"
                  max="2"
                  value={config?.SERVER?.ABS_ALLOWED || 1}
                  onChange={(e) => updateConfigValue('SERVER', 'ABS_ALLOWED', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="label whitespace-nowrap min-w-[5rem]">
                TC: <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {config?.SERVER?.TC_ALLOWED === 0 ? 'Forbidden' : config?.SERVER?.TC_ALLOWED === 1 ? 'Factory' : 'Forced'}
                </span>
              </label>
              <div className="flex-1 relative" style={{ top: '-7px' }}>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  min="0"
                  max="2"
                  value={config?.SERVER?.TC_ALLOWED || 1}
                  onChange={(e) => updateConfigValue('SERVER', 'TC_ALLOWED', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="label whitespace-nowrap min-w-[5rem]">
                Stability: <span className="font-semibold text-blue-600 dark:text-blue-400">{config?.SERVER?.STABILITY_ALLOWED || 0}%</span>
              </label>
              <div className="flex-1 relative" style={{ top: '-7px' }}>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  min="0"
                  max="100"
                  value={config?.SERVER?.STABILITY_ALLOWED || 0}
                  onChange={(e) => updateConfigValue('SERVER', 'STABILITY_ALLOWED', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="label whitespace-nowrap min-w-[5rem]">
                Auto clutch: <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {config?.SERVER?.AUTOCLUTCH_ALLOWED === 0 ? 'Forbidden' : config?.SERVER?.AUTOCLUTCH_ALLOWED === 1 ? 'Allowed' : 'Forced'}
                </span>
              </label>
              <div className="flex-1 relative" style={{ top: '-7px' }}>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  min="0"
                  max="2"
                  value={config?.SERVER?.AUTOCLUTCH_ALLOWED || 1}
                  onChange={(e) => updateConfigValue('SERVER', 'AUTOCLUTCH_ALLOWED', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="label whitespace-nowrap min-w-[5rem]">
                Tire wear: <span className="font-semibold text-blue-600 dark:text-blue-400">{config?.SERVER?.TYRE_WEAR_RATE || 100}%</span>
              </label>
              <div className="flex-1 relative" style={{ top: '-7px' }}>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  min="0"
                  max="500"
                  value={config?.SERVER?.TYRE_WEAR_RATE || 100}
                  onChange={(e) => updateConfigValue('SERVER', 'TYRE_WEAR_RATE', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="label whitespace-nowrap min-w-[5rem]">
                Fuel usage: <span className="font-semibold text-blue-600 dark:text-blue-400">{config?.SERVER?.FUEL_RATE || 100}%</span>
              </label>
              <div className="flex-1 relative" style={{ top: '-7px' }}>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  min="0"
                  max="500"
                  value={config?.SERVER?.FUEL_RATE || 100}
                  onChange={(e) => updateConfigValue('SERVER', 'FUEL_RATE', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="label whitespace-nowrap min-w-[5rem]">
                Damage: <span className="font-semibold text-blue-600 dark:text-blue-400">{config?.SERVER?.DAMAGE_MULTIPLIER || 100}%</span>
              </label>
              <div className="flex-1 relative" style={{ top: '-7px' }}>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  min="0"
                  max="200"
                  value={config?.SERVER?.DAMAGE_MULTIPLIER || 100}
                  onChange={(e) => updateConfigValue('SERVER', 'DAMAGE_MULTIPLIER', parseInt(e.target.value))}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600"
                checked={config?.SERVER?.ALLOW_TYRES_OUT === 1}
                onChange={(e) => updateConfigValue('SERVER', 'ALLOW_TYRES_OUT', e.target.checked ? 1 : 0)}
              />
              <span className="text-gray-900 dark:text-gray-100">Allow tires out</span>
            </label>
          </div>
        </div>

        {/* Additional Rules */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Additional Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="label whitespace-nowrap min-w-[5rem]">
                Tire blankets: <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {config?.SERVER?.TYRE_BLANKETS_ALLOWED === 0 ? 'Forbidden' : config?.SERVER?.TYRE_BLANKETS_ALLOWED === 1 ? 'Allowed' : 'Forced'}
                </span>
              </label>
              <div className="flex-1 relative" style={{ top: '-7px' }}>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  min="0"
                  max="2"
                  value={config?.SERVER?.TYRE_BLANKETS_ALLOWED || 1}
                  onChange={(e) => updateConfigValue('SERVER', 'TYRE_BLANKETS_ALLOWED', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="label whitespace-nowrap min-w-[5rem]">
                Force virtual mirror: <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {config?.SERVER?.FORCE_VIRTUAL_MIRROR === 0 ? 'No' : 'Yes'}
                </span>
              </label>
              <div className="flex-1 relative" style={{ top: '-7px' }}>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  min="0"
                  max="1"
                  value={config?.SERVER?.FORCE_VIRTUAL_MIRROR || 0}
                  onChange={(e) => updateConfigValue('SERVER', 'FORCE_VIRTUAL_MIRROR', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="label whitespace-nowrap min-w-[5rem]">
                Max ballast: <span className="font-semibold text-blue-600 dark:text-blue-400">{config?.SERVER?.MAX_BALLAST_KG || 0} kg</span>
              </label>
              <div className="flex-1 relative" style={{ top: '-7px' }}>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  min="0"
                  max="200"
                  value={config?.SERVER?.MAX_BALLAST_KG || 0}
                  onChange={(e) => updateConfigValue('SERVER', 'MAX_BALLAST_KG', parseInt(e.target.value))}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600"
                checked={config?.SERVER?.RACE_GAS_PENALTY_DISABLED === 1}
                onChange={(e) => updateConfigValue('SERVER', 'RACE_GAS_PENALTY_DISABLED', e.target.checked ? 1 : 0)}
              />
              <span className="text-gray-900 dark:text-gray-100">Disable race gas penalty</span>
            </label>
          </div>
        </div>
      </div>
    </>
  );
}
