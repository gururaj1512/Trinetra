import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Clock, Search, Filter, MessageCircle, Mic, MicOff, Volume2, RefreshCw, Star, Users, Calendar, Bell } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface TempleSite {
  id: number;
  name: string;
  location: string;
  type: 'temple' | 'gurdwara' | 'mosque' | 'church' | 'monastery' | 'shrine';
  deity?: string;
  status: 'open' | 'closed' | 'ceremony' | 'maintenance';
  contact: string;
  timings: string;
  coordinates?: { lat: number; lng: number };
  currentEvent?: string;
  specialOfferings?: string[];
  rating: number;
  visitorsToday: number;
  nextCeremony?: string;
  facilities: string[];
}

interface ChatMessage {
  sender: "user" | "bot";
  text: string;
}

const GEMINI_API_KEY = "AIzaSyAerBoGRKAl_AMK4uGDG1re1u86sNxa28o";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const TempleTracker = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  
  const [temples, setTemples] = useState<TempleSite[]>([]);
  const [isLoadingTemples, setIsLoadingTemples] = useState(true);

  // Generate Solapur-specific temple and religious site data
  const generateTempleData = () => {
    const templeNames = [
      'Siddheshwar Temple', 'Tulja Bhavani Temple', 'Khandoba Temple', 'Vitthal Rukmini Temple',
      'Ganapati Temple', 'Datta Temple', 'Shani Temple', 'Mahalaxmi Temple',
      'Ram Temple', 'Krishna Temple', 'Hanuman Temple', 'Shiva Temple',
      'Durga Temple', 'Laxmi Temple', 'Saraswati Temple', 'Navgraha Temple',
      'Jain Temple', 'Gurudwara Sahib', 'Masjid-e-Azam', 'St. Mary\'s Church'
    ];
    
    const deities = [
      'Lord Siddheshwar', 'Goddess Tulja Bhavani', 'Lord Khandoba', 'Lord Vitthal & Rukmini',
      'Lord Ganesha', 'Lord Dattatreya', 'Lord Shani', 'Goddess Mahalaxmi',
      'Lord Rama', 'Lord Krishna', 'Lord Hanuman', 'Lord Shiva',
      'Goddess Durga', 'Goddess Laxmi', 'Goddess Saraswati', 'Navgraha (Nine Planets)',
      'Lord Mahavira', 'Guru Nanak Dev Ji', 'Allah', 'Mother Mary'
    ];
    
    const locations = [
      'Solapur City, Maharashtra', 'Tuljapur, Maharashtra', 'Solapur City, Maharashtra', 'Pandharpur, Maharashtra',
      'Solapur City, Maharashtra', 'Solapur City, Maharashtra', 'Solapur City, Maharashtra', 'Solapur City, Maharashtra',
      'Solapur City, Maharashtra', 'Solapur City, Maharashtra', 'Solapur City, Maharashtra', 'Solapur City, Maharashtra',
      'Solapur City, Maharashtra', 'Solapur City, Maharashtra', 'Solapur City, Maharashtra', 'Solapur City, Maharashtra',
      'Solapur City, Maharashtra', 'Solapur City, Maharashtra', 'Solapur City, Maharashtra', 'Solapur City, Maharashtra'
    ];
    
    const types = ['temple', 'temple', 'temple', 'temple', 'temple', 'gurdwara', 'temple', 'mosque', 'church', 'monastery'];
    const statuses = ['open', 'open', 'open', 'ceremony', 'open', 'open', 'ceremony', 'closed', 'open', 'maintenance'];
    
    const ceremonies = [
      'Morning Aarti', 'Evening Aarti', 'Abhishekam', 'Bhajan Sandhya', 'Kirtan',
      'Hawan', 'Special Puja', 'Festival Celebration', 'Meditation Session', 'Satsang'
    ];
    
    const offerings = [
      ['Prasadam', 'Holy Water'], ['Free Meals', 'Accommodation'], ['Darshan Tickets', 'VIP Entry'],
      ['Meditation Classes', 'Spiritual Guidance'], ['Free Medical Camp', 'Community Kitchen'],
      ['Educational Programs', 'Cultural Events'], ['Pilgrimage Assistance', 'Travel Guide']
    ];
    
    const facilitiesOptions = [
      ['Parking', 'Restrooms', 'Drinking Water'], ['Shoe Storage', 'Wheelchair Access', 'Audio Guide'],
      ['Photography Allowed', 'Gift Shop', 'Information Center'], ['First Aid', 'Lost & Found', 'Security'],
      ['Community Hall', 'Library', 'Meditation Room'], ['Guest House', 'Food Court', 'ATM']
    ];
    
    const generatedTemples: TempleSite[] = [];
    
    for (let i = 0; i < 20; i++) {
      const name = templeNames[i % templeNames.length];
      const deity = deities[Math.floor(Math.random() * deities.length)];
      const location = locations[i % locations.length];
      const type = types[Math.floor(Math.random() * types.length)] as any;
      const status = statuses[Math.floor(Math.random() * statuses.length)] as any;
      const facilities = facilitiesOptions[Math.floor(Math.random() * facilitiesOptions.length)];
      const specialOfferings = offerings[Math.floor(Math.random() * offerings.length)];
      const nextCeremony = ceremonies[Math.floor(Math.random() * ceremonies.length)];
      
             // Generate realistic coordinates around Solapur, Maharashtra
       // Solapur coordinates: 17.6599° N, 75.9064° E
       const lat = 17.6599 + (Math.random() - 0.5) * 0.1;
       const lng = 75.9064 + (Math.random() - 0.5) * 0.1;
      
      const rating = (4 + Math.random()).toFixed(1);
      const visitorsToday = Math.floor(Math.random() * 5000 + 100);
      
      // Generate temple timings
      const timings = Math.random() > 0.5 ? '5:00 AM - 10:00 PM' : '6:00 AM - 9:00 PM';
      
      // Generate phone number
      const phone = '+91-' + Math.floor(Math.random() * 9000000000 + 1000000000);
      
      // Current event based on status
      let currentEvent = '';
      if (status === 'ceremony') currentEvent = nextCeremony + ' in progress';
      else if (status === 'closed') currentEvent = 'Closed for the day';
      else if (status === 'maintenance') currentEvent = 'Under maintenance';
      else currentEvent = 'Open for darshan';
      
      generatedTemples.push({
        id: i + 1,
        name,
        location,
        type,
        deity: type === 'temple' ? deity : undefined,
        status,
        contact: phone,
        timings,
        coordinates: { lat, lng },
        currentEvent,
        specialOfferings,
        rating: parseFloat(rating),
        visitorsToday,
        nextCeremony: status !== 'ceremony' ? nextCeremony + ' at 6:00 PM' : undefined,
        facilities
      });
    }
    
    return generatedTemples;
  };

  // Load temple data function
  const loadTemples = () => {
    setIsLoadingTemples(true);
    // Simulate API call delay
    setTimeout(() => {
      const templeData = generateTempleData();
      setTemples(templeData);
      setIsLoadingTemples(false);
    }, 1500);
  };



  // Load temple data on component mount
  useEffect(() => {
    loadTemples();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadTemples, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-green-600 bg-green-100';
      case 'closed': return 'text-red-600 bg-red-100';
      case 'ceremony': return 'text-purple-600 bg-purple-100';
      case 'maintenance': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500';
      case 'closed': return 'bg-red-500';
      case 'ceremony': return 'bg-purple-500 animate-pulse';
      case 'maintenance': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'temple': return '🏛️';
      case 'gurdwara': return '🕌';
      case 'mosque': return '🕌';
      case 'church': return '⛪';
      case 'monastery': return '🏯';
      case 'shrine': return '🛕';
      default: return '🏛️';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'temple': return 'bg-orange-100 text-orange-700';
      case 'gurdwara': return 'bg-blue-100 text-blue-700';
      case 'mosque': return 'bg-green-100 text-green-700';
      case 'church': return 'bg-purple-100 text-purple-700';
      case 'monastery': return 'bg-yellow-100 text-yellow-700';
      case 'shrine': return 'bg-pink-100 text-pink-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.maxAlternatives = 1;

      recognitionInstance.onstart = () => setIsListening(true);
      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setChatInput(transcript);
        setIsListening(false);
      };
      recognitionInstance.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };
      recognitionInstance.onend = () => setIsListening(false);
      setRecognition(recognitionInstance);
    }
  }, []);

  const getGeminiReply = async (text: string) => {
    const templeContext = temples.map(t => 
      `${t.name} - ${t.location}, Type: ${t.type}, Status: ${t.status}, Deity: ${t.deity || 'N/A'}, Timings: ${t.timings}, Current: ${t.currentEvent}, Next: ${t.nextCeremony || 'N/A'}, Facilities: ${t.facilities.join(', ')}`
    ).join('\n');

    const prompt = `You are an AI assistant for the Solapur Sacred Sites Tracker system. You help devotees and pilgrims find temples and religious sites in Solapur, Maharashtra, plan visits, and get spiritual guidance.

Current Solapur Religious Sites Data:
${templeContext}

User query: ${text}

Provide helpful information about:
- Solapur temple locations, timings, and status
- Local religious ceremonies and events
- Spiritual guidance and practices specific to Solapur
- Pilgrimage planning in and around Solapur
- Temple facilities and services in Solapur
- Local religious festivals and celebrations
- Prayer times and rituals
- Historical significance of Solapur temples
- Local customs and traditions

Respond in a respectful, spiritual tone. Use markdown formatting for better readability.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sorry, I couldn't process that request.";
  };

  const speak = async (text: string) => {
    try {
      setIsSpeaking(true);
      const ttsResponse = await fetch(
        "https://texttospeech.googleapis.com/v1/text:synthesize?key=AIzaSyCpu960hVq_cy_dZYf1DUVNrBaWJnpBCuk",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: { text },
            voice: {
              languageCode: "en-US",
              name: "en-US-Wavenet-D",
            },
            audioConfig: { audioEncoding: "MP3" },
          }),
        },
      );
      const ttsData = await ttsResponse.json();
      if (ttsData?.audioContent) {
        const audio = new Audio("data:audio/mp3;base64," + ttsData.audioContent);
        setCurrentAudio(audio);
        
        audio.onended = () => {
          setIsSpeaking(false);
          setCurrentAudio(null);
        };
        
        audio.onerror = () => {
          setIsSpeaking(false);
          setCurrentAudio(null);
        };
        
        await audio.play();
      }
    } catch (err) {
      console.error("TTS Error:", err);
      setIsSpeaking(false);
      setCurrentAudio(null);
    }
  };

  const stopSpeaking = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    setIsSpeaking(false);
  };

  const startListening = () => {
    if (recognition && !isListening) {
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition && isListening) recognition.stop();
  };

  const toggleVoice = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    const userMessage: ChatMessage = { sender: "user", text: chatInput };
    setChatMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    try {
      const reply = await getGeminiReply(chatInput);
      const botMessage: ChatMessage = { sender: "bot", text: reply };
      setChatMessages((prev) => [...prev, botMessage]);
      await speak(reply);
    } catch (err) {
      console.error(err);
      alert("Error while processing your request.");
    }
    setChatInput("");
    setIsLoading(false);
  };

  const filteredTemples = temples.filter(temple => {
    const matchesSearch = temple.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         temple.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (temple.deity && temple.deity.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || temple.type === filterType;
    const matchesStatus = filterStatus === 'all' || temple.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                🏛️  Sacred Sites
              </span>
            </h1>
            <button
              onClick={() => setShowAIChat(!showAIChat)}
              className={`p-3 rounded-full transition-all duration-300 ${
                showAIChat 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' 
                  : 'bg-white text-orange-500 border-2 border-orange-500 hover:bg-orange-50'
              }`}
            >
              <MessageCircle size={24} />
            </button>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover temples, mosques, churches, and cultural sites in Solapur, Maharashtra with real-time information and visit guidance
          </p>
        </motion.div>

        {/* AI Chat Interface */}
        {showAIChat && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <MessageCircle size={20} />
                Solapur Site Guide
              </h3>
              <p className="text-white/90 text-sm">Ask about Solapur sites, local events, visit information, or cultural details</p>
            </div>
            
            <div className="h-80 flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle size={48} className="mx-auto mb-4 text-orange-500" />
                    <p>Ask me about Solapur sites, local events, visit information, or cultural details!</p>
                    <div className="mt-4 text-xs text-gray-400">
                      <p>Try: "Which sites are open in Solapur?" or "Tell me about Siddheshwar Temple"</p>
                    </div>
                  </div>
                )}
                
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${
                      msg.sender === "user"
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                                             <div className="text-xs font-medium mb-1 opacity-70">
                         {msg.sender === "user" ? "You" : "Site Guide"}
                       </div>
                      <div className="text-sm">
                        {msg.sender === "user" ? (
                          msg.text
                        ) : (
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                                 Analyzing site information...
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Input Area */}
              <div className="p-4 border-t bg-gray-50">
                <div className="flex gap-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !isLoading && handleChatSend()}
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ask about Solapur sites, events, visit information..."
                    disabled={isLoading || isListening}
                  />
                  <button
                    onClick={toggleVoice}
                    disabled={isLoading}
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      isListening 
                        ? "bg-red-500 text-white animate-pulse" 
                        : isSpeaking
                        ? "bg-blue-500 text-white animate-pulse"
                        : "bg-orange-500 text-white hover:bg-orange-600"
                    }`}
                  >
                    {isListening ? <MicOff size={16} /> : isSpeaking ? <Volume2 size={16} /> : <Mic size={16} />}
                  </button>
                  <button 
                    onClick={handleChatSend} 
                    disabled={isLoading || !chatInput.trim()} 
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {isLoading ? "..." : "Send"}
                  </button>
                </div>
                
                {/* Status Messages */}
                {isListening && (
                  <p className="text-xs text-red-600 mt-2 text-center">🎤 Listening... Speak now!</p>
                )}
                {isSpeaking && (
                  <p className="text-xs text-blue-600 mt-2 text-center">🔊 Speaking...</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-4 grid md:grid-cols-4 gap-6 mb-8"
          >
            {[
                             { 
                 label: 'Total Sites', 
                 value: temples.length.toString(), 
                 icon: MapPin, 
                 color: 'orange',
                 emoji: '🏛️'
               },
              { 
                label: 'Currently Open', 
                value: temples.filter(t => t.status === 'open').length.toString(), 
                icon: Clock, 
                color: 'green',
                emoji: '🕰️'
              },
                             { 
                 label: 'Active Events', 
                 value: temples.filter(t => t.status === 'ceremony').length.toString(), 
                 icon: Bell, 
                 color: 'purple',
                 emoji: '🔔'
               },
              { 
                label: 'Daily Visitors', 
                value: temples.reduce((sum, t) => sum + t.visitorsToday, 0).toLocaleString(), 
                icon: Users, 
                color: 'blue',
                emoji: '👥'
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 text-center hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center mx-auto mb-3`}>
                  <span className="text-2xl">{stat.emoji}</span>
                </div>
                <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Search and Filter */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search size={20} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search Solapur sites, locations, or types..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  />
                </div>
                <div className="relative">
                  <Filter size={20} className="absolute left-3 top-3 text-gray-400" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="pl-10 pr-8 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none appearance-none bg-white"
                  >
                    <option value="all">All Types</option>
                    <option value="temple">Temples</option>
                    <option value="gurdwara">Gurdwaras</option>
                    <option value="mosque">Mosques</option>
                    <option value="church">Churches</option>
                    <option value="monastery">Monasteries</option>
                    <option value="shrine">Shrines</option>
                  </select>
                </div>
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none appearance-none bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="ceremony">In Ceremony</option>
                    <option value="closed">Closed</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <button
                  onClick={loadTemples}
                  disabled={isLoadingTemples}
                  className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <RefreshCw size={16} className={isLoadingTemples ? 'animate-spin' : ''} />
                  <span className="text-sm font-medium">Refresh</span>
                </button>
              </div>
            </div>

            {/* Temple List */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-800">Solapur Sites</h3>
                <p className="text-gray-600">Showing {filteredTemples.length} places in Solapur</p>
              </div>
              <div className="divide-y divide-gray-200">
                {isLoadingTemples ? (
                  // Loading skeleton
                  Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="p-6 animate-pulse">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
                          <div>
                            <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                            <div className="h-3 bg-gray-300 rounded w-24 mb-2"></div>
                            <div className="h-3 bg-gray-300 rounded w-40"></div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="h-6 bg-gray-300 rounded w-16 mb-2"></div>
                          <div className="h-4 bg-gray-300 rounded w-12"></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : filteredTemples.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <MapPin size={48} className="mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2">No sacred sites found</h3>
                    <p>Try adjusting your search or filter criteria.</p>
                  </div>
                ) : (
                  filteredTemples.map((temple, index) => (
                  <motion.div
                    key={temple.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                            {getTypeIcon(temple.type)}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusDot(temple.status)} rounded-full border-2 border-white`}></div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-lg font-semibold text-gray-800">{temple.name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(temple.type)}`}>
                              {temple.type}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                            <span className="flex items-center space-x-1">
                              <MapPin size={12} />
                              <span>{temple.location}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock size={12} />
                              <span>{temple.timings}</span>
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              <Star size={12} className="text-yellow-500 fill-current" />
                              <span className="text-xs font-medium">{temple.rating}</span>
                            </div>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-600">{temple.visitorsToday} visitors today</span>
                          </div>
                          
                          
                          
                          <div className="flex flex-wrap gap-1">
                            {temple.facilities.slice(0, 3).map((facility, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                {facility}
                              </span>
                            ))}
                            {temple.facilities.length > 3 && (
                              <span className="text-xs text-gray-500">+{temple.facilities.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      </div>
                                              <div className="text-right">
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(temple.status)} mb-2`}>
                            {temple.status.charAt(0).toUpperCase() + temple.status.slice(1)}
                          </div>
                          <a 
                            href={`tel:${temple.contact}`}
                            className="text-xs text-blue-600 hover:underline flex items-center justify-end space-x-1"
                          >
                            <Phone size={12} />
                            <span>Call</span>
                          </a>
                        </div>
                    </div>
                  </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>

          {/* Live Map & Quick Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Live Map */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-800">Solapur Sites Map</h3>
              </div>
              <div className="h-96 bg-gradient-to-br from-orange-200 to-red-200 relative">
                <div className="absolute inset-4 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <div className="text-center text-gray-700">
                    <MapPin size={48} className="mx-auto mb-4 text-orange-600" />
                    <h4 className="font-bold mb-2">Solapur Sites</h4>
                    <p className="text-sm text-gray-600">Places of interest in Solapur, Maharashtra</p>
                  </div>
                </div>

                {/* Mock location pins */}
                {[
                  { top: '20%', left: '30%', status: 'open', type: 'temple' },
                  { top: '60%', left: '70%', status: 'ceremony', type: 'temple' },
                  { top: '40%', left: '20%', status: 'open', type: 'gurdwara' },
                  { top: '80%', left: '60%', status: 'closed', type: 'mosque' },
                  { top: '30%', left: '80%', status: 'open', type: 'church' },
                ].map((pin, index) => (
                  <div
                    key={index}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{ top: pin.top, left: pin.left }}
                  >
                    <div className={`w-4 h-4 ${getStatusDot(pin.status)} rounded-full shadow-lg`}>
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs">
                        {getTypeIcon(pin.type)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

                         {/* Today's Activities */}
             <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
               <div className="p-6 border-b border-gray-200">
                 <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                   <Bell size={20} className="text-purple-600" />
                   Today's Activities
                 </h3>
               </div>
               <div className="p-6 space-y-4">
                 {temples.filter(t => t.status === 'ceremony').slice(0, 3).map((temple) => (
                   <div key={temple.id} className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                     <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                       <Bell size={14} />
                     </div>
                     <div className="flex-1">
                       <p className="font-medium text-sm">{temple.name}</p>
                       <p className="text-xs text-gray-600">Special activities in progress</p>
                     </div>
                     <div className="text-xs text-purple-600 font-medium">Active</div>
                   </div>
                 ))}
                 
                 {temples.filter(t => t.status === 'open').slice(0, 2).map((temple) => (
                   <div key={`open-${temple.id}`} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                     <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                       <Calendar size={14} />
                     </div>
                     <div className="flex-1">
                       <p className="font-medium text-sm">{temple.name}</p>
                       <p className="text-xs text-gray-600">Open for visitors</p>
                     </div>
                     <div className="text-xs text-blue-600 font-medium">Open</div>
                   </div>
                 ))}
               </div>
             </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-800">Quick Actions</h3>
              </div>
                             <div className="p-6 space-y-3">
                 <button className="w-full p-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300 text-sm font-medium">
                   🔔 Set Visit Reminders
                 </button>
                 <button className="w-full p-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 text-sm font-medium">
                   🗺️ Plan Visit Route
                 </button>
                 <button className="w-full p-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 text-sm font-medium">
                   📅 View Event Calendar
                 </button>
                 <button className="w-full p-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 text-sm font-medium">
                   📚 Learn About Sites
                 </button>
               </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TempleTracker;