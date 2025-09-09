import { Ionicons } from "@expo/vector-icons"
import { ResizeMode, Video } from "expo-av"
import * as ImagePicker from "expo-image-picker"
import { useRouter } from "expo-router"
import { useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"

import { type AlertData, AlertStorage } from "../lib/alertStorage"

interface CrowdAssessment {
  crowd_level: string

  estimated_people: number

  police_required: boolean

  police_count: number

  medical_required: boolean

  medical_staff_count: number

  activities: string[]

  chokepoints_detected: boolean

  emergency_access_clear: boolean

  harm_likelihood: string

  notes: string
}

const { width, height } = Dimensions.get("window")

export default function FutureCrowdAlertScreen() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<CrowdAssessment | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [location, setLocation] = useState("Mahakumbh, Prayagraj")
  const [context, setContext] = useState("")
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [videoRef, setVideoRef] = useState<Video | null>(null)
  const router = useRouter()

  const toggleVideoPlayback = async () => {
    if (videoRef) {
      if (isVideoPlaying) {
        await videoRef.pauseAsync()
      } else {
        await videoRef.playAsync()
      }
      setIsVideoPlaying(!isVideoPlaying)
    }
  }

  const pickVideo = async () => {
    try {
      // Request permissions first

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant permission to access your media library")

        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,

        allowsEditing: false,

        quality: 1,

        videoMaxDuration: 300, // 5 minutes max

        aspect: [16, 9],
      })

      if (!result.canceled && result.assets[0]) {
        setSelectedVideo(result.assets[0])
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick video file")

      console.error("Video picker error:", error)
    }
  }

  const captureVideo = async () => {
    try {
      // Request camera permissions first

      const { status } = await ImagePicker.requestCameraPermissionsAsync()

      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant permission to access your camera")

        return
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,

        allowsEditing: false,

        quality: 1,

        videoMaxDuration: 300, // 5 minutes max

        aspect: [16, 9],
      })

      if (!result.canceled && result.assets[0]) {
        setSelectedVideo(result.assets[0])
      }
    } catch (error) {
      Alert.alert("Error", "Failed to capture video")

      console.error("Video capture error:", error)
    }
  }

  const analyzeVideo = async (videoFile: any) => {
    setIsAnalyzing(true)

    setAnalysisResult(null)

    try {
      // Create a backup of the video data before sending

      const videoBackup = {
        uri: videoFile.uri,

        name: videoFile.name || "video.mp4",

        size: videoFile.fileSize,

        duration: videoFile.duration,

        timestamp: new Date().toISOString(),

        location,

        context,
      }

      const formData = new FormData()

      formData.append("file", {
        uri: videoFile.uri,

        type: "video/mp4",

        name: videoFile.name || "video.mp4",
      } as any)

      formData.append("location", location)

      formData.append("context", context)

      // Add retry mechanism for government app reliability

      let response

      let retryCount = 0

      const maxRetries = 3

      while (retryCount < maxRetries) {
        try {
          response = await fetch("https://image-recognition-gy0r.onrender.com/analyze", {
            method: "POST",

            body: formData,

            headers: {
              "Content-Type": "multipart/form-data",
            },
          })

          break // Success, exit retry loop
        } catch (fetchError) {
          retryCount++

          if (retryCount >= maxRetries) {
            throw new Error(`Network error after ${maxRetries} attempts`)
          }

          // Wait before retry (exponential backoff)

          await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
        }
      }

      if (!response || !response.ok) {
        throw new Error(`Analysis failed: ${response?.status} ${response?.statusText}`)
      }

      const result = await response.json()

      // Validate the response data
      if (!result || typeof result !== "object") {
        throw new Error("Invalid response format from server")
      }

      // Ensure all required fields are present
      const requiredFields = ["crowd_level", "estimated_people", "police_required", "medical_required"]
      for (const field of requiredFields) {
        if (result[field] === undefined) {
          throw new Error(`Missing required field: ${field}`)
        }
      }

      setAnalysisResult(result)

      // Send alert data to alerts system
      await sendAlert(result)

      // Show success message
      Alert.alert(
        "Analysis Complete",
        `Crowd level: ${result.crowd_level.toUpperCase()}\nEstimated people: ${result.estimated_people}`,
        [{ text: "OK" }],
      )
    } catch (error) {
      console.error("Analysis error:", error)

      // Log failed analysis attempt for government audit trail
      console.error("Failed analysis data:", {
        videoFile: videoFile.name || "Unknown",
        location,
        context,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      })

      Alert.alert(
        "Analysis Failed",
        `Error: ${error instanceof Error ? error.message : String(error)}\n\nThis incident has been logged for government audit purposes.`,
        [{ text: "OK" }],
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  const sendAlert = async (data: CrowdAssessment) => {
    try {
      const alertData: AlertData = {
        id: Date.now().toString(),
        type: "crowd_analysis",
        timestamp: new Date().toISOString(),
        data: data,
        isRead: false,
        priority: "medium", // Will be calculated by storage system
        status: "active",
        videoMetadata: selectedVideo
          ? {
              name: selectedVideo.fileName || selectedVideo.name || "Video File",
              size: selectedVideo.fileSize || 0,
              duration: selectedVideo.duration || 0,
              location,
              context,
            }
          : undefined,
      }

      // Save to local storage with government compliance features
      await AlertStorage.saveAlert(alertData)
      console.log("Alert saved successfully with government compliance")
    } catch (error) {
      console.error("Failed to send alert:", error)
      // Even if storage fails, log for government audit
      console.error("Government audit log - failed alert:", {
        data,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const getCrowdLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "low":
        return "#4CAF50"
      case "medium":
        return "#FF9800"
      case "high":
        return "#F44336"
      case "very_high":
        return "#9C27B0"
      default:
        return "#2196F3"
    }
  }

  const getCrowdLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case "low":
        return "checkmark-circle"
      case "medium":
        return "warning"
      case "high":
        return "alert-circle"
      case "very_high":
        return "close-circle"
      default:
        return "information-circle"
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Professional Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333333" />
          </TouchableOpacity>

          <View style={styles.titleSection}>
            <View style={styles.cameraIconContainer}>
              <Ionicons name="videocam" size={28} color="#FF8C00" />
            </View>
            <View style={styles.titleTextContainer}>
              <Text style={styles.title}>VIGILANT VISION NETWORK</Text>
              <Text style={styles.subtitle}>Future Crowd Analysis</Text>
            </View>
          </View>

          <View style={styles.statusIndicator}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>LIVE</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Live Feed Section */}
        <View style={styles.liveFeedSection}>
          <View style={styles.liveFeedHeader}>
            <Text style={styles.liveFeedTitle}>Crowd Analysis Camera</Text>
            <View style={styles.liveFeedControls}>
              <TouchableOpacity style={styles.controlButton}>
                <Ionicons name="cloud" size={20} color="#666666" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton}>
                <Ionicons name="mic" size={20} color="#666666" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton}>
                <Ionicons name="person" size={20} color="#666666" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton}>
                <Ionicons name="volume-high" size={20} color="#666666" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton}>
                <Ionicons name="location" size={20} color="#666666" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.videoContainer}>
            {selectedVideo ? (
              <View style={styles.videoPreviewContainer}>
                <Video
                  ref={setVideoRef}
                  style={styles.videoPlayer}
                  source={{ uri: selectedVideo.uri }}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={false}
                  isLooping={false}
                  onPlaybackStatusUpdate={(status) => {
                    if (status.isLoaded) {
                      setIsVideoPlaying(status.isPlaying)
                    }
                  }}
                />
                <TouchableOpacity style={styles.playButton} onPress={toggleVideoPlayback}>
                  <Ionicons name={isVideoPlaying ? "pause" : "play"} size={40} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.videoOverlay}>
                  <Text style={styles.videoText}>
                    {selectedVideo.fileName || selectedVideo.name || "Crowd Analysis Video"}
                  </Text>
                  <Text style={styles.videoSubtext}>
                    {selectedVideo.duration ? `${Math.round(selectedVideo.duration)}s` : "Unknown duration"}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.placeholderVideo}>
                <View style={styles.placeholderIconContainer}>
                  <Ionicons name="videocam-outline" size={60} color="#FF8C00" />
                </View>
                <Text style={styles.placeholderText}>No Video Selected</Text>
                <Text style={styles.placeholderSubtext}>Select or record a video to begin analysis</Text>
              </View>
            )}
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="camera" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Picture</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.activeButton]}>
              <Ionicons name="mic" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Speak</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="recording" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Record</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Video Selection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Video Input Options</Text>

          <View style={styles.videoOptionsGrid}>
            <TouchableOpacity style={styles.videoOptionButton} onPress={pickVideo}>
              <Ionicons name="folder-open" size={24} color="#64748B" />
              <Text style={styles.videoOptionButtonText}>Select Video</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.videoOptionButton} onPress={captureVideo}>
              <Ionicons name="camera" size={24} color="#64748B" />
              <Text style={styles.videoOptionButtonText}>Record Video</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Analysis Controls */}
        {selectedVideo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Analysis Controls</Text>

            <TouchableOpacity
              style={styles.analyzeButton}
              onPress={() => analyzeVideo(selectedVideo)}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="analytics" size={20} color="#FFFFFF" />
                  <Text style={styles.analyzeButtonText}>Start Analysis</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {selectedVideo && (
          <View style={styles.videoPreviewSection}>
            <View style={styles.videoPreviewHeader}>
              <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />

              <Text style={styles.videoPreviewTitle}>Video Ready for Government Analysis</Text>

              <View style={styles.governmentBadge}>
                <Ionicons name="checkmark-circle" size={16} color="white" />

                <Text style={styles.governmentBadgeText}>SECURED</Text>
              </View>
            </View>

            <View style={styles.videoInfo}>
              <View style={styles.videoInfoRow}>
                <Ionicons name="document" size={16} color="#666" />

                <Text style={styles.videoInfoText}>{selectedVideo.fileName || selectedVideo.name || "Video File"}</Text>
              </View>

              <View style={styles.videoInfoRow}>
                <Ionicons name="time" size={16} color="#666" />

                <Text style={styles.videoInfoText}>
                  Duration: {selectedVideo.duration ? `${Math.round(selectedVideo.duration)}s` : "Unknown"}
                </Text>
              </View>

              <View style={styles.videoInfoRow}>
                <Ionicons name="hardware-chip" size={16} color="#666" />

                <Text style={styles.videoInfoText}>
                  Size:{" "}
                  {selectedVideo.fileSize ? `${(selectedVideo.fileSize / (1024 * 1024)).toFixed(2)} MB` : "Unknown"}
                </Text>
              </View>

              {selectedVideo.width && selectedVideo.height && (
                <View style={styles.videoInfoRow}>
                  <Ionicons name="resize" size={16} color="#666" />

                  <Text style={styles.videoInfoText}>
                    Resolution: {selectedVideo.width} Ã— {selectedVideo.height}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.videoActionButtons}>
              <TouchableOpacity
                style={styles.analyzeButton}
                onPress={() => analyzeVideo(selectedVideo)}
                disabled={isAnalyzing}
              >
                <Ionicons name="analytics" size={24} color="white" />

                <Text style={styles.analyzeButtonText}>{isAnalyzing ? "Analyzing..." : "Analyze Video"}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSelectedVideo(null)}
                disabled={isAnalyzing}
              >
                <Ionicons name="close-circle" size={24} color="white" />

                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isAnalyzing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFA500" />

            <Text style={styles.loadingText}>Analyzing video...</Text>
          </View>
        )}

        {analysisResult && (
          <View style={styles.resultSection}>
            {/* Professional Header */}
            <View style={styles.resultHeader}>
              <View style={styles.resultHeaderLeft}>
                <View style={styles.resultIconContainer}>
                  <Ionicons name="analytics" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.resultTitleContainer}>
                  <Text style={styles.resultMainTitle}>Crowd Analysis Complete</Text>
                  <Text style={styles.resultSubtitle}>AI-powered security assessment</Text>
                </View>
              </View>
              <View style={styles.resultBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                <Text style={styles.resultBadgeText}>VERIFIED</Text>
              </View>
            </View>

            {/* KPI Summary Cards */}
            <View style={styles.kpiContainer}>
              <View style={[styles.kpiCard, styles.kpiCardPrimary]}>
                <View style={styles.kpiIconContainer}>
                  <Ionicons name="people" size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.kpiNumber}>{analysisResult.estimated_people}</Text>
                <Text style={styles.kpiLabel} numberOfLines={1}>Crowd Count</Text>
              </View>

              <View style={[styles.kpiCard, styles.kpiCardSecondary]}>
                <View style={styles.kpiIconContainer}>
                  <Ionicons name={getCrowdLevelIcon(analysisResult.crowd_level)} size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.kpiNumber} numberOfLines={1}>{analysisResult.crowd_level.toUpperCase()}</Text>
                <Text style={styles.kpiLabel} numberOfLines={1}>Risk Level</Text>
              </View>

              <View style={[styles.kpiCard, styles.kpiCardTertiary]}>
                <View style={styles.kpiIconContainer}>
                  <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.kpiNumber}>{analysisResult.police_required ? analysisResult.police_count : 0}</Text>
                <Text style={styles.kpiLabel} numberOfLines={1}>Police Needed</Text>
              </View>
            </View>

            {/* Safety Status Overview */}
            <View style={styles.statusOverviewCard}>
              <Text style={styles.statusOverviewTitle}>Safety Status Overview</Text>
              <View style={styles.statusGrid}>
                <View style={styles.statusItem}>
                  <View
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: analysisResult.police_required ? "#FF8C00" : "#4CAF50" },
                    ]}
                  >
                    <Ionicons name="shield" size={16} color="#FFFFFF" />
                  </View>
                  <Text style={styles.statusLabel}>Police</Text>
                  <Text style={styles.statusValue}>{analysisResult.police_required ? "Required" : "Not Required"}</Text>
                </View>

                <View style={styles.statusItem}>
                  <View
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: analysisResult.medical_required ? "#FF8C00" : "#4CAF50" },
                    ]}
                  >
                    <Ionicons name="medical" size={16} color="#FFFFFF" />
                  </View>
                  <Text style={styles.statusLabel}>Medical</Text>
                  <Text style={styles.statusValue}>
                    {analysisResult.medical_required ? "Required" : "Not Required"}
                  </Text>
                </View>

                <View style={styles.statusItem}>
                  <View
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: analysisResult.chokepoints_detected ? "#F44336" : "#4CAF50" },
                    ]}
                  >
                    <Ionicons name="warning" size={16} color="#FFFFFF" />
                  </View>
                  <Text style={styles.statusLabel}>Chokepoints</Text>
                  <Text style={styles.statusValue}>{analysisResult.chokepoints_detected ? "Detected" : "Clear"}</Text>
                </View>

                <View style={styles.statusItem}>
                  <View
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: analysisResult.emergency_access_clear ? "#4CAF50" : "#F44336" },
                    ]}
                  >
                    <Ionicons name="exit" size={16} color="#FFFFFF" />
                  </View>
                  <Text style={styles.statusLabel}>Emergency Access</Text>
                  <Text style={styles.statusValue}>{analysisResult.emergency_access_clear ? "Clear" : "Blocked"}</Text>
                </View>
              </View>
            </View>

            {/* Activities Detected */}
            <View style={styles.activitiesCard}>
              <Text style={styles.activitiesTitle}>Activities Detected</Text>
              <View style={styles.activitiesGrid}>
                {analysisResult.activities.map((activity, index) => (
                  <View key={index} style={styles.activityChip}>
                    <Ionicons name="eye" size={12} color="#FF8C00" />
                    <Text style={styles.activityChipText}>{activity}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Risk Assessment */}
            <View style={styles.riskAssessmentCard}>
              <View style={styles.riskHeader}>
                <Ionicons name="alert-circle" size={16} color="#FF8C00" />
                <Text style={styles.riskTitle}>Risk Assessment</Text>
              </View>
              <View style={styles.riskContent}>
                <View style={styles.riskItem}>
                  <Text style={styles.riskLabel}>Harm Likelihood</Text>
                  <View style={styles.riskValueContainer}>
                    <Text style={[styles.riskValue, { color: getCrowdLevelColor(analysisResult.harm_likelihood) }]}>
                      {analysisResult.harm_likelihood}
                    </Text>
                  </View>
                </View>
                {analysisResult.notes && (
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesLabel}>Analysis Notes</Text>
                    <Text style={styles.notesText}>{analysisResult.notes}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity style={styles.primaryActionButton}>
                <Ionicons name="download" size={16} color="#FFFFFF" />
                <Text style={styles.primaryActionText}>Export Report</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryActionButton}>
                <Ionicons name="share" size={16} color="#FF8C00" />
                <Text style={styles.secondaryActionText}>Share Analysis</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC", // Professional light gray background
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0", // Professional border color
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9", // Professional gray background
  },
  titleSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#EBF4FF", // Professional blue background
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    shadowColor: "#3B82F6", // Professional blue shadow
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
    fontSize: 18, // Increased font size for better hierarchy
    fontWeight: "bold",
    color: "#1E293B", // Professional dark gray
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B", // Professional medium gray
    fontWeight: "500",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  liveFeedSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  liveFeedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  liveFeedTitle: {
    fontSize: 18, // Increased font size for better hierarchy
    fontWeight: "bold",
    color: "#1E293B", // Professional dark gray
  },
  liveFeedControls: {
    flexDirection: "row",
    gap: 12,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9", // Professional gray background
    alignItems: "center",
    justifyContent: "center",
  },
  videoContainer: {
    backgroundColor: "#F1F5F9", // Professional gray background
    borderRadius: 16,
    height: 220,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#CBD5E1", // Professional border color
    borderStyle: "dashed",
    overflow: "hidden",
  },
  videoPreviewContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
  },
  videoPlayer: {
    width: "100%",
    height: "100%",
  },
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -25 }, { translateY: -25 }],
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  videoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  placeholderIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EBF4FF", // Professional blue background
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  videoPreview: {
    alignItems: "center",
    justifyContent: "center",
  },
  videoText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  videoSubtext: {
    fontSize: 14,
    color: "#E0E0E0",
  },
  placeholderVideo: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#64748B", // Professional medium gray
    marginTop: 12,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: "#94A3B8", // Professional light gray
    marginTop: 4,
    textAlign: "center",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#64748B", // Professional gray
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  activeButton: {
    backgroundColor: "#3B82F6", // Professional blue
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18, // Increased font size for better hierarchy
    fontWeight: "bold",
    color: "#1E293B", // Professional dark gray
    marginBottom: 16,
  },
  videoOptionsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  videoOptionButton: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 18, // Increased padding for better touch target
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0", // Neutral gray border
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  videoOptionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B", // Neutral gray text
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B", // Professional dark gray
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F1F5F9", // Professional gray background
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1E293B", // Professional dark gray text
    borderWidth: 1,
    borderColor: "#CBD5E1", // Professional border color
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  analyzeButton: {
    backgroundColor: "#3B82F6", // Professional blue
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    shadowColor: "#3B82F6", // Professional blue shadow
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: "#64748B", // Professional medium gray
    marginBottom: 20,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  videoPreviewSection: {
    backgroundColor: "#FFFFFF", // White background for better contrast
    borderRadius: 16, // More rounded for modern look
    padding: 20, // Increased padding
    marginHorizontal: 20, // Added horizontal margin for responsiveness
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#E2E8F0", // Softer border color
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  videoPreviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  videoPreviewTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B", // Professional dark text
    flex: 1,
    marginLeft: 12,
  },
  videoInfo: {
    marginBottom: 20,
  },
  videoInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingVertical: 4,
  },
  governmentBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  governmentBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  resultHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  resultIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3B82F6", // Professional blue
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    shadowColor: "#3B82F6", // Professional blue shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  resultTitleContainer: {
    flex: 1,
  },
  resultMainTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B", // Professional dark gray
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    color: "#64748B", // Professional medium gray
    fontWeight: "500",
  },
  resultBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  kpiContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 80,
    maxWidth: (width - 80) / 3, // Ensure responsive width
  },
  kpiCardPrimary: {
    backgroundColor: "#3B82F6", // Professional blue
  },
  kpiCardSecondary: {
    backgroundColor: "#059669", // Professional green
  },
  kpiCardTertiary: {
    backgroundColor: "#7C3AED", // Professional purple
  },
  kpiIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  kpiNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
    textAlign: "center",
  },
  kpiLabel: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
    textAlign: "center",
  },
  resultBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
  },
  statusOverviewCard: {
    backgroundColor: "#FFFFFF", // White background for better contrast
    borderRadius: 12,
    padding: 18, // Increased padding
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0", // Professional border color
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusOverviewTitle: {
    fontSize: 18, // Increased font size
    fontWeight: "bold",
    color: "#1E293B", // Professional dark gray
    marginBottom: 12,
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statusItem: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statusIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  statusLabel: {
    fontSize: 11,
    color: "#64748B", // Professional medium gray
    fontWeight: "600",
    marginBottom: 2,
  },
  statusValue: {
    fontSize: 12,
    color: "#1E293B", // Professional dark gray
    fontWeight: "bold",
    textAlign: "center",
  },
  activitiesCard: {
    backgroundColor: "#FFFFFF", // White background for better contrast
    borderRadius: 12,
    padding: 18, // Increased padding
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0", // Professional border color
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activitiesTitle: {
    fontSize: 18, // Increased font size
    fontWeight: "bold",
    color: "#1E293B", // Professional dark gray
    marginBottom: 12,
  },
  activitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  activityChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF4FF", // Professional blue background
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#3B82F6", // Professional blue border
    shadowColor: "#3B82F6", // Professional blue shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  activityChipText: {
    fontSize: 12,
    color: "#3B82F6", // Professional blue text
    fontWeight: "600",
    marginLeft: 4,
  },
  riskAssessmentCard: {
    backgroundColor: "#FFFFFF", // White background for better contrast
    borderRadius: 12,
    padding: 18, // Increased padding
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0", // Professional border color
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  riskHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  riskTitle: {
    fontSize: 18, // Increased font size
    fontWeight: "bold",
    color: "#1E293B", // Professional dark gray
    marginLeft: 8,
  },
  riskContent: {
    gap: 12,
  },
  riskItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  riskLabel: {
    fontSize: 14,
    color: "#64748B", // Professional medium gray
    fontWeight: "600",
  },
  riskValueContainer: {
    backgroundColor: "#F1F5F9", // Professional gray background
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  riskValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  notesContainer: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  notesLabel: {
    fontSize: 13,
    color: "#64748B", // Professional medium gray
    fontWeight: "600",
    marginBottom: 6,
  },
  notesText: {
    fontSize: 13,
    color: "#1E293B", // Professional dark gray
    lineHeight: 18,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: "#3B82F6", // Professional blue
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowColor: "#3B82F6", // Professional blue shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 2,
    borderColor: "#3B82F6", // Professional blue border
    shadowColor: "#3B82F6", // Professional blue shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#3B82F6", // Professional blue text
  },
  videoInfoText: {
    fontSize: 14,
    color: "#64748B", // Professional medium gray
    marginLeft: 10,
    flex: 1,
    fontWeight: "500",
  },
  videoActionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f44336",
    padding: 15,
    borderRadius: 8,
    flex: 1,
  },
  clearButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  loadingContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#64748B", // Professional medium gray
  },
  resultSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24, // Increased padding
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  crowdLevelCard: {
    backgroundColor: "#F1F5F9", // Professional gray background
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    alignItems: "center",
  },
  crowdLevelHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  crowdLevelText: {
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 10,
  },
  estimatedPeople: {
    fontSize: 18,
    color: "#64748B", // Professional medium gray
    fontWeight: "600",
  },
  detailCard: {
    backgroundColor: "#F1F5F9", // Professional gray background
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B", // Professional dark gray
    marginBottom: 10,
  },
  recommendationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 16,
    color: "#1E293B", // Professional dark gray
    marginLeft: 10,
    flex: 1,
  },
  activitiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  activityTag: {
    backgroundColor: "#3B82F6", // Professional blue
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activityText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  riskText: {
    fontSize: 16,
  },
})
