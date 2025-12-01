export default function RulesTab({ config, updateConfigValue, loadTabDefaults }) {
  const getAssistLabel = (value) => {
    if (value === 0) return 'Forbidden';
    if (value === 1) return 'Factory';
    return 'Forced';
  };

  const getJumpStartLabel = (value) => {
    if (value === 0) return 'Car locked until green light';
    if (value === 1) return 'Teleport to pits';
    if (value === 2) return 'Drive-through penalty';
    return 'Disabled';
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Assists */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Assists</h2>
          <div className="space-y-4">
            {/* ABS Dropdown */}
            <div className="flex items-center gap-4">
              <label className="label whitespace-nowrap min-w-[5rem]">ABS:</label>
              <select
                className="input bg-gray-800 border-gray-700 text-gray-100 flex-1"
                style={{ position: 'relative', top: '-4px' }}
                value={config?.SERVER?.ABS_ALLOWED || 1}
                onChange={(e) =>
                  updateConfigValue('SERVER', 'ABS_ALLOWED', parseInt(e.target.value))
                }
              >
                <option value={0}>Denied</option>
                <option value={1}>Factory</option>
                <option value={2}>Forced</option>
              </select>
            </div>

            {/* TC Dropdown */}
            <div className="flex items-center gap-4">
              <label className="label whitespace-nowrap min-w-[5rem]">TC:</label>
              <select
                className="input bg-gray-800 border-gray-700 text-gray-100 flex-1"
                style={{ position: 'relative', top: '-4px' }}
                value={config?.SERVER?.TC_ALLOWED || 1}
                onChange={(e) =>
                  updateConfigValue('SERVER', 'TC_ALLOWED', parseInt(e.target.value))
                }
              >
                <option value={0}>Denied</option>
                <option value={1}>Factory</option>
                <option value={2}>Forced</option>
              </select>
            </div>

            {/* Checkboxes */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600"
                checked={config?.SERVER?.STABILITY_ALLOWED === 1}
                onChange={(e) =>
                  updateConfigValue('SERVER', 'STABILITY_ALLOWED', e.target.checked ? 1 : 0)
                }
              />
              <span className="text-gray-900 dark:text-gray-100">Stability control</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600"
                checked={config?.SERVER?.AUTOCLUTCH_ALLOWED === 1}
                onChange={(e) =>
                  updateConfigValue('SERVER', 'AUTOCLUTCH_ALLOWED', e.target.checked ? 1 : 0)
                }
              />
              <span className="text-gray-900 dark:text-gray-100">Automatic clutch</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600"
                checked={config?.SERVER?.TYRE_BLANKETS_ALLOWED === 1}
                onChange={(e) =>
                  updateConfigValue('SERVER', 'TYRE_BLANKETS_ALLOWED', e.target.checked ? 1 : 0)
                }
              />
              <span className="text-gray-900 dark:text-gray-100">Tyre blankets</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600"
                checked={config?.SERVER?.FORCE_VIRTUAL_MIRROR === 1}
                onChange={(e) =>
                  updateConfigValue('SERVER', 'FORCE_VIRTUAL_MIRROR', e.target.checked ? 1 : 0)
                }
              />
              <span className="text-gray-900 dark:text-gray-100">Virtual mirror</span>
            </label>
          </div>
        </div>

        {/* Right Column - Realism */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Realism</h2>
          <div className="space-y-4">
            {/* Fuel rate slider */}
            <div className="flex items-center gap-4">
              <label className="label whitespace-nowrap min-w-[8rem]">
                Fuel rate:{' '}
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {config?.SERVER?.FUEL_RATE || 100}%
                </span>
              </label>
              <div className="flex-1 relative min-w-0" style={{ top: '-7px' }}>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  min="0"
                  max="200"
                  value={config?.SERVER?.FUEL_RATE || 100}
                  onChange={(e) =>
                    updateConfigValue('SERVER', 'FUEL_RATE', parseInt(e.target.value))
                  }
                />
              </div>
            </div>

            {/* Damage rate slider */}
            <div className="flex items-center gap-4">
              <label className="label whitespace-nowrap min-w-[8rem]">
                Damage rate:{' '}
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {config?.SERVER?.DAMAGE_MULTIPLIER || 100}%
                </span>
              </label>
              <div className="flex-1 relative min-w-0" style={{ top: '-7px' }}>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  min="0"
                  max="200"
                  value={config?.SERVER?.DAMAGE_MULTIPLIER || 100}
                  onChange={(e) =>
                    updateConfigValue('SERVER', 'DAMAGE_MULTIPLIER', parseInt(e.target.value))
                  }
                />
              </div>
            </div>

            {/* Tyres wear rate slider */}
            <div className="flex items-center gap-4">
              <label className="label whitespace-nowrap min-w-[8rem]">
                Tyres wear rate:{' '}
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {config?.SERVER?.TYRE_WEAR_RATE || 100}%
                </span>
              </label>
              <div className="flex-1 relative min-w-0" style={{ top: '-7px' }}>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  min="0"
                  max="200"
                  value={config?.SERVER?.TYRE_WEAR_RATE || 100}
                  onChange={(e) =>
                    updateConfigValue('SERVER', 'TYRE_WEAR_RATE', parseInt(e.target.value))
                  }
                />
              </div>
            </div>

            {/* Allowed tyres out slider */}
            <div className="flex items-center gap-4">
              <label className="label whitespace-nowrap min-w-[8rem]">
                Allowed tyres out:{' '}
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {config?.SERVER?.ALLOWED_TYRES_OUT === -1
                    ? 'OFF'
                    : config?.SERVER?.ALLOWED_TYRES_OUT || 2}
                </span>
              </label>
              <div className="flex-1 relative min-w-0" style={{ top: '-7px' }}>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  min="-1"
                  max="3"
                  value={config?.SERVER?.ALLOWED_TYRES_OUT ?? 2}
                  onChange={(e) =>
                    updateConfigValue('SERVER', 'ALLOWED_TYRES_OUT', parseInt(e.target.value))
                  }
                />
              </div>
            </div>

            {/* Max ballast slider */}
            <div className="flex items-center gap-4">
              <label className="label whitespace-nowrap min-w-[8rem]">
                Max ballast:{' '}
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {config?.SERVER?.MAX_BALLAST_KG || 0} kg
                </span>
              </label>
              <div className="flex-1 relative min-w-0" style={{ top: '-7px' }}>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  min="0"
                  max="200"
                  value={config?.SERVER?.MAX_BALLAST_KG || 0}
                  onChange={(e) =>
                    updateConfigValue('SERVER', 'MAX_BALLAST_KG', parseInt(e.target.value))
                  }
                />
              </div>
            </div>

            {/* Jump start dropdown */}
            <div className="flex items-center gap-4">
              <label className="label whitespace-nowrap min-w-[8rem]">Jump start:</label>
              <select
                className="input bg-gray-800 border-gray-700 text-gray-100 flex-1"
                style={{ position: 'relative', top: '-4px' }}
                value={config?.SERVER?.RACE_PIT_WINDOW_START || 3}
                onChange={(e) =>
                  updateConfigValue('SERVER', 'RACE_PIT_WINDOW_START', parseInt(e.target.value))
                }
              >
                <option value={3}>Disabled</option>
                <option value={1}>Pits</option>
                <option value={2}>Drive-thru</option>
              </select>
            </div>

            {/* Disable gas cut penalty checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600"
                checked={config?.SERVER?.RACE_GAS_PENALTY_DISABLED === 1}
                onChange={(e) =>
                  updateConfigValue('SERVER', 'RACE_GAS_PENALTY_DISABLED', e.target.checked ? 1 : 0)
                }
              />
              <span className="text-gray-900 dark:text-gray-100">Disable gas cut penalty</span>
            </label>
          </div>
        </div>
      </div>

      {/* Voting and Banning Section - Full Width Below */}
      <div className="card mt-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Voting and banning
        </h2>
        <div className="space-y-4">
          {/* Kick vote quorum slider */}
          <div className="flex items-center gap-4">
            <label className="label whitespace-nowrap min-w-[10rem]">
              Kick vote quorum:{' '}
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {config?.SERVER?.KICK_QUORUM || 85}%
              </span>
            </label>
            <div className="flex-1 relative min-w-0" style={{ top: '-7px' }}>
              <input
                type="range"
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                min="40"
                max="90"
                value={config?.SERVER?.KICK_QUORUM || 85}
                onChange={(e) =>
                  updateConfigValue('SERVER', 'KICK_QUORUM', parseInt(e.target.value))
                }
              />
            </div>
          </div>

          {/* Session vote quorum slider */}
          <div className="flex items-center gap-4">
            <label className="label whitespace-nowrap min-w-[10rem]">
              Session vote quorum:{' '}
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {config?.SERVER?.VOTING_QUORUM || 80}%
              </span>
            </label>
            <div className="flex-1 relative min-w-0" style={{ top: '-7px' }}>
              <input
                type="range"
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                min="40"
                max="90"
                value={config?.SERVER?.VOTING_QUORUM || 80}
                onChange={(e) =>
                  updateConfigValue('SERVER', 'VOTING_QUORUM', parseInt(e.target.value))
                }
              />
            </div>
          </div>

          {/* Vote duration slider */}
          <div className="flex items-center gap-4">
            <label className="label whitespace-nowrap min-w-[10rem]">
              Vote duration:{' '}
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                00:00:{String(config?.SERVER?.VOTE_DURATION || 20).padStart(2, '0')}
              </span>
            </label>
            <div className="flex-1 relative min-w-0" style={{ top: '-7px' }}>
              <input
                type="range"
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                min="10"
                max="60"
                value={config?.SERVER?.VOTE_DURATION || 20}
                onChange={(e) =>
                  updateConfigValue('SERVER', 'VOTE_DURATION', parseInt(e.target.value))
                }
              />
            </div>
          </div>

          {/* Kick players until restart checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600"
              checked={config?.SERVER?.KICK_UNTIL_RESTART === 1}
              onChange={(e) =>
                updateConfigValue('SERVER', 'KICK_UNTIL_RESTART', e.target.checked ? 1 : 0)
              }
            />
            <span className="text-gray-900 dark:text-gray-100">Kick players until restart</span>
          </label>

          {/* Max contacts per km slider */}
          <div className="flex items-center gap-4">
            <label className="label whitespace-nowrap min-w-[10rem]">
              Max contact/s per km:{' '}
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {config?.SERVER?.MAX_CONTACTS_PER_KM === -1
                  ? 'Off'
                  : config?.SERVER?.MAX_CONTACTS_PER_KM || 'Off'}
              </span>
            </label>
            <div className="flex-1 relative min-w-0" style={{ top: '-7px' }}>
              <input
                type="range"
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                min="-1"
                max="9"
                value={config?.SERVER?.MAX_CONTACTS_PER_KM ?? -1}
                onChange={(e) =>
                  updateConfigValue('SERVER', 'MAX_CONTACTS_PER_KM', parseInt(e.target.value))
                }
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
