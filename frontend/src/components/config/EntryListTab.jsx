import { useMemo, useState, useRef, useEffect } from 'react';

// Custom Skin Dropdown with thumbnails
function SkinDropdown({ carId, skins, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle both old format (string[]) and new format ({id, name}[])
  const skinList = skins || [];
  const normalizedSkins = skinList.map((s) =>
    typeof s === 'string' ? { id: s, name: s.replace(/_/g, ' ') } : s
  );

  if (normalizedSkins.length === 0) {
    normalizedSkins.push({ id: 'default', name: 'Default' });
  }

  const currentSkinId = value || normalizedSkins[0]?.id;
  const currentSkin = normalizedSkins.find((s) => s.id === currentSkinId) || normalizedSkins[0];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected value button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 text-sm px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100 hover:bg-gray-700 transition-colors text-left"
      >
        <img
          src={`/api/content/skin-preview/${carId}/${currentSkin.id}`}
          alt=""
          className="w-5 h-5 object-cover rounded flex-shrink-0"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <span className="truncate flex-1">{currentSkin.name}</span>
        <svg
          className="w-3 h-3 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-56 max-h-64 overflow-y-auto bg-gray-800 border border-gray-700 rounded shadow-lg">
          {normalizedSkins.map((skin) => (
            <button
              key={skin.id}
              type="button"
              onClick={() => {
                onChange(skin.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm text-left hover:bg-gray-700 transition-colors ${
                skin.id === currentSkinId ? 'bg-gray-700 text-blue-400' : 'text-gray-100'
              }`}
            >
              <img
                src={`/api/content/skin-preview/${carId}/${skin.id}`}
                alt=""
                className="w-6 h-6 object-cover rounded flex-shrink-0"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <span className="truncate">{skin.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EntryListTab({
  config,
  updateConfigValue,
  deleteConfigSection,
  cars,
  selectedCars,
}) {
  const [showCarPicker, setShowCarPicker] = useState(false);
  const [carFilter, setCarFilter] = useState('');

  // Extract entries from config (CAR_0, CAR_1, etc.)
  const entries = useMemo(() => {
    const result = [];
    if (!config) return result;

    for (let i = 0; i < 100; i++) {
      const key = `CAR_${i}`;
      if (config[key]) {
        const carId = config[key].MODEL || '';
        const car = cars?.find((c) => c.id === carId);
        result.push({
          index: i,
          sectionKey: key,
          carId: carId,
          car: car?.name || carId,
          author: car?.author || 'Unknown',
          skin: config[key].SKIN || 'default',
          driverName: config[key].DRIVERNAME || '',
          team: config[key].TEAM || '',
          guid: config[key].GUID || '',
          spectatorMode: parseInt(config[key].SPECTATOR_MODE) || 0,
          ballast: parseInt(config[key].BALLAST) || 0,
          restrictor: parseInt(config[key].RESTRICTOR) || 0,
        });
      }
    }

    return result;
  }, [config, cars]);

  // Update a single entry field
  const updateEntry = (sectionKey, field, value) => {
    const fieldMap = {
      skin: 'SKIN',
      driverName: 'DRIVERNAME',
      team: 'TEAM',
      guid: 'GUID',
      spectatorMode: 'SPECTATOR_MODE',
      ballast: 'BALLAST',
      restrictor: 'RESTRICTOR',
    };
    const iniField = fieldMap[field];
    if (iniField) {
      updateConfigValue(sectionKey, iniField, value);
    }
  };

  // Add a new entry from selectedCars
  const addEntry = (carId) => {
    const nextIndex = entries.length;
    const sectionKey = `CAR_${nextIndex}`;
    const car = cars?.find((c) => c.id === carId);

    updateConfigValue(sectionKey, 'MODEL', carId);
    updateConfigValue(sectionKey, 'SKIN', car?.skins?.[0] || 'default');
    updateConfigValue(sectionKey, 'DRIVERNAME', '');
    updateConfigValue(sectionKey, 'TEAM', '');
    updateConfigValue(sectionKey, 'GUID', '');
    updateConfigValue(sectionKey, 'SPECTATOR_MODE', 0);
    updateConfigValue(sectionKey, 'BALLAST', 0);
    updateConfigValue(sectionKey, 'RESTRICTOR', 0);
  };

  // Clone an entry
  const cloneEntry = (entry) => {
    const nextIndex = entries.length;
    const sectionKey = `CAR_${nextIndex}`;

    updateConfigValue(sectionKey, 'MODEL', entry.carId);
    updateConfigValue(sectionKey, 'SKIN', entry.skin);
    updateConfigValue(sectionKey, 'DRIVERNAME', entry.driverName);
    updateConfigValue(sectionKey, 'TEAM', entry.team);
    updateConfigValue(sectionKey, 'GUID', ''); // New entry shouldn't duplicate GUID
    updateConfigValue(sectionKey, 'SPECTATOR_MODE', entry.spectatorMode);
    updateConfigValue(sectionKey, 'BALLAST', entry.ballast);
    updateConfigValue(sectionKey, 'RESTRICTOR', entry.restrictor);
  };

  // Delete an entry and reindex remaining
  const deleteEntryAtIndex = (indexToDelete) => {
    // Delete all entries and rebuild without the deleted one
    const newEntries = entries.filter((_, i) => i !== indexToDelete);

    // First, delete all existing CAR_X sections
    entries.forEach((entry) => {
      deleteConfigSection(entry.sectionKey);
    });

    // Then recreate with new indices
    newEntries.forEach((entry, newIndex) => {
      const newKey = `CAR_${newIndex}`;
      updateConfigValue(newKey, 'MODEL', entry.carId);
      updateConfigValue(newKey, 'SKIN', entry.skin);
      updateConfigValue(newKey, 'DRIVERNAME', entry.driverName);
      updateConfigValue(newKey, 'TEAM', entry.team);
      updateConfigValue(newKey, 'GUID', entry.guid);
      updateConfigValue(newKey, 'SPECTATOR_MODE', entry.spectatorMode);
      updateConfigValue(newKey, 'BALLAST', entry.ballast);
      updateConfigValue(newKey, 'RESTRICTOR', entry.restrictor);
    });
  };

  // Randomize skin for an entry
  const randomizeSkin = (entry) => {
    const car = cars?.find((c) => c.id === entry.carId);
    if (car?.skins?.length > 0) {
      const randomSkin = car.skins[Math.floor(Math.random() * car.skins.length)];
      updateEntry(entry.sectionKey, 'skin', randomSkin);
    }
  };

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
                  {entries.length} entries ({entries.length} slots):
                </strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!cars || cars.length === 0) {
                    alert(
                      'No cars available. Please install car content in Settings/Setup before adding entries.'
                    );
                    return;
                  }
                  setShowCarPicker(true);
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
                <div className="flex-shrink-0 w-32 text-xs font-medium text-gray-600 dark:text-gray-400">
                  Skin
                </div>
                <div className="flex-shrink-0 w-[120px] text-xs font-medium text-gray-600 dark:text-gray-400">
                  GUID
                </div>
                <div className="flex-shrink-0 w-[140px] text-xs font-medium text-gray-600 dark:text-gray-400">
                  Name
                </div>
                <div className="flex-shrink-0 w-[100px] text-xs font-medium text-gray-600 dark:text-gray-400">
                  Team
                </div>
                <div className="flex-shrink-0 w-[80px] text-xs font-medium text-gray-600 dark:text-gray-400">
                  Ballast
                </div>
                <div className="flex-shrink-0 w-[80px] text-xs font-medium text-gray-600 dark:text-gray-400">
                  Restrictor
                </div>
              </div>
            </div>

            {/* Entry List */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {entries.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <div className="mb-3 text-5xl">🏎️</div>
                  <div className="text-gray-500 dark:text-gray-400 mb-2">
                    {!cars || cars.length === 0 ? 'No cars available' : 'No entries configured'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-500">
                    {!cars || cars.length === 0
                      ? 'Install car content in Settings/Setup to add entries'
                      : 'Click "+ Add Entry" to add vehicles to the entry list'}
                  </div>
                </div>
              ) : (
                entries.map((entry, index) => (
                  <div
                    key={entry.sectionKey}
                    className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {/* Top Row - Main Info */}
                    <div className="flex items-center gap-4 mb-2">
                      {/* Entry Number */}
                      <div className="flex-shrink-0 w-8 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        #{index + 1}
                      </div>

                      {/* Car Name */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="inline-block w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {entry.car}
                        </span>
                      </div>

                      {/* Skin - Dropdown with thumbnails */}
                      <div className="flex-shrink-0 w-32">
                        <SkinDropdown
                          carId={entry.carId}
                          skins={cars?.find((c) => c.id === entry.carId)?.skins}
                          value={entry.skin}
                          onChange={(skin) => updateEntry(entry.sectionKey, 'skin', skin)}
                        />
                      </div>

                      {/* GUID */}
                      <div className="flex-shrink-0 w-[120px]">
                        <input
                          type="text"
                          className="w-full text-sm px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100 placeholder-gray-500"
                          placeholder="Any"
                          value={entry.guid}
                          onChange={(e) => updateEntry(entry.sectionKey, 'guid', e.target.value)}
                        />
                      </div>

                      {/* Name */}
                      <div className="flex-shrink-0 w-[140px]">
                        <input
                          type="text"
                          className="w-full text-sm px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100 placeholder-gray-500"
                          placeholder="Client-defined"
                          value={entry.driverName}
                          onChange={(e) =>
                            updateEntry(entry.sectionKey, 'driverName', e.target.value)
                          }
                        />
                      </div>

                      {/* Team */}
                      <div className="flex-shrink-0 w-[100px]">
                        <input
                          type="text"
                          className="w-full text-sm px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100 placeholder-gray-500"
                          placeholder="None"
                          value={entry.team}
                          onChange={(e) => updateEntry(entry.sectionKey, 'team', e.target.value)}
                        />
                      </div>

                      {/* Ballast */}
                      <div className="flex-shrink-0 w-[80px]">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            className="w-16 text-sm px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100"
                            value={entry.ballast}
                            min="0"
                            max="100"
                            onChange={(e) =>
                              updateEntry(
                                entry.sectionKey,
                                'ballast',
                                parseInt(e.target.value) || 0
                              )
                            }
                          />
                          <span className="text-xs text-gray-500">kg</span>
                        </div>
                      </div>

                      {/* Restrictor */}
                      <div className="flex-shrink-0 w-[80px]">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            className="w-16 text-sm px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100"
                            value={entry.restrictor}
                            min="0"
                            max="100"
                            onChange={(e) =>
                              updateEntry(
                                entry.sectionKey,
                                'restrictor',
                                parseInt(e.target.value) || 0
                              )
                            }
                          />
                          <span className="text-xs text-gray-500">%</span>
                        </div>
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
                        <button
                          onClick={() => randomizeSkin(entry)}
                          className="text-xs px-2 py-1 bg-gray-700 dark:bg-gray-600 text-white rounded hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
                        >
                          Random skin
                        </button>
                        <button
                          onClick={() => cloneEntry(entry)}
                          className="text-xs px-2 py-1 bg-gray-700 dark:bg-gray-600 text-white rounded hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
                        >
                          Clone
                        </button>
                        <button
                          onClick={() => deleteEntryAtIndex(index)}
                          className="text-xs px-2 py-1 bg-gray-700 dark:bg-gray-600 text-white rounded hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
                        >
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
                Entry list is stored in presets and saved with the configuration. Edit fields
                directly or use action buttons.
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

      {/* Car Selection Modal for Adding Entries */}
      {showCarPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Add Entry - Select Car
              </h2>

              {/* Search */}
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Search cars..."
                  value={carFilter}
                  onChange={(e) => setCarFilter(e.target.value)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-gray-100"
                  autoFocus
                />
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                Click on a car to add it as an entry. You can add multiple entries.
              </p>
            </div>

            {/* Car Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {cars?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="mb-6 text-6xl">🏎️</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No Cars Available
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                    You need to install car content before you can add entries.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {cars
                    ?.filter((car) => car.name.toLowerCase().includes(carFilter.toLowerCase()))
                    ?.map((car) => (
                      <div
                        key={car.id}
                        onClick={() => {
                          addEntry(car.id);
                        }}
                        className="cursor-pointer rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:ring-2 hover:ring-blue-300 dark:hover:ring-blue-700 transition-all"
                      >
                        <div className="aspect-video bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
                          <img
                            src={`/api/content/car-preview/${car.id}`}
                            alt={car.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src =
                                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="225"%3E%3Crect fill="%23334155" width="400" height="225"/%3E%3Ctext fill="%239CA3AF" font-family="sans-serif" font-size="18" text-anchor="middle" x="200" y="120"%3E🏎️%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        </div>
                        <div className="p-3 bg-white dark:bg-gray-800">
                          <p
                            className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate"
                            title={car.name}
                          >
                            {car.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {car.skins?.length || 0} skins
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {cars?.filter((car) => car.name.toLowerCase().includes(carFilter.toLowerCase()))
                ?.length === 0 &&
                carFilter && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                      No cars found matching "{carFilter}"
                    </p>
                  </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-800">
              <div className="flex gap-3 justify-between items-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {entries.length} entries in list
                </p>
                <button
                  onClick={() => {
                    setShowCarPicker(false);
                    setCarFilter('');
                  }}
                  className="px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
