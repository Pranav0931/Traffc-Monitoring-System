import { useState, useEffect, useCallback, useRef } from 'react';

function normalizeLocalhost(url = '', ws = false) {
  const fallback = ws ? 'ws://127.0.0.1:8000/ws' : 'http://127.0.0.1:8000';
  const base = (url || fallback).replace(/\/+$/, '');
  return base
    .replace('ws://localhost:', 'ws://127.0.0.1:')
    .replace('wss://localhost:', 'wss://127.0.0.1:')
    .replace('http://localhost:', 'http://127.0.0.1:')
    .replace('https://localhost:', 'https://127.0.0.1:');
}

// Use environment variables for API URLs (works with Vite)
const WS_URL = normalizeLocalhost(import.meta.env.VITE_WS_URL, true);
const API_URL = normalizeLocalhost(import.meta.env.VITE_API_URL, false);

// Full WebSocket endpoint
const WS_TRAFFIC_URL = `${WS_URL}/traffic`;

/**
 * Custom hook for WebSocket connection to traffic monitoring backend.
 * Handles automatic reconnection and fallback to REST API.
 * Enhanced for Nagpur Smart City Traffic Monitoring.
 */
export function useTrafficData() {
  const [trafficData, setTrafficData] = useState({
    cars: 0,
    bikes: 0,
    buses: 0,
    trucks: 0,
    ambulances: 0,
    firebrigade: 0,
    total: 0,
    congestion: 'LOW',
    congestion_color: '#22c55e',
    emergency_mode: false,
    emergency_type: null,
    emergency_message: '',
    area: 'Variety Square, Nagpur',
    lat: 21.1458,
    lng: 79.0882,
    timestamp: new Date().toISOString(),
    frame_count: 0,
    fps: 0,
    // New enhanced fields
    vehicles: [],
    avg_speed: 0,
    flow_rate: 0,
    peak_hour: false,
    monitoring_points: [],
    density_score: 0,
    // ROI-based signal control fields
    lane_counts: {},
    signal_times: {},
    priority_lane: null,
    signal_mode: 'NORMAL',
    // Intersection network data
    intersections: [],
    green_corridor: [],
    // Solar power data
    solar_data: {},
    // Environmental sensor data
    environmental_data: {},
    // Alert system data
    alerts: [],
    alert_summary: {},
  });
  
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const shouldReconnectRef = useRef(true);
  const isUnmountedRef = useRef(false);

  const mergeTrafficPayload = useCallback((previous, incoming) => {
    const next = incoming || {};

    return {
      ...previous,
      ...next,
      // Keep rendering the latest valid frame even when fallback endpoints omit it.
      frame: next.frame ?? next.frame_b64 ?? previous?.frame ?? '',
    };
  }, []);

  // Fetch data via REST API (fallback)
  const fetchTrafficStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/traffic-status`);
      if (response.ok) {
        const data = await response.json();
        setTrafficData((previous) => mergeTrafficPayload(previous, data));
        setLastUpdate(Date.now());
      }
    } catch (error) {
      console.error('Failed to fetch traffic status:', error);
    }
  }, [mergeTrafficPayload]);

  // Setup WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!shouldReconnectRef.current || isUnmountedRef.current) {
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    try {
      const ws = new WebSocket(WS_TRAFFIC_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        
        // Clear polling if active
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          // Handle ping/pong
          if (event.data === 'ping') {
            ws.send('pong');
            return;
          }
          if (event.data === 'pong') {
            return;
          }
          
          const data = JSON.parse(event.data);
          setTrafficData((previous) => mergeTrafficPayload(previous, data));
          setLastUpdate(Date.now());
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');

        if (!shouldReconnectRef.current || isUnmountedRef.current) {
          return;
        }
        
        // Start polling as fallback
        if (!pollIntervalRef.current) {
          pollIntervalRef.current = setInterval(fetchTrafficStatus, 2000);
        }
        
        // Attempt to reconnect
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          setConnectionStatus('connecting');
          connectWebSocket();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };

    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setConnectionStatus('error');
      
      // Fallback to polling
      if (!pollIntervalRef.current) {
        pollIntervalRef.current = setInterval(fetchTrafficStatus, 2000);
      }
    }
  }, [fetchTrafficStatus, mergeTrafficPayload]);

  // Initialize connection
  useEffect(() => {
    isUnmountedRef.current = false;
    shouldReconnectRef.current = true;

    connectWebSocket();
    
    // Initial fetch
    fetchTrafficStatus();

    return () => {
      isUnmountedRef.current = true;
      shouldReconnectRef.current = false;

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [connectWebSocket, fetchTrafficStatus]);

  // Send ping to keep connection alive
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send('ping');
      }
    }, 25000);

    return () => clearInterval(pingInterval);
  }, []);

  return {
    trafficData,
    connectionStatus,
    lastUpdate,
    isConnected: connectionStatus === 'connected'
  };
}

/**
 * Custom hook for current time display.
 */
export function useCurrentTime() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return time;
}
