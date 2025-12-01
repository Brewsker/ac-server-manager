import { useState } from 'react';

function DetailsTab({ config, updateConfigValue, loadTabDefaults }) {
  const [showPassword, setShowPassword] = useState(false);
  const [detailsEnabled, setDetailsEnabled] = useState(false);

  const handleMasterToggle = (enabled) => {
    setDetailsEnabled(enabled);
    if (!enabled) {
      // Clear all details when disabled
      updateConfigValue('SERVER', 'CONTENT_MANAGER_WRAPPER_PORT', '');
      updateConfigValue('SERVER', 'LOCKED_ENTRY_LIST', 0);
      updateConfigValue('SERVER', 'DESCRIPTION', '');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            checked={detailsEnabled}
            onChange={(e) => handleMasterToggle(e.target.checked)}
            className="w-5 h-5 text-blue-600"
          />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Server Details
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Provide extra details about the server, such as links to extra content, assists or
              description
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => loadTabDefaults('DETAILS')}
          className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Reset to Defaults
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-8">
        {/* Combined Details Settings */}
        <div className={`space-y-6 ${!detailsEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
              Mode to provide extra details:
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="detailsMode"
                  checked={!config?.SERVER?.CONTENT_MANAGER_WRAPPER_PORT}
                  onChange={() => updateConfigValue('SERVER', 'CONTENT_MANAGER_WRAPPER_PORT', '')}
                  className="w-4 h-4 text-blue-600"
                  disabled={!detailsEnabled}
                />
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  Via ID in name (recommended)
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="detailsMode"
                  checked={!!config?.SERVER?.CONTENT_MANAGER_WRAPPER_PORT}
                  onChange={() =>
                    updateConfigValue('SERVER', 'CONTENT_MANAGER_WRAPPER_PORT', '8081')
                  }
                  className="w-4 h-4 text-blue-600"
                  disabled={!detailsEnabled}
                />
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  Via AC Server Wrapper
                </div>
              </label>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 mt-3 space-y-2">
              <p>
                Content Manager will add a few extra symbols to server name, and then apps on
                client machines will use them to get a full description. Doesn't require any
                scripts to run, works everywhere. A bit less functional, but provides all the
                important details.
              </p>
              <p>To share extra cars and track, you can provide links to download them.</p>
            </div>
          </div>

          {config?.SERVER?.CONTENT_MANAGER_WRAPPER_PORT && detailsEnabled && (
            <div className="ml-7 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Note:</strong> AC Server Wrapper requires additional setup. This tool
                doesn't currently manage wrapper configuration.
              </p>
            </div>
          )}

          {/* Downloading missing content - moved up */}
          <div className="pt-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Downloading missing content
            </h3>

            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config?.SERVER?.LOCKED_ENTRY_LIST === 1}
                  onChange={(e) =>
                    updateConfigValue('SERVER', 'LOCKED_ENTRY_LIST', e.target.checked ? 1 : 0)
                  }
                  className="w-4 h-4 text-blue-600"
                  disabled={!detailsEnabled}
                />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Allow downloading only with correct password
                </span>
              </label>

              {config?.SERVER?.LOCKED_ENTRY_LIST === 1 && detailsEnabled && (
                <div className="ml-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password for downloading
                  </label>
                  <div className="relative max-w-md">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={config?.SERVER?.PASSWORD || ''}
                      onChange={(e) => updateConfigValue('SERVER', 'PASSWORD', e.target.value)}
                      placeholder="Enter password..."
                      className="w-full px-3 py-2 pr-10 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Users will need this password to download missing content
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Server description (both BB-codes and emojis are allowed):
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            This description will be shown in Content Manager's server details
          </p>

          <textarea
            value={config?.SERVER?.DESCRIPTION || ''}
            onChange={(e) => updateConfigValue('SERVER', 'DESCRIPTION', e.target.value)}
            placeholder="None"
            rows={8}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 font-mono text-sm resize-y"
          />

          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/30 rounded border border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              BB-Code Examples:
            </p>
            <div className="space-y-1 text-xs font-mono text-gray-600 dark:text-gray-400">
              <div>
                <span className="text-blue-600 dark:text-blue-400">[b]bold[/b]</span> - Bold text
              </div>
              <div>
                <span className="text-blue-600 dark:text-blue-400">[i]italic[/i]</span> - Italic
                text
              </div>
              <div>
                <span className="text-blue-600 dark:text-blue-400">
                  [url=https://...]link[/url]
                </span>{' '}
                - Hyperlink
              </div>
              <div>
                <span className="text-blue-600 dark:text-blue-400">[color=#FF0000]red[/color]</span>{' '}
                - Colored text
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetailsTab;
