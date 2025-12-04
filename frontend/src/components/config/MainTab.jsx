export default function MainTab({
  config,
  updateConfigValue,
  loadTabDefaults,
  loadAllDefaults,
  setShowTrackModal,
  setActiveTab,
  getSelectedTrackName,
  selectedCars,
  cars,
  tracks,
  getCarPreviewUrl,
  showPassword,
  setShowPassword,
  showAdminPassword,
  setShowAdminPassword,
  setShowCspOptionsModal,
}) {
  // Calculate bandwidth based on client count
  // Data points from Content Manager:
  // 2 clients: 0.01, 5 clients: 0.14, 10 clients: 0.62, 14 clients: 1.26, 18 clients: 2.12
  // This appears to follow a quadratic curve
  const calculateBandwidth = (clients) => {
    // Using quadratic regression: bandwidth ≈ a*clients² + b*clients + c
    // Fitted coefficients for the curve
    const a = 0.00656;
    const b = 0.00625;
    const c = -0.0175;
    const bandwidth = a * clients * clients + b * clients + c;
    return Math.max(0.01, bandwidth).toFixed(2);
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Server Settings - Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Track & Car Selection */}
          <div className="card">
            <div className="grid grid-cols-2 gap-4">
              {/* Track Preview */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowTrackModal(true)}
                  className="w-full aspect-video bg-gray-200 dark:bg-gray-700 rounded overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer"
                >
                  {config?.SERVER?.TRACK ? (
                    <img
                      src={`/api/content/track-preview/${config.SERVER.TRACK}`}
                      alt={getSelectedTrackName()}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                      <div className="text-4xl mb-2">🏁</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        No track selected
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        {tracks.length === 0
                          ? 'Install content in Settings/Setup'
                          : 'Click to select'}
                      </div>
                    </div>
                  )}
                </button>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 text-center font-medium">
                  {getSelectedTrackName()}
                </p>
              </div>

              {/* Car Preview */}
              <div>
                <button
                  type="button"
                  onClick={() => setActiveTab('ENTRY_LIST')}
                  className="w-full aspect-video bg-gray-200 dark:bg-gray-700 rounded overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer relative"
                >
                  {selectedCars.length > 0 ? (
                    <div
                      className={`grid h-full w-full ${
                        selectedCars.length === 1
                          ? 'grid-cols-1'
                          : selectedCars.length === 2
                          ? 'grid-cols-2'
                          : selectedCars.length === 3
                          ? 'grid-cols-3'
                          : selectedCars.length === 4
                          ? 'grid-cols-2 grid-rows-2'
                          : selectedCars.length <= 6
                          ? 'grid-cols-3 grid-rows-2'
                          : selectedCars.length <= 9
                          ? 'grid-cols-3 grid-rows-3'
                          : 'grid-cols-4 grid-rows-3'
                      }`}
                    >
                      {selectedCars.slice(0, 12).map((carId) => (
                        <div key={carId} className="relative w-full h-full">
                          <img
                            src={getCarPreviewUrl(carId)}
                            alt={cars.find((c) => c.id === carId)?.name || carId}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {selectedCars.length > 12 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <div className="bg-blue-600 text-white text-lg px-4 py-2 rounded">
                            +{selectedCars.length - 12} more
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                      <div className="text-4xl mb-2">🏎️</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        No cars selected
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        {cars.length === 0
                          ? 'Install content in Settings/Setup'
                          : 'Click to manage cars'}
                      </div>
                    </div>
                  )}
                </button>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 text-center font-medium">
                  {selectedCars.length > 0
                    ? `${selectedCars.length} car${selectedCars.length !== 1 ? 's' : ''} selected`
                    : 'No cars selected'}
                </p>
              </div>
            </div>

            {/* Capacity Info */}
            <div className="mt-4 space-y-1">
              <div className="flex items-center gap-4">
                <label className="label whitespace-nowrap min-w-[5rem]">
                  Capacity:{' '}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {config?.SERVER?.MAX_CLIENTS || 18}
                  </span>
                </label>
                <div className="flex-1 relative min-w-0" style={{ top: '-7px' }}>
                  <input
                    type="range"
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    min="2"
                    max="18"
                    value={config?.SERVER?.MAX_CLIENTS || 18}
                    onChange={(e) =>
                      updateConfigValue('SERVER', 'MAX_CLIENTS', parseInt(e.target.value))
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Maximum number of clients is limited by track's{' '}
                {config?.SERVER?.TRACK ? '18' : 'XX'} pits
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Approximate upload bandwidth required:{' '}
                {calculateBandwidth(config?.SERVER?.MAX_CLIENTS || 18)} Mbit/s
              </p>
            </div>
          </div>

          {/* Server Settings */}
          <div className="card">
            <div className="space-y-4">
              <div>
                <label className="label">Password:</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input pr-10 bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 w-full"
                    value={config?.SERVER?.PASSWORD || ''}
                    onChange={(e) => updateConfigValue('SERVER', 'PASSWORD', e.target.value)}
                    placeholder="None"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Admin password:</label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    className="input pr-10 bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 w-full"
                    value={config?.SERVER?.ADMIN_PASSWORD || ''}
                    onChange={(e) => updateConfigValue('SERVER', 'ADMIN_PASSWORD', e.target.value)}
                    placeholder="mypassword"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showAdminPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600"
                  checked={config?.SERVER?.REGISTER_TO_LOBBY === 1}
                  onChange={(e) =>
                    updateConfigValue('SERVER', 'REGISTER_TO_LOBBY', e.target.checked ? 1 : 0)
                  }
                />
                <span className="text-gray-900 dark:text-gray-100">
                  Public server (show in the lobby)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600"
                  checked={config?.SERVER?.DISABLE_INTEGRITY_VERIFICATION === 1}
                  onChange={(e) =>
                    updateConfigValue(
                      'SERVER',
                      'DISABLE_INTEGRITY_VERIFICATION',
                      e.target.checked ? 1 : 0
                    )
                  }
                />
                <span className="text-gray-900 dark:text-gray-100">
                  Disable integrity verification (not recommended)
                </span>
              </label>

              <div>
                <label className="label">Welcome msg file:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input flex-1 min-w-0 bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
                    value={config?.SERVER?.WELCOME_FILE || ''}
                    onChange={(e) => updateConfigValue('SERVER', 'WELCOME_FILE', e.target.value)}
                    placeholder="None"
                  />
                  <input
                    type="file"
                    id="welcomeFileInput"
                    className="hidden"
                    accept=".txt"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        updateConfigValue('SERVER', 'WELCOME_FILE', e.target.files[0].name);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors whitespace-nowrap"
                    onClick={() => document.getElementById('welcomeFileInput').click()}
                  >
                    Browse
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Welcome message:</label>
                <textarea
                  className="input min-h-[100px] resize-none bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 w-full"
                  value={config?.SERVER?.WELCOME_MESSAGE || ''}
                  onChange={(e) => updateConfigValue('SERVER', 'WELCOME_MESSAGE', e.target.value)}
                  placeholder="None"
                  rows={4}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1/3) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Network Settings */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Network</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="label whitespace-nowrap min-w-[7rem]">UDP port</label>
                <input
                  type="number"
                  className="input bg-gray-800 border-gray-700 text-gray-100 flex-1 min-w-0"
                  style={{ position: 'relative', top: '-4px' }}
                  value={config?.SERVER?.UDP_PORT || 9600}
                  onChange={(e) =>
                    updateConfigValue('SERVER', 'UDP_PORT', parseInt(e.target.value))
                  }
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="label whitespace-nowrap min-w-[7rem]">TCP port</label>
                <input
                  type="number"
                  className="input bg-gray-800 border-gray-700 text-gray-100 flex-1 min-w-0"
                  style={{ position: 'relative', top: '-4px' }}
                  value={config?.SERVER?.TCP_PORT || 9600}
                  onChange={(e) =>
                    updateConfigValue('SERVER', 'TCP_PORT', parseInt(e.target.value))
                  }
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="label whitespace-nowrap min-w-[7rem]">HTTP port</label>
                <input
                  type="number"
                  className="input bg-gray-800 border-gray-700 text-gray-100 flex-1 min-w-0"
                  style={{ position: 'relative', top: '-4px' }}
                  value={config?.SERVER?.HTTP_PORT || 8081}
                  onChange={(e) =>
                    updateConfigValue('SERVER', 'HTTP_PORT', parseInt(e.target.value))
                  }
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="label whitespace-nowrap min-w-[7rem]">
                  Packets:{' '}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {config?.SERVER?.CLIENT_SEND_INTERVAL_HZ || 18} Hz
                  </span>
                </label>
                <div className="flex-1 relative min-w-0" style={{ top: '-7px' }}>
                  <input
                    type="range"
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    min="10"
                    max="60"
                    value={config?.SERVER?.CLIENT_SEND_INTERVAL_HZ || 18}
                    onChange={(e) =>
                      updateConfigValue(
                        'SERVER',
                        'CLIENT_SEND_INTERVAL_HZ',
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="label whitespace-nowrap min-w-[7rem]">
                  Threads:{' '}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {config?.SERVER?.NUM_THREADS || 2}
                  </span>
                </label>
                <div className="flex-1 relative min-w-0" style={{ top: '-7px' }}>
                  <input
                    type="range"
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    min="2"
                    max="8"
                    value={config?.SERVER?.NUM_THREADS || 2}
                    onChange={(e) =>
                      updateConfigValue('SERVER', 'NUM_THREADS', parseInt(e.target.value))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="label">Manager description</label>
                <input
                  type="text"
                  className="input bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 w-full"
                  placeholder="None"
                  value={config?.SERVER?.WELCOME_MESSAGE || ''}
                  onChange={(e) => updateConfigValue('SERVER', 'WELCOME_MESSAGE', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Custom Shaders Patch */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Custom Shaders Patch:
            </h2>
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600"
                  checked={config?.SERVER?.CSP_REQUIRED === 1}
                  onChange={(e) =>
                    updateConfigValue('SERVER', 'CSP_REQUIRED', e.target.checked ? 1 : 0)
                  }
                />
                <span className="text-gray-900 dark:text-gray-100">Require CSP to join</span>
              </label>

              <label
                className={`flex items-center gap-2 ${
                  config?.SERVER?.CSP_REQUIRED === 1
                    ? 'cursor-pointer'
                    : 'cursor-not-allowed opacity-50'
                }`}
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600"
                  checked={config?.SERVER?.CSP_USE_RAIN_CLOUDS === 1}
                  onChange={(e) =>
                    updateConfigValue('SERVER', 'CSP_USE_RAIN_CLOUDS', e.target.checked ? 1 : 0)
                  }
                  disabled={config?.SERVER?.CSP_REQUIRED !== 1}
                />
                <span className="text-gray-900 dark:text-gray-100">
                  Use extended physics for cars
                </span>
              </label>

              <label
                className={`flex items-center gap-2 ${
                  config?.SERVER?.CSP_REQUIRED === 1
                    ? 'cursor-pointer'
                    : 'cursor-not-allowed opacity-50'
                }`}
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600"
                  checked={config?.SERVER?.CSP_RAIN_CLOUDS_CONTROL === 1}
                  onChange={(e) =>
                    updateConfigValue('SERVER', 'CSP_RAIN_CLOUDS_CONTROL', e.target.checked ? 1 : 0)
                  }
                  disabled={config?.SERVER?.CSP_REQUIRED !== 1}
                />
                <span className="text-gray-900 dark:text-gray-100">
                  Use extended physics for tracks
                </span>
              </label>

              <div>
                <label className="label">Minimum version:</label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    className="input bg-gray-800 border-gray-700 text-gray-100 w-32"
                    value={config?.SERVER?.CSP_MINIMUM_VERSION || 1061}
                    onChange={(e) =>
                      updateConfigValue('SERVER', 'CSP_MINIMUM_VERSION', parseInt(e.target.value))
                    }
                  />
                  <button
                    type="button"
                    className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors text-xs whitespace-nowrap"
                  >
                    Auto-fill
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCspOptionsModal(true)}
                className="w-full px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors text-center"
              >
                Extra options
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
