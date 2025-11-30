import { useState, useEffect } from 'react';
import api from '../api/client';

function EntryList() {
  const [entries, setEntries] = useState([]);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [entriesData, carsData] = await Promise.all([
        api.getEntries(),
        api.getCars(),
      ]);
      
      setEntries(entriesData);
      setCars(carsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = () => {
    // TODO: Open modal to add new entry
    console.log('Add entry');
  };

  const handleDeleteEntry = async (entryId) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      try {
        await api.deleteEntry(entryId);
        fetchData();
      } catch (error) {
        console.error('Failed to delete entry:', error);
      }
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Entry List</h1>
        <button onClick={handleAddEntry} className="btn-primary">
          + Add Entry
        </button>
      </div>

      <div className="card">
        {entries.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No entries yet. Click "Add Entry" to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Car
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Skin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {entry.DRIVERNAME || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {entry.MODEL || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {entry.SKIN || 'default'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default EntryList;
