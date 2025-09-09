import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

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

interface DownloadedFile {
  uri: string;
  type: 'video' | 'image';
  filename: string;
}

export default function FaceDetectionAnalysisScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [crowdVideo, setCrowdVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [downloadedFiles, setDownloadedFiles] = useState<DownloadedFile[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string>('');
  const [tolerance, setTolerance] = useState('0.6');
  const [frameSkip, setFrameSkip] = useState('5');
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      try {
        await Camera.requestMicrophonePermissionsAsync();
      } catch {}
    })();
  }, []);

  const pickPersonImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your media library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPersonImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error('Image picker error:', error);
    }
  };

  const pickCrowdVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your media library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
        videoMaxDuration: 300, // 5 minutes max
      });

      if (!result.canceled && result.assets[0]) {
        setCrowdVideo(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick video');
      console.error('Video picker error:', error);
    }
  };

  const analyzeFaceDetection = async () => {
    if (!personImage || !crowdVideo) {
      Alert.alert('Error', 'Please select both a person image and crowd video');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      
      // Add person image
      formData.append('person_image', {
        uri: personImage,
        name: 'person.jpg',
        type: 'image/jpeg',
      } as any);

      // Add crowd video
      formData.append('crowd_video', {
        uri: crowdVideo,
        name: 'crowd.mp4',
        type: 'video/mp4',
      } as any);

      // Add parameters
      formData.append('tolerance', tolerance);
      formData.append('frame_skip', frameSkip);

      console.log('Sending request to face detection API...');
      
      // Use the same server for both analysis and download
      const response = await fetch('http://172.20.10.4:5003/api/detect', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server error');
      }

      const data = await response.json();
      setResult(data);
      console.log('Detection result:', data);

      // Download output files if detection was successful
      if (data.success) {
        await downloadOutputFiles(data);
      }

    } catch (error) {
      console.error('Face detection error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Face detection failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadOutputFiles = async (detectionData: DetectionResult) => {
    if (!detectionData.success) return;

    setDownloading(true);
    setDownloadProgress('Starting download...');
    const newFiles: DownloadedFile[] = [];

    try {
      // Download output video if available
      if (detectionData.output_video) {
        setDownloadProgress(`Downloading video: ${detectionData.output_video}`);
        const videoUri = await downloadFileWithRetry(detectionData.output_video, 'video');
        if (videoUri) {
          newFiles.push({
            uri: videoUri,
            type: 'video',
            filename: detectionData.output_video
          });
          setDownloadProgress(`Video downloaded successfully`);
        } else {
          setDownloadProgress(`Failed to download video: ${detectionData.output_video}. Check server connectivity.`);
        }
      }

      // Download detection frame if available
      if (detectionData.detection_frame) {
        setDownloadProgress(`Downloading image: ${detectionData.detection_frame}`);
        const frameUri = await downloadFileWithRetry(detectionData.detection_frame, 'image');
        if (frameUri) {
          newFiles.push({
            uri: frameUri,
            type: 'image',
            filename: detectionData.detection_frame
          });
          setDownloadProgress(`Image downloaded successfully`);
        } else {
          setDownloadProgress(`Failed to download image: ${detectionData.detection_frame}. Check server connectivity.`);
        }
      }

      setDownloadedFiles(newFiles);
      setDownloadProgress(`Download complete! ${newFiles.length} files downloaded.`);
    } catch (error) {
      console.error('Error downloading files:', error);
      setDownloadProgress('Download failed');
      Alert.alert('Warning', 'Some output files could not be downloaded');
    } finally {
      setDownloading(false);
    }
  };

  const downloadFileWithRetry = async (filename: string, fileType: 'video' | 'image', maxRetries: number = 3): Promise<string | null> => {
    const servers = [
      // Cloud server
      'http://172.20.10.4:5003', // Local server fallback
    ];
    
    for (const server of servers) {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Download attempt ${attempt}/${maxRetries} for ${filename} from ${server}`);
          const result = await downloadFileFromServer(filename, fileType, server);
          if (result) {
            return result;
          }
        } catch (error) {
          console.error(`Download attempt ${attempt} failed for ${filename} from ${server}:`, error);
          if (attempt === maxRetries) {
            console.log(`All attempts failed for ${server}, trying next server...`);
            break; // Try next server
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    console.error(`All download attempts failed for ${filename}`);
    return null;
  };

  const downloadFileFromServer = async (filename: string, fileType: 'video' | 'image', serverUrl: string): Promise<string | null> => {
    try {
      console.log(`Downloading ${fileType}: ${filename} from ${serverUrl}`);
      
      // Add timeout and better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error(`Download timeout for ${filename} from ${serverUrl}`);
        controller.abort();
      }, 120000); // 2 minute timeout for large files
      
      const downloadUrl = `${serverUrl}/api/download/${filename}`;
      console.log(`Download URL: ${downloadUrl}`);
      
      const response = await fetch(downloadUrl, {
        signal: controller.signal,
        headers: {
          'Accept': fileType === 'video' ? 'video/mp4,video/*' : 'image/*,*/*',
        },
      });
      
      clearTimeout(timeoutId);
      
      console.log(`Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Download failed: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      // Check content type
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      console.log(`Content type for ${filename}: ${contentType}`);
      console.log(`Content length for ${filename}: ${contentLength} bytes`);

      // Get the file as blob
      const blob = await response.blob();
      console.log(`Downloaded ${filename}: ${blob.size} bytes`);
      
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      // Convert blob to base64 for display
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          console.log(`Converted ${filename} to base64: ${base64data.length} characters`);
          resolve(base64data);
        };
        reader.onerror = () => {
          console.error(`Error reading ${filename} as base64`);
          reject(new Error('Failed to convert file to base64'));
        };
        reader.readAsDataURL(blob);
      });

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`Download timeout for ${filename} from ${serverUrl}`);
        throw new Error(`Download timeout for ${filename}`);
      } else {
        console.error(`Error downloading ${filename} from ${serverUrl}:`, error);
        throw error;
      }
    }
  };

  // Keep the old function for backward compatibility
  const downloadFile = async (filename: string, fileType: 'video' | 'image'): Promise<string | null> => {
    return downloadFileFromServer(filename, fileType, 'http://35.154.222.142:5001');
  };

  const resetAnalysis = () => {
    setPersonImage(null);
    setCrowdVideo(null);
    setResult(null);
    setDownloadedFiles([]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Professional Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FF8C00" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <View style={styles.iconContainer}>
                <Ionicons name="eye" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.titleTextContainer}>
                <Text style={styles.title}>Face Detection Analysis</Text>
                <Text style={styles.subtitle}>Find missing persons in crowd videos</Text>
              </View>
            </View>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>LIVE</Text>
            </View>
          </View>
        </View>

        {!result ? (
          <View style={styles.content}>
            {/* Person Image Selection */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="person" size={20} color="#FF8C00" />
                </View>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionTitle}>1. Select Person Image</Text>
                  <Text style={styles.sectionSubtitle}>Upload a clear photo of the missing person</Text>
                </View>
              </View>
              
              {personImage ? (
                <View style={styles.imagePreviewContainer}>
                  <View style={styles.imageWrapper}>
                    <Image source={{ uri: personImage }} style={styles.previewImage} />
                    <View style={styles.imageOverlay}>
                      <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
                    </View>
                  </View>
                  <TouchableOpacity onPress={pickPersonImage} style={styles.changeButton}>
                    <Ionicons name="camera" size={16} color="#FF8C00" />
                    <Text style={styles.changeButtonText}>Change Image</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={pickPersonImage} style={styles.selectButton}>
                  <View style={styles.selectButtonIcon}>
                    <Ionicons name="camera" size={32} color="#FFFFFF" />
                  </View>
                  <Text style={styles.selectButtonText}>Select Person Image</Text>
                  <Text style={styles.selectButtonSubtext}>Tap to choose from gallery</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Crowd Video Selection */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="videocam" size={20} color="#FF8C00" />
                </View>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionTitle}>2. Select Crowd Video</Text>
                  <Text style={styles.sectionSubtitle}>Upload video footage to search in</Text>
                </View>
              </View>
              
              {crowdVideo ? (
                <View style={styles.videoPreviewContainer}>
                  <View style={styles.videoWrapper}>
                    <Video
                      source={{ uri: crowdVideo }}
                      style={styles.videoPreview}
                      useNativeControls
                      resizeMode={ResizeMode.COVER}
                      shouldPlay={false}
                    />
                    <View style={styles.videoOverlay}>
                      <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
                    </View>
                  </View>
                  <TouchableOpacity onPress={pickCrowdVideo} style={styles.changeButton}>
                    <Ionicons name="videocam" size={16} color="#FF8C00" />
                    <Text style={styles.changeButtonText}>Change Video</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={pickCrowdVideo} style={styles.selectButton}>
                  <View style={styles.selectButtonIcon}>
                    <Ionicons name="videocam" size={32} color="#FFFFFF" />
                  </View>
                  <Text style={styles.selectButtonText}>Select Crowd Video</Text>
                  <Text style={styles.selectButtonSubtext}>Tap to choose from gallery</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Parameters */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="settings" size={20} color="#FF8C00" />
                </View>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionTitle}>3. Detection Parameters</Text>
                  <Text style={styles.sectionSubtitle}>Fine-tune detection accuracy</Text>
                </View>
              </View>
              
              <View style={styles.parametersContainer}>
                <View style={styles.parameterCard}>
                  <View style={styles.parameterHeader}>
                    <Ionicons name="search" size={18} color="#FF8C00" />
                    <Text style={styles.parameterLabel}>Tolerance</Text>
                  </View>
                  <Text style={styles.parameterDescription}>Lower = more strict matching</Text>
                  <TextInput
                    style={styles.parameterInput}
                    value={tolerance}
                    onChangeText={setTolerance}
                    keyboardType="numeric"
                    placeholder="0.6"
                  />
                </View>
                
                <View style={styles.parameterCard}>
                  <View style={styles.parameterHeader}>
                    <Ionicons name="speedometer" size={18} color="#FF8C00" />
                    <Text style={styles.parameterLabel}>Frame Skip</Text>
                  </View>
                  <Text style={styles.parameterDescription}>Higher = faster processing</Text>
                  <TextInput
                    style={styles.parameterInput}
                    value={frameSkip}
                    onChangeText={setFrameSkip}
                    keyboardType="numeric"
                    placeholder="5"
                  />
                </View>
              </View>
            </View>

            {/* Analyze Button */}
            <TouchableOpacity
              onPress={analyzeFaceDetection}
              style={[styles.analyzeButton, loading && styles.analyzeButtonDisabled]}
              disabled={loading || !personImage || !crowdVideo}
            >
              <View style={styles.analyzeButtonContent}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Ionicons name="search" size={20} color="#FFFFFF" />
                )}
                <Text style={styles.analyzeButtonText}>
                  {loading ? 'Analyzing...' : 'Start Face Detection'}
                </Text>
              </View>
            </TouchableOpacity>
            
            {/* Bottom Spacing */}
            <View style={styles.bottomSpacing} />
          </View>
        ) : (
          <View style={styles.resultContainer}>
            {/* Results Header */}
            <View style={styles.resultHeader}>
              <View style={styles.resultIconContainer}>
                <Ionicons 
                  name={result.success ? "checkmark-circle" : "close-circle"} 
                  size={32} 
                  color={result.success ? "#4CAF50" : "#F44336"} 
                />
              </View>
              <View style={styles.resultTitleContainer}>
                <Text style={styles.resultTitle}>
                  {result.success ? "Detection Complete" : "Detection Failed"}
                </Text>
                <Text style={styles.resultSubtitle}>
                  {result.success ? "Face detection analysis finished successfully" : "Analysis could not be completed"}
                </Text>
              </View>
            </View>
            
            {result.success ? (
              <View style={styles.successContent}>
                {/* Success Message */}
                <View style={styles.successMessageCard}>
                  <View style={styles.successIconContainer}>
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  </View>
                  <Text style={styles.successMessage}>{result.message}</Text>
                </View>
                
                {/* Detection Summary */}
                {result.detection_summary && (
                  <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                      <Ionicons name="analytics" size={20} color="#FF8C00" />
                      <Text style={styles.summaryTitle}>Detection Summary</Text>
                    </View>
                    
                    <View style={styles.summaryGrid}>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>{result.detection_summary.total_frames}</Text>
                        <Text style={styles.summaryLabel}>Total Frames</Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>{result.detection_summary.detected_frames}</Text>
                        <Text style={styles.summaryLabel}>Detected Frames</Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>
                          {((result.detection_summary.detected_frames / result.detection_summary.total_frames) * 100).toFixed(1)}%
                        </Text>
                        <Text style={styles.summaryLabel}>Match Rate</Text>
                      </View>
                    </View>
                    
                    {result.detection_summary.detection_timestamps.length > 0 && (
                      <View style={styles.timestampsContainer}>
                        <Text style={styles.timestampsTitle}>Detection Timestamps:</Text>
                        <View style={styles.timestampsList}>
                          {result.detection_summary.detection_timestamps.slice(0, 10).map((timestamp, index) => (
                            <View key={index} style={styles.timestampTag}>
                              <Text style={styles.timestampText}>{timestamp.toFixed(1)}s</Text>
                            </View>
                          ))}
                          {result.detection_summary.detection_timestamps.length > 10 && (
                            <View style={styles.timestampTag}>
                              <Text style={styles.timestampText}>+{result.detection_summary.detection_timestamps.length - 10} more</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Download Progress */}
                {downloading && (
                  <View style={styles.downloadingCard}>
                    <View style={styles.downloadingHeader}>
                      <ActivityIndicator size="small" color="#FF8C00" />
                      <Text style={styles.downloadingTitle}>Downloading Results</Text>
                    </View>
                    <Text style={styles.downloadingText}>{downloadProgress}</Text>
                  </View>
                )}

                {/* Downloaded Files */}
                {downloadedFiles.length > 0 && (
                  <View style={styles.filesCard}>
                    <View style={styles.filesHeader}>
                      <Ionicons name="download" size={20} color="#FF8C00" />
                      <Text style={styles.filesTitle}>Analysis Results</Text>
                    </View>
                    
                    {downloadedFiles.map((file, index) => (
                      <View key={index} style={styles.fileCard}>
                        <View style={styles.fileHeader}>
                          <View style={styles.fileIconContainer}>
                            <Ionicons 
                              name={file.type === 'video' ? 'videocam' : 'image'} 
                              size={20} 
                              color="#FF8C00" 
                            />
                          </View>
                          <View style={styles.fileInfo}>
                            <Text style={styles.fileName}>{file.filename}</Text>
                            <Text style={styles.fileType}>
                              {file.type === 'video' ? 'Processed Video' : 'Detection Frame'}
                            </Text>
                          </View>
                        </View>
                        
                        <View style={styles.filePreviewContainer}>
                          {file.type === 'image' ? (
                            <Image source={{ uri: file.uri }} style={styles.filePreview} />
                          ) : (
                            <Video
                              source={{ uri: file.uri }}
                              style={styles.filePreview}
                              useNativeControls
                              resizeMode={ResizeMode.COVER}
                              shouldPlay={false}
                            />
                          )}
                        </View>
                        
                        <TouchableOpacity
                          style={styles.viewButton}
                          onPress={() => {
                            if (file.type === 'video') {
                              Alert.alert(
                                'Processed Video', 
                                `This video shows the original footage with face detection highlights.\n\nFilename: ${file.filename}`
                              );
                            } else {
                              Alert.alert(
                                'Detection Frame', 
                                `This image shows a frame where the missing person was detected.\n\nFilename: ${file.filename}`
                              );
                            }
                          }}
                        >
                          <Ionicons 
                            name={file.type === 'video' ? 'play-circle' : 'eye'} 
                            size={16} 
                            color="#FFFFFF" 
                          />
                          <Text style={styles.viewButtonText}>
                            {file.type === 'video' ? 'Play Video' : 'View Image'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Manual Download */}
                {result.output_video && downloadedFiles.length === 0 && !downloading && (
                  <View style={styles.manualDownloadCard}>
                    <View style={styles.manualDownloadHeader}>
                      <Ionicons name="cloud-download" size={20} color="#FF8C00" />
                      <Text style={styles.manualDownloadTitle}>Download Results</Text>
                    </View>
                    <Text style={styles.manualDownloadText}>
                      Click below to download the analysis results
                    </Text>
                    <TouchableOpacity
                      style={styles.manualDownloadButton}
                      onPress={() => downloadOutputFiles(result)}
                    >
                      <Ionicons name="download" size={16} color="#FFFFFF" />
                      <Text style={styles.manualDownloadButtonText}>Download Files</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.errorCard}>
                <View style={styles.errorHeader}>
                  <Ionicons name="alert-circle" size={24} color="#F44336" />
                  <Text style={styles.errorTitle}>Analysis Failed</Text>
                </View>
                <Text style={styles.errorMessage}>{result.message}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity onPress={resetAnalysis} style={styles.resetButton}>
                <Ionicons name="refresh" size={16} color="#666666" />
                <Text style={styles.resetButtonText}>New Analysis</Text>
              </TouchableOpacity>
              
              {result.success && (
                <TouchableOpacity 
                  onPress={() => router.back()} 
                  style={styles.backToHomeButton}
                >
                  <Ionicons name="home" size={16} color="#FFFFFF" />
                  <Text style={styles.backToHomeButtonText}>Back to Dashboard</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
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
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  imagePreviewContainer: {
    alignItems: 'center',
  },
  imageWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  imageOverlay: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  videoPreviewContainer: {
    alignItems: 'center',
  },
  videoWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  videoPreview: {
    width: 200,
    height: 150,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  videoOverlay: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  selectButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  selectButtonIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  selectButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  changeButton: {
    backgroundColor: '#F8F9FA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 8,
  },
  changeButtonText: {
    color: '#FF8C00',
    fontSize: 14,
    fontWeight: '600',
  },
  parametersContainer: {
    gap: 16,
  },
  parameterCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  parameterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  parameterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  parameterDescription: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  parameterInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333333',
  },
  analyzeButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 5,
    marginBottom: 20,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0.1,
  },
  analyzeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  resultIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  resultTitleContainer: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  successContent: {
    gap: 20,
  },
  successMessageCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  successIconContainer: {
    marginRight: 16,
  },
  successMessage: {
    flex: 1,
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF8C00',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
    textAlign: 'center',
  },
  timestampsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
  },
  timestampsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  timestampsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timestampTag: {
    backgroundColor: '#FF8C00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timestampText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  downloadingCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FF8C00',
  },
  downloadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  downloadingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF8C00',
  },
  downloadingText: {
    fontSize: 14,
    color: '#E65100',
    fontWeight: '500',
  },
  filesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  filesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  filesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  fileCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fileIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 2,
  },
  fileType: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  filePreviewContainer: {
    marginBottom: 12,
  },
  filePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  viewButton: {
    backgroundColor: '#FF8C00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  manualDownloadCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  manualDownloadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  manualDownloadTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  manualDownloadText: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 16,
    fontWeight: '500',
  },
  manualDownloadButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  manualDownloadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorCard: {
    backgroundColor: '#FFEBEE',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C62828',
  },
  errorMessage: {
    fontSize: 14,
    color: '#C62828',
    fontWeight: '500',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 6,
  },
  resetButtonText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: 'bold',
  },
  backToHomeButton: {
    flex: 1,
    backgroundColor: '#FF8C00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    gap: 6,
  },
  backToHomeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 60,
  },
});
