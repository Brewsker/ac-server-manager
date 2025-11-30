# Example React Component - Car Selector

This is an example of how to create a multi-select car selector component.

## Component Code

```jsx
import { useState } from 'react';
import PropTypes from 'prop-types';

function CarSelector({ cars, selectedCars, onChange }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCars = cars.filter(car =>
    car.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggle = (carId) => {
    const newSelection = selectedCars.includes(carId)
      ? selectedCars.filter(id => id !== carId)
      : [...selectedCars, carId];
    
    onChange(newSelection);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Search Cars</label>
        <input
          type="text"
          className="input-field"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
        {filteredCars.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No cars found</p>
        ) : (
          <div className="space-y-2">
            {filteredCars.map((car) => (
              <label
                key={car.id}
                className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedCars.includes(car.id)}
                  onChange={() => handleToggle(car.id)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="flex-1">{car.name}</span>
                <span className="text-sm text-gray-500">{car.id}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <p className="text-sm text-gray-600">
        {selectedCars.length} car(s) selected
      </p>
    </div>
  );
}

CarSelector.propTypes = {
  cars: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  selectedCars: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default CarSelector;
```

## Usage Example

```jsx
import { useState, useEffect } from 'react';
import CarSelector from '../components/CarSelector';
import api from '../api/client';

function ExamplePage() {
  const [cars, setCars] = useState([]);
  const [selectedCars, setSelectedCars] = useState([]);

  useEffect(() => {
    async function fetchCars() {
      const data = await api.getCars();
      setCars(data);
    }
    fetchCars();
  }, []);

  const handleCarChange = (newSelection) => {
    setSelectedCars(newSelection);
    console.log('Selected cars:', newSelection);
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Select Cars</h2>
      <CarSelector
        cars={cars}
        selectedCars={selectedCars}
        onChange={handleCarChange}
      />
    </div>
  );
}

export default ExamplePage;
```

## Features

- Multi-select functionality
- Search/filter capability
- Responsive design
- Tailwind CSS styling
- PropTypes validation
- Clear selection count

## Customization

You can customize this component by:
- Adding car images/thumbnails
- Grouping by category
- Adding select/deselect all buttons
- Changing the max height
- Adding sorting options
