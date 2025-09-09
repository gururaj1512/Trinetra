import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, AlertCircle, CheckCircle, Loader2, X, Shield } from 'lucide-react';
import AdminTag from '../components/AdminTag';

interface EmergencyResult {
  activities: string[];
  chokepoints_detected: boolean;
  crowd_level: string;
  emergency_access_clear: boolean;
  estimated_people: number;
  harm_likelihood: string;
  medical_required: boolean;
  medical_staff_count: number;
  notes: string;
  police_count: number;
  police_required: boolean;
}

const EmergencyDetection = () => {
  const [emergencyVideoFile, setEmergencyVideoFile] = useState<File | null>(null);
  const [isEmergencyAnalyzing, setIsEmergencyAnalyzing] = useState(false);
  const [emergencyResult, setEmergencyResult] = useState<EmergencyResult | null>(null);
  const [emergencyError, setEmergencyError] = useState<string | null>(null);
  
  const emergencyVideoRef = useRef<HTMLInputElement>(null);

  const handleEmergencyVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEmergencyVideoFile(file);
      setEmergencyError(null);
    }
  };

  const handleEmergencyAnalysis = async () => {
    if (!emergencyVideoFile) {
      setEmergencyError('Please select a video file for emergency detection');
      return;
    }

    setIsEmergencyAnalyzing(true);
    setEmergencyError(null);
    setEmergencyResult(null);

    try {
      const formData = new FormData();
      formData.append('file', emergencyVideoFile);

      const response = await fetch('/emergency-api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Ensure the data has the expected structure
        if (data && typeof data === 'object' && data.crowd_level !== undefined) {
          setEmergencyResult(data);
        } else {
          setEmergencyError('Invalid response format from emergency detection API');
        }
      } else {
        setEmergencyError(data.error || 'Emergency analysis failed');
      }
    } catch (err) {
      setEmergencyError('Network error. Please check if the emergency detection server is running.');
      console.error('Emergency analysis error:', err);
    } finally {
      setIsEmergencyAnalyzing(false);
    }
  };

  const clearEmergencyFiles = () => {
    setEmergencyVideoFile(null);
    setEmergencyResult(null);
    setEmergencyError(null);
    if (emergencyVideoRef.current) emergencyVideoRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <span className="bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
              Emergency Detection
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Advanced crowd safety analysis and emergency situation detection for enhanced public safety monitoring
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Shield className="text-red-400" size={28} />
              Video Upload & Analysis
            </h2>

            {/* Video Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Emergency Video (crowd safety analysis)
              </label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-red-400 transition-colors">
                <input
                  ref={emergencyVideoRef}
                  type="file"
                  accept="video/*"
                  onChange={handleEmergencyVideoChange}
                  className="hidden"
                />
                <Upload size={32} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-400 text-sm mb-3">
                  {emergencyVideoFile ? emergencyVideoFile.name : 'Click to select crowd safety video'}
                </p>
                <button
                  onClick={() => emergencyVideoRef.current?.click()}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                >
                  Select Video
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleEmergencyAnalysis}
                disabled={!emergencyVideoFile || isEmergencyAnalyzing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg text-sm hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isEmergencyAnalyzing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <AlertCircle size={18} />
                    Start Safety Analysis
                  </>
                )}
              </button>
              
              <button
                onClick={clearEmergencyFiles}
                className="px-4 py-3 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error Display */}
            {emergencyError && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-red-300">
                  <AlertCircle size={18} />
                  <span className="text-sm font-medium">Error</span>
                </div>
                <p className="text-red-200 text-sm mt-1">{emergencyError}</p>
              </div>
            )}
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <CheckCircle className="text-green-400" size={28} />
              Safety Analysis Results
            </h2>

            {emergencyResult ? (
              <div className="space-y-4">
                {/* Overall Status */}
                <div className={`p-4 rounded-lg border ${
                  emergencyResult.harm_likelihood === 'high' || !emergencyResult.emergency_access_clear
                    ? 'bg-red-500/20 border-red-500/30' 
                    : emergencyResult.harm_likelihood === 'medium'
                    ? 'bg-yellow-500/20 border-yellow-500/30'
                    : 'bg-green-500/20 border-green-500/30'
                }`}>
                  <div className={`flex items-center gap-2 ${
                    emergencyResult.harm_likelihood === 'high' || !emergencyResult.emergency_access_clear
                      ? 'text-red-300' 
                      : emergencyResult.harm_likelihood === 'medium'
                      ? 'text-yellow-300'
                      : 'text-green-300'
                  }`}>
                    {emergencyResult.harm_likelihood === 'high' || !emergencyResult.emergency_access_clear ? (
                      <AlertCircle size={20} />
                    ) : emergencyResult.harm_likelihood === 'medium' ? (
                      <AlertCircle size={20} />
                    ) : (
                      <CheckCircle size={20} />
                    )}
                    <span className="text-lg font-medium">
                      {emergencyResult.harm_likelihood === 'high' || !emergencyResult.emergency_access_clear
                        ? '⚠️ HIGH RISK AREA' 
                        : emergencyResult.harm_likelihood === 'medium'
                        ? '⚠️ MEDIUM RISK'
                        : '✅ Area is Safe'}
                    </span>
                  </div>
                  <p className={`text-sm mt-2 ${
                    emergencyResult.harm_likelihood === 'high' || !emergencyResult.emergency_access_clear
                      ? 'text-red-200' 
                      : emergencyResult.harm_likelihood === 'medium'
                      ? 'text-yellow-200'
                      : 'text-green-200'
                  }`}>
                    {emergencyResult.notes}
                  </p>
                </div>

                {/* Crowd Analysis */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-white text-lg mb-3">Crowd Analysis</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">Crowd Level:</span>
                      <span className={`ml-2 font-medium ${
                        emergencyResult.crowd_level === 'high' ? 'text-red-400' :
                        emergencyResult.crowd_level === 'medium' ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {emergencyResult.crowd_level.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Estimated People:</span>
                      <span className="text-white ml-2 font-medium">{emergencyResult.estimated_people.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Activities:</span>
                      <span className="text-blue-400 ml-2 font-medium">{emergencyResult.activities.join(', ')}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Chokepoints:</span>
                      <span className={`ml-2 font-medium ${
                        emergencyResult.chokepoints_detected ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {emergencyResult.chokepoints_detected ? 'DETECTED' : 'NONE'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Emergency Access */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-white text-lg mb-3">Emergency Access</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">Access Clear:</span>
                      <span className={`ml-2 font-medium ${
                        emergencyResult.emergency_access_clear ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {emergencyResult.emergency_access_clear ? 'YES' : 'NO'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Harm Likelihood:</span>
                      <span className={`ml-2 font-medium ${
                        emergencyResult.harm_likelihood === 'high' ? 'text-red-400' :
                        emergencyResult.harm_likelihood === 'medium' ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {emergencyResult.harm_likelihood.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Security & Medical */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-white text-lg mb-3">Security & Medical</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">Police Count:</span>
                      <span className="text-blue-400 ml-2 font-medium">{emergencyResult.police_count}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Police Required:</span>
                      <span className={`ml-2 font-medium ${
                        emergencyResult.police_required ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {emergencyResult.police_required ? 'YES' : 'NO'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Medical Count:</span>
                      <span className="text-green-400 ml-2 font-medium">{emergencyResult.medical_staff_count}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Medical Required:</span>
                      <span className={`ml-2 font-medium ${
                        emergencyResult.medical_required ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {emergencyResult.medical_required ? 'YES' : 'NO'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield size={48} className="mx-auto text-gray-500 mb-4" />
                <p className="text-gray-400">Upload a video to start emergency detection analysis</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Technical Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
        >
          <h3 className="text-white text-xl font-bold mb-4">Technical Specifications</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400 mb-2">AI Safety</div>
              <div className="text-gray-300 text-sm">Risk Assessment</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-2">Real-time</div>
              <div className="text-gray-300 text-sm">Emergency Detection</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-2">Crowd Analysis</div>
              <div className="text-gray-300 text-sm">Safety Monitoring</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EmergencyDetection;
