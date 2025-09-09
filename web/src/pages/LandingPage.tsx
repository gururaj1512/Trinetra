import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Shield, Users, Monitor, Play, Upload, ArrowRight } from 'lucide-react';
import HeroSection from '../components/HeroSection';
import FeaturesGrid from '../components/FeaturesGrid';
import IPhoneMockup from '../components/IPhoneMockup';
import OmSymbol from '../components/OmSymbol';

const LandingPage = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesGrid />
      
      {/* Enhanced Call to Action Section */}
      <section className="py-16 bg-sacred-gradient relative overflow-hidden">
        {/* Background Om Symbols */}
        <div className="absolute inset-0 opacity-10">
          <motion.div 
            className="absolute top-10 left-10"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          >
            <OmSymbol size={100} className="text-white" />
          </motion.div>
          <motion.div 
            className="absolute bottom-10 right-10"
            animate={{ rotate: [360, 0] }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          >
            <OmSymbol size={80} className="text-white" />
          </motion.div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <OmSymbol size={100} className="text-white mx-auto" animated variant="divine" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-display font-bold text-white mb-4"
          >
            Experience Divine Technology at
            <span className="block mt-2">MahaKumbh 2025</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-saffron-100 mb-8 max-w-4xl mx-auto leading-relaxed"
          >
            Join millions of pilgrims in the world's largest spiritual gathering, enhanced by cutting-edge AI technology and divine guidance
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/monitoring"
              className="group bg-white text-saffron-600 px-8 py-3 rounded-2xl font-semibold hover:bg-saffron-50 transition-all duration-300 flex items-center justify-center space-x-3 shadow-divine transform hover:-translate-y-1"
            >
              <Monitor size={24} />
              <span className="text-lg">Start Sacred Monitoring</span>
            </Link>
            <Link
              to="/ai-maps"
              className="group border-2 border-white text-white px-8 py-3 rounded-2xl font-semibold hover:bg-white hover:text-saffron-600 transition-all duration-300 flex items-center justify-center space-x-3 transform hover:-translate-y-1"
            >
              <MapPin size={24} />
              <span className="text-lg">Explore AI Maps</span>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;