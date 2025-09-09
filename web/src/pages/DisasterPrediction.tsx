import { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, RefreshCw } from 'lucide-react';
import OmSymbol from '../components/OmSymbol';

const DisasterPrediction = () => {
  const [isLoading, setIsLoading] = useState(true);
  
  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate refresh
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-sacred-50 to-divine-50">
      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-sacred-gradient shadow-sacred border-b border-saffron-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                  scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                <OmSymbol size={40} className="text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">MahaKumbh Disaster Prediction System</h1>
                <p className="text-white/90 text-sm font-medium">AI-powered early warning system for pilgrim safety</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white/80 text-xs">System Active</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all duration-300 backdrop-blur-sm border border-white/30"
                disabled={isLoading}
              >
                <RefreshCw size={16} className={`text-white ${isLoading ? 'animate-spin' : ''}`} />
                <span className="text-white text-sm font-medium">Refresh</span>
              </button>
              <a
                href="https://mahakumbh-disaster-prediction-xw47.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all duration-300 backdrop-blur-sm border border-white/30"
              >
                <ExternalLink size={16} className="text-white" />
                <span className="text-white text-sm font-medium">Open Full System</span>
              </a>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-saffron-50 via-sacred-50 to-divine-50 flex items-center justify-center z-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center bg-white/90 backdrop-blur-lg rounded-3xl p-8 shadow-sacred border border-saffron-200"
          >
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
              className="mb-6"
            >
              <OmSymbol size={64} className="text-saffron-500" />
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Initializing Disaster Prediction System</h3>
            <p className="text-gray-600 mb-4">Connecting to AI Safety Network and loading predictive models...</p>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-saffron-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-saffron-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-saffron-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Enhanced Iframe Container */}
      <div className="relative h-[calc(100vh-100px)] bg-white rounded-t-3xl shadow-sacred border-t border-saffron-200 overflow-hidden">
        <iframe
          src="https://mahakumbh-disaster-prediction-xw47.vercel.app/"
          className="w-full h-full border-0 rounded-t-3xl"
          title="MahaKumbh Disaster Prediction System"
          onLoad={() => setIsLoading(false)}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals"
        />
        
        {/* Subtle overlay for better integration */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-sacred-gradient"></div>
      </div>
    </div>
  );
};

export default DisasterPrediction;