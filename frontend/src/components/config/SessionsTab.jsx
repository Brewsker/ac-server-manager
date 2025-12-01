export default function SessionsTab({ config, updateConfigValue, loadTabDefaults }) {
  return (
    <>
      {/* Header with button and checkboxes */}
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600"
              checked={config?.SERVER?.PICKUP_MODE_ENABLED === 1}
              onChange={(e) =>
                updateConfigValue('SERVER', 'PICKUP_MODE_ENABLED', e.target.checked ? 1 : 0)
              }
            />
            <span className="text-gray-900 dark:text-gray-100">Pickup mode</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600"
              checked={config?.SERVER?.LOCKED_ENTRY_LIST === 1}
              onChange={(e) =>
                updateConfigValue('SERVER', 'LOCKED_ENTRY_LIST', e.target.checked ? 1 : 0)
              }
            />
            <span className="text-gray-900 dark:text-gray-100">
              Locked entry list in pickup mode
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600"
              checked={config?.SERVER?.LOOP_MODE === 1}
              onChange={(e) => updateConfigValue('SERVER', 'LOOP_MODE', e.target.checked ? 1 : 0)}
            />
            <span className="text-gray-900 dark:text-gray-100">Loop mode</span>
          </label>
        </div>

        <button
          type="button"
          onClick={() => loadTabDefaults('SESSIONS')}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          🔄 Load Tab Defaults
        </button>
      </div>

      {/* Session Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Booking, Practice, Qualification */}
        <div className="space-y-6">
          {/* Booking Session */}
          <BookingSession config={config} updateConfigValue={updateConfigValue} />

          {/* Practice Session */}
          <PracticeSession config={config} updateConfigValue={updateConfigValue} />

          {/* Qualification Session */}
          <QualificationSession config={config} updateConfigValue={updateConfigValue} />
        </div>

        {/* Right Column: Race */}
        <RaceSession config={config} updateConfigValue={updateConfigValue} />
      </div>
    </>
  );
}

function BookingSession({ config, updateConfigValue }) {
  const isEnabled = config?.BOOKING?.IS_OPEN === 1;

  return (
    <div className="card">
      <label className="flex items-center gap-2 cursor-pointer mb-4">
        <input
          type="checkbox"
          className="w-4 h-4 text-blue-600"
          checked={isEnabled}
          onChange={(e) => {
            if (e.target.checked) {
              updateConfigValue('BOOKING', 'IS_OPEN', 1);
              updateConfigValue('BOOKING', 'TIME', 10);
            } else {
              updateConfigValue('BOOKING', 'IS_OPEN', 0);
            }
          }}
        />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Booking</h2>
      </label>

      <div className="flex items-center gap-4">
        <label className={`label whitespace-nowrap min-w-[5rem] ${!isEnabled ? 'opacity-50' : ''}`}>
          Time:{' '}
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            {String(Math.floor((config?.BOOKING?.TIME || 10) / 60)).padStart(2, '0')}:
            {String((config?.BOOKING?.TIME || 10) % 60).padStart(2, '0')}
          </span>
        </label>
        <div className="flex-1 relative min-w-0" style={{ top: '-7px' }}>
          <input
            type="range"
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            min="1"
            max="90"
            value={config?.BOOKING?.TIME || 10}
            onChange={(e) => updateConfigValue('BOOKING', 'TIME', parseInt(e.target.value))}
            disabled={!isEnabled}
          />
        </div>
      </div>
    </div>
  );
}

function PracticeSession({ config, updateConfigValue }) {
  const isEnabled = config?.PRACTICE?.IS_OPEN === 1;

  return (
    <div className="card">
      <label className="flex items-center gap-2 cursor-pointer mb-4">
        <input
          type="checkbox"
          className="w-4 h-4 text-blue-600"
          checked={isEnabled}
          onChange={(e) => updateConfigValue('PRACTICE', 'IS_OPEN', e.target.checked ? 1 : 0)}
        />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Practice</h2>
      </label>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label
            className={`label whitespace-nowrap min-w-[5rem] ${!isEnabled ? 'opacity-50' : ''}`}
          >
            Time:{' '}
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {String(Math.floor((config?.PRACTICE?.TIME || 10) / 60)).padStart(2, '0')}:
              {String((config?.PRACTICE?.TIME || 10) % 60).padStart(2, '0')}
            </span>
          </label>
          <div className="flex-1 relative min-w-0" style={{ top: '-7px' }}>
            <input
              type="range"
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              min="1"
              max="90"
              value={config?.PRACTICE?.TIME || 10}
              onChange={(e) => updateConfigValue('PRACTICE', 'TIME', parseInt(e.target.value))}
              disabled={!isEnabled}
            />
          </div>
        </div>

        <label
          className={`flex items-center gap-2 cursor-pointer ${!isEnabled ? 'opacity-50' : ''}`}
        >
          <input
            type="checkbox"
            className="w-4 h-4 text-blue-600"
            checked={config?.PRACTICE?.CAN_JOIN === 1}
            onChange={(e) => updateConfigValue('PRACTICE', 'CAN_JOIN', e.target.checked ? 1 : 0)}
            disabled={!isEnabled}
          />
          <span className="text-gray-900 dark:text-gray-100 text-sm">Can join</span>
        </label>
      </div>
    </div>
  );
}

function QualificationSession({ config, updateConfigValue }) {
  const isEnabled = config?.QUALIFY?.IS_OPEN === 1;

  return (
    <div className="card">
      <label className="flex items-center gap-2 cursor-pointer mb-4">
        <input
          type="checkbox"
          className="w-4 h-4 text-blue-600"
          checked={isEnabled}
          onChange={(e) => updateConfigValue('QUALIFY', 'IS_OPEN', e.target.checked ? 1 : 0)}
        />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Qualification</h2>
      </label>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label
            className={`label whitespace-nowrap min-w-[5rem] ${!isEnabled ? 'opacity-50' : ''}`}
          >
            Time:{' '}
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {String(Math.floor((config?.QUALIFY?.TIME || 10) / 60)).padStart(2, '0')}:
              {String((config?.QUALIFY?.TIME || 10) % 60).padStart(2, '0')}
            </span>
          </label>
          <div className="flex-1 relative min-w-0" style={{ top: '-7px' }}>
            <input
              type="range"
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              min="1"
              max="90"
              value={config?.QUALIFY?.TIME || 10}
              onChange={(e) => updateConfigValue('QUALIFY', 'TIME', parseInt(e.target.value))}
              disabled={!isEnabled}
            />
          </div>
        </div>

        <label
          className={`flex items-center gap-2 cursor-pointer ${!isEnabled ? 'opacity-50' : ''}`}
        >
          <input
            type="checkbox"
            className="w-4 h-4 text-blue-600"
            checked={config?.QUALIFY?.CAN_JOIN === 1}
            onChange={(e) => updateConfigValue('QUALIFY', 'CAN_JOIN', e.target.checked ? 1 : 0)}
            disabled={!isEnabled}
          />
          <span className="text-gray-900 dark:text-gray-100 text-sm">Can join</span>
        </label>

        <div className="flex items-center gap-4">
          <label
            className={`label whitespace-nowrap min-w-[5rem] text-sm ${
              !isEnabled ? 'opacity-50' : ''
            }`}
          >
            Qualify limit:{' '}
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {config?.QUALIFY?.QUALIFY_MAX_WAIT_PERC || 120}%
            </span>
          </label>
          <div className="flex-1 relative min-w-0" style={{ top: '-7px' }}>
            <input
              type="range"
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              min="100"
              max="200"
              value={config?.QUALIFY?.QUALIFY_MAX_WAIT_PERC || 120}
              onChange={(e) =>
                updateConfigValue('QUALIFY', 'QUALIFY_MAX_WAIT_PERC', parseInt(e.target.value))
              }
              disabled={!isEnabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function RaceSession({ config, updateConfigValue }) {
  const isEnabled = config?.RACE?.IS_OPEN === 1;

  return (
    <div className="card">
      <label className="flex items-center gap-2 cursor-pointer mb-4">
        <input
          type="checkbox"
          className="w-4 h-4 text-blue-600"
          checked={isEnabled}
          onChange={(e) => updateConfigValue('RACE', 'IS_OPEN', e.target.checked ? 1 : 0)}
        />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Race</h2>
      </label>

      <div className="space-y-4">
        {/* Limit by dropdown */}
        <div className="flex items-center gap-4">
          <label
            className={`label whitespace-nowrap min-w-[5rem] text-sm ${
              !isEnabled ? 'opacity-50' : ''
            }`}
          >
            Limit by:
          </label>
          <select
            className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-gray-100"
            value={config?.RACE?.LAPS !== undefined ? 'laps' : 'time'}
            onChange={(e) => {
              if (e.target.value === 'laps') {
                updateConfigValue('RACE', 'LAPS', 5);
                updateConfigValue('RACE', 'TIME', undefined);
              } else {
                updateConfigValue('RACE', 'TIME', 10);
                updateConfigValue('RACE', 'LAPS', undefined);
              }
            }}
            disabled={!isEnabled}
          >
            <option value="laps">Laps</option>
            <option value="time">Time</option>
          </select>
        </div>

        {/* Laps or Time Slider */}
        {config?.RACE?.LAPS !== undefined ? (
          <div className="flex items-center gap-4">
            <label
              className={`label whitespace-nowrap min-w-[5rem] ${!isEnabled ? 'opacity-50' : ''}`}
            >
              Laps:{' '}
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {config?.RACE?.LAPS || 5}
              </span>
            </label>
            <div className="flex-1 relative min-w-0" style={{ top: '-7px' }}>
              <input
                type="range"
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                min="1"
                max="120"
                value={config?.RACE?.LAPS || 5}
                onChange={(e) => updateConfigValue('RACE', 'LAPS', parseInt(e.target.value))}
                disabled={!isEnabled}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <label
              className={`label whitespace-nowrap min-w-[5rem] ${!isEnabled ? 'opacity-50' : ''}`}
            >
              Time:{' '}
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {String(Math.floor((config?.RACE?.TIME || 0) / 60)).padStart(2, '0')}:
                {String((config?.RACE?.TIME || 0) % 60).padStart(2, '0')}
              </span>
            </label>
            <div className="flex-1 relative min-w-0" style={{ top: '-7px' }}>
              <input
                type="range"
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                min="1"
                max="600"
                value={config?.RACE?.TIME || 10}
                onChange={(e) => updateConfigValue('RACE', 'TIME', parseInt(e.target.value))}
                disabled={!isEnabled}
              />
            </div>
          </div>
        )}

        {/* Other race fields */}
        <div className="flex items-center gap-4">
          <label
            className={`label whitespace-nowrap min-w-[5rem] text-sm ${
              !isEnabled ? 'opacity-50' : ''
            }`}
          >
            Initial delay:{' '}
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {String(Math.floor((config?.RACE?.WAIT_TIME || 60) / 60)).padStart(2, '0')}:
              {String((config?.RACE?.WAIT_TIME || 60) % 60).padStart(2, '0')}
            </span>
          </label>
          <div className="flex-1 relative min-w-0" style={{ top: '-7px' }}>
            <input
              type="range"
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              min="1"
              max="120"
              value={config?.RACE?.WAIT_TIME || 60}
              onChange={(e) => updateConfigValue('RACE', 'WAIT_TIME', parseInt(e.target.value))}
              disabled={!isEnabled}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label
            className={`label whitespace-nowrap min-w-[5rem] text-sm ${
              !isEnabled ? 'opacity-50' : ''
            }`}
          >
            Race over:{' '}
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {String(Math.floor((config?.SERVER?.RACE_OVER_TIME || 180) / 60)).padStart(2, '0')}:
              {String((config?.SERVER?.RACE_OVER_TIME || 180) % 60).padStart(2, '0')}
            </span>
          </label>
          <div className="flex-1 relative min-w-0" style={{ top: '-7px' }}>
            <input
              type="range"
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              min="0"
              max="300"
              value={config?.SERVER?.RACE_OVER_TIME || 180}
              onChange={(e) =>
                updateConfigValue('SERVER', 'RACE_OVER_TIME', parseInt(e.target.value))
              }
              disabled={!isEnabled}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label
            className={`label whitespace-nowrap min-w-[5rem] text-sm ${
              !isEnabled ? 'opacity-50' : ''
            }`}
          >
            Result screen:{' '}
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {String(Math.floor((config?.RACE?.RESULT_SCREEN_TIME || 60) / 60)).padStart(2, '0')}:
              {String((config?.RACE?.RESULT_SCREEN_TIME || 60) % 60).padStart(2, '0')}
            </span>
          </label>
          <div className="flex-1 relative min-w-0" style={{ top: '-7px' }}>
            <input
              type="range"
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              min="0"
              max="120"
              value={config?.RACE?.RESULT_SCREEN_TIME || 60}
              onChange={(e) =>
                updateConfigValue('RACE', 'RESULT_SCREEN_TIME', parseInt(e.target.value))
              }
              disabled={!isEnabled}
            />
          </div>
        </div>

        {/* Join Type Dropdown */}
        <div className="flex items-center gap-4">
          <label
            className={`label whitespace-nowrap min-w-[5rem] text-sm ${
              !isEnabled ? 'opacity-50' : ''
            }`}
          >
            Join type:
          </label>
          <select
            className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-gray-100"
            value={config?.RACE?.RACE_JOIN_TYPE || 0}
            onChange={(e) => updateConfigValue('RACE', 'RACE_JOIN_TYPE', parseInt(e.target.value))}
            disabled={!isEnabled}
          >
            <option value={1}>Closed</option>
            <option value={0}>Open</option>
            <option value={2}>Close at start</option>
          </select>
        </div>

        {/* Mandatory Pit */}
        <div className="space-y-2">
          <label
            className={`flex items-center gap-2 cursor-pointer ${!isEnabled ? 'opacity-50' : ''}`}
          >
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600"
              checked={config?.RACE?.MANDATORY_PIT === 1}
              onChange={(e) => updateConfigValue('RACE', 'MANDATORY_PIT', e.target.checked ? 1 : 0)}
              disabled={!isEnabled}
            />
            <span className="text-gray-900 dark:text-gray-100 text-sm">Mandatory pit</span>
          </label>

          {config?.RACE?.MANDATORY_PIT === 1 && (
            <div className={`grid grid-cols-2 gap-4 ml-6 ${!isEnabled ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-2">
                <label className="label text-sm whitespace-nowrap">From:</label>
                <input
                  type="number"
                  className="flex-1 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-gray-100 text-sm"
                  min="0"
                  value={config?.RACE?.MANDATORY_PIT_FROM || 0}
                  onChange={(e) =>
                    updateConfigValue('RACE', 'MANDATORY_PIT_FROM', parseInt(e.target.value))
                  }
                  disabled={!isEnabled}
                />
                <span className="text-gray-600 dark:text-gray-400 text-sm">lap</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="label text-sm whitespace-nowrap">To:</label>
                <input
                  type="number"
                  className="flex-1 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-gray-100 text-sm"
                  min="0"
                  value={config?.RACE?.MANDATORY_PIT_TO || 0}
                  onChange={(e) =>
                    updateConfigValue('RACE', 'MANDATORY_PIT_TO', parseInt(e.target.value))
                  }
                  disabled={!isEnabled}
                />
                <span className="text-gray-600 dark:text-gray-400 text-sm">lap</span>
              </div>
            </div>
          )}
        </div>

        {/* Reversed Grid */}
        <div className="flex items-center gap-4">
          <label
            className={`flex items-center gap-2 cursor-pointer ${!isEnabled ? 'opacity-50' : ''}`}
          >
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600"
              checked={config?.RACE?.REVERSED_GRID_RACE_POSITIONS === -1}
              onChange={(e) =>
                updateConfigValue('RACE', 'REVERSED_GRID_RACE_POSITIONS', e.target.checked ? -1 : 0)
              }
              disabled={!isEnabled}
            />
            <span className="text-gray-900 dark:text-gray-100 text-sm">Reversed grid</span>
          </label>
        </div>
      </div>
    </div>
  );
}
