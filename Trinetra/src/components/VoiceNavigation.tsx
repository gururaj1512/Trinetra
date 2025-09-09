import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Navigation, Home, Eye, AlertTriangle, MapPin, Users, MessageCircle } from 'lucide-react';

interface VoiceNavigationProps {
  onFeatureOpen?: (feature: string) => void;
  onChatbotToggle?: () => void;
}

const VoiceNavigation = ({ onFeatureOpen, onChatbotToggle }: VoiceNavigationProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [lastCommand, setLastCommand] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const recognitionRef = useRef<any>(null);

  // Voice commands mapping
  const voiceCommands = {
    // Navigation commands
    'go home': () => navigate('/'),
    'home': () => navigate('/'),
    'main page': () => navigate('/'),
    'landing page': () => navigate('/'),
    
    // Feature commands
    'open monitoring': () => navigate('/monitoring'),
    'monitoring dashboard': () => navigate('/monitoring'),
    'monitoring': () => navigate('/monitoring'),
    'open monitoring dashboard': () => navigate('/monitoring'),
    
    'open ai maps': () => navigate('/ai-maps'),
    'ai guided maps': () => navigate('/ai-maps'),
    'ai maps': () => navigate('/ai-maps'),
    'open ai guided maps': () => navigate('/ai-maps'),
    'maps': () => navigate('/ai-maps'),
    
    'open disaster prediction': () => navigate('/disaster-prediction'),
    'disaster prediction': () => navigate('/disaster-prediction'),
    'disaster': () => navigate('/disaster-prediction'),
    'open disaster': () => navigate('/disaster-prediction'),
    
    'open pilgrim tracker': () => navigate('/pilgrim-tracker'),
    'pilgrim tracker': () => navigate('/pilgrim-tracker'),
    'pilgrims': () => navigate('/pilgrim-tracker'),
    'open pilgrims': () => navigate('/pilgrim-tracker'),
    'sacred sites': () => navigate('/pilgrim-tracker'),
    'open sacred sites': () => navigate('/pilgrim-tracker'),
    
    // Chatbot commands
    'open chatbot': () => onChatbotToggle && onChatbotToggle(),
    'open chat': () => onChatbotToggle && onChatbotToggle(),
    'chatbot': () => onChatbotToggle && onChatbotToggle(),
    'chat': () => onChatbotToggle && onChatbotToggle(),
    'open assistant': () => onChatbotToggle && onChatbotToggle(),
    'assistant': () => onChatbotToggle && onChatbotToggle(),
    
    // General commands
    'help': () => setShowCommands(true),
    'show commands': () => setShowCommands(true),
    'what can i say': () => setShowCommands(true),
    'hide commands': () => setShowCommands(false),
    'close commands': () => setShowCommands(false),
  };

  useEffect(() => {
    // Check if speech recognition is supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onstart = () => {
        setIsListening(true);
        setIsProcessing(true);
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('voiceNavigationStart'));
      };
      
      recognitionInstance.onresult = (event: any) => {
        const command = event.results[0][0].transcript.toLowerCase().trim();
        setLastCommand(command);
        setIsProcessing(false);
        
        // Execute the command
        executeVoiceCommand(command);
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsProcessing(false);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
        setIsProcessing(false);
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('voiceNavigationEnd'));
      };
      
      setRecognition(recognitionInstance);
      recognitionRef.current = recognitionInstance;
    }
  }, []);

  const executeVoiceCommand = (command: string) => {
    // Find matching command
    const matchedCommand = Object.keys(voiceCommands).find(cmd => 
      command.includes(cmd) || cmd.includes(command)
    );
    
    if (matchedCommand && voiceCommands[matchedCommand as keyof typeof voiceCommands]) {
      const commandFunction = voiceCommands[matchedCommand as keyof typeof voiceCommands];
      commandFunction();
      
      // Notify parent component
      if (onFeatureOpen) {
        onFeatureOpen(matchedCommand);
      }
      
      // Provide audio feedback
      speak(`Opening ${matchedCommand}`);
    } else {
      speak("Command not recognized. Say 'help' to see available commands.");
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const getCurrentPageName = () => {
    const path = location.pathname;
    switch (path) {
      case '/': return 'Home';
      case '/monitoring': return 'Monitoring Dashboard';
      case '/ai-maps': return 'AI Guided Maps';
      case '/disaster-prediction': return 'Disaster Prediction';
      case '/pilgrim-tracker': return 'Pilgrim Tracker';
      default: return 'Unknown Page';
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <>
      {/* Voice Navigation Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-20 right-6 z-40 sm:bottom-6 sm:right-20"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={isListening ? stopListening : startListening}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : isProcessing
              ? 'bg-yellow-500 hover:bg-yellow-600'
              : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
          }`}
        >
          {isListening ? (
            <MicOff size={24} className="text-white" />
          ) : isProcessing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Volume2 size={24} className="text-white" />
            </motion.div>
          ) : (
            <Mic size={24} className="text-white" />
          )}
        </motion.button>
        
        {/* Status indicator */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap"
            >
              Listening... Say a command
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Last command display */}
        <AnimatePresence>
          {lastCommand && !isListening && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-green-500/90 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap"
            >
              "{lastCommand}"
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Commands Help Modal */}
      <AnimatePresence>
        {showCommands && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCommands(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Navigation size={24} className="text-orange-500" />
                  Voice Commands
                </h2>
                <button
                  onClick={() => setShowCommands(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Home size={16} />
                    Navigation
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <span className="bg-gray-100 px-3 py-2 rounded">"go home"</span>
                    <span className="bg-gray-100 px-3 py-2 rounded">"home"</span>
                    <span className="bg-gray-100 px-3 py-2 rounded">"main page"</span>
                    <span className="bg-gray-100 px-3 py-2 rounded">"landing page"</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Eye size={16} />
                    Monitoring Dashboard
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <span className="bg-gray-100 px-3 py-2 rounded">"open monitoring"</span>
                    <span className="bg-gray-100 px-3 py-2 rounded">"monitoring dashboard"</span>
                    <span className="bg-gray-100 px-3 py-2 rounded">"monitoring"</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin size={16} />
                    AI Guided Maps
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <span className="bg-gray-100 px-3 py-2 rounded">"open ai maps"</span>
                    <span className="bg-gray-100 px-3 py-2 rounded">"ai guided maps"</span>
                    <span className="bg-gray-100 px-3 py-2 rounded">"maps"</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <AlertTriangle size={16} />
                    Disaster Prediction
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <span className="bg-gray-100 px-3 py-2 rounded">"open disaster prediction"</span>
                    <span className="bg-gray-100 px-3 py-2 rounded">"disaster prediction"</span>
                    <span className="bg-gray-100 px-3 py-2 rounded">"disaster"</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Users size={16} />
                    Pilgrim Tracker
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <span className="bg-gray-100 px-3 py-2 rounded">"open pilgrim tracker"</span>
                    <span className="bg-gray-100 px-3 py-2 rounded">"pilgrim tracker"</span>
                    <span className="bg-gray-100 px-3 py-2 rounded">"sacred sites"</span>
                    <span className="bg-gray-100 px-3 py-2 rounded">"pilgrims"</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <MessageCircle size={16} />
                    Chatbot Assistant
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <span className="bg-gray-100 px-3 py-2 rounded">"open chatbot"</span>
                    <span className="bg-gray-100 px-3 py-2 rounded">"open chat"</span>
                    <span className="bg-gray-100 px-3 py-2 rounded">"chatbot"</span>
                    <span className="bg-gray-100 px-3 py-2 rounded">"assistant"</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Help Commands</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <span className="bg-gray-100 px-3 py-2 rounded">"help"</span>
                    <span className="bg-gray-100 px-3 py-2 rounded">"show commands"</span>
                    <span className="bg-gray-100 px-3 py-2 rounded">"hide commands"</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>Current Page:</strong> {getCurrentPageName()}
                </p>
                <p className="text-sm text-orange-700 mt-1">
                  Click the microphone button or say "help" to see all available commands.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VoiceNavigation;
