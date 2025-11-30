import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useKeyboardNav } from '../hooks/useKeyboardNav';

function CarSelectionModal({ cars, selectedCars, onConfirm, onClose }) {
  const [localSelection, setLocalSelection] = useState([...selectedCars]);
  const [searchQuery, setSearchQuery] = useState('');

  const { selectedIndex, buttonRefs } = useKeyboardNav(
    2,
    (index) => {
      if (index === 0) handleConfirm();
      else if (index === 1) onClose();
    },
    onClose,
    0 // Default to Confirm button
  );

  const toggleCar = (carId) => {
    setLocalSelection(prev =>
      prev.includes(carId)
        ? prev.filter(id => id !== carId)
        : [...prev, carId]
    );
  };

  const selectAll = () => {
    setLocalSelection(filteredCars.map(car => car.id));
  };

  const clearAll = () => {
    setLocalSelection([]);
  };

  const handleConfirm = () => {
    onConfirm(localSelection);
  };

  const filteredCars = cars.filter(car =>
    car.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCarPreviewUrl = (carId) => {
    return `/api/content/car-preview/${carId}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Select Cars</h2>
          
          {/* Search and Actions */}
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder="Search cars..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 input-field"
              autoFocus
            />
            <button
              onClick={selectAll}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded transition-colors text-sm font-medium"
            >
              Select All
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded transition-colors text-sm font-medium"
            >
              Clear All
            </button>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Selected: <span className="font-medium text-blue-600 dark:text-blue-400">{localSelection.length}</span> of {cars.length} cars
          </p>
        </div>

        {/* Car List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredCars.map((car) => (
              <div
                key={car.id}
                onClick={() => toggleCar(car.id)}
                className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  localSelection.includes(car.id)
                    ? 'border-blue-500 ring-2 ring-blue-300 dark:ring-blue-700'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
              >
                <div className="aspect-video bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
                  <img
                    src={getCarPreviewUrl(car.id)}
                    alt={car.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="225"%3E%3Crect fill="%23334155" width="400" height="225"/%3E%3Ctext fill="%239CA3AF" font-family="sans-serif" font-size="18" text-anchor="middle" x="200" y="120"%3E🏎️%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  {localSelection.includes(car.id) && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold">
                      ✓
                    </div>
                  )}
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 rounded pointer-events-none"
                    checked={localSelection.includes(car.id)}
                    onChange={() => {}}
                  />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex-1" title={car.name}>
                    {car.name}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {filteredCars.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No cars found matching "{searchQuery}"</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800">
          {localSelection.length === 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mb-4 p-2 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800">
              ⚠️ Warning: At least one car must be selected for the server to start
            </p>
          )}
          
          <div className="flex gap-3 justify-end">
            <button
              ref={(el) => (buttonRefs.current[1] = el)}
              onClick={onClose}
              className={`px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                selectedIndex === 1 ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              Cancel
            </button>
            <button
              ref={(el) => (buttonRefs.current[0] = el)}
              onClick={handleConfirm}
              disabled={localSelection.length === 0}
              className={`px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed ${
                selectedIndex === 0 ? 'ring-2 ring-blue-800' : ''
              }`}
            >
              Confirm Selection ({localSelection.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

CarSelectionModal.propTypes = {
  cars: PropTypes.array.isRequired,
  selectedCars: PropTypes.array.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CarSelectionModal;
