import React, { useState, useCallback } from 'react';
import { 
  Header, 
  VehicleCounters, 
  CongestionBadge, 
  EmergencyPanel, 
  LiveCameraFeed,
  AdvancedStats,
  CameraModal,
  InteractiveTrafficMap,
  AlertsPanel,
  TrafficPrediction
} from './components';
import { useTrafficData } from './hooks/useTrafficData';
import { 
  LayoutDashboard, Map, Camera, Bell, TrendingUp, 
  Settings, HelpCircle, Menu, X
} from 'lucide-react';

/**
 * Main Dashboard Application.
 * AI-Based Real-time Traffic Monitoring Command Center for Nagpur Smart City.
 */
function App() {
  const { trafficData, connectionStatus, lastUpdate, isConnected } = useTrafficData();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Handle location selection from map
  const handleLocationSelect = useCallback((location) => {
    setSelectedLocation(location);
    if (location) {
      setShowCameraModal(true);
    }
  }, []);

  // Close camera modal
  const handleCloseCameraModal = useCallback(() => {
    setShowCameraModal(false);
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'Traffic Map', icon: Map },
    { id: 'cameras', label: 'Live Cameras', icon: Camera },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'prediction', label: 'AI Prediction', icon: TrendingUp }
  ];

  return (
    <div className={`
      min-h-screen bg-traffic-dark flex flex-col lg:flex-row
      ${trafficData.emergency_mode ? 'emergency-active' : ''}
    `}>
      {/* Mobile Header with menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-sm">🚦</span>
          </div>
          <span className="font-bold text-white text-sm">Traffic AI</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-gray-800 rounded-lg text-gray-400"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile overlay when sidebar is open */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed lg:relative z-40 h-screen bg-gray-900 border-r border-gray-800
        transition-all duration-300 flex flex-col
        ${sidebarOpen ? 'w-64 translate-x-0' : 'w-16 -translate-x-full lg:translate-x-0'}
        top-0 left-0
      `}>
        {/* Logo - hidden on mobile (shown in mobile header) */}
        <div className="p-4 border-b border-gray-800 hidden lg:block">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-xl">🚦</span>
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-sm font-bold text-white">Traffic AI</h1>
                <p className="text-xs text-gray-500">Nagpur Smart City</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 mt-16 lg:mt-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-lg
                  transition-all duration-200 group
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'}
                `}
              >
                <Icon size={20} className={isActive ? '' : 'group-hover:scale-110 transition-transform'} />
                <span className="text-sm font-medium lg:hidden xl:inline">{tab.label}</span>
                {sidebarOpen && (
                  <span className="text-sm font-medium hidden lg:inline xl:hidden">{tab.label}</span>
                )}
                {tab.id === 'alerts' && trafficData.emergency_mode && (
                  <span className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Status indicator */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-500 lg:hidden xl:inline">
              {isConnected ? 'System Online' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Toggle button - desktop only */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-gray-800 border border-gray-700 rounded-full items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          {sidebarOpen ? <X size={12} /> : <Menu size={12} />}
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0 main-container">
        {/* Top Header Bar */}
        <Header 
          isConnected={isConnected}
          lastUpdate={lastUpdate}
          area={trafficData.area}
        />

        {/* Emergency Banner */}
        {trafficData.emergency_mode && (
          <div className="mx-3 sm:mx-6 mt-4 emergency-flash rounded-xl p-3 sm:p-4 text-center">
            <div className="flex items-center justify-center gap-2 sm:gap-3 text-white font-bold text-sm sm:text-xl flex-wrap">
              <span className="animate-pulse">🚨</span>
              <span>EMERGENCY PRIORITY MODE ACTIVE</span>
              <span className="animate-pulse">🚨</span>
            </div>
            <p className="text-white/80 mt-1 text-xs sm:text-base">{trafficData.emergency_message}</p>
          </div>
        )}

        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
            {/* Advanced Stats */}
            <AdvancedStats data={trafficData} />

            {/* Main Grid - Stack on mobile, 2 cols on tablet, 3 cols on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {/* Left - Vehicle Detection */}
              <div className="space-y-4 sm:space-y-6">
                <div className="card">
                  <div className="card-header">
                    <span className="text-lg sm:text-xl">🚗</span>
                    <span className="text-sm sm:text-base">Live Vehicle Detection</span>
                  </div>
                  <VehicleCounters data={trafficData} />
                </div>
                
                <CongestionBadge 
                  level={trafficData.congestion} 
                  total={trafficData.total}
                />
                
                <EmergencyPanel 
                  isActive={trafficData.emergency_mode}
                  emergencyType={trafficData.emergency_type}
                  message={trafficData.emergency_message}
                />
              </div>

              {/* Center - Live Camera */}
              <div className="space-y-4 sm:space-y-6">
                <div className="card" style={{ minHeight: '300px' }}>
                  <div className="card-header">
                    <span className="text-lg sm:text-xl">📹</span>
                    <span className="text-sm sm:text-base">Live Camera Feed</span>
                    <span className="ml-auto flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                      <span className="text-xs text-red-400">LIVE</span>
                    </span>
                  </div>
                  <LiveCameraFeed 
                    vehicles={trafficData.vehicles || []}
                    emergencyMode={trafficData.emergency_mode}
                    fps={trafficData.fps}
                    congestion={trafficData.congestion}
                  />
                </div>
              </div>

              {/* Right - Map Preview (full width on tablet, normal on desktop) */}
              <div className="space-y-4 sm:space-y-6 md:col-span-2 xl:col-span-1">
                <div className="card" style={{ height: '300px', minHeight: '300px' }}>
                  <div className="card-header">
                    <span className="text-lg sm:text-xl">🗺️</span>
                    <span className="text-sm sm:text-base">Traffic Map</span>
                    <button 
                      onClick={() => setActiveTab('map')}
                      className="ml-auto text-xs text-blue-400 hover:text-blue-300"
                    >
                      Full View →
                    </button>
                  </div>
                  <div style={{ height: 'calc(100% - 50px)' }}>
                    <InteractiveTrafficMap 
                      trafficData={trafficData}
                      onLocationSelect={handleLocationSelect}
                      selectedLocation={selectedLocation}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row - Alerts & Prediction */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <AlertsPanel emergencyMode={trafficData.emergency_mode} />
              <TrafficPrediction currentData={trafficData} />
            </div>
          </div>
        )}

        {/* Full Map View */}
        {activeTab === 'map' && (
          <div className="p-3 sm:p-6">
            <div className="card" style={{ height: 'calc(100vh - 180px)', minHeight: '400px' }}>
              <div className="card-header flex-wrap">
                <span className="text-lg sm:text-xl">🗺️</span>
                <span className="text-sm sm:text-base">Nagpur Traffic Network</span>
                <span className="ml-auto text-xs text-gray-400 hidden sm:inline">
                  Click any location to view camera
                </span>
              </div>
              <div style={{ height: 'calc(100% - 60px)' }}>
                <InteractiveTrafficMap 
                  trafficData={trafficData}
                  onLocationSelect={handleLocationSelect}
                  selectedLocation={selectedLocation}
                />
              </div>
            </div>
          </div>
        )}

        {/* Cameras View */}
        {activeTab === 'cameras' && (
          <div className="p-3 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
              {[
                { id: 1, name: 'Variety Square', lat: 21.1458, lng: 79.0882 },
                { id: 2, name: 'Sitabuldi', lat: 21.1480, lng: 79.0800 },
                { id: 3, name: 'Medical Square', lat: 21.1520, lng: 79.0920 },
                { id: 4, name: 'Shankar Nagar', lat: 21.1350, lng: 79.0850 },
                { id: 5, name: 'Dharampeth', lat: 21.1400, lng: 79.0750 },
                { id: 6, name: 'Sadar', lat: 21.1550, lng: 79.0750 }
              ].map(camera => (
                <div 
                  key={camera.id}
                  className="card cursor-pointer hover:border-blue-500/50 transition-colors active:scale-[0.98]"
                  onClick={() => handleLocationSelect(camera)}
                >
                  <div className="card-header text-sm sm:text-base">
                    <Camera size={16} className="text-blue-400" />
                    <span className="truncate">{camera.name}</span>
                    <span className="ml-auto flex items-center gap-1 flex-shrink-0">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span className="text-xs text-green-400 hidden sm:inline">Online</span>
                    </span>
                  </div>
                  <div className="h-36 sm:h-48">
                    <LiveCameraFeed 
                      vehicles={trafficData.vehicles || []}
                      emergencyMode={trafficData.emergency_mode}
                      congestion={trafficData.congestion}
                    />
                  </div>
                  <div className="mt-2 sm:mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>CAM-{camera.id.toString().padStart(3, '0')}</span>
                    <span className="hidden sm:inline">{camera.lat.toFixed(4)}, {camera.lng.toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerts View */}
        {activeTab === 'alerts' && (
          <div className="p-3 sm:p-6">
            <div className="max-w-4xl mx-auto">
              <AlertsPanel emergencyMode={trafficData.emergency_mode} />
            </div>
          </div>
        )}

        {/* AI Prediction View */}
        {activeTab === 'prediction' && (
          <div className="p-3 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <TrafficPrediction currentData={trafficData} />
              <div className="card">
                <div className="card-header">
                  <TrendingUp size={18} className="text-purple-400" />
                  <span>Historical Analysis</span>
                </div>
                <div className="flex items-center justify-center h-48 sm:h-64 text-gray-500">
                  <div className="text-center">
                    <TrendingUp size={36} className="mx-auto mb-4 opacity-30 sm:w-12 sm:h-12" />
                    <p className="text-sm sm:text-base">Historical traffic data visualization</p>
                    <p className="text-xs sm:text-sm text-gray-600">Coming soon...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="p-3 sm:p-6 text-center text-xs sm:text-sm text-gray-500 border-t border-gray-800">
          <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
            <span className="hidden sm:inline">📍 {trafficData.area}</span>
            <span className="sm:hidden">📍 Nagpur</span>
            <span className="hidden sm:inline">|</span>
            <span>🕐 {new Date(trafficData.timestamp).toLocaleTimeString()}</span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline">⚡ {trafficData.fps || 0} FPS</span>
            <span>|</span>
            <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
              {isConnected ? '● Connected' : '○ Disconnected'}
            </span>
          </div>
          <p className="mt-2 text-gray-600">
            🚦 AI-Based Intelligent Traffic Monitoring & Emergency Vehicle Priority System - Nagpur Smart City
          </p>
        </footer>
      </main>

      {/* Camera Modal */}
      <CameraModal
        isOpen={showCameraModal}
        onClose={handleCloseCameraModal}
        location={selectedLocation}
        trafficData={trafficData}
      />
    </div>
  );
}

export default App;
