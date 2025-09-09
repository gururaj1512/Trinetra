import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Monitor, Activity, Users, AlertTriangle, TrendingUp, Clock, Zap } from 'lucide-react';
import AdminTag from '../components/AdminTag';

const MonitoringDashboard = () => {
  // Live monitoring data
  const [liveStats] = useState({
    totalDetections: 1247,
    averageConfidence: 92.5,
    processingSpeed: 28,
    activeModels: 4,
    totalModels: 4,
    uptime: '99.9%',
    lastUpdate: new Date().toLocaleTimeString()
  });

  // Video URLs for the admin dashboard
  const video1Url = "https://player.cloudinary.com/embed/?cloud_name=drxliiejo&public_id=20250907_194643_crowd_heatmap_video_wkytkm&profile=cld-default";
  const video2Url = "https://fra.cloud.appwrite.io/v1/storage/buckets/6787b3590020b59b8727/files/68be0965002c585e5a5a/view?project=6787b12a00046d6750fb&mode=admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-4">
            <AdminTag />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              ML Monitoring Dashboard
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Real-time monitoring of machine learning models with live video feeds and analytics
          </p>
        </motion.div>

        {/* Control Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-white font-medium">Live Monitoring Active</span>
            </div>
            <div className="flex items-center space-x-4 text-gray-300">
              <span>Resolution: 1080p</span>
              <span>•</span>
              <span>FPS: 30</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Eye size={16} />
                <span>2 Live Feeds</span>
              </span>
            </div>
          </div>
        </motion.div>

        {/* Live Video Feeds */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Video Feed 1 - Crowd Heatmap */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/20 hover:border-orange-400/50 transition-all duration-300"
          >
            <div className="p-4 border-b border-white/20">
              <div className="flex justify-between items-center">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Activity className="text-green-400" size={20} />
                  Crowd Heatmap Analysis
                </h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm">LIVE</span>
                </div>
              </div>
            </div>
            <div className="aspect-video bg-gray-800 relative">
              <iframe
                src={`${video1Url}&autoplay=1&loop=1&muted=1`}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
                title="Crowd Heatmap Video"
              />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-green-400">● Processing</span>
                    <span>Model: OpenCV</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span>Density: High</span>
                    <span>Confidence: 94%</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Video Feed 2 - Security Monitoring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/20 hover:border-orange-400/50 transition-all duration-300"
          >
            <div className="p-4 border-b border-white/20">
              <div className="flex justify-between items-center">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Monitor className="text-blue-400" size={20} />
                  Security Monitoring
                </h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm">LIVE</span>
                </div>
              </div>
            </div>
            <div className="aspect-video bg-gray-800 relative">
              <iframe
                src={`${video2Url}&autoplay=1&loop=1&muted=1`}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
                title="Security Monitoring Video"
              />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-400">● Monitoring</span>
                    <span>Model: YOLOv8</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span>Objects: 12</span>
                    <span>Confidence: 92%</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Model Status Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {[
            { 
              title: 'Crowd Density Analysis', 
              status: 'active', 
              icon: Users, 
              color: 'green',
              stats: { detections: 342, accuracy: '94%' }
            },
            { 
              title: 'Face Recognition System', 
              status: 'active', 
              icon: Monitor, 
              color: 'blue',
              stats: { detections: 156, accuracy: '92%' }
            },
            { 
              title: 'Behavior Analysis', 
              status: 'active', 
              icon: AlertTriangle, 
              color: 'yellow',
              stats: { detections: 89, accuracy: '96%' }
            },
            { 
              title: 'Emergency Detection', 
              status: 'active', 
              icon: Zap, 
              color: 'red',
              stats: { detections: 23, accuracy: '98%' }
            }
          ].map((model, index) => (
            <motion.div
              key={model.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:border-orange-400/50 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <model.icon className={`text-${model.color}-400`} size={24} />
                <div className={`w-2 h-2 bg-${model.color}-500 rounded-full animate-pulse`}></div>
              </div>
              <h4 className="text-white font-semibold text-sm mb-2">{model.title}</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Detections:</span>
                  <span className="text-white">{model.stats.detections}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Accuracy:</span>
                  <span className={`text-${model.color}-400`}>{model.stats.accuracy}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Analytics Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
        >
          <h3 className="text-white text-xl font-bold mb-6 flex items-center gap-3">
            <TrendingUp className="text-orange-400" size={24} />
            Real-Time Analytics
          </h3>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { 
                label: 'Total Detections', 
                value: liveStats.totalDetections.toLocaleString(), 
                change: '+12%',
                icon: Activity,
                color: 'green'
              },
              { 
                label: 'Average Confidence', 
                value: `${liveStats.averageConfidence}%`, 
                change: '+2.1%',
                icon: TrendingUp,
                color: 'blue'
              },
              { 
                label: 'Processing Speed', 
                value: `${liveStats.processingSpeed} FPS`, 
                change: '+5%',
                icon: Zap,
                color: 'yellow'
              },
              { 
                label: 'Active Models', 
                value: `${liveStats.activeModels}/${liveStats.totalModels}`, 
                change: '100%',
                icon: Monitor,
                color: 'purple'
              },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <stat.icon className={`text-${stat.color}-400`} size={24} />
                </div>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-gray-300 text-sm mb-1">{stat.label}</div>
                <div className="text-green-400 text-xs">{stat.change}</div>
              </div>
            ))}
          </div>
          
          {/* System Status */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="text-gray-400" size={16} />
                  <span className="text-gray-300 text-sm">Last Update: {liveStats.lastUpdate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm">System Uptime: {liveStats.uptime}</span>
                </div>
              </div>
              <div className="text-gray-400 text-sm">
                All systems operational
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;