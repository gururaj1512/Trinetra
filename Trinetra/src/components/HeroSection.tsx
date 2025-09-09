import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import IPhoneMockup from './IPhoneMockup';
import OmSymbol from './OmSymbol';

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-saffron-50 via-sacred-50 to-divine-50 pt-16 pb-16">
      {/* Enhanced Background Pattern with Animated Om Symbols */}
      <div className="absolute inset-0 opacity-10">
        <motion.div 
          className="absolute top-20 left-20 transform rotate-12"
          animate={{ rotate: [12, 372, 12] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <OmSymbol size={120} className="text-saffron-400" animated variant="floating" />
        </motion.div>
        <motion.div 
          className="absolute bottom-20 right-20 transform -rotate-12"
          animate={{ rotate: [-12, 348, -12] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        >
          <OmSymbol size={80} className="text-sacred-400" animated variant="glowing" />
        </motion.div>
        <motion.div 
          className="absolute top-1/2 left-1/3 transform rotate-45"
          animate={{ rotate: [45, 405, 45] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          <OmSymbol size={60} className="text-divine-400" animated variant="spinning" />
        </motion.div>
        <motion.div 
          className="absolute top-1/4 right-1/4"
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <OmSymbol size={40} className="text-saffron-300" animated variant="floating" />
        </motion.div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-saffron-300 rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            {/* Enhanced Om Symbol with Glow Effect */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mb-6 flex justify-center lg:justify-start"
            >
              <div className="relative pulse-glow">
                <OmSymbol size={120} className="text-saffron-500" animated variant="divine" />
                <div className="absolute inset-0 bg-sacred-gradient rounded-full blur-2xl opacity-30 animate-pulse-slow"></div>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute inset-0 bg-divine-gradient rounded-full blur-xl opacity-20"
                />
              </div>
            </motion.div>

            {/* Decorative Elements */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center lg:justify-start mb-3"
            >
              <Sparkles className="text-saffron-400 mr-2" size={20} />
              <span className="text-saffron-600 font-medium text-sm uppercase tracking-wider">
                Sacred Technology
              </span>
              <Star className="text-sacred-400 ml-2" size={16} />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-4 leading-tight"
            >
              <span className="bg-sacred-gradient bg-clip-text text-transparent">
                MahaKumbh
              </span>
              <br />
              <span className="text-gray-800">
                2025
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-xl md:text-2xl text-gray-700 mb-4 leading-relaxed font-medium"
            >
              Divine Journey Enhanced by
              <br />
              <span className="bg-divine-gradient bg-clip-text text-transparent font-bold">
                Sacred AI Technology
              </span>
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="text-base text-gray-600 mb-8 max-w-2xl leading-relaxed"
            >
              Experience the world's largest spiritual gathering enhanced by cutting-edge artificial intelligence, 
              real-time monitoring, and divine guidance for every devotee's sacred journey to enlightenment.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link
                to="/monitoring"
                className="group bg-sacred-gradient text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-divine transition-all duration-300 flex items-center justify-center space-x-3 shadow-sacred transform hover:-translate-y-2 hover:scale-105"
              >
                <OmSymbol size={24} className="text-white" />
                <span className="text-lg">Begin Sacred Journey</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/ai-maps"
                className="border-2 border-saffron-500 text-saffron-600 px-8 py-4 rounded-2xl font-semibold hover:bg-saffron-500 hover:text-white transition-all duration-300 flex items-center justify-center space-x-3 hover:shadow-sacred transform hover:-translate-y-1"
              >
                <span className="text-lg">Explore Features</span>
                <Sparkles size={20} />
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
              className="mt-8 grid grid-cols-3 gap-6 text-center lg:text-left"
            >
              <div>
                <div className="text-2xl font-bold text-saffron-600">50M+</div>
                <div className="text-sm text-gray-600">Expected Pilgrims</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-sacred-600">24/7</div>
                <div className="text-sm text-gray-600">AI Monitoring</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-divine-600">100%</div>
                <div className="text-sm text-gray-600">Divine Guidance</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Enhanced iPhone Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex justify-center lg:justify-end relative"
          >
            <div className="relative">
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-10 -right-10"
              >
                <OmSymbol size={60} className="text-saffron-400" animated variant="floating" />
              </motion.div>
              <motion.div
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-10 -left-10"
              >
                <OmSymbol size={40} className="text-sacred-400" animated variant="glowing" />
              </motion.div>
              <IPhoneMockup />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;