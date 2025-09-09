import React, { useState, useRef } from 'react';
import { Upload, Play, Pause } from 'lucide-react';
import { motion } from 'framer-motion';

const IPhoneMockup = () => {
  const [prototypeVideo, setPrototypeVideo] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [useYouTube, setUseYouTube] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // YouTube video ID extracted from the URL
  const youtubeVideoId = "y4DyLemCTMQ";

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setPrototypeVideo(url);
      setUseYouTube(false);
      setIsPlaying(false);
    }
  };

  const switchToYouTube = () => {
    setUseYouTube(true);
    setPrototypeVideo(null);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMouseEnter = () => {
    setShowControls(true);
  };

  const handleMouseLeave = () => {
    setShowControls(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.8, duration: 0.6 }}
      className="relative"
    >
      {/* iPhone Frame */}
      <div className="relative w-64 h-[520px] bg-gray-900 rounded-[3rem] p-2 shadow-2xl">
        {/* Screen */}
        <div className="w-full h-full bg-black rounded-[2.5rem] overflow-hidden relative">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl z-10"></div>
          
          {useYouTube ? (
            <div 
              className="relative w-full h-full"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {/* YouTube iframe - fills entire screen area */}
              <iframe
                src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=1&loop=1&playlist=${youtubeVideoId}&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&fs=0&disablekb=1`}
                className="absolute inset-0 w-full h-full"
                style={{ borderRadius: '2.5rem' }}
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title="YouTube video"
              />
              {/* Overlay for hover controls */}
              {showControls && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 group z-20"
                  style={{ borderRadius: '2.5rem' }}
                >
                  <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:bg-white transition-all duration-300">
                    <Play size={24} className="text-orange-600 ml-1" />
                  </div>
                </motion.div>
              )}
            </div>
          ) : prototypeVideo ? (
            <div 
              className="relative w-full h-full"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {/* Video fills entire screen area */}
              <video
                ref={videoRef}
                src={prototypeVideo}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ borderRadius: '2.5rem' }}
                loop
                muted
                autoPlay
                playsInline
                onLoadedData={() => {
                  if (videoRef.current) {
                    videoRef.current.play();
                    setIsPlaying(true);
                  }
                }}
              />
              {/* Play/Pause overlay - only show on hover */}
              {showControls && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 group z-20"
                  style={{ borderRadius: '2.5rem' }}
                >
                  <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:bg-white transition-all duration-300">
                    {isPlaying ? (
                      <Pause size={24} className="text-orange-600" />
                    ) : (
                      <Play size={24} className="text-orange-600 ml-1" />
                    )}
                  </div>
                </motion.button>
              )}
            </div>
          ) : (
            /* Default content when no video */
            <div className="w-full h-full bg-gradient-to-br from-orange-500 to-amber-600 flex flex-col items-center justify-center p-4 relative">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer text-center text-white"
              >
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto backdrop-blur-sm">
                  <Upload size={32} />
                </div>
                <h3 className="text-lg font-bold mb-2">Upload Prototype</h3>
                <p className="text-sm opacity-90">Showcase your app demo</p>
                <p className="text-xs opacity-75 mt-2">Tap to upload video</p>
              </motion.div>
              
              {/* YouTube video option */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={switchToYouTube}
                className="mt-4 px-4 py-2 bg-white/20 rounded-lg text-white text-sm font-medium backdrop-blur-sm hover:bg-white/30 transition-all duration-300"
              >
                Use YouTube Video
              </motion.button>
            </div>
          )}
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full"></div>
      </div>

      {/* Upload Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoUpload}
        className="hidden"
      />

    </motion.div>
  );
};

export default IPhoneMockup;