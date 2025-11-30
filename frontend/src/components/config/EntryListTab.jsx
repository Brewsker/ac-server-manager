import React, { useState, useEffect } from 'react';

export default function EntryListTab({ 
  config, 
  updateConfigValue, 
  cars,
  selectedCars,
  setShowCarModal 
}) {
  const [entries, setEntries] = useState([]);

  // Populate entries from selected cars
  useEffect(() => {
    if (selectedCars && selectedCars.length > 0 && entries.length === 0) {
      const initialEntries = selectedCars.map((carId, index) => {
        const car = cars.find(c => c.id === carId);
        return {
          carId: carId,
          car: car?.name || carId,
          author: car?.author || 'Unknown',
          skin: car?.skins?.[0] || 'default',
          skinColor: '#' + Math.floor(Math.random()*16777215).toString(16), // Random color for now
          guid: '',
          name: '',
          team: '',
          ballast: 0,
          restrictor: 0,
          spectatorMode: 0,
          driverName: '',
          driverTeam: '',
          driverNation: ''
        };
      });
      setEntries(initialEntries);
    }
  }, [selectedCars, cars, entries.length]);

  return (
    <>
      <div className="mb-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 text-blue-600"
            checked={config?.SERVER?.LOCKED_ENTRY_LIST === 1}
            onChange={(e) => updateConfigValue('SERVER', 'LOCKED_ENTRY_LIST', e.target.checked ? 1 : 0)}
          />
          <span className="text-gray-900 dark:text-gray-100">Locked entry list in pickup mode</span>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main content - 4/5 */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center px-4 pt-4 pb-2">
              <div className="text-gray-900 dark:text-gray-100 text-sm">
                <strong>{entries.length} entries ({entries.reduce((sum, e) => sum + (e.clients || 1), 0)} clients):</strong>
              </div>
              <button
                type="button"
                onClick={() => setShowCarModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
              >
                + Add Entry
              </button>
            </div>

            {/* Table Header */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400">#</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400">Car</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400">Skin</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400">GUID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400">Team</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400">Ballast</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400">Restrictor</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        No entries configured. Click "+ Add Entry" to add vehicles to the entry list.
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry, index) => (
                      <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{index + 1}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="inline-block w-3 h-3 bg-blue-500 rounded-full"></span>
                            {entry.car}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">ID: {entry.carId}, author: {entry.author}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-6" style={{ backgroundColor: entry.skinColor || '#ccc' }}></div>
                            <span className="text-gray-900 dark:text-gray-100">{entry.skin}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{entry.guid || 'Any'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{entry.name || 'Client-defined'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{entry.team || 'None'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{entry.ballast || 0} kg</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{entry.restrictor || 0}%</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700">Random skin</button>
                            <button className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700">Store</button>
                            <button className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Clone</button>
                            <button className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {entries.length > 0 && (
              <div className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                To load stored entry, simply drag'n'drop it to the table. Hold Shift while dragging to force add a new entry instead of loading params to existing one. Same with cars.
              </div>
            )}
          </div>
        </div>

        {/* Known Drivers - 1/5 */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-800 p-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Known drivers:</h3>
            <div className="mb-3">
              <label className="text-xs text-gray-600 dark:text-gray-400">Filter:</label>
              <input
                type="text"
                className="w-full mt-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100 placeholder-gray-500 text-sm"
                placeholder="Search..."
              />
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No known drivers yet.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
