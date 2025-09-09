import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TrinetraWebView() {
  const webViewRef = useRef<WebView>(null);
  const url = 'https://trinetra-delta.vercel.app/';

  // Handle Android back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (webViewRef.current) {
          webViewRef.current.goBack();
          return true; // Prevent default behavior (exit app)
        }
        return false;
      }
    );

    return () => backHandler.remove();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo={true}
        allowsBackForwardNavigationGestures={true}
        onNavigationStateChange={(navState: WebViewNavigation) => {
          // Handle navigation state changes if needed
        }}
        onShouldStartLoadWithRequest={(request) => {
          // Only allow navigation within the app's domain
          return request.url.startsWith('https://trinetra-delta.vercel.app/');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
});
