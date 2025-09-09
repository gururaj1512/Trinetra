import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import NotificationService from '../lib/notificationService';

interface NotificationSettings {
  criticalAlerts: boolean;
  highAlerts: boolean;
  mediumAlerts: boolean;
  lowAlerts: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  badgeEnabled: boolean;
  emergencyOverride: boolean;
}

export default function NotificationSettingsScreen() {
  const [settings, setSettings] = useState<NotificationSettings>({
    criticalAlerts: true,
    highAlerts: true,
    mediumAlerts: true,
    lowAlerts: false,
    soundEnabled: true,
    vibrationEnabled: true,
    badgeEnabled: true,
    emergencyOverride: true,
  });
  const router = useRouter();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('officer_notification_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem('officer_notification_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const testNotification = async () => {
    Alert.alert(
      'Test Notification',
      'This will send a test notification to verify your settings are working correctly.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Test',
          onPress: async () => {
            try {
              // Send a test notification
              const testData = {
                alertId: 'test-' + Date.now(),
                crowdLevel: 'medium',
                estimatedPeople: 500,
                location: 'Test Location',
                priority: 'medium' as const,
                timestamp: new Date().toISOString(),
                policeRequired: false,
                policeCount: 0,
                medicalRequired: false,
                medicalStaffCount: 0,
                harmLikelihood: 'Low risk',
                activities: ['walking', 'monitoring'],
                chokepointsDetected: false,
                emergencyAccessClear: true,
              };
              
              await NotificationService.sendCrowdAlertNotification(testData);
              Alert.alert('Success', 'Test notification sent successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to send test notification');
            }
          },
        },
      ]
    );
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset to Defaults',
      'Are you sure you want to reset all notification settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            const defaultSettings: NotificationSettings = {
              criticalAlerts: true,
              highAlerts: true,
              mediumAlerts: true,
              lowAlerts: false,
              soundEnabled: true,
              vibrationEnabled: true,
              badgeEnabled: true,
              emergencyOverride: true,
            };
            saveSettings(defaultSettings);
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFA500" />
        </TouchableOpacity>
        <Text style={styles.title}>Notification Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alert Priority Levels</Text>
        <Text style={styles.sectionDescription}>
          Choose which priority levels should trigger notifications
        </Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="alert-circle" size={20} color="#9C27B0" />
            <Text style={styles.settingLabel}>Critical Alerts</Text>
            <Text style={styles.settingDescription}>Immediate action required</Text>
          </View>
          <Switch
            value={settings.criticalAlerts}
            onValueChange={(value) => updateSetting('criticalAlerts', value)}
            trackColor={{ false: '#e0e0e0', true: '#9C27B0' }}
            thumbColor={settings.criticalAlerts ? '#fff' : '#f4f3f4'}
            disabled={true} // Critical alerts cannot be disabled
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="warning" size={20} color="#F44336" />
            <Text style={styles.settingLabel}>High Priority Alerts</Text>
            <Text style={styles.settingDescription}>Urgent response needed</Text>
          </View>
          <Switch
            value={settings.highAlerts}
            onValueChange={(value) => updateSetting('highAlerts', value)}
            trackColor={{ false: '#e0e0e0', true: '#F44336' }}
            thumbColor={settings.highAlerts ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="information-circle" size={20} color="#FF9800" />
            <Text style={styles.settingLabel}>Medium Priority Alerts</Text>
            <Text style={styles.settingDescription}>Attention required</Text>
          </View>
          <Switch
            value={settings.mediumAlerts}
            onValueChange={(value) => updateSetting('mediumAlerts', value)}
            trackColor={{ false: '#e0e0e0', true: '#FF9800' }}
            thumbColor={settings.mediumAlerts ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.settingLabel}>Low Priority Alerts</Text>
            <Text style={styles.settingDescription}>Monitoring only</Text>
          </View>
          <Switch
            value={settings.lowAlerts}
            onValueChange={(value) => updateSetting('lowAlerts', value)}
            trackColor={{ false: '#e0e0e0', true: '#4CAF50' }}
            thumbColor={settings.lowAlerts ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Preferences</Text>
        <Text style={styles.sectionDescription}>
          Customize how notifications are delivered
        </Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="volume-high" size={20} color="#2196F3" />
            <Text style={styles.settingLabel}>Sound</Text>
            <Text style={styles.settingDescription}>Play alert sounds</Text>
          </View>
          <Switch
            value={settings.soundEnabled}
            onValueChange={(value) => updateSetting('soundEnabled', value)}
            trackColor={{ false: '#e0e0e0', true: '#2196F3' }}
            thumbColor={settings.soundEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="phone-portrait" size={20} color="#FF9800" />
            <Text style={styles.settingLabel}>Vibration</Text>
            <Text style={styles.settingDescription}>Vibrate device</Text>
          </View>
          <Switch
            value={settings.vibrationEnabled}
            onValueChange={(value) => updateSetting('vibrationEnabled', value)}
            trackColor={{ false: '#e0e0e0', true: '#FF9800' }}
            thumbColor={settings.vibrationEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="ellipse" size={20} color="#F44336" />
            <Text style={styles.settingLabel}>Badge Count</Text>
            <Text style={styles.settingDescription}>Show unread count</Text>
          </View>
          <Switch
            value={settings.badgeEnabled}
            onValueChange={(value) => updateSetting('badgeEnabled', value)}
            trackColor={{ false: '#e0e0e0', true: '#F44336' }}
            thumbColor={settings.badgeEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="shield-checkmark" size={20} color="#9C27B0" />
            <Text style={styles.settingLabel}>Emergency Override</Text>
            <Text style={styles.settingDescription}>Bypass silent mode for critical alerts</Text>
          </View>
          <Switch
            value={settings.emergencyOverride}
            onValueChange={(value) => updateSetting('emergencyOverride', value)}
            trackColor={{ false: '#e0e0e0', true: '#9C27B0' }}
            thumbColor={settings.emergencyOverride ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Testing & Management</Text>
        
        <TouchableOpacity style={styles.testButton} onPress={testNotification}>
          <Ionicons name="play-circle" size={20} color="white" />
          <Text style={styles.testButtonText}>Send Test Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
          <Ionicons name="refresh" size={20} color="#FFA500" />
          <Text style={styles.resetButtonText}>Reset to Defaults</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Important Notes:</Text>
        <Text style={styles.infoText}>
          • Critical alerts cannot be disabled for officer safety
        </Text>
        <Text style={styles.infoText}>
          • Emergency override ensures critical alerts are heard even in silent mode
        </Text>
        <Text style={styles.infoText}>
          • Settings are saved locally on your device
        </Text>
        <Text style={styles.infoText}>
          • Test notifications help verify your settings are working correctly
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFA500',
  },
  section: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 10,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  testButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  resetButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  resetButtonText: {
    color: '#FFA500',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  infoSection: {
    backgroundColor: '#e8f4fd',
    margin: 20,
    marginTop: 10,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    lineHeight: 20,
  },
});
