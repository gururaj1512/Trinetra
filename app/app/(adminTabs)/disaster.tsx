import { useEffect, useRef } from 'react';
import { BackHandler, SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';

export default function DisasterScreen() {
  const webViewRef = useRef<WebView>(null);
  const url = 'https://mahakumbh-disaster-prediction-i2qo.vercel.app/';

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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Orange header area */}
      <View style={styles.headerArea} />
      
      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          style={styles.webView}
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
            // Only allow navigation within the disaster prediction domain
            return request.url.startsWith('https://mahakumbh-disaster-prediction-i2qo.vercel.app/');
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // White background for SafeAreaView
  },
  headerArea: {
    height: 30, // Additional header height
    backgroundColor: '#FF7518', // Orange color
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webView: {
    flex: 1,
  },
});
