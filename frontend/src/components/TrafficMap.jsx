import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Layers, Satellite, Map as MapIcon } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Tile layer configurations
const TILE_LAYERS = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap',
    name: 'Street'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
    name: 'Satellite'
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO',
    name: 'Dark'
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap',
    name: 'Terrain'
  }
};

/**
 * Map controller for centering and zoom
 */
function MapController({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
}

/**
 * Create custom marker icon based on status
 */
function createMarkerIcon(congestion, emergencyMode, size = 32) {
  let color = '#22c55e';
  
  if (emergencyMode) {
    color = '#ef4444';
  } else {
    switch (congestion) {
      case 'LOW': color = '#22c55e'; break;
      case 'MEDIUM': color = '#eab308'; break;
      case 'HIGH': color = '#ef4444'; break;
      default: color = '#22c55e';
    }
  }

  const svgIcon = `
    <svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="${color}" opacity="0.3"/>
      <circle cx="16" cy="16" r="10" fill="${color}" opacity="0.6"/>
      <circle cx="16" cy="16" r="6" fill="${color}"/>
      ${emergencyMode ? `
        <circle cx="16" cy="16" r="14" stroke="${color}" stroke-width="2" opacity="0.8">
          <animate attributeName="r" values="8;16" dur="1s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="1;0" dur="1s" repeatCount="indefinite"/>
        </circle>
      ` : ''}
    </svg>
  `;

  return L.divIcon({
    html: `<div class="custom-marker">${svgIcon}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    className: 'custom-marker-container'
  });
}

/**
 * Monitoring point marker component
 */
function MonitoringPointMarker({ point, isMain = false }) {
  const icon = useMemo(() => 
    createMarkerIcon(point.congestion, point.emergency, isMain ? 40 : 28),
    [point.congestion, point.emergency, isMain]
  );

  return (
    <>
      <Marker position={[point.lat, point.lng]} icon={icon}>
        <Popup>
          <div className="p-2 min-w-[150px]">
            <h3 className="font-bold text-lg mb-2">{point.name}</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`font-semibold ${
                  point.congestion === 'LOW' ? 'text-green-600' :
                  point.congestion === 'MEDIUM' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {point.congestion}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Vehicles:</span>
                <span className="font-semibold">{point.vehicles}</span>
              </div>
              {point.emergency && (
                <div className="text-red-600 font-bold animate-pulse mt-2">
                  🚨 EMERGENCY ACTIVE
                </div>
              )}
            </div>
          </div>
        </Popup>
      </Marker>
      {/* Congestion radius circle */}
      <Circle
        center={[point.lat, point.lng]}
        radius={point.vehicles * 8}
        pathOptions={{
          color: point.congestion === 'LOW' ? '#22c55e' :
                 point.congestion === 'MEDIUM' ? '#eab308' : '#ef4444',
          fillColor: point.congestion === 'LOW' ? '#22c55e' :
                     point.congestion === 'MEDIUM' ? '#eab308' : '#ef4444',
          fillOpacity: 0.2,
          weight: 1
        }}
      />
    </>
  );
}

/**
 * Layer switcher component
 */
function LayerSwitcher({ currentLayer, onLayerChange }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute top-4 right-4 z-[1000]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-lg hover:bg-white transition-colors"
        title="Change map style"
      >
        <Layers size={20} className="text-gray-700" />
      </button>
      
      {isOpen && (
        <div className="absolute top-12 right-0 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-2 min-w-[120px]">
          {Object.entries(TILE_LAYERS).map(([key, layer]) => (
            <button
              key={key}
              onClick={() => {
                onLayerChange(key);
                setIsOpen(false);
              }}
              className={`
                w-full px-3 py-2 text-left text-sm rounded-md transition-colors
                flex items-center gap-2
                ${currentLayer === key ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 text-gray-700'}
              `}
            >
              {key === 'satellite' ? <Satellite size={16} /> : <MapIcon size={16} />}
              {layer.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Enhanced Traffic Map component with satellite view and multiple monitoring points.
 */
export default function TrafficMap({ 
  lat, 
  lng, 
  congestion, 
  emergencyMode, 
  area,
  monitoringPoints = [],
  densityScore = 0
}) {
  const [currentLayer, setCurrentLayer] = useState('dark');
  const position = [lat, lng];
  const tileConfig = TILE_LAYERS[currentLayer];

  // Main marker icon
  const mainIcon = useMemo(() => 
    createMarkerIcon(congestion, emergencyMode, 44),
    [congestion, emergencyMode]
  );

  // Border style based on status
  const borderColor = emergencyMode ? 'border-red-500' :
    congestion === 'LOW' ? 'border-green-500/50' :
    congestion === 'MEDIUM' ? 'border-yellow-500/50' :
    'border-red-500/50';

  return (
    <div className={`
      relative rounded-xl overflow-hidden border-2
      ${borderColor}
      ${emergencyMode ? 'emergency-border' : ''}
      transition-all duration-300
      h-full min-h-[400px]
    `}>
      <MapContainer
        center={position}
        zoom={14}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        className="rounded-xl"
      >
        <MapController center={position} zoom={14} />
        
        {/* Base tile layer */}
        <TileLayer
          key={currentLayer}
          attribution={tileConfig.attribution}
          url={tileConfig.url}
        />

        {/* Main monitoring point */}
        <Marker position={position} icon={mainIcon}>
          <Popup>
            <div className="p-3 min-w-[180px]">
              <h3 className="font-bold text-lg">{area}</h3>
              <p className="text-gray-500 text-sm mb-2">Primary Monitoring Point</p>
              <div className={`
                px-3 py-1 rounded-full text-sm font-semibold text-center
                ${emergencyMode ? 'bg-red-500 text-white animate-pulse' :
                  congestion === 'LOW' ? 'bg-green-500 text-white' :
                  congestion === 'MEDIUM' ? 'bg-yellow-500 text-black' :
                  'bg-red-500 text-white'}
              `}>
                {emergencyMode ? '🚨 EMERGENCY' : `Traffic: ${congestion}`}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Density Score: {densityScore.toFixed(0)}%
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Congestion radius around main point */}
        <Circle
          center={position}
          radius={densityScore * 5}
          pathOptions={{
            color: emergencyMode ? '#ef4444' :
                   congestion === 'LOW' ? '#22c55e' :
                   congestion === 'MEDIUM' ? '#eab308' : '#ef4444',
            fillColor: emergencyMode ? '#ef4444' :
                       congestion === 'LOW' ? '#22c55e' :
                       congestion === 'MEDIUM' ? '#eab308' : '#ef4444',
            fillOpacity: 0.15,
            weight: 2,
            dashArray: emergencyMode ? '5, 5' : undefined
          }}
        />

        {/* Other monitoring points */}
        {monitoringPoints
          .filter(p => p.lat !== lat || p.lng !== lng)
          .map((point, index) => (
            <MonitoringPointMarker key={index} point={point} />
          ))
        }
      </MapContainer>

      {/* Layer switcher */}
      <LayerSwitcher 
        currentLayer={currentLayer} 
        onLayerChange={setCurrentLayer} 
      />
      
      {/* Emergency overlay */}
      {emergencyMode && (
        <div className="absolute top-4 left-4 right-16 z-[1000]">
          <div className="bg-red-500/95 text-white px-4 py-2 rounded-lg text-center font-bold animate-pulse shadow-lg">
            🚨 EMERGENCY VEHICLE IN AREA - PRIORITY CLEARANCE
          </div>
        </div>
      )}

      {/* Map legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-black/70 backdrop-blur-sm rounded-lg p-3 text-white text-xs">
        <div className="font-semibold mb-2">Traffic Status</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Low Traffic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Heavy Traffic</span>
          </div>
        </div>
      </div>

      {/* City label */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-white">
        <div className="text-xs text-gray-400">Monitoring</div>
        <div className="font-bold">Nagpur, Maharashtra</div>
      </div>
    </div>
  );
}
