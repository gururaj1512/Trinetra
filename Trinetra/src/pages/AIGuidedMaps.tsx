import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, Star, Route, ExternalLink, RefreshCw, Search, ArrowRight, AlertCircle } from 'lucide-react';
import OmSymbol from '../components/OmSymbol';

interface RouteInfo {
  id: string;
  name: string;
  time: string;
  distance: string;
  crowd: 'Low' | 'Medium' | 'High';
  description: string;
  waypoints: string[];
}

interface Landmark {
  name: string;
  type: string;
  distance: string;
  rating: number;
}

interface CrowdData {
  location: string;
  level: 'Low' | 'Medium' | 'High';
  density: number;
  lastUpdated: string;
}

const AIGuidedMaps = () => {
  const [selectedRoute, setSelectedRoute] = useState<string>('optimal');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchLocation, setSearchLocation] = useState<string>('');
  const [currentLocation, setCurrentLocation] = useState<string>('Triveni Sangam');
  const [routes, setRoutes] = useState<RouteInfo[]>([]);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [crowdData, setCrowdData] = useState<CrowdData[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Simulate dynamic route generation based on location
  const generateRoutes = (destination: string) => {
    // More realistic duration calculations based on distance and route type
    const optimalDistance = Math.random() * 3 + 1.5; // 1.5-4.5 km
    const sacredDistance = Math.random() * 4 + 4; // 4-8 km
    const scenicDistance = Math.random() * 3 + 2.5; // 2.5-5.5 km
    
    // Calculate realistic walking times (average 4-5 km/h walking speed)
    const optimalTime = Math.round((optimalDistance / 4.5) * 60); // minutes
    const sacredTime = Math.round((sacredDistance / 3.5) * 60); // slower due to crowds
    const scenicTime = Math.round((scenicDistance / 4) * 60); // moderate pace
    
    const formatTime = (minutes: number) => {
      if (minutes < 60) {
        return `${minutes} min`;
      } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
      }
    };

    const baseRoutes: RouteInfo[] = [
      { 
        id: 'optimal', 
        name: 'Optimal Path', 
        time: formatTime(optimalTime), 
        distance: `${optimalDistance.toFixed(1)} km`, 
        crowd: 'Low',
        description: 'AI-recommended fastest route avoiding high-density areas',
        waypoints: ['Current Location', 'Sector 2', destination]
      },
      { 
        id: 'sacred', 
        name: 'Sacred Circuit', 
        time: formatTime(sacredTime), 
        distance: `${sacredDistance.toFixed(1)} km`, 
        crowd: 'Medium',
        description: 'Traditional darshan path covering all major temples and ghats',
        waypoints: ['Current Location', 'Akshayavat', 'Hanuman Mandir', destination]
      },
      { 
        id: 'scenic', 
        name: 'Scenic Route', 
        time: formatTime(scenicTime), 
        distance: `${scenicDistance.toFixed(1)} km`, 
        crowd: 'Low',
        description: 'Beautiful riverside path with photogenic spots and cultural sites',
        waypoints: ['Current Location', 'Ganga Ghat', 'Cultural Center', destination]
      },
    ];
    setRoutes(baseRoutes);
  };

  // Simulate dynamic landmark generation
  const generateLandmarks = (location: string) => {
    const baseLandmarks: Landmark[] = [
      { name: 'Triveni Sangam', type: 'Sacred Site', distance: '0.8 km', rating: 4.8 },
      { name: 'Akshayavat', type: 'Temple', distance: '1.2 km', rating: 4.6 },
      { name: 'Hanuman Mandir', type: 'Temple', distance: '2.1 km', rating: 4.7 },
      { name: 'Alopi Devi Mandir', type: 'Temple', distance: '3.4 km', rating: 4.5 },
      { name: location || 'Destination', type: 'Sacred Site', distance: '0.5 km', rating: 4.9 },
    ];
    setLandmarks(baseLandmarks);
  };

  // Simulate dynamic crowd data
  const generateCrowdData = () => {
    const locations = ['Main Ghat', 'Sector 7', 'Parking Area', 'Food Court', 'Medical Center'];
    const levels: ('Low' | 'Medium' | 'High')[] = ['Low', 'Medium', 'High'];
    
    const data: CrowdData[] = locations.map(location => ({
      location,
      level: levels[Math.floor(Math.random() * levels.length)],
      density: Math.floor(Math.random() * 100),
      lastUpdated: new Date().toLocaleTimeString()
    }));
    setCrowdData(data);
  };

  const handleSearch = async () => {
    if (!searchLocation.trim()) return;
    
    setIsSearching(true);
    setCurrentLocation(searchLocation);
    
    // Simulate API call delay
    setTimeout(() => {
      generateRoutes(searchLocation);
      generateLandmarks(searchLocation);
      generateCrowdData();
      setIsSearching(false);
    }, 1500);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    generateCrowdData();
    setTimeout(() => setIsLoading(false), 2000);
  };

  // Initialize with default data
  useEffect(() => {
    generateRoutes('Triveni Sangam');
    generateLandmarks('Triveni Sangam');
    generateCrowdData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-sacred-50 to-divine-50 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-3"
          >
            <OmSymbol size={60} className="text-saffron-500 mx-auto" animated variant="divine" />
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-3">
            <span className="bg-sacred-gradient bg-clip-text text-transparent">
              AI Guided Maps
            </span>
          </h1>
          <p className="text-base text-gray-600 max-w-3xl mx-auto">
            Navigate the sacred grounds with intelligent route optimization and real-time crowd insights
          </p>
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="bg-white rounded-2xl shadow-sacred p-4 border border-saffron-100">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter destination (e.g., Akshayavat, Hanuman Mandir, Ganga Ghat)"
                  className="w-full pl-10 pr-4 py-3 border border-saffron-200 rounded-xl focus:ring-2 focus:ring-saffron-500 focus:border-transparent outline-none"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchLocation.trim()}
                className="bg-sacred-gradient text-white px-6 py-3 rounded-xl font-semibold hover:shadow-divine transition-all duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <Search size={18} />
                )}
                <span>{isSearching ? 'Searching...' : 'Find Route'}</span>
              </button>
            </div>
            {currentLocation && (
              <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
                <MapPin size={16} className="text-saffron-500" />
                <span>Current Destination: <span className="font-semibold text-saffron-600">{currentLocation}</span></span>
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-3 items-start">
          {/* Map Area */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl shadow-sacred overflow-hidden border border-saffron-100">
              {/* Map Header */}
              <div className="bg-sacred-gradient p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <OmSymbol size={24} className="text-white" animated variant="glowing" />
                  <h3 className="text-white font-semibold">Trinetra AI Navigation</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleRefresh}
                    className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                    disabled={isLoading}
                  >
                    <RefreshCw size={16} className={`text-white ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <a
                    href="https://trinetra-delta.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <ExternalLink size={16} className="text-white" />
                  </a>
                </div>
              </div>

              {/* Embedded Trinetra Application */}
              <div className="relative h-[500px]">
                {isLoading && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="mb-4"
                      >
                        <OmSymbol size={48} className="text-saffron-500" />
                      </motion.div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading Sacred Navigation...</h3>
                      <p className="text-gray-600">Connecting to Trinetra AI System</p>
                    </div>
                  </div>
                )}
                <iframe
                  src="https://trinetra-delta.vercel.app/"
                  className="w-full h-full border-0"
                  title="Trinetra AI Navigation System"
                  onLoad={() => setIsLoading(false)}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                />
              </div>

              {/* Route Selection */}
              <div className="p-4 bg-saffron-50 border-t border-saffron-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Available Routes</h4>
                <div className="flex flex-wrap gap-3">
                  {routes.map((route) => (
                    <button
                      key={route.id}
                      onClick={() => setSelectedRoute(route.id)}
                      className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                        selectedRoute === route.id
                          ? 'bg-sacred-gradient text-white shadow-sacred'
                          : 'bg-white text-gray-600 hover:bg-saffron-100 border border-saffron-200'
                      }`}
                    >
                      {route.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-3 sticky top-6"
          >
            {/* Route Details */}
            <div className="bg-white rounded-2xl shadow-sacred p-4 border border-saffron-100">
              <div className="flex items-center space-x-2 mb-3">
                <Route size={18} className="text-saffron-600" />
                <h3 className="text-base font-bold text-gray-800">Route Details</h3>
              </div>
              {routes.find(r => r.id === selectedRoute) && (
                <motion.div 
                  key={selectedRoute}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  {/* Route Info Grid */}
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center justify-between p-3 bg-saffron-50 rounded-lg">
                      <span className="text-gray-600 font-medium text-sm">Duration</span>
                      <span className="font-bold text-gray-800 text-base">
                        {routes.find(r => r.id === selectedRoute)?.time}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-saffron-50 rounded-lg">
                      <span className="text-gray-600 font-medium text-sm">Distance</span>
                      <span className="font-bold text-gray-800 text-base">
                        {routes.find(r => r.id === selectedRoute)?.distance}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-saffron-50 rounded-lg">
                      <span className="text-gray-600 font-medium text-sm">Crowd Level</span>
                      <span className={`font-bold text-base ${
                        routes.find(r => r.id === selectedRoute)?.crowd === 'Low' ? 'text-green-600' :
                        routes.find(r => r.id === selectedRoute)?.crowd === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {routes.find(r => r.id === selectedRoute)?.crowd}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {routes.find(r => r.id === selectedRoute)?.description}
                    </p>
                  </div>
                  
                  {/* Waypoints */}
                  <div className="pt-2 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Route Waypoints</h4>
                    <div className="space-y-2">
                      {routes.find(r => r.id === selectedRoute)?.waypoints.map((waypoint, index) => (
                        <div key={index} className="flex items-center space-x-3 text-sm">
                          <div className="flex-shrink-0 w-6 h-6 bg-saffron-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{index + 1}</span>
                          </div>
                          <span className="text-gray-700 font-medium">{waypoint}</span>
                          {index < (routes.find(r => r.id === selectedRoute)?.waypoints.length || 0) - 1 && (
                            <ArrowRight size={14} className="text-gray-400 ml-auto" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Nearby Landmarks */}
            <div className="bg-white rounded-2xl shadow-sacred p-4 border border-saffron-100">
              <div className="flex items-center space-x-2 mb-3">
                <MapPin size={18} className="text-saffron-600" />
                <h3 className="text-base font-bold text-gray-800">Nearby Landmarks</h3>
              </div>
              <div className="space-y-2">
                {landmarks.map((landmark, index) => (
                  <motion.div 
                    key={landmark.name}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 bg-saffron-50 rounded-lg border border-saffron-100 hover:bg-saffron-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 text-sm truncate">{landmark.name}</div>
                        <div className="text-sm text-gray-600 mt-1">{landmark.type}</div>
                        <div className="flex items-center space-x-1 mt-2">
                          <Star size={12} className="text-yellow-500 fill-current" />
                          <span className="text-sm text-gray-500 font-medium">{landmark.rating}</span>
                        </div>
                      </div>
                      <div className="ml-3 flex-shrink-0">
                        <div className="text-sm font-bold text-saffron-600 bg-white px-2 py-1 rounded-full">
                          {landmark.distance}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Live Crowd Data */}
            <div className="bg-white rounded-2xl shadow-sacred p-4 border border-saffron-100">
              <div className="flex items-center space-x-2 mb-3">
                <Users size={18} className="text-saffron-600" />
                <h3 className="text-base font-bold text-gray-800">Live Crowd Data</h3>
                <div className="ml-auto">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-2">
                {crowdData.map((data, index) => (
                  <motion.div 
                    key={data.location}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-700 font-semibold text-sm">{data.location}</span>
                        <div className="text-sm text-gray-500 mt-1">Updated: {data.lastUpdated}</div>
                      </div>
                      <div className="ml-3 flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          data.level === 'Low' ? 'bg-green-500' :
                          data.level === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <span className={`text-sm font-bold ${
                          data.level === 'Low' ? 'text-green-600' :
                          data.level === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {data.level}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  <AlertCircle size={16} className="text-blue-600" />
                  <span className="text-sm text-blue-700">Data updates every 30 seconds</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Integration Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 bg-white rounded-2xl shadow-sacred p-4 border border-saffron-100"
        >
          <div className="flex items-center space-x-2 mb-3">
            <OmSymbol size={24} className="text-saffron-500" animated variant="glowing" />
            <h3 className="text-base font-bold text-gray-800">Powered by Trinetra AI</h3>
          </div>
          <p className="text-gray-600 mb-3 text-sm">
            This AI-guided navigation system is powered by Trinetra, an advanced artificial intelligence platform 
            that provides real-time route optimization, crowd density analysis, and intelligent pathfinding for 
            the MahaKumbh pilgrimage experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://trinetra-delta.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-sacred-gradient text-white px-4 py-2 rounded-lg font-semibold hover:shadow-divine transition-all duration-300 transform hover:-translate-y-1 text-sm"
            >
              <ExternalLink size={16} />
              <span>Open Full Trinetra App</span>
            </a>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live AI System Active</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AIGuidedMaps;