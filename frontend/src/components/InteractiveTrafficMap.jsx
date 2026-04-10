import React, { useState, useCallback } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.75rem'
};

/**
 * Interactive Traffic Map using Google Maps API
 */
export default function InteractiveTrafficMap({ 
  trafficData,
  onLocationSelect,
  selectedLocation 
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const [map, setMap] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);

  const onLoad = useCallback(function callback(map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  // Use the live coordinates from backend payload
  const center = {
    lat: trafficData?.lat || 21.1458,
    lng: trafficData?.lng || 79.0882
  };

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 border-2 border-red-500 rounded-xl text-white">
        Error loading Google Maps. Check your API key.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 border-2 border-gray-700 rounded-xl text-white animate-pulse">
        Loading Google Maps...
      </div>
    );
  }

  // Derive marker color from congestion level
  let iconUrl = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
  if (trafficData?.emergency_mode) {
    iconUrl = "http://maps.google.com/mapfiles/ms/icons/purple-dot.png";
  } else if (trafficData?.congestion === 'HIGH') {
    iconUrl = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
  } else if (trafficData?.congestion === 'MEDIUM') {
    iconUrl = "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
  }

  return (
    <div className={`relative w-full h-full rounded-xl overflow-hidden border-2 flex-1 ${trafficData?.emergency_mode ? 'border-red-500 emergency-border' : 'border-gray-700'}`}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={16}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          mapId: 'traffic_monitor_map',
          disableDefaultUI: false,
          zoomControl: true,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
              featureType: "administrative.locality",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }],
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#38414e" }],
            },
            {
              featureType: "road",
              elementType: "geometry.stroke",
              stylers: [{ color: "#212a37" }],
            },
            {
              featureType: "road",
              elementType: "labels.text.fill",
              stylers: [{ color: "#9ca5b3" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry",
              stylers: [{ color: "#746855" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry.stroke",
              stylers: [{ color: "#1f2835" }],
            },
            {
              featureType: "road.highway",
              elementType: "labels.text.fill",
              stylers: [{ color: "#f3d19c" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#17263c" }],
            },
            {
              featureType: "water",
              elementType: "labels.text.fill",
              stylers: [{ color: "#515c6d" }],
            },
            {
              featureType: "water",
              elementType: "labels.text.stroke",
              stylers: [{ color: "#17263c" }],
            },
          ],
        }}
      >
        <Marker
          position={center}
          icon={{ url: iconUrl }}
          onClick={() => setInfoOpen(true)}
        >
          {infoOpen && (
            <InfoWindow
              position={center}
              onCloseClick={() => setInfoOpen(false)}
            >
              <div className="p-2 text-black min-w-[150px]">
                <h3 className="font-bold text-md mb-1">{trafficData?.area || 'Intersection'}</h3>
                <div className="text-sm">
                  <p><strong>Status:</strong> {trafficData?.congestion || 'LOW'}</p>
                  <p><strong>Total Vehicles:</strong> {trafficData?.total || 0}</p>
                  <p><strong>Priority Lane:</strong> {trafficData?.priority_lane || 'None'}</p>
                  <p><strong>Mode:</strong> {trafficData?.signal_mode || 'NORMAL'}</p>
                </div>
              </div>
            </InfoWindow>
          )}
        </Marker>
      </GoogleMap>
    </div>
  );
}
