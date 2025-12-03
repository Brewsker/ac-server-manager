import { useState, useEffect } from 'react';

export default function EntryListTab({
  config,
  updateConfigValue,
  cars,
  selectedCars,
  setShowCarModal,
}) {
  const [entries, setEntries] = useState([]);

  // Sync entries with selectedCars - add new cars, remove deleted cars
  useEffect(() => {
    if (!selectedCars || selectedCars.length === 0) {
      setEntries([]);
      return;
    }

    setEntries((prevEntries) => {
      // Create a map of existing entries by carId for quick lookup
      const existingEntriesMap = new Map(prevEntries.map((entry) => [entry.carId, entry]));

      // Build new entries array based on selectedCars order
      const newEntries = selectedCars.map((carId) => {
        // If entry already exists, keep it (preserves user edits)
        if (existingEntriesMap.has(carId)) {
          return existingEntriesMap.get(carId);
        }

        // Otherwise, create a new entry
        const car = cars.find((c) => c.id === carId);
        return {
          carId: carId,
          car: car?.name || carId,
          author: car?.author || 'Unknown',
          skin: car?.skins?.[0] || 'default',
          skinColor: '#' + Math.floor(Math.random() * 16777215).toString(16),
          guid: '',
          name: '',
          team: '',
          ballast: 0,
          restrictor: 0,
          spectatorMode: 0,
          driverName: '',
          driverTeam: '',
          driverNation: '',
        };
      });

      return newEntries;
    });
  }, [selectedCars, cars]);

  return (
    <>
      <div className="mb-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 text-blue-600"
            checked={config?.SERVER?.LOCKED_ENTRY_LIST === 1}
            onChange={(e) =>
              updateConfigValue('SERVER', 'LOCKED_ENTRY_LIST', e.target.checked ? 1 : 0)
            }
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
                <strong>
                  {entries.length} entries ({entries.reduce((sum, e) => sum + (e.clients || 1), 0)}{' '}
                  clients):
                </strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (cars.length === 0) {
                    alert(
                      'No cars available. Please install car content in Settings/Setup before adding entries.'
                    );
                    return;
                  }
                  setShowCarModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
              >
                + Add Entry
              </button>
            </div>

            {/* Table Header */}
            <div className="bg-gray-100 dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 px-4 py-2">
                <div className="flex-shrink-0 w-8 text-xs font-medium text-gray-600 dark:text-gray-400">
                  #
                </div>
                <div className="flex-1 min-w-0 text-xs font-medium text-gray-600 dark:text-gray-400">
                  Car
                </div>
                <div className="flex-shrink-0 w-24 text-xs font-medium text-gray-600 dark:text-gray-400">
                  Skin
                </div>
                <div className="flex-shrink-0 min-w-[120px] text-xs font-medium text-gray-600 dark:text-gray-400">
                  GUID
                </div>
                <div className="flex-shrink-0 min-w-[140px] text-xs font-medium text-gray-600 dark:text-gray-400">
                  Name
                </div>
                <div className="flex-shrink-0 min-w-[100px] text-xs font-medium text-gray-600 dark:text-gray-400">
                  Team
                </div>
                <div className="flex-shrink-0 min-w-[80px] text-xs font-medium text-gray-600 dark:text-gray-400">
                  Ballast
                </div>
                <div className="flex-shrink-0 min-w-[80px] text-xs font-medium text-gray-600 dark:text-gray-400">
                  Restrictor
                </div>
              </div>
            </div>

            {/* Entry List - 2-Row Card Layout */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {entries.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <div className="mb-3 text-5xl">🏎️</div>
                  <div className="text-gray-500 dark:text-gray-400 mb-2">
                    {cars.length === 0 ? 'No cars available' : 'No entries configured'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-500">
                    {cars.length === 0
                      ? 'Install car content in Settings/Setup to add entries'
                      : 'Click "+ Add Entry" to add vehicles to the entry list'}
                  </div>
                </div>
              ) : (
                entries.map((entry, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {/* Top Row - Main Info */}
                    <div className="flex items-center gap-4 mb-2">
                      {/* Entry Number */}
                      <div className="flex-shrink-0 w-8 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        #{index + 1}
                      </div>

                      {/* Car Name with Color Indicator */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="inline-block w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {entry.car}
                        </span>
                      </div>

                      {/* Skin */}
                      <div className="flex items-center gap-2 flex-shrink-0 w-24">
                        <div
                          className="w-8 h-6 border border-gray-300 dark:border-gray-600 rounded"
                          style={{ backgroundColor: entry.skinColor || '#ccc' }}
                        ></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {entry.skin}
                        </span>
                      </div>

                      {/* GUID */}
                      <div className="flex-shrink-0 min-w-[120px]">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {entry.guid || 'Any'}
                        </span>
                      </div>

                      {/* Name */}
                      <div className="flex-shrink-0 min-w-[140px]">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {entry.name || 'Client-defined'}
                        </span>
                      </div>

                      {/* Team */}
                      <div className="flex-shrink-0 min-w-[100px]">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {entry.team || 'None'}
                        </span>
                      </div>

                      {/* Ballast */}
                      <div className="flex-shrink-0 min-w-[80px]">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {entry.ballast || 0} kg
                        </span>
                      </div>

                      {/* Restrictor */}
                      <div className="flex-shrink-0 min-w-[80px]">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {entry.restrictor || 0}%
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row - Vehicle ID, Author, Actions */}
                    <div className="flex items-center justify-between pl-12">
                      {/* Left: Vehicle ID & Author */}
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          <span className="font-medium">ID:</span> {entry.carId}
                        </span>
                        <span>
                          <span className="font-medium">Author:</span> {entry.author}
                        </span>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex gap-2">
                        <button className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
                          Random skin
                        </button>
                        <button className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                          Clone
                        </button>
                        <button className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {entries.length > 0 && (
              <div className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                To load stored entry, simply drag'n'drop it to the table. Hold Shift while dragging
                to force add a new entry instead of loading params to existing one. Same with cars.
              </div>
            )}
          </div>
        </div>

        {/* Known Drivers - 1/5 */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-800 p-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
              Known drivers:
            </h3>
            <div className="mb-3">
              <label className="text-xs text-gray-600 dark:text-gray-400">Filter:</label>
              <input
                type="text"
                className="w-full mt-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100 placeholder-gray-500 text-sm"
                placeholder="Search..."
              />
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">No known drivers yet.</div>
          </div>
        </div>
      </div>
    </>
  );
}
