import React, { useState, useMemo, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Circle, Polyline } from '@react-google-maps/api';
import { MapContainer, TileLayer, Marker as LeafletMarker, Popup as LeafletPopup, Circle as LeafletCircle, Polyline as LeafletPolyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const LIBRARIES = ["places"];
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
const hasGoogleMapsKey = API_KEY && API_KEY !== 'PLACEHOLDER_KEY' && API_KEY !== '';

const getMarkerIcon = (intersection) => {
  let color = '#22c55e'; // default green
  if (intersection.emergency_active) color = '#a855f7';
  else if (intersection.is_green_corridor) color = '#3b82f6';
  else if (intersection.congestion_level === 'HIGH') color = '#ef4444';
  else if (intersection.congestion_level === 'MEDIUM') color = '#eab308';
  
  return {
    path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
    fillColor: color,
    fillOpacity: 0.9,
    scale: intersection.emergency_active ? 12 : 10,
    strokeColor: "white",
    strokeWeight: 2,
  };
};

const getZoneColor = (congestion) => {
  switch (congestion) {
    case 'HIGH': return '#ef4444';
    case 'MEDIUM': return '#eab308';
    default: return '#22c55e';
  }
};

// Custom Leaflet DivIcon creator to avoid asset-bundler errors and keep theme consistent
const createLeafletMarkerIcon = (intersection) => {
  let color = '#22c55e'; // default green
  if (intersection.emergency_active) color = '#a855f7';
  else if (intersection.is_green_corridor) color = '#3b82f6';
  else if (intersection.congestion_level === 'HIGH') color = '#ef4444';
  else if (intersection.congestion_level === 'MEDIUM') color = '#eab308';
  
  const size = intersection.emergency_active ? 20 : 16;
  const html = `
    <div style="
      position: relative;
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
    ">
      ${(intersection.emergency_active || intersection.is_green_corridor) ? `
        <div style="
          position: absolute;
          top: -6px;
          left: -6px;
          right: -6px;
          bottom: -6px;
          border-radius: 50%;
          border: 2px solid ${color};
          opacity: 0.8;
          animation: marker-pulse 1.5s ease-in-out infinite;
        " class="animate-ping"></div>
      ` : ''}
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

export default function TrafficMap({ 
  trafficData,
  onLocationSelect,
  selectedLocation 
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: API_KEY,
    libraries: LIBRARIES,
  });

  const [map, setMap] = useState(null);
  const [activePopup, setActivePopup] = useState(null);

  const center = {
    lat: trafficData?.lat || 21.1458,
    lng: trafficData?.lng || 79.0882
  };

  const intersections = useMemo(() => {
    if (trafficData?.intersections && trafficData.intersections.length > 0) {
      return trafficData.intersections;
    }
    return [{
      id: 'primary',
      name: trafficData?.area || 'Variety Square, Nagpur',
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

  const corridorPath = useMemo(() => {
    if (trafficData?.green_corridor && trafficData.green_corridor.length > 0) {
      const corridor = trafficData.green_corridor[0];
      return corridor.route_coords?.map(c => ({ lat: c.lat, lng: c.lng })) || [];
    }
    return [];
  }, [trafficData?.green_corridor]);

  const onLoad = useCallback(function callback(map) {
    if (intersections.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      intersections.forEach(({ lat, lng }) => bounds.extend({ lat, lng }));
      map.fitBounds(bounds);
    }
    setMap(map);
  }, [intersections]);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  // RENDER LEAFLET IF NO GOOGLE MAPS API KEY IS PROVIDED
  if (!hasGoogleMapsKey) {
    return (
      <div className={`relative w-full h-full rounded-xl overflow-hidden border-2 flex flex-col ${
        trafficData?.emergency_mode ? 'border-red-500 emergency-border' : 'border-gray-700'
      }`}>
        
        {/* Video Overlay inside Map Container */}
        {trafficData?.frame && (
          <div className="w-full h-[45%] bg-black relative border-b-2 border-gray-700 z-10">
             <img 
                src={`data:image/jpeg;base64,${trafficData.frame}`} 
                className="w-full h-full object-contain"
                alt="Live Traffic Feed with ROI"
             />
             <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 text-xs font-bold rounded animate-pulse z-[1000]">
               🔴 LIVE CAMERA ROI FEED
             </div>
          </div>
        )}

        {/* Map Section */}
        <div className={`relative w-full ${trafficData?.frame ? 'h-[55%]' : 'h-full'}`}>
          <MapContainer 
            center={[center.lat, center.lng]} 
            zoom={15} 
            scrollWheelZoom={true}
            style={{ width: '100%', height: '100%', zIndex: 0 }}
          >
            {/* Dark Mode Map Tiles */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            
            {intersections.map((intersection) => (
              <React.Fragment key={intersection.id}>
                <LeafletCircle
                  center={[intersection.lat, intersection.lng]}
                  radius={200}
                  pathOptions={{
                    fillColor: getZoneColor(intersection.congestion_level),
                    fillOpacity: 0.15,
                    color: getZoneColor(intersection.congestion_level),
                    opacity: 0.5,
                    weight: 1,
                  }}
                />
                
                <LeafletMarker
                  position={[intersection.lat, intersection.lng]}
                  icon={createLeafletMarkerIcon(intersection)}
                  eventHandlers={{
                    click: () => {
                      if (onLocationSelect) onLocationSelect(intersection);
                    },
                  }}
                >
                  <LeafletPopup>
                    <div className="text-gray-900 min-w-[200px] p-1 font-sans">
                      <h3 className="font-bold text-sm mb-2">{intersection.name}</h3>
                      <div className="space-y-1 text-xs">
                        <p className="flex justify-between m-0">
                          <span className="text-gray-500">Status:</span>
                          <span style={{ color: getZoneColor(intersection.congestion_level) }} className="font-bold">
                            {intersection.congestion_level}
                          </span>
                        </p>
                        <p className="flex justify-between m-0">
                          <span className="text-gray-500">Total Vehicles:</span>
                          <span className="font-bold">{intersection.vehicle_count || 0}</span>
                        </p>
                        <p className="flex justify-between border-b pb-1 m-0">
                          <span className="text-gray-500">Signal Mode:</span>
                          <span className="font-bold text-blue-600">{intersection.signal_mode || 'NORMAL'}</span>
                        </p>
                        
                        {intersection.priority_lane && (
                          <div className="mt-2 p-1.5 bg-green-50 border border-green-200 rounded">
                            <p className="font-bold text-green-600 text-center text-[10px] m-0">
                              🟢 {intersection.priority_lane.replace('_', ' ').toUpperCase()} ACTIVE
                            </p>
                            <p className="text-center font-bold text-gray-800 text-sm m-0">
                              Green Time: {intersection.signal_times?.[intersection.priority_lane] || 0}s
                            </p>
                          </div>
                        )}

                        {intersection.emergency_active && (
                          <p className="text-red-500 font-bold mt-2 animate-pulse text-center bg-red-50 rounded py-1 border border-red-200 m-0">
                            🚨 Emergency Mode
                          </p>
                        )}
                      </div>
                    </div>
                  </LeafletPopup>
                </LeafletMarker>
              </React.Fragment>
            ))}
            
            {corridorPath.length > 1 && (
              <LeafletPolyline
                positions={corridorPath.map(c => [c.lat, c.lng])}
                pathOptions={{
                  color: '#3b82f6',
                  opacity: 0.8,
                  weight: 5,
                }}
              />
            )}
          </MapContainer>
          
          {/* Legend */}
          <div className="absolute bottom-3 left-3 z-[1000] bg-gray-900/90 rounded-lg p-2 text-xs text-gray-300 border border-gray-700 shadow-lg pointer-events-none">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span>Smooth Flow</span>
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span>Moderate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Congested</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RENDER GOOGLE MAPS IF KEY IS PRESENT
  if (loadError) return <div className="text-red-500 bg-gray-900 p-4 rounded-xl flex h-full items-center justify-center font-bold">Error loading Google Maps</div>;
  if (!isLoaded) return <div className="text-white bg-gray-900 p-4 rounded-xl flex h-full items-center justify-center font-bold">Loading Live Maps...</div>;

  return (
    <div className={`relative w-full h-full rounded-xl overflow-hidden border-2 flex flex-col ${
      trafficData?.emergency_mode ? 'border-red-500 emergency-border' : 'border-gray-700'
    }`}>
      
      {/* Video Overlay inside Map Container */}
      {trafficData?.frame && (
        <div className="w-full h-[45%] bg-black relative border-b-2 border-gray-700">
           <img 
              src={`data:image/jpeg;base64,${trafficData.frame}`} 
              className="w-full h-full object-contain"
              alt="Live Traffic Feed with ROI"
           />
           <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 text-xs font-bold rounded animate-pulse">
             🔴 LIVE CAMERA ROI FEED
           </div>
        </div>
      )}

      {/* Map Section */}
      <div className={`relative w-full ${trafficData?.frame ? 'h-[55%]' : 'h-full'}`}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={center}
          zoom={15}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            disableDefaultUI: false,
            styles: [
              { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
              { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
              { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
              { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
              { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
              { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
              { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
              { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
              { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
              { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
            ]
          }}
        >
          {intersections.map((intersection) => (
            <React.Fragment key={intersection.id}>
              <Circle
                center={{ lat: intersection.lat, lng: intersection.lng }}
                radius={200}
                options={{
                  fillColor: getZoneColor(intersection.congestion_level),
                  fillOpacity: 0.15,
                  strokeColor: getZoneColor(intersection.congestion_level),
                  strokeOpacity: 0.5,
                  strokeWeight: 1,
                }}
              />
              
              <Marker
                position={{ lat: intersection.lat, lng: intersection.lng }}
                icon={window.google ? getMarkerIcon(intersection) : null}
                onClick={() => {
                  setActivePopup(intersection.id);
                  if (onLocationSelect) onLocationSelect(intersection);
                }}
              />
              
              {activePopup === intersection.id && (
                <InfoWindow
                  position={{ lat: intersection.lat, lng: intersection.lng }}
                  onCloseClick={() => setActivePopup(null)}
                >
                  <div className="text-gray-900 min-w-[200px] p-1">
                    <h3 className="font-bold text-sm mb-2">{intersection.name}</h3>
                    <div className="space-y-1 text-xs">
                      <p className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span style={{ color: getZoneColor(intersection.congestion_level) }} className="font-bold">
                          {intersection.congestion_level}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-gray-500">Total Vehicles:</span>
                        <span className="font-bold">{intersection.vehicle_count || 0}</span>
                      </p>
                      <p className="flex justify-between border-b pb-1">
                        <span className="text-gray-500">Signal Mode:</span>
                        <span className="font-bold text-blue-600">{intersection.signal_mode || 'NORMAL'}</span>
                      </p>
                      
                      {intersection.priority_lane && (
                        <div className="mt-2 p-1.5 bg-green-50 border border-green-200 rounded">
                          <p className="font-bold text-green-600 text-center text-[10px]">
                            🟢 {intersection.priority_lane.replace('_', ' ').toUpperCase()} ACTIVE
                          </p>
                          <p className="text-center font-bold text-gray-800 text-sm">
                            Green Time: {intersection.signal_times?.[intersection.priority_lane] || 0}s
                          </p>
                        </div>
                      )}

                      {intersection.emergency_active && (
                        <p className="text-red-500 font-bold mt-2 animate-pulse text-center bg-red-50 rounded py-1 border border-red-200">
                          🚨 Emergency Mode
                        </p>
                      )}
                    </div>
                  </div>
                </InfoWindow>
              )}
            </React.Fragment>
          ))}
          
          {corridorPath.length > 1 && (
            <Polyline
              path={corridorPath}
              options={{
                strokeColor: '#3b82f6',
                strokeOpacity: 0.8,
                strokeWeight: 5,
              }}
            />
          )}
        </GoogleMap>
        
        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-10 bg-gray-900/90 rounded-lg p-2 text-xs text-gray-300 border border-gray-700 shadow-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span>Smooth Flow</span>
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span>Moderate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Congested</span>
          </div>
        </div>
      </div>
    </div>
  );
}
