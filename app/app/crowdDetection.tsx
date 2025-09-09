import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Pressable } from 'react-native';
import { Camera, CameraView } from 'expo-camera';

export default function CrowdDetectionScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const inFlight = useRef(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [hasSent, setHasSent] = useState(false);

  const handleRetake = () => {
    setResultImage(null);
    setCount(null);
    setHasSent(false);
    // re-trigger capture via effect once camera is ready
  };

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      // Microphone permission may be needed for video recording on some devices
      try { await Camera.requestMicrophonePermissionsAsync(); } catch {}
    })();
  }, []);

  // Single-shot trigger once camera is ready and permissions are granted
  useEffect(() => {
    if (hasPermission && cameraReady && !hasSent && !inFlight.current) {
      // Give camera a brief warm-up before starting recording
      const t = setTimeout(() => {
        captureAndSendFrame();
      }, 400);
      return () => clearTimeout(t);
    }
  }, [hasPermission, cameraReady, hasSent]);

  const captureAndSendFrame = async () => {
    if (!cameraRef.current || inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      // Record a 3-second video clip using recordAsync (SDK 53 CameraView)
      console.log('[CrowdDetection] Starting 3s recording...');
      // @ts-ignore - recordAsync exists on CameraView in expo-camera SDK 53
      const video = await (cameraRef.current as any).recordAsync({
        maxDuration: 3,
        mute: true,
        quality: '480p',
      } as any);

      if (!video?.uri) throw new Error('Recording failed');
      console.log('[CrowdDetection] Recording finished:', video.uri);

      const formData = new FormData();
      formData.append('file', {
        uri: video.uri,
        name: 'clip.mp4',
        type: 'video/mp4',
      } as any);

      console.log('[CrowdDetection] Uploading to API...');
      const response = await fetch('http://192.168.31.47:8000/detect-crowd/', {
        method: 'POST',
        body: formData,
      });

      console.log('[CrowdDetection] API status:', response.status);
      if (!response.ok) throw new Error('Server error');
      const data = await response.json();
      const { image_base64, count: peopleCount, content_type } = data || {};
      if (image_base64 && content_type) {
        setResultImage(`data:${content_type};base64,${image_base64}`);
      }
      setCount(typeof peopleCount === 'number' ? peopleCount : null);
      setHasSent(true);
    } catch (e) {
      console.log('[CrowdDetection] Error:', e);
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  };

  if (hasPermission === null) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#FFA500" /></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.container}><Text>No access to camera</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crowd Detection</Text>

      {/* Camera preview (hidden after response) */}
      {hasPermission && !resultImage && (
        <View style={styles.card}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            mode="video"
            onCameraReady={() => setCameraReady(true)}
          />
          {loading && (
            <View style={styles.statusOverlay}>
              <ActivityIndicator size="small" color="#FFA500" />
              <Text style={styles.statusText}>Recording and processing…</Text>
            </View>
          )}
        </View>
      )}

      {/* Result image with count badge */}
      {resultImage && (
        <View style={styles.card}>
          <Image source={{ uri: resultImage }} style={styles.image} resizeMode="cover" />
          {typeof count === 'number' && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>People: {count}</Text>
            </View>
          )}
        </View>
      )}

      {/* Actions */}
      {resultImage && (
        <Pressable onPress={handleRetake} style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}>
          <Text style={styles.buttonText}>Retake</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  camera: {
    width: '100%',
    aspectRatio: 1,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  badge: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: '#22c55e',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: '#052e16',
    fontWeight: '700',
  },
  button: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#f97316',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  statusOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
  },
  statusText: {
    color: '#111827',
    fontSize: 12,
    marginTop: 4,
  },
});
