export default function AdvancedTab({
  config,
  updateConfigValue,
  loadTabDefaults,
  selectedCars,
  cars,
}) {
  // Extract unique tyres from selected cars
  // For now, show common AC tyre types as placeholder
  // TODO: Parse car data.acd or tyres.ini to get actual tyre compounds
  const availableTyres = [
    { code: 'H', label: '[H] Hard GP70', info: 'Ferrari 312T' },
    { code: 'S', label: '[S] Soft GP70', info: 'Ferrari 312T' },
    { code: 'SM', label: '[SM] Semislick', info: 'BMW M3 E30 and KTM X-Bow R' },
    { code: 'ST', label: '[ST] Street', info: 'BMW M3 E30' },
    { code: 'SV', label: '[SV] Street 90s', info: 'BMW M3 E30' },
  ];

  const selectedTyres = config?.SERVER?.LEGAL_TYRES?.split(';').filter((t) => t) || [];

  const toggleTyre = (tyreCode) => {
    let currentTyres = [...selectedTyres];

    if (currentTyres.includes(tyreCode)) {
      currentTyres = currentTyres.filter((t) => t !== tyreCode);
    } else {
      currentTyres.push(tyreCode);
    }

    updateConfigValue('SERVER', 'LEGAL_TYRES', currentTyres.join(';'));
  };

  return (
    <>
      <div className="flex justify-end mb-6">
        <button
          type="button"
          onClick={() => loadTabDefaults('ADVANCED')}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          🔄 Load Tab Defaults
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column (1/2) */}
        <div className="space-y-6">
          {/* Allowed Tyres Section */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Allowed tyres:
            </h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select allowed tire types (leave empty to allow all)
              </p>
              <div className="space-y-2">
                {availableTyres.map((tyre) => {
                  return (
                    <div key={tyre.code}>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600"
                          checked={selectedTyres.includes(tyre.code)}
                          onChange={() => toggleTyre(tyre.code)}
                        />
                        <span className="text-gray-900 dark:text-gray-100">{tyre.label}</span>
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">{tyre.info}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Fixed Setups Section */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Fixed setups:
            </h2>
            <button
              type="button"
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-300 dark:border-gray-700"
            >
              + Add setup
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Checked setup is the one applied by default.
            </p>
          </div>

          {/* Web Link Section */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Web link:
            </h2>
            <input
              type="text"
              className="input bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 w-full"
              placeholder="None"
              value={config?.SERVER?.WEB_LINK || ''}
              onChange={(e) => updateConfigValue('SERVER', 'WEB_LINK', e.target.value)}
            />
          </div>

          {/* FTP Data Section */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              FTP data:
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This section doesn't affect actual AC server, it only allows you to quickly upload all
              necessary files (including executable) to a remote server via FTP.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="label whitespace-nowrap min-w-[5rem]">Host:</label>
                <input
                  type="text"
                  className="input bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 flex-1"
                  style={{ position: 'relative', top: '-4px' }}
                  placeholder="None"
                  value={config?.FTP?.HOST || ''}
                  onChange={(e) => updateConfigValue('FTP', 'HOST', e.target.value)}
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="label whitespace-nowrap min-w-[5rem]">Login:</label>
                <input
                  type="text"
                  className="input bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 flex-1"
                  style={{ position: 'relative', top: '-4px' }}
                  placeholder="None"
                  value={config?.FTP?.LOGIN || ''}
                  onChange={(e) => updateConfigValue('FTP', 'LOGIN', e.target.value)}
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="label whitespace-nowrap min-w-[5rem]">Password:</label>
                <input
                  type="password"
                  className="input bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 flex-1"
                  style={{ position: 'relative', top: '-4px' }}
                  placeholder="None"
                  value={config?.FTP?.PASSWORD || ''}
                  onChange={(e) => updateConfigValue('FTP', 'PASSWORD', e.target.value)}
                />
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors whitespace-nowrap"
                  style={{ position: 'relative', top: '-4px' }}
                >
                  Verify connection
                </button>
              </div>

              <div className="flex items-center gap-4">
                <label className="label whitespace-nowrap min-w-[5rem]">Folder:</label>
                <input
                  type="text"
                  className="input bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 flex-1"
                  style={{ position: 'relative', top: '-4px' }}
                  placeholder="None"
                  value={config?.FTP?.FOLDER || ''}
                  onChange={(e) => updateConfigValue('FTP', 'FOLDER', e.target.value)}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600"
                  checked={config?.FTP?.UPLOAD_DATA_ONLY === 1}
                  onChange={(e) =>
                    updateConfigValue('FTP', 'UPLOAD_DATA_ONLY', e.target.checked ? 1 : 0)
                  }
                />
                <span className="text-gray-900 dark:text-gray-100">
                  Upload data only, without executable
                </span>
              </label>

              <div className="flex items-center gap-4">
                <label className="label whitespace-nowrap min-w-[5rem]">Target:</label>
                <select
                  className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-gray-100"
                  style={{ position: 'relative', top: '-4px' }}
                  value={config?.FTP?.TARGET || 'windows'}
                  onChange={(e) => updateConfigValue('FTP', 'TARGET', e.target.value)}
                >
                  <option value="windows">Windows</option>
                  <option value="linux">Linux</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-sm text-red-500">
                <span>⚠️</span>
                <span>Clear folder before upload</span>
              </div>

              <button
                type="button"
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-300 dark:border-gray-700"
              >
                Upload content
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (1/2) */}
        <div className="space-y-6">
          {/* Server Plugin Section */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Server plugin:
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="label whitespace-nowrap min-w-[5rem]">Address:</label>
                <input
                  type="text"
                  className="input bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 flex-1"
                  style={{ position: 'relative', top: '-4px' }}
                  placeholder="None"
                  value={config?.SERVER?.PLUGIN_ADDRESS || ''}
                  onChange={(e) => updateConfigValue('SERVER', 'PLUGIN_ADDRESS', e.target.value)}
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="label whitespace-nowrap min-w-[5rem]">Local port:</label>
                <input
                  type="text"
                  className="input bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 flex-1"
                  style={{ position: 'relative', top: '-4px' }}
                  placeholder="None"
                  value={config?.SERVER?.PLUGIN_LOCAL_PORT || ''}
                  onChange={(e) => updateConfigValue('SERVER', 'PLUGIN_LOCAL_PORT', e.target.value)}
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="label whitespace-nowrap min-w-[5rem]">Auth:</label>
                <input
                  type="text"
                  className="input bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 flex-1"
                  style={{ position: 'relative', top: '-4px' }}
                  placeholder="None"
                  value={config?.SERVER?.AUTH_PLUGIN_ADDRESS || ''}
                  onChange={(e) =>
                    updateConfigValue('SERVER', 'AUTH_PLUGIN_ADDRESS', e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          {/* CM Plugin Section */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              CM plugin:
            </h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600"
                checked={config?.SERVER?.USE_CM_AS_PLUGIN === 1}
                onChange={(e) =>
                  updateConfigValue('SERVER', 'USE_CM_AS_PLUGIN', e.target.checked ? 1 : 0)
                }
              />
              <span className="text-gray-900 dark:text-gray-100">
                Use Content Manager as server plugin
              </span>
            </label>
          </div>
        </div>
      </div>
    </>
  );
}
