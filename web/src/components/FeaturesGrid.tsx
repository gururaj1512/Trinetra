import { motion } from 'framer-motion';
import { Monitor, MapPin, Shield, Users, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import OmSymbol from './OmSymbol';

const FeaturesGrid = () => {
  const features = [
    {
      icon: Monitor,
      title: 'ML Video Monitoring',
      description: 'Real-time crowd analysis and safety monitoring using advanced machine learning models',
      path: '/monitoring',
      gradient: 'from-saffron-500 to-sacred-500',
      bgGradient: 'from-saffron-50 to-sacred-50',
    },
    {
      icon: MapPin,
      title: 'AI Guided Maps',
      description: 'Intelligent navigation system with real-time route optimization for pilgrims',
      path: '/ai-maps',
      gradient: 'from-sacred-500 to-divine-500',
      bgGradient: 'from-sacred-50 to-divine-50',
    },
    {
      icon: Shield,
      title: 'Disaster Prediction',
      description: 'Advanced early warning system for weather and crowd-related emergencies',
      path: '/disaster-prediction',
      gradient: 'from-divine-500 to-saffron-500',
      bgGradient: 'from-divine-50 to-saffron-50',
    },
    {
      icon: Users,
      title: 'Pilgrim Tracker',
      description: 'Track and locate fellow devotees for enhanced safety and connection',
      path: '/pilgrim-tracker',
      gradient: 'from-saffron-600 to-divine-600',
      bgGradient: 'from-saffron-50 to-divine-50',
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-white via-saffron-25 to-sacred-25 relative overflow-hidden">
      {/* Background Om Symbols */}
      <div className="absolute inset-0 opacity-5">
        <motion.div 
          className="absolute top-10 left-10"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          <OmSymbol size={80} className="text-saffron-400" />
        </motion.div>
        <motion.div 
          className="absolute bottom-10 right-10"
          animate={{ rotate: [360, 0] }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
        >
          <OmSymbol size={60} className="text-sacred-400" />
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-4"
          >
            <OmSymbol size={100} className="text-saffron-500 mx-auto" animated variant="divine" />
          </motion.div>
          
          <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-800 mb-4">
            Sacred Technology for
            <span className="bg-sacred-gradient bg-clip-text text-transparent block mt-2"> Divine Purpose</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Harness the power of artificial intelligence to enhance your spiritual journey at the world's largest religious gathering
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group"
            >
              <Link to={feature.path} className="block h-full">
                <div className={`bg-gradient-to-br ${feature.bgGradient} rounded-3xl p-6 shadow-sacred hover:shadow-divine transition-all duration-500 border border-saffron-100 group-hover:border-sacred-200 h-full relative overflow-hidden group-hover:glass-effect`}>
                  {/* Background Pattern */}
                  <div className="absolute top-4 right-4 opacity-10">
                    <OmSymbol size={40} className="text-saffron-400" />
                  </div>
                  
                  {/* Icon Container */}
                  <motion.div 
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${feature.gradient} p-3 mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg relative`}
                    whileHover={{ rotate: 5 }}
                  >
                    <feature.icon className="w-full h-full text-white" />
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-white/20 rounded-2xl blur-sm"
                    />
                  </motion.div>
                  
                  {/* Content */}
                  <h3 className="text-lg font-bold text-gray-800 mb-3 group-hover:text-saffron-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    {feature.description}
                  </p>

                  {/* Enhanced CTA */}
                  <motion.div 
                    className="flex items-center text-saffron-600 font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300"
                    initial={false}
                  >
                    <span className="mr-2">Explore Sacred Tech</span>
                    <motion.div
                      animate={{ x: [0, 8, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <ArrowRight size={16} />
                    </motion.div>
                  </motion.div>

                  {/* Decorative Elements */}
                  <motion.div
                    className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles size={16} className="text-sacred-400" />
                  </motion.div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-12"
        >
          <Link
            to="/monitoring"
            className="inline-flex items-center space-x-3 bg-sacred-gradient text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-divine transition-all duration-300 transform hover:-translate-y-1"
          >
            <OmSymbol size={24} className="text-white" />
            <span>Begin Your Sacred Journey</span>
            <ArrowRight size={20} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesGrid;