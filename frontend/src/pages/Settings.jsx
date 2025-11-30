function Settings() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="space-y-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">AC Installation Paths</h2>
          
          <div className="space-y-4">
            <div>
              <label className="label">AC Server Executable</label>
              <input
                type="text"
                className="input-field"
                placeholder="C:/Steam/steamapps/common/assettocorsa/server/acServer.exe"
              />
            </div>

            <div>
              <label className="label">AC Content Folder</label>
              <input
                type="text"
                className="input-field"
                placeholder="C:/Steam/steamapps/common/assettocorsa/content"
              />
            </div>

            <div>
              <label className="label">Server Config Path</label>
              <input
                type="text"
                className="input-field"
                placeholder="C:/Steam/steamapps/common/assettocorsa/server/cfg"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Application Settings</h2>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input type="checkbox" id="auto-start" className="mr-2" />
              <label htmlFor="auto-start">Auto-start server on app launch</label>
            </div>

            <div className="flex items-center">
              <input type="checkbox" id="notifications" className="mr-2" />
              <label htmlFor="notifications">Enable notifications</label>
            </div>
          </div>
        </div>

        <button className="btn-primary">Save Settings</button>
      </div>
    </div>
  );
}

export default Settings;
