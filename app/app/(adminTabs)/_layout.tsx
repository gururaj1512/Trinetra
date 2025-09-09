import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import TabBarBackground from '../../components/ui/TabBarBackground';
export default function AdminTabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFA500',
        headerShown: false,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: { position: 'absolute' },
          default: {},
        }),
      }}>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }} 
      />
          <Tabs.Screen 
        name="home" 
        options={{ 
          title: 'CCTV',
          tabBarIcon: ({ color }) => <Ionicons name="videocam" size={24} color={color} />,
        }} 
      />
     
    
      <Tabs.Screen 
        name="alerts" 
        options={{ 
          title: 'Alerts',
          tabBarIcon: ({ color }) => <Ionicons name="warning" size={24} color={color} />,
        }} 
      />
      <Tabs.Screen 
        name="missing" 
        options={{ 
          title: 'Missing',
          tabBarIcon: ({ color }) => <Ionicons name="search" size={24} color={color} />,
        }} 
      />
      <Tabs.Screen 
        name="unusual-detection" 
        options={{ 
          title: 'Unusual',
          tabBarIcon: ({ color }) => <Ionicons name="eye" size={24} color={color} />,
        }} 
      />
      <Tabs.Screen 
        name="disaster" 
        options={{ 
          title: 'Disaster',
          tabBarIcon: ({ color }) => <Ionicons name="alert-circle" size={24} color={color} />,
        }} 
      />
    </Tabs>
  );
}
