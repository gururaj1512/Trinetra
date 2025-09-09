import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, AlertCircle, CheckCircle, Loader2, X, Shield } from 'lucide-react';
import AdminTag from '../components/AdminTag';

interface BehaviorResult {
  results: Array<{
    frame: number;
    timestamp_sec: number;
    analysis: {
      status: 'safe' | 'danger' | 'error';
      weapons: string[];
    };
  }>;
}

const BehaviorAnalysis = () => {
  const [behaviorVideoFile, setBehaviorVideoFile] = useState<File | null>(null);
  const [isBehaviorAnalyzing, setIsBehaviorAnalyzing] = useState(false);
  const [behaviorResult, setBehaviorResult] = useState<BehaviorResult | null>(null);
  const [behaviorError, setBehaviorError] = useState<string | null>(null);
  
  const behaviorVideoRef = useRef<HTMLInputElement>(null);

  const handleBehaviorVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBehaviorVideoFile(file);
      setBehaviorError(null);
    }
  };

  const handleBehaviorAnalysis = async () => {
    if (!behaviorVideoFile) {
      setBehaviorError('Please select a video file for behavior analysis');
      return;
    }

    setIsBehaviorAnalyzing(true);
    setBehaviorError(null);
    setBehaviorResult(null);

    try {
      const formData = new FormData();
      formData.append('file', behaviorVideoFile);

      const response = await fetch('/behavior-api', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Ensure the data has the expected structure
        if (data && data.results && Array.isArray(data.results)) {
          setBehaviorResult(data);
        } else {
          setBehaviorError('Invalid response format from behavior analysis API');
        }
      } else {
        setBehaviorError(data.error || 'Behavior analysis failed');
      }
    } catch (err) {
      setBehaviorError('Network error. Please check if the behavior analysis server is running.');
      console.error('Behavior analysis error:', err);
    } finally {
      setIsBehaviorAnalyzing(false);
    }
  };

  const clearBehaviorFiles = () => {
    setBehaviorVideoFile(null);
    setBehaviorResult(null);
    setBehaviorError(null);
    if (behaviorVideoRef.current) behaviorVideoRef.current.value = '';
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
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Behavior Analysis
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Advanced AI-powered weapon detection and behavioral analysis for enhanced security monitoring
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
              <Shield className="text-yellow-400" size={28} />
              Video Upload & Analysis
            </h2>

            {/* Video Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Behavior Video (weapon detection)
              </label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-yellow-400 transition-colors">
                <input
                  ref={behaviorVideoRef}
                  type="file"
                  accept="video/*"
                  onChange={handleBehaviorVideoChange}
                  className="hidden"
                />
                <Upload size={32} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-400 text-sm mb-3">
                  {behaviorVideoFile ? behaviorVideoFile.name : 'Click to select behavior analysis video'}
                </p>
                <button
                  onClick={() => behaviorVideoRef.current?.click()}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 transition-colors"
                >
                  Select Video
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleBehaviorAnalysis}
                disabled={!behaviorVideoFile || isBehaviorAnalyzing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg text-sm hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isBehaviorAnalyzing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <AlertCircle size={18} />
                    Start Behavior Analysis
                  </>
                )}
              </button>
              
              <button
                onClick={clearBehaviorFiles}
                className="px-4 py-3 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error Display */}
            {behaviorError && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-red-300">
                  <AlertCircle size={18} />
                  <span className="text-sm font-medium">Error</span>
                </div>
                <p className="text-red-200 text-sm mt-1">{behaviorError}</p>
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
              Analysis Results
            </h2>

            {behaviorResult && behaviorResult.results && behaviorResult.results.length > 0 ? (
              <div className="space-y-4">
                {/* Overall Status */}
                <div className={`p-4 rounded-lg border ${
                  behaviorResult.results.some(r => r.analysis.status === 'danger') 
                    ? 'bg-red-500/20 border-red-500/30' 
                    : 'bg-green-500/20 border-green-500/30'
                }`}>
                  <div className={`flex items-center gap-2 ${
                    behaviorResult.results.some(r => r.analysis.status === 'danger') 
                      ? 'text-red-300' 
                      : 'text-green-300'
                  }`}>
                    {behaviorResult.results.some(r => r.analysis.status === 'danger') ? (
                      <AlertCircle size={20} />
                    ) : (
                      <CheckCircle size={20} />
                    )}
                    <span className="text-lg font-medium">
                      {behaviorResult.results.some(r => r.analysis.status === 'danger') 
                        ? '⚠️ WEAPONS DETECTED!' 
                        : '✅ Area is Safe'}
                    </span>
                  </div>
                  <p className={`text-sm mt-2 ${
                    behaviorResult.results.some(r => r.analysis.status === 'danger') 
                      ? 'text-red-200' 
                      : 'text-green-200'
                  }`}>
                    {behaviorResult.results.some(r => r.analysis.status === 'danger') 
                      ? 'Weapons or harmful objects detected in the video' 
                      : 'No dangerous objects found in the analyzed frames'}
                  </p>
                </div>

                {/* Analysis Summary */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-white text-lg mb-3">Weapon Detection Summary</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">Total Frames:</span>
                      <span className="text-white ml-2 font-medium">{behaviorResult.results.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Danger Frames:</span>
                      <span className="text-red-400 ml-2 font-medium">
                        {behaviorResult.results.filter(r => r.analysis.status === 'danger').length}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Safe Frames:</span>
                      <span className="text-green-400 ml-2 font-medium">
                        {behaviorResult.results.filter(r => r.analysis.status === 'safe').length}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Error Frames:</span>
                      <span className="text-yellow-400 ml-2 font-medium">
                        {behaviorResult.results.filter(r => r.analysis.status === 'error').length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detailed Results */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-white text-lg mb-3">Frame-by-Frame Analysis</h4>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {behaviorResult.results.map((result, index) => (
                      <div key={index} className={`p-3 rounded-lg text-sm ${
                        result.analysis.status === 'danger' 
                          ? 'bg-red-500/20 border border-red-500/30' 
                          : result.analysis.status === 'safe'
                          ? 'bg-green-500/20 border border-green-500/30'
                          : 'bg-yellow-500/20 border border-yellow-500/30'
                      }`}>
                        <div className="flex justify-between items-center">
                          <span className="text-white font-medium">
                            Frame {result.frame} ({result.timestamp_sec}s)
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            result.analysis.status === 'danger' 
                              ? 'bg-red-500 text-white' 
                              : result.analysis.status === 'safe'
                              ? 'bg-green-500 text-white'
                              : 'bg-yellow-500 text-black'
                          }`}>
                            {result.analysis.status.toUpperCase()}
                          </span>
                        </div>
                        {result.analysis.weapons.length > 0 && (
                          <div className="mt-2">
                            <span className="text-gray-300">Weapons detected: </span>
                            <span className="text-red-300 font-medium">
                              {result.analysis.weapons.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : behaviorResult && (!behaviorResult.results || behaviorResult.results.length === 0) ? (
              <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-300">
                  <AlertCircle size={18} />
                  <span className="text-sm font-medium">No Analysis Results</span>
                </div>
                <p className="text-yellow-200 text-sm mt-1">
                  The video was processed but no analysis results were returned. Please try again.
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield size={48} className="mx-auto text-gray-500 mb-4" />
                <p className="text-gray-400">Upload a video to start behavior analysis</p>
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
              <div className="text-2xl font-bold text-yellow-400 mb-2">AI Detection</div>
              <div className="text-gray-300 text-sm">Weapon Recognition</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400 mb-2">Real-time</div>
              <div className="text-gray-300 text-sm">Frame Analysis</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400 mb-2">High Accuracy</div>
              <div className="text-gray-300 text-sm">Threat Detection</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BehaviorAnalysis;
