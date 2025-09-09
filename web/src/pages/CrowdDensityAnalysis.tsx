import { useState, useRef, useEffect } from 'react';
import { Upload, Eye, CheckCircle, AlertCircle, Loader2, X, Download, Users, BarChart3, Shield, MapPin, Film, TrendingUp, ArrowUp, Languages } from 'lucide-react';
import CrowdRadarChart from '../components/CrowdRadarChart';

interface CrowdAnalysisResult {
  success: boolean;
  type: 'image' | 'video';
  analysis: {
    // For images
    estimated_count?: number;
    crowd_level?: string;
    confidence?: number;
    highest_density_region?: string;
    regions?: {
      left_side: { mean_density: number; crowd_level: string };
      center: { mean_density: number; crowd_level: string };
      right_side: { mean_density: number; crowd_level: string };
      top_half: { mean_density: number; crowd_level: string };
      bottom_half: { mean_density: number; crowd_level: string };
    };
    // For videos
    total_frames?: number;
    total_people_detected?: number;
    average_people_per_frame?: number;
    max_people_in_frame?: number;
    final_crowd_level?: string;
    final_regions?: {
      left_side: { mean_density: number; crowd_level: string };
      center: { mean_density: number; crowd_level: string };
      right_side: { mean_density: number; crowd_level: string };
    };
  };
  images?: {
    heatmap?: string;
    blended?: string;
    analysis?: string;
    final_heatmap?: string;
    final_analysis?: string;
  };
  videos?: {
    blended_video?: string;
    heatmap_video?: string;
  };
  timestamp?: string;
}

const CrowdDensityAnalysis = () => {
  const [crowdFile, setCrowdFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [crowdResult, setCrowdResult] = useState<CrowdAnalysisResult | null>(null);
  const [crowdError, setCrowdError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return localStorage.getItem('selectedLanguage') || 'en';
  });
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  
  const crowdAnalysisFileRef = useRef<HTMLInputElement>(null);

  const handleCrowdAnalysisFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCrowdFile(file);
      setCrowdError(null);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleCrowdAnalysis = async () => {
    if (!crowdFile) {
      setCrowdError('Please select an image or video file for crowd analysis');
      return;
    }

    setIsAnalyzing(true);
    setCrowdError(null);
    setCrowdResult(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', crowdFile);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/crowd-api/analyze', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (response.ok && data.success) {
        setCrowdResult(data);
      } else {
        setCrowdError(data.error || 'Crowd analysis failed');
      }
    } catch (err) {
      setCrowdError('Network error. Please check if the crowd analysis server is running.');
      console.error('Crowd analysis error:', err);
    } finally {
      setIsAnalyzing(false);
      setUploadProgress(0);
    }
  };

  const clearCrowdAnalysisFiles = () => {
    setCrowdFile(null);
    setCrowdResult(null);
    setCrowdError(null);
    setPreviewUrl(null);
    if (crowdAnalysisFileRef.current) crowdAnalysisFileRef.current.value = '';
  };

  const getCrowdLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'very low': return 'text-green-600';
      case 'low': return 'text-blue-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'very high': return 'text-red-600';
      case 'extremely high': return 'text-red-800';
      default: return 'text-gray-600';
    }
  };

  const handleLanguageChange = (lang: string) => {
    setCurrentLanguage(lang);
    setShowLanguageMenu(false);
    // Store language preference in localStorage
    localStorage.setItem('selectedLanguage', lang);
    console.log('Language changed to:', lang);
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'bn', name: 'বাংলা', flag: '🇮🇳' },
  ];

  // Translation object
  const translations = {
    en: {
      divineProtection: 'Divine Protection & Safety Management',
      dashboard: 'Divine Protection Dashboard',
      sacredMonitoring: 'Sacred Monitoring & Safety Management for Mahakumbh',
      riskScore: 'Risk Score',
      criticalAlerts: 'Critical Alerts',
      currentCrowd: 'Current Crowd',
      openRoutes: 'Open Routes',
      lowRisk: 'Low Risk',
      immediateAction: 'Immediate Action Required',
      capacity: '0% Capacity',
      trafficNormal: 'Traffic Flow Normal',
      mediaUpload: 'Media Upload',
      dropFiles: 'Drop files here or click to browse',
      supports: 'Supports: Images (JPG, PNG, BMP, TIFF) and Videos (MP4, AVI, MOV, MKV, WMV)',
      maxSize: 'Maximum file size: 100MB',
      uploading: 'Uploading...',
      mediaPreview: 'Media Preview',
      analysisResults: 'Analysis Results',
      imageAnalysis: 'Image Analysis',
      videoAnalysis: 'Video Analysis',
      estimatedPeople: 'Estimated People',
      crowdLevel: 'Crowd Level',
      confidence: 'Confidence',
      highestDensity: 'Highest Density',
      totalFrames: 'Total Frames',
      avgPerFrame: 'Avg per Frame',
      peakCount: 'Peak Count',
      finalLevel: 'Final Level',
      analysisComplete: 'Analysis Complete!',
      analysisFinished: 'Crowd density analysis finished successfully',
      heatmap: 'Heatmap',
      blendedView: 'Blended View',
      analysis: 'Analysis',
      finalHeatmap: 'Final Heatmap',
      finalAnalysis: 'Final Analysis',
      blendedVideo: 'Blended Video',
      heatmapVideo: 'Heatmap Video',
      download: 'Download',
      roadSideAnalysis: 'Road Side Analysis',
      regionalStatistics: 'Regional Statistics',
      startAnalysis: 'Start Analysis',
      analyzing: 'Analyzing...',
      clear: 'Clear',
      trinetraAnalyzing: 'Trinetra is Analyzing...',
      processingMedia: 'Processing your media',
      poweredBy: 'Powered by AI for Mahakumbh'
    },
    hi: {
      divineProtection: 'दिव्य सुरक्षा और सुरक्षा प्रबंधन',
      dashboard: 'दिव्य सुरक्षा डैशबोर्ड',
      sacredMonitoring: 'महाकुंभ के लिए पवित्र निगरानी और सुरक्षा प्रबंधन',
      riskScore: 'जोखिम स्कोर',
      criticalAlerts: 'महत्वपूर्ण अलर्ट',
      currentCrowd: 'वर्तमान भीड़',
      openRoutes: 'खुले मार्ग',
      lowRisk: 'कम जोखिम',
      immediateAction: 'तत्काल कार्रवाई आवश्यक',
      capacity: '0% क्षमता',
      trafficNormal: 'यातायात प्रवाह सामान्य',
      mediaUpload: 'मीडिया अपलोड',
      dropFiles: 'फ़ाइलें यहाँ छोड़ें या ब्राउज़ करने के लिए क्लिक करें',
      supports: 'समर्थन: छवियां (JPG, PNG, BMP, TIFF) और वीडियो (MP4, AVI, MOV, MKV, WMV)',
      maxSize: 'अधिकतम फ़ाइल आकार: 100MB',
      uploading: 'अपलोड हो रहा है...',
      mediaPreview: 'मीडिया पूर्वावलोकन',
      analysisResults: 'विश्लेषण परिणाम',
      imageAnalysis: 'छवि विश्लेषण',
      videoAnalysis: 'वीडियो विश्लेषण',
      estimatedPeople: 'अनुमानित लोग',
      crowdLevel: 'भीड़ स्तर',
      confidence: 'आत्मविश्वास',
      highestDensity: 'उच्चतम घनत्व',
      totalFrames: 'कुल फ्रेम',
      avgPerFrame: 'प्रति फ्रेम औसत',
      peakCount: 'शिखर गिनती',
      finalLevel: 'अंतिम स्तर',
      analysisComplete: 'विश्लेषण पूर्ण!',
      analysisFinished: 'भीड़ घनत्व विश्लेषण सफलतापूर्वक समाप्त',
      heatmap: 'हीटमैप',
      blendedView: 'मिश्रित दृश्य',
      analysis: 'विश्लेषण',
      finalHeatmap: 'अंतिम हीटमैप',
      finalAnalysis: 'अंतिम विश्लेषण',
      blendedVideo: 'मिश्रित वीडियो',
      heatmapVideo: 'हीटमैप वीडियो',
      download: 'डाउनलोड',
      roadSideAnalysis: 'सड़क किनारे विश्लेषण',
      regionalStatistics: 'क्षेत्रीय आंकड़े',
      startAnalysis: 'विश्लेषण शुरू करें',
      analyzing: 'विश्लेषण हो रहा है...',
      clear: 'साफ़ करें',
      trinetraAnalyzing: 'त्रिनेत्र विश्लेषण कर रहा है...',
      processingMedia: 'आपका मीडिया प्रसंस्करण',
      poweredBy: 'महाकुंभ के लिए AI द्वारा संचालित'
    },
    gu: {
      divineProtection: 'દિવ્ય સુરક્ષા અને સલામતી વ્યવસ્થાપન',
      dashboard: 'દિવ્ય સુરક્ષા ડેશબોર્ડ',
      sacredMonitoring: 'મહાકુંભ માટે પવિત્ર મોનિટરિંગ અને સલામતી વ્યવસ્થાપન',
      riskScore: 'રિસ્ક સ્કોર',
      criticalAlerts: 'મહત્વપૂર્ણ એલર્ટ',
      currentCrowd: 'વર્તમાન ભીડ',
      openRoutes: 'ખુલ્લા માર્ગો',
      lowRisk: 'નીચું જોખમ',
      immediateAction: 'તાત્કાલિક ક્રિયા જરૂરી',
      capacity: '0% ક્ષમતા',
      trafficNormal: 'ટ્રાફિક પ્રવાહ સામાન્ય',
      mediaUpload: 'મીડિયા અપલોડ',
      dropFiles: 'ફાઇલો અહીં છોડો અથવા બ્રાઉઝ કરવા માટે ક્લિક કરો',
      supports: 'સપોર્ટ: ઇમેજ (JPG, PNG, BMP, TIFF) અને વિડિયો (MP4, AVI, MOV, MKV, WMV)',
      maxSize: 'મહત્તમ ફાઇલ કદ: 100MB',
      uploading: 'અપલોડ થઈ રહ્યું છે...',
      mediaPreview: 'મીડિયા પૂર્વાવલોકન',
      analysisResults: 'વિશ્લેષણ પરિણામો',
      imageAnalysis: 'ઇમેજ વિશ્લેષણ',
      videoAnalysis: 'વિડિયો વિશ્લેષણ',
      estimatedPeople: 'અંદાજિત લોકો',
      crowdLevel: 'ભીડ સ્તર',
      confidence: 'વિશ્વાસ',
      highestDensity: 'ઉચ્ચતમ ઘનતા',
      totalFrames: 'કુલ ફ્રેમ',
      avgPerFrame: 'દર ફ્રેમ ઔસત',
      peakCount: 'પીક ગણતરી',
      finalLevel: 'અંતિમ સ્તર',
      analysisComplete: 'વિશ્લેષણ પૂર્ણ!',
      analysisFinished: 'ભીડ ઘનતા વિશ્લેષણ સફળતાપૂર્વક સમાપ્ત',
      heatmap: 'હીટમેપ',
      blendedView: 'મિશ્રિત દૃશ્ય',
      analysis: 'વિશ્લેષણ',
      finalHeatmap: 'અંતિમ હીટમેપ',
      finalAnalysis: 'અંતિમ વિશ્લેષણ',
      blendedVideo: 'મિશ્રિત વિડિયો',
      heatmapVideo: 'હીટમેપ વિડિયો',
      download: 'ડાઉનલોડ',
      roadSideAnalysis: 'રોડ સાઇડ વિશ્લેષણ',
      regionalStatistics: 'પ્રાદેશિક આંકડા',
      startAnalysis: 'વિશ્લેષણ શરૂ કરો',
      analyzing: 'વિશ્લેષણ થઈ રહ્યું છે...',
      clear: 'સાફ કરો',
      trinetraAnalyzing: 'ત્રિનેત્ર વિશ્લેષણ કરી રહ્યું છે...',
      processingMedia: 'તમારા મીડિયાનું પ્રોસેસિંગ',
      poweredBy: 'મહાકુંભ માટે AI દ્વારા સંચાલિત'
    },
    bn: {
      divineProtection: 'দিব্য সুরক্ষা ও নিরাপত্তা ব্যবস্থাপনা',
      dashboard: 'দিব্য সুরক্ষা ড্যাশবোর্ড',
      sacredMonitoring: 'মহাকুম্ভের জন্য পবিত্র নিবিড় পর্যবেক্ষণ ও নিরাপত্তা ব্যবস্থাপনা',
      riskScore: 'ঝুঁকি স্কোর',
      criticalAlerts: 'সমালোচনামূলক সতর্কতা',
      currentCrowd: 'বর্তমান জনতা',
      openRoutes: 'খোলা রুট',
      lowRisk: 'নিম্ন ঝুঁকি',
      immediateAction: 'তাত্ক্ষণিক পদক্ষেপ প্রয়োজন',
      capacity: '0% ধারণক্ষমতা',
      trafficNormal: 'ট্র্যাফিক প্রবাহ স্বাভাবিক',
      mediaUpload: 'মিডিয়া আপলোড',
      dropFiles: 'ফাইল এখানে ফেলে দিন বা ব্রাউজ করতে ক্লিক করুন',
      supports: 'সমর্থন: ছবি (JPG, PNG, BMP, TIFF) এবং ভিডিও (MP4, AVI, MOV, MKV, WMV)',
      maxSize: 'সর্বোচ্চ ফাইল আকার: 100MB',
      uploading: 'আপলোড হচ্ছে...',
      mediaPreview: 'মিডিয়া প্রিভিউ',
      analysisResults: 'বিশ্লেষণ ফলাফল',
      imageAnalysis: 'ছবি বিশ্লেষণ',
      videoAnalysis: 'ভিডিও বিশ্লেষণ',
      estimatedPeople: 'আনুমানিক লোক',
      crowdLevel: 'জনতা স্তর',
      confidence: 'আত্মবিশ্বাস',
      highestDensity: 'সর্বোচ্চ ঘনত্ব',
      totalFrames: 'মোট ফ্রেম',
      avgPerFrame: 'প্রতি ফ্রেম গড়',
      peakCount: 'পিক গণনা',
      finalLevel: 'চূড়ান্ত স্তর',
      analysisComplete: 'বিশ্লেষণ সম্পূর্ণ!',
      analysisFinished: 'জনতা ঘনত্ব বিশ্লেষণ সফলভাবে সম্পন্ন',
      heatmap: 'হিটম্যাপ',
      blendedView: 'মিশ্রিত দৃশ্য',
      analysis: 'বিশ্লেষণ',
      finalHeatmap: 'চূড়ান্ত হিটম্যাপ',
      finalAnalysis: 'চূড়ান্ত বিশ্লেষণ',
      blendedVideo: 'মিশ্রিত ভিডিও',
      heatmapVideo: 'হিটম্যাপ ভিডিও',
      download: 'ডাউনলোড',
      roadSideAnalysis: 'রাস্তার পাশের বিশ্লেষণ',
      regionalStatistics: 'আঞ্চলিক পরিসংখ্যান',
      startAnalysis: 'বিশ্লেষণ শুরু করুন',
      analyzing: 'বিশ্লেষণ হচ্ছে...',
      clear: 'পরিষ্কার করুন',
      trinetraAnalyzing: 'ত্রিনেত্র বিশ্লেষণ করছে...',
      processingMedia: 'আপনার মিডিয়া প্রক্রিয়াকরণ',
      poweredBy: 'মহাকুম্ভের জন্য AI দ্বারা চালিত'
    }
  };

  // Get current translation
  const t = translations[currentLanguage as keyof typeof translations] || translations.en;

  // Close language menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showLanguageMenu && !target.closest('.language-menu-container')) {
        setShowLanguageMenu(false);
      }
    };

    if (showLanguageMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showLanguageMenu]);

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
      <header className="bg-orange-500 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <Eye className="text-orange-500" size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Trinetra</h1>
                  <p className="text-sm opacity-90">{t.divineProtection}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Connected</span>
                <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs">0</span>
              </div>
              
              {/* Multilingual Button */}
              <div className="relative language-menu-container">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLanguageMenu(!showLanguageMenu);
                  }}
                  className="flex items-center gap-1 px-2 py-1 bg-white bg-opacity-20 rounded-md hover:bg-opacity-30 transition-all duration-200 cursor-pointer text-xs"
                >
                  <Languages size={14} />
                  <span className="font-medium">
                    {languages.find(lang => lang.code === currentLanguage)?.flag}
                  </span>
                </button>
                
                {showLanguageMenu && (
                  <div className="absolute top-full right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLanguageChange(lang.code);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 transition-colors flex items-center gap-2 ${
                          currentLanguage === lang.code ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                        }`}
                      >
                        <span className="text-sm">{lang.flag}</span>
                        <span className="truncate">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <AlertCircle size={20} className="text-yellow-300" />
              <div className="relative">
                <Eye size={20} />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">1</span>
              </div>
            </div>
          </div>
        </div>
      </header>

        {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t.dashboard}</h1>
          <p className="text-lg text-gray-600">{t.sacredMonitoring}</p>
        </div>

        {/* Main Stats Cards */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border-t-4 border-orange-500">
              <div className="text-3xl font-bold text-orange-500 mb-2">0</div>
              <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1">{t.riskScore}</div>
              <div className="text-xs text-gray-500">{t.lowRisk}</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border-t-4 border-red-500">
              <div className="text-3xl font-bold text-red-500 mb-2">0</div>
              <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1">{t.criticalAlerts}</div>
              <div className="text-xs text-gray-500">{t.immediateAction}</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border-t-4 border-blue-500">
              <div className="text-3xl font-bold text-blue-500 mb-2">0</div>
              <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1">{t.currentCrowd}</div>
              <div className="text-xs text-gray-500">{t.capacity}</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border-t-4 border-green-500">
              <div className="text-3xl font-bold text-green-500 mb-2">0</div>
              <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1">{t.openRoutes}</div>
              <div className="text-xs text-gray-500">{t.trafficNormal}</div>
            </div>
          </div>
        </section>

          {/* Upload Section */}
        <section className="mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
                <div className="w-1 h-6 bg-orange-500 rounded"></div>
                {t.mediaUpload}
              </h2>
              <Upload className="text-orange-500" size={24} />
            </div>
            
            <div className="p-6">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors cursor-pointer bg-gray-50 hover:bg-orange-50"
                onClick={() => crowdAnalysisFileRef.current?.click()}
              >
                <input
                  ref={crowdAnalysisFileRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleCrowdAnalysisFileChange}
                  className="hidden"
                />
                <Upload size={48} className="mx-auto text-orange-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t.dropFiles}</h3>
                <p className="text-gray-600 mb-1">{t.supports}</p>
                <p className="text-orange-600 font-semibold text-sm">{t.maxSize}</p>
              </div>
              
              {isAnalyzing && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-center text-gray-600 mt-2">{t.uploading}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Preview Section */}
        {previewUrl && (
          <section className="mb-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
                  <div className="w-1 h-6 bg-orange-500 rounded"></div>
                  Media Preview
                </h2>
                <Eye className="text-orange-500" size={24} />
              </div>
              <div className="p-6">
                {crowdFile?.type.startsWith('image/') ? (
                  <img src={previewUrl} alt="Preview" className="max-w-full h-auto rounded-lg shadow-md" />
                ) : (
                  <video src={previewUrl} controls className="max-w-full h-auto rounded-lg shadow-md" />
                )}
              </div>
            </div>
          </section>
        )}

        {/* Analysis Section */}
        {crowdResult && (
          <section className="mb-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
                  <div className="w-1 h-6 bg-orange-500 rounded"></div>
                  Analysis Results
                </h2>
                <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                  {crowdResult.type === 'image' ? 'Image Analysis' : 'Video Analysis'}
                </div>
              </div>
              
              <div className="p-6">
                {/* Success Message */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle size={20} />
                    <span className="font-medium">Analysis Complete!</span>
                  </div>
                  <p className="text-green-700 text-sm mt-1">Crowd density analysis finished successfully</p>
                </div>

                {/* Analysis Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {crowdResult.type === 'image' ? (
                    <>
                      <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
                        <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="text-white" size={24} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-1">
                          {crowdResult.analysis?.estimated_count?.toLocaleString() || '0'}
                        </h3>
                        <p className="text-sm text-gray-600 font-medium uppercase tracking-wide">Estimated People</p>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
                        <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <BarChart3 className="text-white" size={24} />
                        </div>
                        <h3 className={`text-2xl font-bold mb-1 ${getCrowdLevelColor(crowdResult.analysis?.crowd_level || '')}`}>
                          {crowdResult.analysis?.crowd_level || 'Low'}
                        </h3>
                        <p className="text-sm text-gray-600 font-medium uppercase tracking-wide">Crowd Level</p>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
                        <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Shield className="text-white" size={24} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-1">
                          {crowdResult.analysis?.confidence ? `${(crowdResult.analysis.confidence * 100).toFixed(0)}%` : '0%'}
                        </h3>
                        <p className="text-sm text-gray-600 font-medium uppercase tracking-wide">Confidence</p>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
                        <div className="w-14 h-14 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MapPin className="text-white" size={24} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-1">
                          {crowdResult.analysis?.highest_density_region?.replace('_', ' ').toUpperCase() || 'Center'}
                        </h3>
                        <p className="text-sm text-gray-600 font-medium uppercase tracking-wide">Highest Density</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
                        <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Film className="text-white" size={24} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-1">
                          {crowdResult.analysis?.total_frames?.toLocaleString() || '0'}
                        </h3>
                        <p className="text-sm text-gray-600 font-medium uppercase tracking-wide">Total Frames</p>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
                        <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <TrendingUp className="text-white" size={24} />
                    </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-1">
                          {crowdResult.analysis?.average_people_per_frame?.toFixed(0) || '0'}
                        </h3>
                        <p className="text-sm text-gray-600 font-medium uppercase tracking-wide">Avg per Frame</p>
                    </div>
                      
                      <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
                        <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <ArrowUp className="text-white" size={24} />
                    </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-1">
                          {crowdResult.analysis?.max_people_in_frame?.toLocaleString() || '0'}
                        </h3>
                        <p className="text-sm text-gray-600 font-medium uppercase tracking-wide">Peak Count</p>
                    </div>
                      
                      <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
                        <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <BarChart3 className="text-white" size={24} />
                    </div>
                        <h3 className={`text-2xl font-bold mb-1 ${getCrowdLevelColor(crowdResult.analysis?.final_crowd_level || '')}`}>
                          {crowdResult.analysis?.final_crowd_level || 'Low'}
                        </h3>
                        <p className="text-sm text-gray-600 font-medium uppercase tracking-wide">Final Level</p>
                  </div>
                    </>
                  )}
                </div>

                {/* Images Grid */}
                {crowdResult.images && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {crowdResult.type === 'image' ? (
                      <>
                        {crowdResult.images.heatmap && (
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <h3 className="text-orange-600 font-semibold text-center mb-3 uppercase tracking-wide">Heatmap</h3>
                            <img 
                              src={`data:image/png;base64,${crowdResult.images.heatmap}`}
                              alt="Crowd Density Heatmap"
                              className="w-full h-48 object-cover rounded-lg shadow-md"
                            />
                          </div>
                        )}
                        {crowdResult.images.blended && (
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <h3 className="text-orange-600 font-semibold text-center mb-3 uppercase tracking-wide">Blended View</h3>
                            <img 
                              src={`data:image/jpeg;base64,${crowdResult.images.blended}`}
                              alt="Blended View"
                              className="w-full h-48 object-cover rounded-lg shadow-md"
                            />
                          </div>
                        )}
                        {crowdResult.images.analysis && (
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <h3 className="text-orange-600 font-semibold text-center mb-3 uppercase tracking-wide">Analysis</h3>
                            <img 
                              src={`data:image/png;base64,${crowdResult.images.analysis}`}
                              alt="Detailed Analysis"
                              className="w-full h-48 object-cover rounded-lg shadow-md"
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                      {crowdResult.images.final_heatmap && (
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <h3 className="text-orange-600 font-semibold text-center mb-3 uppercase tracking-wide">Final Heatmap</h3>
                          <img 
                            src={`data:image/png;base64,${crowdResult.images.final_heatmap}`}
                            alt="Final Heatmap"
                              className="w-full h-48 object-cover rounded-lg shadow-md"
                          />
                        </div>
                      )}
                      {crowdResult.images.final_analysis && (
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <h3 className="text-orange-600 font-semibold text-center mb-3 uppercase tracking-wide">Final Analysis</h3>
                          <img 
                            src={`data:image/png;base64,${crowdResult.images.final_analysis}`}
                              alt="Final Analysis"
                              className="w-full h-48 object-cover rounded-lg shadow-md"
                          />
                        </div>
                      )}
                      </>
                    )}
                  </div>
                )}

                {/* Video Controls */}
                {crowdResult.videos && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {crowdResult.videos.blended_video && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h3 className="text-orange-600 font-semibold text-center mb-3 uppercase tracking-wide">Blended Video</h3>
                        <video 
                          src={`http://65.2.80.116:5002${crowdResult.videos.blended_video}`}
                          controls 
                          className="w-full h-48 object-cover rounded-lg shadow-md"
                        >
                          Your browser does not support the video tag.
                        </video>
                        <a 
                          href={`http://65.2.80.116:5002${crowdResult.videos.blended_video}`}
                          download 
                          className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium mt-3 hover:bg-orange-600 transition-colors"
                        >
                          <Download size={16} />
                          Download
                        </a>
                      </div>
                    )}
                    {crowdResult.videos.heatmap_video && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h3 className="text-orange-600 font-semibold text-center mb-3 uppercase tracking-wide">Heatmap Video</h3>
                        <video 
                          src={`http://65.2.80.116:5002${crowdResult.videos.heatmap_video}`}
                          controls 
                          className="w-full h-48 object-cover rounded-lg shadow-md"
                        >
                          Your browser does not support the video tag.
                        </video>
                        <a 
                          href={`http://65.2.80.116:5002${crowdResult.videos.heatmap_video}`}
                          download 
                          className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium mt-3 hover:bg-orange-600 transition-colors"
                        >
                          <Download size={16} />
                          Download
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Road Analysis Section with Radar Chart */}
        {crowdResult && crowdResult.analysis.regions && (
          <section className="mb-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
                  <div className="w-1 h-6 bg-orange-500 rounded"></div>
                  Road Side Analysis
                </h2>
                <Eye className="text-orange-500" size={24} />
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Radar Chart */}
                  <div>
                    <CrowdRadarChart 
                      regions={crowdResult.analysis.regions} 
                      type={crowdResult.type}
                    />
                  </div>
                  
                  {/* Road Statistics */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Regional Statistics</h3>
                    {Object.entries(crowdResult.analysis.regions).map(([region, stats]) => (
                      <div key={region} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="text-orange-600 font-semibold mb-2 uppercase tracking-wide">
                          {region.replace('_', ' ')}
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Crowd Level:</span>
                            <span className={`ml-2 font-medium ${getCrowdLevelColor(stats.crowd_level)}`}>
                              {stats.crowd_level}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Density:</span>
                            <span className="ml-2 font-medium text-gray-800">
                              {(stats.mean_density * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Error Display */}
        {crowdError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle size={20} />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-700 text-sm mt-1">{crowdError}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleCrowdAnalysis}
            disabled={!crowdFile || isAnalyzing}
            className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Eye size={20} />
                Start Analysis
              </>
            )}
          </button>
          
          <button
            onClick={clearCrowdAnalysisFiles}
            className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-full font-medium hover:bg-gray-600 transition-all duration-300 shadow-lg"
          >
            <X size={20} />
            Clear
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-orange-500 font-semibold text-lg mb-1">Trinetra</h3>
              <p className="text-gray-600 text-sm">Mahakumbh Crowd Analysis System</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">&copy; 2024 Trinetra. Powered by AI for Mahakumbh.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Loading Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 text-center max-w-md mx-4">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Trinetra is Analyzing...</h3>
            <p className="text-gray-600">Processing your media</p>
          </div>
      </div>
      )}
    </div>
  );
};

export default CrowdDensityAnalysis;