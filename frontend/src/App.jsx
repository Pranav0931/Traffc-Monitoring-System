import React, { useState, useMemo } from 'react';
import { 
  Header, VehicleCounters, CongestionBadge, EmergencyPanel,
  TrafficMap, AlertsPanel, StatsPanel, LiveCameraFeed,
  SignalControlPanel, TrafficPrediction, AdvancedStats, CameraModal,
  SolarPowerPanel, EnvironmentalPanel, SurveillanceModule, IntersectionDetailPanel
} from './components';
import { useTrafficData } from './hooks/useTrafficData';
import {
  LayoutDashboard, Map, Sun, Wind, Camera, Bell, Activity,
  Radio, ChevronRight, Maximize2
} from 'lucide-react';

/**
 * Main App - AI Smart Traffic Management System v2.0.0
 * ------------------------------------------------------------
 * Tabbed layout: Dashboard, Map, Solar, Environment, Surveillance, Alerts
 * Orchestrates real-time data flow from WebSocket to components.
 */
function App() {
  const { trafficData, connectionStatus, lastUpdate } = useTrafficData();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedIntersection, setSelectedIntersection] = useState(null);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'solar', label: 'Solar', icon: Sun },
    { id: 'environment', label: 'Environment', icon: Wind },
    { id: 'surveillance', label: 'Surveillance', icon: Camera },
    { id: 'alerts', label: 'Alerts', icon: Bell },
  ];

  // Find intersection details when one is selected on the map
  const intersectionDetail = useMemo(() => {
    if (!selectedIntersection || !trafficData?.intersections) return null;
    return trafficData.intersections.find(i => i.id === selectedIntersection.id) || null;
  }, [selectedIntersection, trafficData?.intersections]);

  // Alert count for tab badge
  const alertCount = trafficData?.alerts?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <Header 
        isConnected={connectionStatus === 'connected'}
        lastUpdate={lastUpdate}
        area={trafficData?.area}
      />

      {/* Emergency Banner */}
      {trafficData?.emergency_mode && (
        <EmergencyPanel trafficData={trafficData} />
      )}

      {/* Tab Navigation */}
      <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-[1920px] mx-auto px-3 sm:px-4 lg:px-6">
          <nav className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-thin" aria-label="System Tabs">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all
                    ${activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }
                  `}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {/* Alert badge */}
                  {tab.id === 'alerts' && alertCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[18px] text-center">
                      {alertCount > 20 ? '20+' : alertCount}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Connection Status */}
            <div className="ml-auto flex items-center gap-2 flex-shrink-0">
              <span className={`flex items-center gap-1.5 text-xs ${
                connectionStatus === 'connected' ? 'text-green-400' :
                connectionStatus === 'connecting' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                <Radio size={12} className={connectionStatus === 'connected' ? 'animate-pulse' : ''} />
                <span className="hidden md:inline capitalize">{connectionStatus}</span>
              </span>
            </div>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        
        {/* ============================================================= */}
        {/* DASHBOARD TAB */}
        {/* ============================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Top Row: Vehicle Counters + Congestion */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-3">
                <VehicleCounters trafficData={trafficData} />
              </div>
              <div>
                <CongestionBadge trafficData={trafficData} />
              </div>
            </div>

            {/* Middle Row: Map + Signal Control + Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Map */}
              <div className="lg:col-span-5 h-[350px] sm:h-[400px] lg:h-[450px]">
                <TrafficMap
                  trafficData={trafficData}
                  onLocationSelect={setSelectedIntersection}
                  selectedLocation={selectedIntersection}
                />
              </div>
              
              {/* Signal Control */}
              <div className="lg:col-span-4">
                <SignalControlPanel trafficData={trafficData} />
              </div>

              {/* Alerts */}
              <div className="lg:col-span-3 max-h-[450px]">
                <AlertsPanel 
                  emergencyMode={trafficData?.emergency_mode}
                  alerts={trafficData?.alerts}
                  alertSummary={trafficData?.alert_summary}
                />
              </div>
            </div>

            {/* Bottom Row: Camera + Solar + Environment */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Live Camera Feed */}
              <div>
                <LiveCameraFeed 
                  trafficData={trafficData}
                  onExpand={() => setCameraModalOpen(true)}
                />
              </div>

              {/* Solar (compact) */}
              <div>
                <SolarPowerPanel solarData={trafficData?.solar_data} compact />
              </div>

              {/* Environment (compact) */}
              <div>
                <EnvironmentalPanel environmentalData={trafficData?.environmental_data} compact />
              </div>
            </div>

            {/* Stats and Prediction */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AdvancedStats trafficData={trafficData} />
              <TrafficPrediction trafficData={trafficData} />
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* MAP TAB */}
        {/* ============================================================= */}
        {activeTab === 'map' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3 h-[calc(100vh-180px)]">
              <TrafficMap
                trafficData={trafficData}
                onLocationSelect={setSelectedIntersection}
                selectedLocation={selectedIntersection}
              />
            </div>
            <div className="space-y-4">
              <IntersectionDetailPanel 
                intersection={intersectionDetail}
                solarData={trafficData?.solar_data}
                environmentalData={trafficData?.environmental_data}
              />
              {/* Network overview */}
              <div className="card">
                <div className="card-header">
                  <Activity size={18} className="text-purple-400" />
                  <span>Network</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-gray-800/50 rounded-lg p-2">
                    <div className="text-gray-500">Total</div>
                    <div className="text-xl font-bold text-white">
                      {trafficData?.intersections?.length || 0}
                    </div>
                  </div>
                  <div className="bg-red-500/10 rounded-lg p-2">
                    <div className="text-gray-500">Congested</div>
                    <div className="text-xl font-bold text-red-400">
                      {trafficData?.intersections?.filter(i => i.congestion_level === 'HIGH').length || 0}
                    </div>
                  </div>
                  <div className="bg-purple-500/10 rounded-lg p-2">
                    <div className="text-gray-500">Emergency</div>
                    <div className="text-xl font-bold text-purple-400">
                      {trafficData?.intersections?.filter(i => i.emergency_active).length || 0}
                    </div>
                  </div>
                </div>
                {/* Green corridor info */}
                {trafficData?.green_corridor?.length > 0 && (
                  <div className="mt-3 bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-xs text-blue-300">
                      Green Corridor Active — {trafficData.green_corridor[0]?.intersection_ids?.length || 0} intersections
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* SOLAR TAB */}
        {/* ============================================================= */}
        {activeTab === 'solar' && (
          <SolarPowerPanel solarData={trafficData?.solar_data} />
        )}

        {/* ============================================================= */}
        {/* ENVIRONMENT TAB */}
        {/* ============================================================= */}
        {activeTab === 'environment' && (
          <EnvironmentalPanel environmentalData={trafficData?.environmental_data} />
        )}

        {/* ============================================================= */}
        {/* SURVEILLANCE TAB */}
        {/* ============================================================= */}
        {activeTab === 'surveillance' && (
          <SurveillanceModule 
            trafficData={trafficData}
            intersections={trafficData?.intersections}
          />
        )}

        {/* ============================================================= */}
        {/* ALERTS TAB */}
        {/* ============================================================= */}
        {activeTab === 'alerts' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <AlertsPanel 
                emergencyMode={trafficData?.emergency_mode}
                alerts={trafficData?.alerts}
                alertSummary={trafficData?.alert_summary}
              />
            </div>
            <div className="space-y-4">
              {/* Alert Summary Card */}
              <div className="card">
                <div className="card-header">
                  <Activity size={18} className="text-blue-400" />
                  <span>Alert Summary</span>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Total Active</span>
                    <span className="text-white font-bold">{trafficData?.alert_summary?.total_active || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Total Generated</span>
                    <span className="text-white font-bold">{trafficData?.alert_summary?.total_generated || 0}</span>
                  </div>
                  <div className="border-t border-gray-700 pt-2 mt-2 space-y-1">
                    {['CRITICAL', 'WARNING', 'INFO'].map(severity => {
                      const count = trafficData?.alert_summary?.severity_breakdown?.[severity] || 0;
                      const colors = { CRITICAL: 'text-red-400', WARNING: 'text-yellow-400', INFO: 'text-blue-400' };
                      return (
                        <div key={severity} className="flex items-center justify-between text-xs">
                          <span className={colors[severity]}>{severity}</span>
                          <span className="text-white font-medium">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              {/* Mini solar status */}
              <SolarPowerPanel solarData={trafficData?.solar_data} compact />
            </div>
          </div>
        )}
      </main>

      {/* Camera Modal */}
      {cameraModalOpen && (
        <CameraModal 
          isOpen={cameraModalOpen}
          location={selectedIntersection || { id: 'variety_square', name: trafficData?.area || 'Variety Square, Nagpur', lat: trafficData?.lat || 21.1458, lng: trafficData?.lng || 79.0882 }}
          trafficData={trafficData}
          onClose={() => setCameraModalOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
