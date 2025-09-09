import { useColorScheme } from '@/hooks/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { auth, db } from '../lib/firebase';

// Suppress specific warnings
console.disableYellowBox = true;

// Suppress specific React Native warnings
const originalWarn = console.warn;
const originalError = console.error;

console.warn = (message, ...args) => {
  // Suppress the specific text component warning
  if (typeof message === 'string' && message.includes('Text strings must be rendered within a <Text> component')) {
    return;
  }
  // Suppress other common warnings
  if (typeof message === 'string' && (
    message.includes('Warning:') ||
    message.includes('Text strings must be rendered')
  )) {
    return;
  }
  // Allow other warnings through
  originalWarn(message, ...args);
};

console.error = (message, ...args) => {
  // Suppress the specific text component error
  if (typeof message === 'string' && message.includes('Text strings must be rendered within a <Text> component')) {
    return;
  }
  // Allow other errors through
  originalError(message, ...args);
};

// This layout can be used to show different screens based on auth state
function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const colorScheme = useColorScheme();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const currentRoute = segments[0];
      const isAuthRoute = currentRoute === 'LoginScreen' || currentRoute === 'RegisterScreen';
      
      if (user) {
        // User is signed in, redirect to appropriate panel based on role
        if (isAuthRoute) {
          try {
            // Fetch user role from Firestore
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.exists() ? userDoc.data() : {};
            
            // Navigate based on user role
            if (userData.role === 'medicalAdmin') {
              router.replace('/(medicalAdminTabs)');
            } else if (userData.role === 'admin') {
              router.replace('/(adminTabs)');
            } else {
              router.replace('/(tabs)');
            }
          } catch (error) {
            console.error('Error fetching user role:', error);
            // Fallback to user panel if there's an error
            router.replace('/(tabs)');
          }
        }
      } else {
        // User is not signed in, redirect to login if not already there
        if (!isAuthRoute) {
          router.replace('/LoginScreen');
        }
      }
    });

    return () => unsubscribe();
  }, [segments, router]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(adminTabs)" />
        <Stack.Screen name="(medicalAdminTabs)" />
        <Stack.Screen name="LoginScreen" />
        <Stack.Screen name="RegisterScreen" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="user-ambulance-request" />
        <Stack.Screen name="emergency-offline-service" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Only render the app when fonts are loaded
    return null;
  }

  return <RootLayoutNav />;
}
