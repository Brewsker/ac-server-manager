import { useState } from 'react';
import PropTypes from 'prop-types';
import { useKeyboardNav } from '../hooks/useKeyboardNav';

function TrackSelectionModal({ tracks, currentTrack, onSelect, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSelectedTrack, setTempSelectedTrack] = useState(currentTrack || '');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState(null); // 'kunos', 'new', or null
  const [countryFilter, setCountryFilter] = useState(null); // selected country or null

  // Debug: Verify onSelect is a function
  if (typeof onSelect !== 'function') {
    console.error('TrackSelectionModal: onSelect is not a function!', typeof onSelect);
  }

  const filterTabs = [
    { id: 'ALL', label: 'All', icon: '🌐' },
    { id: 'COUNTRIES', label: 'Countries', icon: '🌍' },
    { id: 'CATEGORIES', label: 'Categories', icon: '📁' },
    { id: 'DLCS', label: 'DLCs', icon: '💿' },
    { id: 'TAGS', label: 'Tags', icon: '🏷️' },
    { id: 'RATINGS', label: 'Ratings', icon: '⭐' },
    { id: 'FAVOURITES', label: 'Favourites', icon: '❤️' },
  ];

  // Get unique countries from tracks
  const getUniqueCountries = () => {
    const countries = tracks.map((t) => t.country).filter((c) => c && c.trim() !== '');
    return [...new Set(countries)].sort();
  };

  const getCountryFlagUrl = (country) => {
    // AC stores country flags in content/texture/flags/
    // Flag filenames are typically lowercase country codes or names
    const countryCode = country.toLowerCase().replace(/\s+/g, '_');
    return `/api/content/country-flag/${countryCode}`;
  };

  // Get unique tags from tracks
  const getUniqueTags = () => {
    const allTags = tracks.flatMap((t) => t.tags || []);
    return [...new Set(allTags)].sort();
  };

  // Determine if track is from DLC (basic heuristic - can be improved)
  const isDLC = (track) => {
    const dlcKeywords = ['dream pack', 'ready to race', 'japanese pack', 'porsche'];
    const trackName = track.name.toLowerCase();
    const trackTags = (track.tags || []).map((t) => t.toLowerCase());
    return dlcKeywords.some(
      (keyword) => trackName.includes(keyword) || trackTags.some((tag) => tag.includes(keyword))
    );
  };

  // Determine if track is from Kunos (original + DLC)
  const isKunos = (track) => {
    // Kunos original tracks (base game + DLC)
    const kunosTracks = [
      'imola',
      'monza',
      'mugello',
      'spa',
      'silverstone',
      'brands_hatch',
      'nurburgring',
      'vallelunga',
      'trento_bondone',
      'magione',
      'barcelona',
      'drift',
      'drag',
      'red_bull_ring',
      'blackcat',
      'acu_blanchimont',
      'ks_',
    ];
    const trackId = track.id.toLowerCase();
    return (
      kunosTracks.some((kt) => trackId.includes(kt)) ||
      track.author?.toLowerCase().includes('kunos')
    );
  };

  // Check if track is recently installed (within last 30 days)
  const isNew = (track) => {
    // This would need file creation/modification time from backend
    // For now, placeholder - could be enhanced with actual file stats
    return false;
  };

  const filteredTracks = tracks.filter((track) => {
    // Search filter - search in name, tags, and country
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      searchTerm === '' ||
      track.name.toLowerCase().includes(searchLower) ||
      (track.country && track.country.toLowerCase().includes(searchLower)) ||
      (track.tags && track.tags.some((tag) => tag.toLowerCase().includes(searchLower)));

    if (!matchesSearch) return false;

    // Country filter
    if (countryFilter && track.country !== countryFilter) return false;

    // Category filter (Kunos/New)
    if (categoryFilter === 'kunos' && !isKunos(track)) return false;
    if (categoryFilter === 'new' && !isNew(track)) return false;

    // Tab filter
    switch (activeFilter) {
      case 'ALL':
        return true;
      case 'DLCS':
        return isDLC(track);
      case 'FAVOURITES':
        // TODO: Implement favourites system with localStorage
        return false;
      default:
        return true;
    }
  });

  const handleConfirm = () => {
    console.log('Confirm clicked, tempSelectedTrack:', tempSelectedTrack);
    if (!tempSelectedTrack) {
      alert('Please select a track');
      return;
    }
    console.log('Calling onSelect with:', tempSelectedTrack);
    onSelect(tempSelectedTrack);
  };

  const { selectedIndex, buttonRefs } = useKeyboardNav(
    2,
    (index) => {
      if (index === 0) onClose();
      else if (index === 1) handleConfirm();
    },
    onClose,
    1 // Default to confirm
  );

  const getTrackPreviewUrl = (trackId) => {
    // AC stores track previews in content/tracks/{track_id}/ui/preview.png
    return `/api/content/track-preview/${trackId}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full mx-4 h-[90vh] flex flex-col"
        style={{ maxWidth: '1200px' }}
      >
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Select Track (v2)
        </h3>

        {/* Filter Tabs */}
        <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex gap-1 overflow-x-auto -mb-px">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveFilter(tab.id);
                  setCategoryFilter(null); // Reset category filter when switching tabs
                  setCountryFilter(null); // Reset country filter when switching tabs
                }}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeFilter === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Filter Content - Countries/Categories/Tags Lists */}
        {activeFilter === 'COUNTRIES' && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {getUniqueCountries().map((country) => {
                const trackCount = tracks.filter((t) => t.country === country).length;
                return (
                  <button
                    key={country}
                    onClick={() => {
                      setCountryFilter(country);
                      setSearchTerm('');
                    }}
                    className={`flex items-center gap-3 p-3 text-sm bg-white dark:bg-gray-800 border-2 rounded-lg transition-all ${
                      countryFilter === country
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-500'
                    }`}
                  >
                    <img
                      src={getCountryFlagUrl(country)}
                      alt={country}
                      className="w-8 h-6 object-cover rounded shadow-sm"
                      onError={(e) => {
                        // Fallback to country initial if flag image fails
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{country}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {trackCount} track{trackCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {countryFilter && (
              <div className="mt-3 flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
                <span className="text-sm text-blue-800 dark:text-blue-200">
                  Filtering by: <strong>{countryFilter}</strong>
                </span>
                <button
                  onClick={() => setCountryFilter(null)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium"
                >
                  Clear Filter
                </button>
              </div>
            )}
          </div>
        )}

        {activeFilter === 'TAGS' && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex flex-wrap gap-2">
              {getUniqueTags().map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSearchTerm(tag);
                  }}
                  className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-500 transition-colors"
                >
                  🏷️ {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeFilter === 'CATEGORIES' && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            {/* MAIN Section */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
                Main
              </h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setCategoryFilter('kunos');
                    setSearchTerm('');
                  }}
                  className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-500 transition-colors"
                  title="Original Kunos tracks including DLCs"
                >
                  🏁 Kunos (Official)
                </button>
                <button
                  onClick={() => {
                    setCategoryFilter('new');
                    setSearchTerm('');
                  }}
                  className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-500 transition-colors"
                  title="Recently installed tracks"
                >
                  ✨ New Tracks
                </button>
              </div>
            </div>

            {/* TYPES Section */}
            <div>
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
                Types
              </h4>
              <div className="flex flex-wrap gap-2">
                {['Circuit', 'Street', 'Hillclimb', 'Drift', 'Oval', 'Rally'].map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setCategoryFilter(null);
                      setSearchTerm(category.toLowerCase());
                    }}
                    className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-500 transition-colors"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeFilter === 'RATINGS' && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Track ratings feature coming soon
            </p>
          </div>
        )}

        {activeFilter === 'FAVOURITES' && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No favourite tracks yet. Mark tracks as favourites to see them here.
            </p>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search tracks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus={activeFilter === 'ALL'}
          />
        </div>

        {/* Track Grid */}
        <div className="flex-1 overflow-y-auto mb-4">
          {tracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="mb-6 text-6xl">🏁</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Tracks Available
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                You need to install track content before you can configure your server.
              </p>
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
                  📦 How to install content:
                </p>
                <ol className="text-sm text-blue-700 dark:text-blue-300 text-left space-y-1">
                  <li>
                    1. Go to <strong>Settings/Setup</strong> in the navigation menu
                  </li>
                  <li>2. Use the content upload feature to add tracks</li>
                  <li>3. Return here to select your track</li>
                </ol>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredTracks.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => setTempSelectedTrack(track.id)}
                    onDoubleClick={() => {
                      setTempSelectedTrack(track.id);
                      onSelect(track.id);
                    }}
                    className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      tempSelectedTrack === track.id
                        ? 'border-blue-500 ring-2 ring-blue-300 dark:ring-blue-700'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                    }`}
                  >
                    <div className="aspect-video bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
                      <img
                        src={getTrackPreviewUrl(track.id)}
                        alt={track.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          e.target.src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="225"%3E%3Crect fill="%23334155" width="400" height="225"/%3E%3Ctext fill="%239CA3AF" font-family="sans-serif" font-size="24" text-anchor="middle" x="200" y="120"%3ENo Preview%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      {tempSelectedTrack === track.id && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                          ✓
                        </div>
                      )}
                      {track.country && (
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          {track.country}
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-800">
                      <p
                        className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate mb-1"
                        title={track.name}
                      >
                        {track.name}
                      </p>
                      {track.length && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          📏 {(track.length / 1000).toFixed(2)} km
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {filteredTracks.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  {activeFilter === 'FAVOURITES'
                    ? 'No favourite tracks yet'
                    : `No tracks found matching "${searchTerm}"`}
                </div>
              )}
            </>
          )}
        </div>

        {/* Selection Info */}
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {tempSelectedTrack ? (
              <>
                Selected: <strong>{tracks.find((t) => t.id === tempSelectedTrack)?.name}</strong>
              </>
            ) : (
              <>No track selected</>
            )}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            ref={(el) => (buttonRefs.current[0] = el)}
            onClick={onClose}
            className={`px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
              selectedIndex === 0 ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            Cancel
          </button>
          <button
            ref={(el) => (buttonRefs.current[1] = el)}
            onClick={handleConfirm}
            disabled={!tempSelectedTrack}
            className={`px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              selectedIndex === 1 ? 'ring-2 ring-blue-800' : ''
            }`}
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
}

TrackSelectionModal.propTypes = {
  tracks: PropTypes.array.isRequired,
  currentTrack: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default TrackSelectionModal;
