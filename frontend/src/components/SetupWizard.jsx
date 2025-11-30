import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

function SetupWizard({ onComplete }) {
  const [step, setStep] = useState('checking'); // checking, configure, validating, complete
  const [acPath, setAcPath] = useState('');
  const [autoDetected, setAutoDetected] = useState(null);
  const [validation, setValidation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const response = await fetch('/api/setup/status');
      const data = await response.json();

      if (data.configured) {
        setStep('complete');
        if (onComplete) onComplete();
      } else {
        setStep('configure');
        if (data.autoDetected) {
          setAutoDetected(data.autoDetected);
          setAcPath(data.autoDetected);
        }
      }
    } catch (err) {
      setError('Failed to check setup status');
      setStep('configure');
    }
  };

  const handleAutoDetect = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/setup/auto-detect');
      const data = await response.json();

      if (data.found) {
        setAcPath(data.path);
        setAutoDetected(data.path);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to auto-detect AC installation');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!acPath.trim()) {
      setError('Please enter an AC installation path');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('validating');

    try {
      const response = await fetch('/api/setup/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: acPath })
      });

      const data = await response.json();
      setValidation(data);

      if (!data.valid) {
        setError('Invalid AC installation directory');
        setStep('configure');
      }
    } catch (err) {
      setError('Failed to validate AC installation');
      setStep('configure');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/setup/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: acPath })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStep('complete');
        console.log('Configuration saved successfully');
        // Mark as complete without auto-reload
        if (onComplete) onComplete();
      } else {
        setError(data.error || 'Failed to save configuration');
        setStep('configure');
      }
    } catch (err) {
      setError('Failed to save configuration');
      setStep('configure');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking configuration...</p>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return null; // Return null to show main app
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏁 Welcome to AC Server Manager
          </h1>
          <p className="text-gray-600">
            Let's set up your Assetto Corsa installation
          </p>
        </div>

        {step === 'configure' && (
          <>
            <div className="space-y-6">
              {autoDetected && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium mb-1">
                    ✅ AC Installation Auto-Detected!
                  </p>
                  <p className="text-sm text-green-700">{autoDetected}</p>
                </div>
              )}

              <div>
                <label className="label">
                  Assetto Corsa Installation Directory
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={acPath}
                  onChange={(e) => setAcPath(e.target.value)}
                  placeholder="C:/Steam/steamapps/common/assettocorsa"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This is the main AC folder containing the "server" and "content" directories
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleAutoDetect}
                  disabled={loading}
                  className="btn-secondary flex-1"
                >
                  🔍 Auto-Detect
                </button>
                <button
                  onClick={handleValidate}
                  disabled={loading || !acPath.trim()}
                  className="btn-primary flex-1"
                >
                  {loading ? 'Validating...' : 'Validate & Continue →'}
                </button>
              </div>
            </div>
          </>
        )}

        {step === 'validating' && validation && (
          <>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 font-medium mb-3">
                  ✅ Validation Successful!
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <div className="flex-1">
                      <p className="font-medium">Server Executable</p>
                      <p className="text-blue-700 break-all">
                        {validation.paths.AC_SERVER_PATH}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <div className="flex-1">
                      <p className="font-medium">Server Config</p>
                      <p className="text-blue-700 break-all">
                        {validation.paths.AC_SERVER_CONFIG_PATH}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <div className="flex-1">
                      <p className="font-medium">Entry List</p>
                      <p className="text-blue-700 break-all">
                        {validation.paths.AC_ENTRY_LIST_PATH}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <div className="flex-1">
                      <p className="font-medium">Content Folder</p>
                      <p className="text-blue-700 break-all">
                        {validation.paths.AC_CONTENT_PATH}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('configure')}
                  disabled={loading}
                  className="btn-secondary"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {loading ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

SetupWizard.propTypes = {
  onComplete: PropTypes.func,
};

export default SetupWizard;
