import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, MapPin, Shield, Users, Monitor, Sparkles, Activity, Camera, AlertTriangle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OmSymbol from './OmSymbol';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: null },
    { path: '/monitoring', label: 'ML Monitoring', icon: Monitor },
    { path: '/crowd-density', label: 'Crowd Analysis', icon: Activity },
    { path: '/face-recognition', label: 'Face Recognition', icon: Camera },
    { path: '/behavior-analysis', label: 'Behavior Analysis', icon: AlertTriangle },
    { path: '/emergency-detection', label: 'Emergency Detection', icon: Zap },
    { path: '/ai-maps', label: 'AI Maps', icon: MapPin },
    { path: '/disaster-prediction', label: 'Disaster Alert', icon: Shield },
    { path: '/pilgrim-tracker', label: 'Pilgrim Tracker', icon: Users },
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-xl shadow-sacred border-b border-saffron-100 sticky top-0 z-50 supports-[backdrop-filter]:bg-white/90" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 min-h-[4rem]">
          {/* Enhanced Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <motion.div 
              className="relative w-9 h-9 bg-sacred-gradient rounded-xl flex items-center justify-center shadow-sacred group-hover:shadow-divine transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <OmSymbol size={20} className="text-white" animated={true} variant="glowing" />
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-divine-gradient rounded-xl blur-md opacity-30"
              />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-lg font-display font-bold bg-sacred-gradient bg-clip-text text-transparent">
                MahaKumbh
              </span>
              <span className="text-xs text-saffron-600 font-medium -mt-1">2025</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={item.path}
                    className={`group flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-300 relative overflow-hidden ${
                      isActive
                        ? 'bg-sacred-gradient text-white shadow-sacred'
                        : 'text-gray-600 hover:text-saffron-600 hover:bg-saffron-50'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-sacred-gradient rounded-xl"
                        initial={false}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <div className="relative z-10 flex items-center space-x-2">
                      {item.icon && <item.icon size={16} />}
                      <span className="font-medium text-sm">{item.label}</span>
                      {isActive && <Sparkles size={12} className="text-white" />}
                    </div>
                    {!isActive && (
                      <motion.div
                        className="absolute inset-0 bg-saffron-100 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        initial={false}
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-saffron-600 transition-colors p-2 rounded-lg hover:bg-saffron-50"
              whileTap={{ scale: 0.95 }}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
            >
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </motion.div>
            </motion.button>
          </div>
        </div>

        {/* Enhanced Mobile Navigation */}
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden border-t border-saffron-100 mt-2 pt-4"
            >
              <div className="space-y-2 pb-4">
                {navItems.map((item, index) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={`group flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-300 ${
                          isActive
                            ? 'bg-sacred-gradient text-white shadow-sacred'
                            : 'text-gray-600 hover:text-saffron-600 hover:bg-saffron-50'
                        }`}
                      >
                        {item.icon && <item.icon size={18} />}
                        <span className="font-medium text-sm">{item.label}</span>
                        {isActive && <Sparkles size={14} className="text-white ml-auto" />}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;