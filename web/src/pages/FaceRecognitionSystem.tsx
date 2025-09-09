import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Camera, CheckCircle, AlertCircle, Loader2, X, Download, Eye } from 'lucide-react';
import AdminTag from '../components/AdminTag';

interface DetectionResult {
  success: boolean;
  message: string;
  output_video?: string;
  detection_frame?: string;
  detection_summary?: {
    total_frames: number;
    detected_frames: number;
    detection_timestamps: number[];
  };
}

const FaceRecognitionSystem = () => {
  const [personImage, setPersonImage] = useState<File | null>(null);
  const [crowdVideo, setCrowdVideo] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tolerance] = useState(0.6);
  const [frameSkip] = useState(10);
  
  const personImageRef = useRef<HTMLInputElement>(null);
  const crowdVideoRef = useRef<HTMLInputElement>(null);

  const API_BASE_URL = ''; // Use Vite proxy

  const handlePersonImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPersonImage(file);
      setError(null);
    }
  };

  const handleCrowdVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCrowdVideo(file);
      setError(null);
    }
  };

  const handleFaceRecognitionUpload = async () => {
    if (!personImage || !crowdVideo) {
      setError('Please select both a person image and crowd video');
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('person_image', personImage);
      formData.append('crowd_video', crowdVideo);
      formData.append('tolerance', tolerance.toString());
      formData.append('frame_skip', frameSkip.toString());

      const response = await fetch(`${API_BASE_URL}/api/detect`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Detection failed');
      }
    } catch (err) {
      setError('Network error. Please check if the API server is running.');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = (filename: string) => {
    window.open(`${API_BASE_URL}/api/download/${filename}`, '_blank');
  };

  const handleView = (filename: string) => {
    window.open(`${API_BASE_URL}/api/view/${filename}`, '_blank');
  };

  const clearFaceRecognitionFiles = () => {
    setPersonImage(null);
    setCrowdVideo(null);
    setResult(null);
    setError(null);
    if (personImageRef.current) personImageRef.current.value = '';
    if (crowdVideoRef.current) crowdVideoRef.current.value = '';
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
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Face Recognition System
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Advanced facial recognition technology for identifying individuals in crowd videos with high accuracy
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
              <Camera className="text-blue-400" size={28} />
              Upload Files
            </h2>

            {/* Person Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Person Image (to find)
              </label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  ref={personImageRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePersonImageChange}
                  className="hidden"
                />
                <Camera size={32} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-400 text-sm mb-3">
                  {personImage ? personImage.name : 'Click to select person image'}
                </p>
                <button
                  onClick={() => personImageRef.current?.click()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                >
                  Select Image
                </button>
              </div>
            </div>

            {/* Crowd Video Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Crowd Video (to search in)
              </label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  ref={crowdVideoRef}
                  type="file"
                  accept="video/*"
                  onChange={handleCrowdVideoChange}
                  className="hidden"
                />
                <Upload size={32} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-400 text-sm mb-3">
                  {crowdVideo ? crowdVideo.name : 'Click to select crowd video'}
                </p>
                <button
                  onClick={() => crowdVideoRef.current?.click()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                >
                  Select Video
                </button>
              </div>
            </div>

            {/* Settings */}
            <div className="mb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Recognition Tolerance: {tolerance}
                </label>
                <div className="text-xs text-gray-400 mb-2">
                  Lower values = stricter matching, Higher values = more lenient matching
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Frame Skip: {frameSkip}
                </label>
                <div className="text-xs text-gray-400 mb-2">
                  Process every {frameSkip} frames for faster analysis
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleFaceRecognitionUpload}
                disabled={!personImage || !crowdVideo || isUploading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-sm hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Camera size={18} />
                    Start Detection
                  </>
                )}
              </button>
              
              <button
                onClick={clearFaceRecognitionFiles}
                className="px-4 py-3 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-red-300">
                  <AlertCircle size={18} />
                  <span className="text-sm font-medium">Error</span>
                </div>
                <p className="text-red-200 text-sm mt-1">{error}</p>
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
              Detection Results
            </h2>

            {result ? (
              <div className="space-y-4">
                {/* Success/Failure Message */}
                {result.success ? (
                  <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-green-300">
                      <CheckCircle size={18} />
                      <span className="text-sm font-medium">Detection Successful!</span>
                    </div>
                    <p className="text-green-200 text-sm mt-1">{result.message}</p>
                  </div>
                ) : (
                  <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-red-300">
                      <AlertCircle size={18} />
                      <span className="text-sm font-medium">Detection Failed</span>
                    </div>
                    <p className="text-red-200 text-sm mt-1">{result.message}</p>
                  </div>
                )}

                {/* Detection Summary */}
                {result.detection_summary && (
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white text-lg mb-3">Detection Summary</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-400">Total Frames:</span>
                        <span className="text-white ml-2 font-medium">{result.detection_summary.total_frames}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Detected:</span>
                        <span className="text-green-400 ml-2 font-medium">{result.detection_summary.detected_frames}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-400">Success Rate:</span>
                        <span className="text-white ml-2 font-medium text-lg">
                          {((result.detection_summary.detected_frames / result.detection_summary.total_frames) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Download/View Buttons */}
                <div className="space-y-3">
                  {result.output_video && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleView(result.output_video!)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                      >
                        <Eye size={16} />
                        View Video
                      </button>
                      <button
                        onClick={() => handleDownload(result.output_video!)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                      >
                        <Download size={16} />
                        Download
                      </button>
                    </div>
                  )}

                  {result.detection_frame && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleView(result.detection_frame!)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 transition-colors"
                      >
                        <Eye size={16} />
                        View Frame
                      </button>
                      <button
                        onClick={() => handleDownload(result.detection_frame!)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition-colors"
                      >
                        <Download size={16} />
                        Download
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Camera size={48} className="mx-auto text-gray-500 mb-4" />
                <p className="text-gray-400">Upload files to start face recognition analysis</p>
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
              <div className="text-2xl font-bold text-blue-400 mb-2">Deep Learning</div>
              <div className="text-gray-300 text-sm">Neural Network Models</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400 mb-2">High Accuracy</div>
              <div className="text-gray-300 text-sm">Facial Recognition</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-2">Real-time</div>
              <div className="text-gray-300 text-sm">Processing Speed</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FaceRecognitionSystem;
