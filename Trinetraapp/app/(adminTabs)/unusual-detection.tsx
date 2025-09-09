import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

interface PersonImage {
  image: string;
  confidence: number;
  bbox: [number, number, number, number];
}

interface AnalysisResult {
  frame: number;
  timestamp_sec: number;
  analysis: {
    status: 'normal' | 'anomaly' | 'critical' | 'error' | 'safe' | 'danger';
    summary?: string;
    weapons: string[];
    fighting_detected?: boolean;
    fire_detected?: boolean;
    suspicious_activity?: boolean;
  };
  frame_screenshot?: string;
  person_images?: PersonImage[];
}

interface ApiResponse {
  success?: boolean;
  results: AnalysisResult[];
  total_frames?: number;
  threats_detected?: number;
  error?: string;
}

export default function UnusualDetectionScreen() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileUri, setSelectedFileUri] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [analysisStats, setAnalysisStats] = useState<{
    totalFrames: number;
    threatsDetected: number;
  } | null>(null);

  // Backend API URL - Update this to match your server
  // For local development: 'http://localhost:5002'
  // For production: 'https://your-domain.com'
  const API_BASE_URL = 'https://gun-detection.onrender.com';

  const pickVideo = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access media library is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow both images and videos
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = asset.fileName || (asset.type?.includes('image') ? 'selected_image.jpg' : 'selected_video.mp4');
        setSelectedFile(fileName);
        setSelectedFileUri(asset.uri);
        setError(null);
        setAnalysisResults([]);
        console.log(`📁 Selected file: ${fileName} (${asset.type})`);
      }
    } catch (err) {
      console.error('Error picking file:', err);
      setError('Failed to select file');
    }
  };

  const analyzeVideo = async () => {
    if (!selectedFile || !selectedFileUri) {
      Alert.alert('No File Selected', 'Please select a file first.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setUploadProgress(0);

    try {
      const fileUri = selectedFileUri;
      const fileName = selectedFile;

      // Create FormData for file upload
      const formData = new FormData();
      
      // For React Native, we need to create a proper file object
      const file = {
        uri: fileUri,
        type: 'video/mp4', // You might want to detect the actual type
        name: fileName,
      } as any;

      formData.append('file', file);

      // Make API call to your Flask server
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      console.log('📊 Analysis Results:', data);
      
      // Check for API errors
      if (data.error) {
        setError(data.error);
        return;
      }
      
      if (!data.success) {
        setError('Analysis failed - server returned unsuccessful response');
        return;
      }
      
      // Set analysis statistics
      if (data.total_frames !== undefined && data.threats_detected !== undefined) {
        setAnalysisStats({
          totalFrames: data.total_frames,
          threatsDetected: data.threats_detected
        });
      }
      
      // Debug: Check for images in results
      data.results?.forEach((result, index) => {
        if (result.frame_screenshot) {
          console.log(`📸 Frame ${result.frame} has screenshot:`, result.frame_screenshot.substring(0, 50) + '...');
        }
        if (result.person_images && result.person_images.length > 0) {
          console.log(`👤 Frame ${result.frame} has ${result.person_images.length} person images`);
        }
        
        // Log new detection types
        const analysis = result.analysis;
        if (analysis.fighting_detected) {
          console.log(`🥊 Frame ${result.frame}: Fighting detected`);
        }
        if (analysis.fire_detected) {
          console.log(`🔥 Frame ${result.frame}: Fire detected`);
        }
        if (analysis.suspicious_activity) {
          console.log(`⚠️ Frame ${result.frame}: Suspicious activity detected`);
        }
      });
      
      setAnalysisResults(data.results || []);
      
      if (data.results && data.results.length === 0) {
        setError('No analysis results returned from server');
      }

    } catch (err) {
      console.error('Analysis error:', err);
      let errorMessage = 'Failed to analyze video';
      
      if (err instanceof Error) {
        if (err.message.includes('Server error: 500')) {
          errorMessage = 'Server error: Please check if the backend is running and try again';
        } else if (err.message.includes('Server error: 400')) {
          errorMessage = 'Invalid file format: Please upload a valid video file';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
      setUploadProgress(0);
    }
  };

  const clearResults = () => {
    setAnalysisResults([]);
    setSelectedFile(null);
    setSelectedFileUri(null);
    setError(null);
    setAnalysisStats(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return '#8B0000'; // Dark red for critical
      case 'danger': return '#ff4444';   // Red for danger
      case 'anomaly': return '#ff8800';  // Orange for anomaly
      case 'error': return '#666666';    // Gray for error
      case 'normal': 
      case 'safe':
      default: return '#00aa00';         // Green for safe
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical': return 'flame';
      case 'danger': return 'warning';
      case 'anomaly': return 'alert-circle';
      case 'error': return 'close-circle';
      case 'normal':
      case 'safe':
      default: return 'checkmark-circle';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <View style={styles.iconContainer}>
                <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.titleTextContainer}>
                <Text style={styles.title}>Anomaly Detection</Text>
                <Text style={styles.subtitle}>
                  AI-powered behavior analysis & threat detection
                </Text>
              </View>
            </View>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>LIVE</Text>
            </View>
          </View>
        </View>

        {/* File Selection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Media Input</Text>
          <TouchableOpacity style={styles.fileButton} onPress={pickVideo}>
            <View style={styles.fileButtonContent}>
              <Ionicons name="images" size={18} color="#FF8C00" />
              <View style={styles.fileButtonTextContainer}>
                <Text style={styles.fileButtonText}>
                  {selectedFile ? 'File Selected' : 'Select Image or Video'}
                </Text>
                {selectedFile && (
                  <Text style={styles.fileButtonSubtext} numberOfLines={1}>
                    {selectedFile}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={16} color="#FF8C00" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Analysis Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analysis Controls</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.analyzeButton, isAnalyzing && styles.disabledButton]}
              onPress={analyzeVideo}
              disabled={isAnalyzing || !selectedFile}
            >
              {isAnalyzing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="analytics" size={16} color="#fff" />
              )}
              <Text style={styles.analyzeButtonText}>
                {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.clearButton} onPress={clearResults}>
              <Ionicons name="close-circle" size={16} color="#FF8C00" />
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

      {/* Progress Indicator */}
      {isAnalyzing && (
        <View style={styles.progressSection}>
          <Text style={styles.progressText}>Processing video frames...</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
          </View>
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={styles.errorSection}>
          <Ionicons name="alert-circle" size={24} color="#ff4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

        {/* Analysis Statistics */}
        {analysisStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Analysis Summary</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Ionicons name="videocam" size={20} color="#FF8C00" />
                <Text style={styles.statValue}>{analysisStats.totalFrames}</Text>
                <Text style={styles.statLabel}>Total Frames</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="warning" size={20} color="#F44336" />
                <Text style={styles.statValue}>{analysisStats.threatsDetected}</Text>
                <Text style={styles.statLabel}>Threats Detected</Text>
              </View>
            </View>
          </View>
        )}

        {/* Results Section */}
        {analysisResults.length > 0 && (
          <View style={styles.section}>
            <View style={styles.resultsHeader}>
              <View style={styles.resultsTitleContainer}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={styles.sectionTitle}>
                  Analysis Results
                </Text>
              </View>
              <View style={styles.resultsCount}>
                <Text style={styles.resultsCountText}>{analysisResults.length} frames</Text>
              </View>
            </View>
            
            {analysisResults.map((result, index) => {
              const analysis = result.analysis;
              return (
                <View key={index} style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    <View style={styles.timestampContainer}>
                      <Ionicons name="time" size={14} color="#666" />
                      <Text style={styles.timestamp}>
                        {Math.floor(result.timestamp_sec / 60)}:{(result.timestamp_sec % 60).toFixed(0).padStart(2, '0')}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(analysis.status) }]}>
                      <Ionicons 
                        name={getStatusIcon(analysis.status)} 
                        size={12} 
                        color="#FFFFFF" 
                      />
                      <Text style={styles.statusText}>
                        {analysis.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  
                  {analysis.summary && (
                    <Text style={styles.summaryText} numberOfLines={3}>
                      {analysis.summary}
                    </Text>
                  )}

                  {/* Detection Type Indicators */}
                  <View style={styles.detectionTypesContainer}>
                    {analysis.fighting_detected && (
                      <View style={styles.detectionTag}>
                        <Ionicons name="fitness" size={12} color="#FF6B35" />
                        <Text style={styles.detectionText}>Fighting</Text>
                      </View>
                    )}
                    {analysis.fire_detected && (
                      <View style={styles.detectionTag}>
                        <Ionicons name="flame" size={12} color="#FF4444" />
                        <Text style={styles.detectionText}>Fire</Text>
                      </View>
                    )}
                    {analysis.suspicious_activity && (
                      <View style={styles.detectionTag}>
                        <Ionicons name="eye" size={12} color="#FF8800" />
                        <Text style={styles.detectionText}>Suspicious</Text>
                      </View>
                    )}
                  </View>
                  
                  {analysis.weapons && analysis.weapons.length > 0 && (
                    <View style={styles.weaponsContainer}>
                      <Text style={styles.weaponsLabel}>⚠️ Weapons Detected:</Text>
                      <View style={styles.weaponsList}>
                        {analysis.weapons.map((weapon: string, weaponIndex: number) => (
                          <View key={weaponIndex} style={styles.weaponTag}>
                            <Ionicons name="warning" size={10} color="#ff4444" />
                            <Text style={styles.weaponText}>{weapon}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Frame Screenshot Display - Show when any threat is detected */}
                  {result.frame_screenshot && (
                    analysis.weapons.length > 0 || 
                    analysis.status === 'danger' || 
                    analysis.status === 'critical' ||
                    analysis.fighting_detected ||
                    analysis.fire_detected ||
                    analysis.suspicious_activity
                  ) && (
                    <View style={styles.imageContainer}>
                      <View style={styles.screenshotHeader}>
                        <Text style={styles.imageLabel}>📸 Threat Detection Screenshot</Text>
                        <View style={styles.frameInfo}>
                          <Ionicons name="videocam" size={14} color="#FF8C00" />
                          <Text style={styles.frameNumber}>Frame #{result.frame}</Text>
                        </View>
                      </View>
                      <View style={styles.screenshotContainer}>
                        <Image 
                          source={{ uri: result.frame_screenshot }} 
                          style={styles.frameScreenshot}
                          resizeMode="cover"
                          onLoad={() => console.log('✅ Threat screenshot loaded successfully')}
                          onError={(error) => console.log('❌ Threat screenshot failed to load:', error)}
                        />
                        <View style={[styles.screenshotOverlay, { 
                          backgroundColor: analysis.status === 'critical' ? 'rgba(139, 0, 0, 0.9)' : 
                                         analysis.status === 'danger' ? 'rgba(255, 68, 68, 0.9)' : 
                                         analysis.fire_detected ? 'rgba(255, 68, 68, 0.9)' :
                                         analysis.fighting_detected ? 'rgba(255, 107, 53, 0.9)' :
                                         'rgba(255, 140, 0, 0.9)' 
                        }]}>
                          <Ionicons 
                            name={analysis.status === 'critical' ? 'flame' : 
                                  analysis.fire_detected ? 'flame' :
                                  analysis.fighting_detected ? 'fitness' :
                                  analysis.status === 'danger' ? 'warning' : 'shield'} 
                            size={16} 
                            color="#FFFFFF" 
                          />
                          <Text style={styles.screenshotText}>
                            {analysis.status === 'critical' ? 'CRITICAL THREAT' :
                             analysis.fire_detected ? 'FIRE DETECTED' :
                             analysis.fighting_detected ? 'FIGHTING DETECTED' :
                             analysis.status === 'danger' ? 'DANGER DETECTED' :
                             analysis.weapons.length > 0 ? 'WEAPON DETECTED' : 'THREAT DETECTED'}
                          </Text>
                        </View>
                        <View style={styles.screenshotTimestamp}>
                          <Ionicons name="time" size={12} color="#FFFFFF" />
                          <Text style={styles.screenshotTimestampText}>
                            {Math.floor(result.timestamp_sec / 60)}:{(result.timestamp_sec % 60).toFixed(0).padStart(2, '0')}
                          </Text>
                        </View>
                        <View style={styles.screenshotFrameInfo}>
                          <Ionicons name="information-circle" size={12} color="#FFFFFF" />
                          <Text style={styles.screenshotFrameInfoText}>
                            Frame {result.frame} • {result.timestamp_sec.toFixed(1)}s
                          </Text>
                        </View>
                      </View>
                      <View style={styles.screenshotDetails}>
                        <View style={styles.detailRow}>
                          <Ionicons name="calendar" size={14} color="#64748B" />
                          <Text style={styles.detailText}>
                            Detected at: {new Date().toLocaleString()}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Ionicons name="stopwatch" size={14} color="#64748B" />
                          <Text style={styles.detailText}>
                            Video Time: {Math.floor(result.timestamp_sec / 60)}:{(result.timestamp_sec % 60).toFixed(0).padStart(2, '0')}
                          </Text>
                        </View>
                        {analysis.weapons.length > 0 && (
                          <View style={styles.detailRow}>
                            <Ionicons name="warning" size={14} color="#F44336" />
                            <Text style={[styles.detailText, { color: '#F44336' }]}>
                              Weapons: {analysis.weapons.join(', ')}
                            </Text>
                          </View>
                        )}
                        {analysis.fighting_detected && (
                          <View style={styles.detailRow}>
                            <Ionicons name="fitness" size={14} color="#FF6B35" />
                            <Text style={[styles.detailText, { color: '#FF6B35' }]}>
                              Physical altercation detected
                            </Text>
                          </View>
                        )}
                        {analysis.fire_detected && (
                          <View style={styles.detailRow}>
                            <Ionicons name="flame" size={14} color="#FF4444" />
                            <Text style={[styles.detailText, { color: '#FF4444' }]}>
                              Fire or smoke detected
                            </Text>
                          </View>
                        )}
                        {analysis.suspicious_activity && (
                          <View style={styles.detailRow}>
                            <Ionicons name="eye" size={14} color="#FF8800" />
                            <Text style={[styles.detailText, { color: '#FF8800' }]}>
                              Suspicious behavior detected
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Person Images Display */}
                  {result.person_images && result.person_images.length > 0 ? (
                    <View style={styles.personsContainer}>
                      <Text style={styles.personsLabel}>👤 Detected Persons ({result.person_images.length})</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.personsScroll}>
                        {result.person_images.map((person, personIndex) => (
                          <View key={personIndex} style={styles.personImageContainer}>
                            <Image 
                              source={{ uri: person.image }} 
                              style={styles.personImage}
                              resizeMode="cover"
                              onLoad={() => console.log(`✅ Person ${personIndex + 1} image loaded successfully`)}
                              onError={(error) => console.log(`❌ Person ${personIndex + 1} image failed to load:`, error)}
                            />
                            <View style={styles.personInfo}>
                              <Text style={styles.personConfidence}>
                                {(person.confidence * 100).toFixed(0)}% match
                              </Text>
                            </View>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  ) : result.frame_screenshot && (
                    analysis.weapons && analysis.weapons.length > 0 ||
                    analysis.fighting_detected ||
                    analysis.status === 'danger' ||
                    analysis.status === 'critical'
                  ) ? (
                    <View style={styles.noPersonsContainer}>
                      <Text style={styles.noPersonsText}>
                        ℹ️ No persons detected in this frame - weapon detection only
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <View style={styles.instructionsHeader}>
            <Ionicons name="information-circle" size={18} color="#FF8C00" />
            <Text style={styles.instructionsTitle}>How it works</Text>
          </View>
          <Text style={styles.instructionsText}>
            • Select an image or video file from your device{'\n'}
            • Click "Start Analysis" to process the media{'\n'}
            • AI analyzes for weapons and suspicious objects{'\n'}
            • Detects persons when weapons are found{'\n'}
            • Results show detailed analysis with images{'\n'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#FF8C00',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  titleTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  fileButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  fileButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileButtonTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  fileButtonText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '600',
    marginBottom: 2,
  },
  fileButtonSubtext: {
    fontSize: 14,
    color: '#666666',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  analyzeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8C00',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF8C00',
    gap: 8,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  clearButtonText: {
    color: '#FF8C00',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF8C00',
    borderRadius: 3,
  },
  errorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#F44336',
    lineHeight: 20,
    fontWeight: '500',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultsCount: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resultsCountText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF8C00',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timestamp: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  summaryText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 8,
  },
  weaponsContainer: {
    marginTop: 12,
  },
  weaponsLabel: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '600',
    marginBottom: 8,
  },
  weaponsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  weaponTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F44336',
    gap: 4,
  },
  weaponText: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '500',
  },
  instructionsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF8C00',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginLeft: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 22,
  },
  imageContainer: {
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  screenshotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  imageLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
    flex: 1,
  },
  frameInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD4A3',
  },
  frameNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF8C00',
    marginLeft: 4,
  },
  screenshotContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FF4444',
  },
  frameScreenshot: {
    width: '100%',
    height: 200,
    backgroundColor: '#F0F0F0',
  },
  screenshotOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 68, 68, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  screenshotText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  screenshotTimestamp: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  screenshotTimestampText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  screenshotFrameInfo: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  screenshotFrameInfoText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  screenshotDetails: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 8,
    fontWeight: '500',
  },
  personsContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  personsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF8C00',
    marginBottom: 8,
  },
  personsScroll: {
    flexDirection: 'row',
  },
  personImageContainer: {
    marginRight: 12,
    alignItems: 'center',
  },
  personImage: {
    width: 80,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  personInfo: {
    marginTop: 4,
    alignItems: 'center',
  },
  personConfidence: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '600',
  },
  noPersonsContainer: {
    marginTop: 16,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF8C00',
  },
  noPersonsText: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    textAlign: 'center',
  },
  detectionTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 8,
    gap: 6,
  },
  detectionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD4A3',
    gap: 4,
  },
  detectionText: {
    fontSize: 11,
    color: '#FF6B35',
    fontWeight: '600',
  },
});
