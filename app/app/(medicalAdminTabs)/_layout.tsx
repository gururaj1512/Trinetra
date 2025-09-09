import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import TabBarBackground from '../../components/ui/TabBarBackground';

export default function MedicalAdminTabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF6B6B',
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
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Ionicons name="grid" size={24} color={color} />,
        }} 
      />
      <Tabs.Screen 
        name="ambulance-requests" 
        options={{ 
          title: 'Ambulance Requests',
          tabBarIcon: ({ color }) => <Ionicons name="medical" size={24} color={color} />,
        }} 
      />
      <Tabs.Screen 
        name="users-coming" 
        options={{ 
          title: 'Users Coming',
          tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} />,
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }} 
      />
    </Tabs>
  );
}


