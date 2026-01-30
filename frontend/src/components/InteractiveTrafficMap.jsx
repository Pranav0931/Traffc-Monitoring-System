import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { 
  Camera, MapPin, AlertTriangle, Activity, Layers, 
  Navigation, ZoomIn, ZoomOut, Crosshair, Car
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Nagpur monitoring locations with camera data
const NAGPUR_LOCATIONS = [
  { 
    id: 1, 
    name: 'Variety Square', 
    lat: 21.1458, 
    lng: 79.0882, 
    type: 'major',
    cameras: 4,
    description: 'Major commercial intersection'
  },
  { 
    id: 2, 
    name: 'Sitabuldi', 
    lat: 21.1480, 
    lng: 79.0800, 
    type: 'major',
    cameras: 3,
    description: 'Central business district'
  },
  { 
    id: 3, 
    name: 'Dharampeth', 
    lat: 21.1400, 
    lng: 79.0750, 
    type: 'residential',
    cameras: 2,
    description: 'Residential area junction'
  },
  { 
    id: 4, 
    name: 'Shankar Nagar Square', 
    lat: 21.1350, 
    lng: 79.0850, 
    type: 'major',
    cameras: 3,
    description: 'Shopping district intersection'
  },
  { 
    id: 5, 
    name: 'Medical Square', 
    lat: 21.1520, 
    lng: 79.0920, 
    type: 'hospital',
    cameras: 4,
    description: 'Hospital zone - Emergency priority'
  },
  { 
    id: 6, 
    name: 'Lakadganj', 
    lat: 21.1600, 
    lng: 79.1000, 
    type: 'industrial',
    cameras: 2,
    description: 'Industrial area junction'
  },
  { 
    id: 7, 
    name: 'Sadar', 
    lat: 21.1550, 
    lng: 79.0750, 
    type: 'commercial',
    cameras: 3,
    description: 'Commercial hub'
  },
  { 
    id: 8, 
    name: 'Manish Nagar', 
    lat: 21.1300, 
    lng: 79.0700, 
    type: 'residential',
    cameras: 2,
    description: 'Residential colony'
  },
  { 
    id: 9, 
    name: 'Wardha Road', 
    lat: 21.1250, 
    lng: 79.1050, 
    type: 'highway',
    cameras: 4,
    description: 'Highway entrance point'
  },
  { 
    id: 10, 
    name: 'Airport Road', 
    lat: 21.1100, 
    lng: 79.0500, 
    type: 'highway',
    cameras: 3,
    description: 'Airport approach road'
  }
];

// Road connections for visualization
const ROAD_CONNECTIONS = [
  [[21.1458, 79.0882], [21.1480, 79.0800]], // Variety to Sitabuldi
  [[21.1480, 79.0800], [21.1400, 79.0750]], // Sitabuldi to Dharampeth
  [[21.1400, 79.0750], [21.1350, 79.0850]], // Dharampeth to Shankar Nagar
  [[21.1458, 79.0882], [21.1520, 79.0920]], // Variety to Medical
  [[21.1520, 79.0920], [21.1600, 79.1000]], // Medical to Lakadganj
  [[21.1480, 79.0800], [21.1550, 79.0750]], // Sitabuldi to Sadar
  [[21.1350, 79.0850], [21.1300, 79.0700]], // Shankar Nagar to Manish Nagar
  [[21.1350, 79.0850], [21.1250, 79.1050]], // Shankar Nagar to Wardha Road
  [[21.1300, 79.0700], [21.1100, 79.0500]], // Manish Nagar to Airport
];

// Tile layer configurations
const TILE_LAYERS = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    name: 'Street'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
    name: 'Satellite'
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB',
    name: 'Dark'
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap',
    name: 'Terrain'
  }
};

// Custom marker icons
const createMarkerIcon = (type, isSelected, hasEmergency) => {
  const colors = {
    major: '#ef4444',
    commercial: '#f97316',
    residential: '#22c55e',
    hospital: '#3b82f6',
    industrial: '#a855f7',
    highway: '#eab308'
  };
  
  const color = hasEmergency ? '#ef4444' : colors[type] || '#3b82f6';
  const size = isSelected ? 40 : 30;
  const pulse = hasEmergency ? 'animate-pulse' : '';
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="relative ${pulse}" style="width: ${size}px; height: ${size}px;">
        <div class="absolute inset-0 rounded-full" style="background: ${color}; opacity: 0.3; transform: scale(1.5);"></div>
        <div class="absolute inset-0 flex items-center justify-center rounded-full shadow-lg" 
             style="background: linear-gradient(135deg, ${color}, ${color}dd); border: 3px solid white;">
          <svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        ${isSelected ? `<div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45"></div>` : ''}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  });
};

/**
 * Map controls component
 */
function MapControls({ map, onLayerChange, currentLayer }) {
  const [showLayers, setShowLayers] = useState(false);

  return (
    <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-[1000] flex flex-col gap-1.5 sm:gap-2">
      {/* Layer switcher */}
      <div className="relative">
        <button
          onClick={() => setShowLayers(!showLayers)}
          className="p-1.5 sm:p-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
          title="Change map layer"
        >
          <Layers size={16} className="text-blue-400 sm:w-5 sm:h-5" />
        </button>
        
        {showLayers && (
          <div className="absolute top-full right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden shadow-xl min-w-[100px] sm:min-w-[120px]">
            {Object.entries(TILE_LAYERS).map(([key, layer]) => (
              <button
                key={key}
                onClick={() => { onLayerChange(key); setShowLayers(false); }}
                className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-left text-xs sm:text-sm transition-colors ${
                  currentLayer === key 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                {layer.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zoom controls */}
      <button
        onClick={() => map?.zoomIn()}
        className="p-1.5 sm:p-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
      >
        <ZoomIn size={16} className="text-gray-300 sm:w-5 sm:h-5" />
      </button>
      <button
        onClick={() => map?.zoomOut()}
        className="p-1.5 sm:p-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
      >
        <ZoomOut size={16} className="text-gray-300 sm:w-5 sm:h-5" />
      </button>
      <button
        onClick={() => map?.setView([21.1458, 79.0882], 14)}
        className="p-1.5 sm:p-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
        title="Reset view"
      >
        <Crosshair size={16} className="text-gray-300 sm:w-5 sm:h-5" />
      </button>
    </div>
  );
}

/**
 * Location info panel
 */
function LocationPanel({ location, trafficData, onViewCamera, onClose }) {
  if (!location) return null;

  const getCongestionColor = () => {
    const level = trafficData?.congestion || 'LOW';
    if (level === 'HIGH') return 'text-red-400';
    if (level === 'MEDIUM') return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-auto z-[1000] bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl p-3 sm:p-4 w-auto sm:w-80 shadow-2xl">
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm sm:text-base">
            <MapPin size={14} className="text-blue-400 flex-shrink-0 sm:w-4 sm:h-4" />
            <span className="truncate">{location.name}</span>
          </h3>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 truncate">{location.description}</p>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-white transition-colors text-lg sm:text-xl ml-2 flex-shrink-0"
        >
          ×
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-2 sm:mb-3">
        <div className="bg-gray-800 rounded-lg p-1.5 sm:p-2 text-center">
          <div className="text-base sm:text-lg font-bold text-blue-400">{location.cameras}</div>
          <div className="text-[10px] sm:text-xs text-gray-500">Cameras</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-1.5 sm:p-2 text-center">
          <div className={`text-base sm:text-lg font-bold ${getCongestionColor()}`}>
            {trafficData?.congestion || 'LOW'}
          </div>
          <div className="text-[10px] sm:text-xs text-gray-500">Status</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-1.5 sm:p-2 text-center">
          <div className="text-base sm:text-lg font-bold text-green-400">{trafficData?.total || 0}</div>
          <div className="text-[10px] sm:text-xs text-gray-500">Vehicles</div>
        </div>
      </div>

      <button
        onClick={() => onViewCamera(location)}
        className="w-full py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
      >
        <Camera size={14} className="sm:w-4 sm:h-4" />
        View Camera Feed
      </button>
    </div>
  );
}

/**
 * Legend component
 */
function MapLegend() {
  const items = [
    { color: '#ef4444', label: 'Major Junction' },
    { color: '#f97316', label: 'Commercial' },
    { color: '#22c55e', label: 'Residential' },
    { color: '#3b82f6', label: 'Hospital Zone' },
    { color: '#a855f7', label: 'Industrial' },
    { color: '#eab308', label: 'Highway' }
  ];

  return (
    <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-[1000] bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-2 sm:p-3 shadow-xl">
      <h4 className="text-[10px] sm:text-xs font-semibold text-gray-300 mb-1.5 sm:mb-2 hidden sm:block">LOCATION TYPES</h4>
      <div className="flex sm:flex-col gap-1.5 sm:gap-1 flex-wrap">
        {items.map(item => (
          <div key={item.label} className="flex items-center gap-1 sm:gap-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
            <span className="text-[9px] sm:text-xs text-gray-400 hidden sm:inline">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Map event handler component
 */
function MapEventHandler({ onMapReady }) {
  const map = useMap();
  
  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);
  
  return null;
}

/**
 * Interactive Traffic Map with clickable locations
 */
export default function InteractiveTrafficMap({ 
  trafficData,
  onLocationSelect,
  selectedLocation 
}) {
  const [currentLayer, setCurrentLayer] = useState('dark');
  const [map, setMap] = useState(null);
  const [hoveredLocation, setHoveredLocation] = useState(null);

  // Generate traffic status for each location
  const locationStatus = useMemo(() => {
    const statuses = ['LOW', 'MEDIUM', 'HIGH'];
    return NAGPUR_LOCATIONS.reduce((acc, loc) => {
      acc[loc.id] = {
        congestion: statuses[Math.floor(Math.random() * 3)],
        vehicles: Math.floor(Math.random() * 50) + 10,
        speed: Math.floor(Math.random() * 30) + 20
      };
      return acc;
    }, {});
  }, []);

  const handleMarkerClick = (location) => {
    onLocationSelect(location);
    map?.flyTo([location.lat, location.lng], 16, { duration: 0.5 });
  };

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <MapContainer
        center={[21.1458, 79.0882]}
        zoom={13}
        className="w-full h-full"
        zoomControl={false}
      >
        <MapEventHandler onMapReady={setMap} />
        
        <TileLayer
          url={TILE_LAYERS[currentLayer].url}
          attribution={TILE_LAYERS[currentLayer].attribution}
        />

        {/* Road connections */}
        {ROAD_CONNECTIONS.map((path, idx) => (
          <Polyline
            key={idx}
            positions={path}
            pathOptions={{
              color: '#3b82f6',
              weight: 3,
              opacity: 0.5,
              dashArray: '10, 10'
            }}
          />
        ))}

        {/* Location markers */}
        {NAGPUR_LOCATIONS.map((location) => {
          const isSelected = selectedLocation?.id === location.id;
          const status = locationStatus[location.id];
          const hasEmergency = trafficData?.emergency_mode && location.type === 'hospital';

          return (
            <React.Fragment key={location.id}>
              {/* Congestion radius */}
              <Circle
                center={[location.lat, location.lng]}
                radius={status.congestion === 'HIGH' ? 400 : status.congestion === 'MEDIUM' ? 300 : 200}
                pathOptions={{
                  color: status.congestion === 'HIGH' ? '#ef4444' : 
                         status.congestion === 'MEDIUM' ? '#eab308' : '#22c55e',
                  fillColor: status.congestion === 'HIGH' ? '#ef4444' : 
                             status.congestion === 'MEDIUM' ? '#eab308' : '#22c55e',
                  fillOpacity: 0.15,
                  weight: 2
                }}
              />
              
              <Marker
                position={[location.lat, location.lng]}
                icon={createMarkerIcon(location.type, isSelected, hasEmergency)}
                eventHandlers={{
                  click: () => handleMarkerClick(location),
                  mouseover: () => setHoveredLocation(location),
                  mouseout: () => setHoveredLocation(null)
                }}
              >
                <Popup className="custom-popup">
                  <div className="text-center p-1">
                    <strong className="text-gray-900">{location.name}</strong>
                    <br />
                    <span className="text-gray-600 text-xs">{location.cameras} cameras</span>
                    <br />
                    <span className={`text-xs font-medium ${
                      status.congestion === 'HIGH' ? 'text-red-600' : 
                      status.congestion === 'MEDIUM' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {status.congestion} Traffic
                    </span>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Controls */}
      <MapControls 
        map={map} 
        onLayerChange={setCurrentLayer} 
        currentLayer={currentLayer}
      />

      {/* Legend */}
      <MapLegend />

      {/* Selected location panel */}
      {selectedLocation && (
        <LocationPanel
          location={selectedLocation}
          trafficData={trafficData}
          onViewCamera={onLocationSelect}
          onClose={() => onLocationSelect(null)}
        />
      )}

      {/* City label */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-gray-900/90 px-3 py-2 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2">
          <Navigation size={14} className="text-blue-400" />
          <span className="text-sm font-medium text-white">Nagpur</span>
          <span className="text-xs text-gray-400">Maharashtra, India</span>
        </div>
      </div>

      {/* Stats overlay */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-4 bg-gray-900/90 px-4 py-2 rounded-full border border-gray-700">
        <div className="flex items-center gap-2">
          <Car size={16} className="text-blue-400" />
          <span className="text-sm text-white font-medium">{trafficData?.total || 0} vehicles</span>
        </div>
        <div className="w-px h-4 bg-gray-600"></div>
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-green-400" />
          <span className="text-sm text-white font-medium">{NAGPUR_LOCATIONS.length} locations</span>
        </div>
        <div className="w-px h-4 bg-gray-600"></div>
        <div className="flex items-center gap-2">
          <Camera size={16} className="text-purple-400" />
          <span className="text-sm text-white font-medium">
            {NAGPUR_LOCATIONS.reduce((a, l) => a + l.cameras, 0)} cameras
          </span>
        </div>
      </div>
    </div>
  );
}
