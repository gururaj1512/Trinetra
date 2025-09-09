import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useRef } from 'react';
import Navbar from './components/Navbar';
import ChatbotPopup from './components/ChatbotPopup';
import VoiceNavigation from './components/VoiceNavigation';
import LandingPage from './pages/LandingPage';
import MonitoringDashboard from './pages/MonitoringDashboard';
import CrowdDensityAnalysis from './pages/CrowdDensityAnalysis';
import FaceRecognitionSystem from './pages/FaceRecognitionSystem';
import BehaviorAnalysis from './pages/BehaviorAnalysis';
import EmergencyDetection from './pages/EmergencyDetection';
import AIGuidedMaps from './pages/AIGuidedMaps';
import DisasterPrediction from './pages/DisasterPrediction';
import PilgrimTracker from './pages/PilgrimTracker';

function App() {
  const chatbotRef = useRef<{ toggleChatbot: () => void } | null>(null);

  const handleChatbotToggle = () => {
    if (chatbotRef.current && chatbotRef.current.toggleChatbot) {
      chatbotRef.current.toggleChatbot();
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-sacred-50 to-divine-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/monitoring" element={<MonitoringDashboard />} />
          <Route path="/crowd-density" element={<CrowdDensityAnalysis />} />
          <Route path="/face-recognition" element={<FaceRecognitionSystem />} />
          <Route path="/behavior-analysis" element={<BehaviorAnalysis />} />
          <Route path="/emergency-detection" element={<EmergencyDetection />} />
          <Route path="/ai-maps" element={<AIGuidedMaps />} />
          <Route path="/disaster-prediction" element={<DisasterPrediction />} />
          <Route path="/pilgrim-tracker" element={<PilgrimTracker />} />
        </Routes>
        <ChatbotPopup ref={chatbotRef} />
        <VoiceNavigation onChatbotToggle={handleChatbotToggle} />
      </div>
    </Router>
  );
}

export default App;