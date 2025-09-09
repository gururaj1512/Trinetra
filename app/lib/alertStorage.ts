import AsyncStorage from '@react-native-async-storage/async-storage';
import { arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import NotificationService, { CrowdAlertNotificationData } from './notificationService';

export interface AlertData {
  id: string;
  type: string;
  timestamp: string;
  data: any;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'escalated';
  assignedTo?: string;
  notes?: string;
  videoMetadata?: {
    name: string;
    size: number;
    duration: number;
    location: string;
    context: string;
  };
}

const ALERTS_STORAGE_KEY = 'trinetra_alerts';

export class AlertStorage {
  static async getAllAlerts(): Promise<AlertData[]> {
    try {
      // First try to get from Firebase
      const firebaseAlerts = await this.getAlertsFromFirebase();
      if (firebaseAlerts.length > 0) {
        return firebaseAlerts;
      }
      
      // Fallback to local storage
      const alertsJson = await AsyncStorage.getItem(ALERTS_STORAGE_KEY);
      return alertsJson ? JSON.parse(alertsJson) : [];
    } catch (error) {
      console.error('Failed to get alerts:', error);
      // Fallback to local storage on error
      try {
        const alertsJson = await AsyncStorage.getItem(ALERTS_STORAGE_KEY);
        return alertsJson ? JSON.parse(alertsJson) : [];
      } catch (localError) {
        console.error('Failed to get alerts from local storage:', localError);
        return [];
      }
    }
  }

  static async saveAlert(alert: AlertData): Promise<void> {
    try {
      const alerts = await this.getAllAlerts();
      
      // Set default values for government app requirements
      const enhancedAlert: AlertData = {
        ...alert,
        priority: alert.priority || this.calculatePriority(alert.data),
        status: alert.status || 'active',
        timestamp: alert.timestamp || new Date().toISOString(),
      };
      
      alerts.unshift(enhancedAlert); // Add to beginning
      
      // Ensure data integrity - limit to last 1000 alerts for performance
      if (alerts.length > 1000) {
        alerts.splice(1000);
      }
      
      await AsyncStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
      
      // Save to Firebase under user's document
      await this.saveToFirebase(enhancedAlert);
      
      // Backup to secondary storage for government compliance
      await this.backupAlert(enhancedAlert);
      
      // Send notification for officers (only for medium priority and above)
      if (enhancedAlert.priority !== 'low') {
        await this.sendOfficerNotification(enhancedAlert);
      }
      
    } catch (error) {
      console.error('Failed to save alert:', error);
      // Emergency fallback storage
      await this.emergencyStorage(alert);
    }
  }

  private static calculatePriority(data: any): 'low' | 'medium' | 'high' | 'critical' {
    if (!data || !data.crowd_level) return 'medium';
    
    switch (data.crowd_level.toLowerCase()) {
      case 'low': return 'low';
      case 'medium': return 'medium';
      case 'high': return 'high';
      case 'very_high': return 'critical';
      default: return 'medium';
    }
  }

  private static async backupAlert(alert: AlertData): Promise<void> {
    try {
      const backupKey = `backup_${ALERTS_STORAGE_KEY}_${Date.now()}`;
      await AsyncStorage.setItem(backupKey, JSON.stringify(alert));
    } catch (error) {
      console.error('Backup failed:', error);
    }
  }

  private static async emergencyStorage(alert: AlertData): Promise<void> {
    try {
      const emergencyKey = `emergency_${Date.now()}`;
      await AsyncStorage.setItem(emergencyKey, JSON.stringify(alert));
    } catch (error) {
      console.error('Emergency storage failed:', error);
    }
  }

  private static async sendOfficerNotification(alert: AlertData): Promise<void> {
    try {
      const notificationData: CrowdAlertNotificationData = {
        alertId: alert.id,
        crowdLevel: alert.data.crowd_level,
        estimatedPeople: alert.data.estimated_people,
        location: alert.videoMetadata?.location || 'Unknown Location',
        priority: alert.priority,
        timestamp: alert.timestamp,
        policeRequired: alert.data.police_required,
        policeCount: alert.data.police_count,
        medicalRequired: alert.data.medical_required,
        medicalStaffCount: alert.data.medical_staff_count,
        harmLikelihood: alert.data.harm_likelihood,
        activities: alert.data.activities,
        chokepointsDetected: alert.data.chokepoints_detected,
        emergencyAccessClear: alert.data.emergency_access_clear,
      };

      await NotificationService.sendCrowdAlertNotification(notificationData);
      console.log('Officer notification sent for alert:', alert.id);
    } catch (error) {
      console.error('Failed to send officer notification:', error);
    }
  }

  static async updateAlert(alertId: string, updates: Partial<AlertData>): Promise<void> {
    try {
      const alerts = await this.getAllAlerts();
      const updatedAlerts = alerts.map(alert =>
        alert.id === alertId ? { ...alert, ...updates } : alert
      );
      await AsyncStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updatedAlerts));
      
      // Also update in Firebase
      await this.updateAlertsInFirebase(updatedAlerts);
    } catch (error) {
      console.error('Failed to update alert:', error);
    }
  }

  static async deleteAlert(alertId: string): Promise<void> {
    try {
      const alerts = await this.getAllAlerts();
      const filteredAlerts = alerts.filter(alert => alert.id !== alertId);
      await AsyncStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(filteredAlerts));
      
      // Also update in Firebase
      await this.updateAlertsInFirebase(filteredAlerts);
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  }

  static async clearAllAlerts(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ALERTS_STORAGE_KEY);
      
      // Also clear in Firebase
      await this.updateAlertsInFirebase([]);
    } catch (error) {
      console.error('Failed to clear alerts:', error);
    }
  }

  static async markAlertAsRead(alertId: string): Promise<void> {
    await this.updateAlert(alertId, { isRead: true });
  }

  static async markAllAlertsAsRead(): Promise<void> {
    try {
      const alerts = await this.getAllAlerts();
      const updatedAlerts = alerts.map(alert => ({ ...alert, isRead: true }));
      await AsyncStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updatedAlerts));
      
      // Also update in Firebase
      await this.updateAlertsInFirebase(updatedAlerts);
    } catch (error) {
      console.error('Failed to mark all alerts as read:', error);
    }
  }

  // Firebase methods
  private static async saveToFirebase(alert: AlertData): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.warn('No authenticated user, skipping Firebase save');
        return;
      }

      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        futureCrowdDetectionAlerts: arrayUnion(alert)
      });
      
      console.log('Alert saved to Firebase for user:', currentUser.uid);
    } catch (error) {
      console.error('Failed to save alert to Firebase:', error);
    }
  }

  private static async getAlertsFromFirebase(): Promise<AlertData[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.warn('No authenticated user, returning empty alerts');
        return [];
      }

      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const alerts = userData.futureCrowdDetectionAlerts || [];
        
        // Sort by timestamp (newest first)
        return alerts.sort((a: AlertData, b: AlertData) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      }
      
      return [];
    } catch (error) {
      console.error('Failed to get alerts from Firebase:', error);
      return [];
    }
  }

  private static async updateAlertsInFirebase(alerts: AlertData[]): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.warn('No authenticated user, skipping Firebase update');
        return;
      }

      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        futureCrowdDetectionAlerts: alerts
      });
      
      console.log('Alerts updated in Firebase for user:', currentUser.uid);
    } catch (error) {
      console.error('Failed to update alerts in Firebase:', error);
    }
  }
}
