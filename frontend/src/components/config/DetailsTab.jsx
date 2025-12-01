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
      {/* Content */}
      <div className="p-6 space-y-8">
        <div>
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
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Downloading missing content
          </h3>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config?.SERVER?.LOCKED_ENTRY_LIST === 1}
              onChange={(e) =>
                updateConfigValue('SERVER', 'LOCKED_ENTRY_LIST', e.target.checked ? 1 : 0)
              }
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Allow downloading only with correct password
            </span>
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-6">
            Uses the server password from the Main tab
          </p>
        </div>
      </div>
    </div>
  );
}

export default DetailsTab;
