import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, TrafficLayer } from '@react-google-maps/api';

// Google Maps API key — loaded from env or fallback
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Dark mode map styles (sleek command-center aesthetic)
const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d0d1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5a5a7a' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#8a8aaa' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#5a5a7a' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1a2a1a' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#3a6a3a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a4a' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a1a3a' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6a6a8a' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3a3a5a' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#2a2a4a' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#8a8aaa' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1a1a3a' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#5a5a7a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a0a2a' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3a3a6a' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#0a0a1a' }] },
];

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.75rem',
};

const mapOptions = {
  styles: DARK_MAP_STYLES,
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  gestureHandling: 'greedy',
};

// Congestion color mapping
const getCongestionColor = (level) => {
  switch (level) {
    case 'HIGH': return '#ef4444';
    case 'MEDIUM': return '#eab308';
    case 'LOW': default: return '#22c55e';
  }
};

// Create SVG marker icon for Google Maps
const createMarkerIcon = (color, isEmergency = false, isCorridor = false) => {
  const size = isEmergency ? 22 : 16;
  const pulseSize = size + 12;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${pulseSize}" height="${pulseSize}" viewBox="0 0 ${pulseSize} ${pulseSize}">
      ${(isEmergency || isCorridor) ? `
        <circle cx="${pulseSize/2}" cy="${pulseSize/2}" r="${pulseSize/2 - 1}" fill="${color}" opacity="0.25">
          <animate attributeName="r" values="${size/2};${pulseSize/2 - 1}" dur="1.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.4;0" dur="1.5s" repeatCount="indefinite"/>
        </circle>
      ` : ''}
      <circle cx="${pulseSize/2}" cy="${pulseSize/2}" r="${size/2}" fill="${color}" stroke="white" stroke-width="2.5"/>
      <circle cx="${pulseSize/2}" cy="${pulseSize/2}" r="${size/2 - 4}" fill="white" opacity="0.3"/>
    </svg>
  `;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: { width: pulseSize, height: pulseSize },
    anchor: { x: pulseSize / 2, y: pulseSize / 2 },
  };
};

/**
 * Google Maps Traffic Map — Live, real-time, WebSocket-driven.
 * Replaces Leaflet map with Google Maps JavaScript API.
 * Markers update color and info based on congestion, signal state, and emergencies.
 */
export default function GoogleTrafficMap({
  trafficData,
  onLocationSelect,
  selectedLocation,
}) {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const mapRef = useRef(null);

  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    id: 'traffic-map-script',
  });

  // Center coordinates
  const center = useMemo(() => ({
    lat: trafficData?.lat || 21.1458,
    lng: trafficData?.lng || 79.0882,
  }), [trafficData?.lat, trafficData?.lng]);

  // Build intersection markers from live data
  const intersections = useMemo(() => {
    if (trafficData?.intersections?.length > 0) {
      return trafficData.intersections;
    }
    // Fallback: single primary intersection
    return [{
      id: 'primary',
      name: trafficData?.area || 'Intersection',
      lat: trafficData?.lat || 21.1458,
      lng: trafficData?.lng || 79.0882,
      congestion_level: trafficData?.congestion || 'LOW',
      vehicle_count: trafficData?.total || 0,
      signal_mode: trafficData?.signal_mode || 'NORMAL',
      emergency_active: trafficData?.emergency_mode || false,
      is_green_corridor: false,
      lane_counts: trafficData?.lane_counts || {},
      signal_times: trafficData?.signal_times || {},
      priority_lane: trafficData?.priority_lane || null,
    }];
  }, [trafficData]);

  // Green corridor path
  const corridorPath = useMemo(() => {
    if (trafficData?.green_corridor?.length > 0) {
      const corridor = trafficData.green_corridor[0];
      return corridor.route_coords?.map(c => ({ lat: c.lat, lng: c.lng })) || [];
    }
    return [];
  }, [trafficData?.green_corridor]);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    // Auto-fit bounds to show all intersections
    if (intersections.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      intersections.forEach(i => bounds.extend({ lat: i.lat, lng: i.lng }));
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    }
  }, [intersections]);

  const handleMarkerClick = useCallback((intersection) => {
    setSelectedMarker(intersection);
    if (onLocationSelect) {
      onLocationSelect({
        id: intersection.id,
        name: intersection.name,
        lat: intersection.lat,
        lng: intersection.lng,
      });
    }
  }, [onLocationSelect]);

  // Close info window when selected location changes externally
  useEffect(() => {
    if (!selectedLocation) {
      setSelectedMarker(null);
    }
  }, [selectedLocation]);

  // Draw green corridor polyline
  useEffect(() => {
    if (!mapRef.current || corridorPath.length < 2) return;
    const polyline = new window.google.maps.Polyline({
      path: corridorPath,
      geodesic: true,
      strokeColor: '#3b82f6',
      strokeOpacity: 0.8,
      strokeWeight: 5,
    });
    polyline.setMap(mapRef.current);
    return () => polyline.setMap(null);
  }, [corridorPath]);

  // If API key is missing, show fallback message pointing to Leaflet
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="relative w-full h-full rounded-xl overflow-hidden border-2 border-gray-700 bg-gray-900 flex items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <div className="text-4xl mb-4">🗺️</div>
          <h3 className="text-lg font-bold text-white mb-2">Google Maps API Key Required</h3>
          <p className="text-sm text-gray-400 mb-4">
            Add <code className="text-blue-400 bg-gray-800 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> to your 
            <code className="text-blue-400 bg-gray-800 px-1 rounded">.env.development</code> file.
          </p>
          <p className="text-xs text-gray-500">
            The Leaflet/OpenStreetMap fallback is active on the Map tab.
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="relative w-full h-full rounded-xl overflow-hidden border-2 border-red-700 bg-gray-900 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-4xl mb-3">❌</div>
          <p className="text-red-400 font-medium">Failed to load Google Maps</p>
          <p className="text-xs text-gray-500 mt-1">{loadError.message}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="relative w-full h-full rounded-xl overflow-hidden border-2 border-gray-700 bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full rounded-xl overflow-hidden border-2 flex-1 ${
      trafficData?.emergency_mode ? 'border-red-500' : 'border-gray-700'
    }`}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={14}
        options={mapOptions}
        onLoad={onMapLoad}
      >
        {/* Live Google Traffic Layer */}
        <TrafficLayer />

        {/* Intersection Markers — update in real time */}
        {intersections.map((intersection) => {
          const color = intersection.emergency_active
            ? '#a855f7'
            : intersection.is_green_corridor
              ? '#3b82f6'
              : getCongestionColor(intersection.congestion_level);

          return (
            <Marker
              key={intersection.id}
              position={{ lat: intersection.lat, lng: intersection.lng }}
              icon={createMarkerIcon(color, intersection.emergency_active, intersection.is_green_corridor)}
              onClick={() => handleMarkerClick(intersection)}
              title={intersection.name}
            />
          );
        })}

        {/* InfoWindow for selected marker */}
        {selectedMarker && (
          <InfoWindow
            position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
            onCloseClick={() => setSelectedMarker(null)}
            options={{
              pixelOffset: new window.google.maps.Size(0, -20),
            }}
          >
            <div style={{
              background: '#1f2937',
              color: 'white',
              padding: '10px 14px',
              borderRadius: '10px',
              minWidth: '200px',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>
              <h3 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: 'white' }}>
                {selectedMarker.name}
              </h3>
              <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Status</span>
                  <span style={{
                    color: getCongestionColor(selectedMarker.congestion_level),
                    fontWeight: 600,
                  }}>
                    {selectedMarker.congestion_level}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Vehicles</span>
                  <span style={{ fontWeight: 500 }}>{selectedMarker.vehicle_count || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Signal</span>
                  <span style={{ fontWeight: 500 }}>{selectedMarker.signal_mode || 'NORMAL'}</span>
                </div>
                {/* Lane-level data if available */}
                {selectedMarker.lane_counts && Object.keys(selectedMarker.lane_counts).length > 0 && (
                  <div style={{ marginTop: '8px', borderTop: '1px solid #374151', paddingTop: '6px' }}>
                    <div style={{ color: '#6b7280', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Lane Breakdown
                    </div>
                    {Object.entries(selectedMarker.lane_counts).map(([laneId, count]) => (
                      <div key={laneId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span style={{ color: laneId === selectedMarker.priority_lane ? '#ef4444' : '#9ca3af' }}>
                          {laneId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          {laneId === selectedMarker.priority_lane ? ' ⬤' : ''}
                        </span>
                        <span style={{ fontWeight: 500 }}>
                          {count} → {selectedMarker.signal_times?.[laneId] || '—'}s
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {selectedMarker.emergency_active && (
                  <p style={{ color: '#ef4444', fontWeight: 700, marginTop: '6px' }}>
                    🚨 Emergency ({selectedMarker.emergency_type})
                  </p>
                )}
                {selectedMarker.is_green_corridor && (
                  <p style={{ color: '#3b82f6', fontWeight: 700, marginTop: '6px' }}>
                    🟦 Green Corridor Active
                  </p>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Legend overlay */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-gray-900/90 backdrop-blur-sm rounded-lg p-2 text-xs text-gray-300 space-y-1 border border-gray-700/50">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span>Smooth Flow</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <span>Moderate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span>Congested</span>
        </div>
        {corridorPath.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>Green Corridor</span>
          </div>
        )}
      </div>

      {/* Intersection count badge */}
      <div className="absolute top-3 right-3 z-[1000] bg-gray-900/90 backdrop-blur-sm rounded-lg px-2.5 py-1 text-xs text-gray-300 border border-gray-700/50 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        {intersections.length} intersections • LIVE
      </div>
    </div>
  );
}
