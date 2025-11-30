import React from 'react';

export default function MainTab({ config, updateConfigValue, loadTabDefaults }) {
  return (
    <>
      <div className="flex justify-end mb-6">
        <button
          type="button"
          onClick={() => loadTabDefaults('MAIN')}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          🔄 Load Defaults
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Server Settings */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Server</h2>
          
          <div className="space-y-4">
            <div>
              <label className="label">Server name</label>
              <input
                type="text"
                className="input"
                value={config?.SERVER?.NAME || ''}
                onChange={(e) => updateConfigValue('SERVER', 'NAME', e.target.value)}
                placeholder="My AC Server"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="text"
                className="input"
                value={config?.SERVER?.PASSWORD || ''}
                onChange={(e) => updateConfigValue('SERVER', 'PASSWORD', e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="label">Admin password</label>
              <input
                type="text"
                className="input"
                value={config?.SERVER?.ADMIN_PASSWORD || ''}
                onChange={(e) => updateConfigValue('SERVER', 'ADMIN_PASSWORD', e.target.value)}
                placeholder="Required"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="label whitespace-nowrap min-w-[5rem]">
                Max clients: <span className="font-semibold text-blue-600 dark:text-blue-400">{config?.SERVER?.MAX_CLIENTS || 10}</span>
              </label>
              <div className="flex-1 relative" style={{ top: '-7px' }}>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  min="1"
                  max="24"
                  value={config?.SERVER?.MAX_CLIENTS || 10}
                  onChange={(e) => updateConfigValue('SERVER', 'MAX_CLIENTS', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="label whitespace-nowrap min-w-[5rem]">
                UDP port: <span className="font-semibold text-blue-600 dark:text-blue-400">{config?.SERVER?.UDP_PORT || 9600}</span>
              </label>
              <div className="flex-1 relative" style={{ top: '-7px' }}>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  min="1024"
                  max="65535"
                  value={config?.SERVER?.UDP_PORT || 9600}
                  onChange={(e) => updateConfigValue('SERVER', 'UDP_PORT', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="label whitespace-nowrap min-w-[5rem]">
                TCP port: <span className="font-semibold text-blue-600 dark:text-blue-400">{config?.SERVER?.TCP_PORT || 9600}</span>
              </label>
              <div className="flex-1 relative" style={{ top: '-7px' }}>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  min="1024"
                  max="65535"
                  value={config?.SERVER?.TCP_PORT || 9600}
                  onChange={(e) => updateConfigValue('SERVER', 'TCP_PORT', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="label whitespace-nowrap min-w-[5rem]">
                HTTP port: <span className="font-semibold text-blue-600 dark:text-blue-400">{config?.SERVER?.HTTP_PORT || 8081}</span>
              </label>
              <div className="flex-1 relative" style={{ top: '-7px' }}>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  min="1024"
                  max="65535"
                  value={config?.SERVER?.HTTP_PORT || 8081}
                  onChange={(e) => updateConfigValue('SERVER', 'HTTP_PORT', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600"
                  checked={config?.SERVER?.REGISTER_TO_LOBBY === 1}
                  onChange={(e) => updateConfigValue('SERVER', 'REGISTER_TO_LOBBY', e.target.checked ? 1 : 0)}
                />
                <span className="text-gray-900 dark:text-gray-100">Register to lobby</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600"
                  checked={config?.SERVER?.PUBLIC === 1}
                  onChange={(e) => updateConfigValue('SERVER', 'PUBLIC', e.target.checked ? 1 : 0)}
                />
                <span className="text-gray-900 dark:text-gray-100">Public server</span>
              </label>
            </div>
          </div>
        </div>

        {/* Track Configuration */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Track</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Track</label>
              <input
                type="text"
                className="input"
                value={config?.SERVER?.TRACK || ''}
                onChange={(e) => updateConfigValue('SERVER', 'TRACK', e.target.value)}
                placeholder="e.g., imola"
              />
            </div>

            <div>
              <label className="label">Track config</label>
              <input
                type="text"
                className="input"
                value={config?.SERVER?.CONFIG_TRACK || ''}
                onChange={(e) => updateConfigValue('SERVER', 'CONFIG_TRACK', e.target.value)}
                placeholder="Optional layout variant"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
