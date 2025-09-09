import { Platform } from 'react-native';

// Try to import expo-notifications, but handle if it fails
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
  
  // Configure notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (error) {
  console.warn('expo-notifications not available:', error);
}

export interface NotificationData {
  familyMemberName: string;
  familyMemberId: string;
  distance: number;
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface CrowdAlertNotificationData {
  alertId: string;
  crowdLevel: string;
  estimatedPeople: number;
  location: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  policeRequired: boolean;
  policeCount: number;
  medicalRequired: boolean;
  medicalStaffCount: number;
  harmLikelihood: string;
  activities: string[];
  chokepointsDetected: boolean;
  emergencyAccessClear: boolean;
}

export interface MedicalNotificationData {
  type: 'ambulance_accepted' | 'user_traveling' | 'ambulance_arriving';
  patientName?: string;
  userName?: string;
  hospitalName: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
}

export class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Register for push notifications and get token
  public async registerForPushNotifications(): Promise<string | null> {
    let token = null;

    if (!Notifications) {
      console.warn('Notifications not available');
      return null;
    }

    if (Platform.OS === 'android') {
      // Family alerts channel
      await Notifications.setNotificationChannelAsync('family-alerts', {
        name: 'Family Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        description: 'Notifications for family member distance alerts',
      });

      // Crowd alert channel for officers
      await Notifications.setNotificationChannelAsync('crowd-alert', {
        name: 'Crowd Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500, 250, 500],
        lightColor: '#FF0000',
        sound: 'alarm',
        description: 'Critical crowd alerts for law enforcement officers',
        enableVibrate: true,
        showBadge: true,
      });

      // Medical notifications channel
      await Notifications.setNotificationChannelAsync('medical-notifications', {
        name: 'Medical Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B6B',
        sound: 'default',
        description: 'Medical alerts and ambulance request notifications',
        enableVibrate: true,
        showBadge: true,
      });
    }

    // Request permissions for notifications
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get permission for push notifications!');
      return null;
    }
    
    try {
      // For local notifications, we don't need the Expo push token
      console.log('Notification permissions granted - using local notifications');
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }

    return token;
  }

  // Send local notification for family alert
  public async sendFamilyAlertNotification(data: NotificationData): Promise<string | null> {
    if (!Notifications) {
      console.warn('Notifications not available - cannot send family alert');
      return null;
    }
    
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚨 Family Alert',
          body: `${data.familyMemberName} is ${data.distance.toFixed(2)} km away from you!`,
          data: {
            familyMemberId: data.familyMemberId,
            familyMemberName: data.familyMemberName,
            distance: data.distance,
            location: data.location,
            timestamp: data.timestamp,
            type: 'family-alert',
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Show immediately
      });

      console.log('Family alert notification sent with ID:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error sending family alert notification:', error);
      return null;
    }
  }

  // Send notification when family member comes back nearby
  public async sendFamilyNearbyNotification(familyMemberName: string): Promise<string | null> {
    if (!Notifications) {
      console.warn('Notifications not available - cannot send nearby notification');
      return null;
    }
    
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '✅ Family Member Nearby',
          body: `${familyMemberName} is now close to you again!`,
          data: {
            familyMemberName,
            type: 'family-nearby',
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger: null,
      });

      console.log('Family nearby notification sent with ID:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error sending family nearby notification:', error);
      return null;
    }
  }

  // Send critical crowd alert notification for officers
  public async sendCrowdAlertNotification(data: CrowdAlertNotificationData): Promise<string | null> {
    if (!Notifications) {
      console.warn('Notifications not available - cannot send crowd alert');
      return null;
    }

    try {
      // Create officer-friendly notification content
      const priorityEmoji = this.getPriorityEmoji(data.priority);
      const urgencyLevel = this.getUrgencyLevel(data.priority);
      const actionRequired = this.getActionRequired(data);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${priorityEmoji} ${urgencyLevel} CROWD ALERT - ${data.crowdLevel.toUpperCase()}`,
          body: this.createOfficerNotificationBody(data),
          data: {
            ...data,
            type: 'crowd-alert',
            notificationId: Date.now().toString(),
          },
          sound: data.priority === 'critical' ? 'alarm' : 'default',
          priority: this.getNotificationPriority(data.priority),
          categoryIdentifier: 'crowd-alert',
          // Add rich content for better officer understanding
          subtitle: `Location: ${data.location}`,
          badge: 1,
        },
        trigger: null, // Show immediately
      });

      console.log('Crowd alert notification sent with ID:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error sending crowd alert notification:', error);
      return null;
    }
  }

  // Get priority emoji for visual identification
  private getPriorityEmoji(priority: string): string {
    switch (priority) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '🔶';
      case 'low': return '🟢';
      default: return 'ℹ️';
    }
  }

  // Get urgency level text
  private getUrgencyLevel(priority: string): string {
    switch (priority) {
      case 'critical': return 'IMMEDIATE ACTION';
      case 'high': return 'URGENT';
      case 'medium': return 'ATTENTION';
      case 'low': return 'MONITOR';
      default: return 'INFO';
    }
  }

  // Get action required text
  private getActionRequired(data: CrowdAlertNotificationData): string {
    if (data.priority === 'critical') return 'IMMEDIATE RESPONSE REQUIRED';
    if (data.policeRequired || data.medicalRequired) return 'RESPONSE REQUIRED';
    return 'MONITORING REQUIRED';
  }

  // Create officer-friendly notification body
  private createOfficerNotificationBody(data: CrowdAlertNotificationData): string {
    let body = `Location: ${data.location}\n`;
    body += `Estimated People: ${data.estimatedPeople}\n`;
    
    if (data.policeRequired) {
      body += `Police Required: ${data.policeCount} personnel\n`;
    }
    
    if (data.medicalRequired) {
      body += `Medical Required: ${data.medicalStaffCount} staff\n`;
    }
    
    body += `Risk: ${data.harmLikelihood}`;
    
    if (data.chokepointsDetected) {
      body += '\n⚠️ CHOKEPOINTS DETECTED';
    }
    
    if (!data.emergencyAccessClear) {
      body += '\n🚨 EMERGENCY ACCESS BLOCKED';
    }
    
    return body;
  }

  // Get notification priority for Android
  private getNotificationPriority(priority: string): any {
    switch (priority) {
      case 'critical': return Notifications.AndroidNotificationPriority.MAX;
      case 'high': return Notifications.AndroidNotificationPriority.HIGH;
      case 'medium': return Notifications.AndroidNotificationPriority.DEFAULT;
      case 'low': return Notifications.AndroidNotificationPriority.LOW;
      default: return Notifications.AndroidNotificationPriority.DEFAULT;
    }
  }

  // Get current push token
  public getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  // Clear all notifications
  public async clearAllNotifications(): Promise<void> {
    if (!Notifications) {
      console.warn('Notifications not available - cannot clear notifications');
      return;
    }
    
    try {
      await Notifications.dismissAllNotificationsAsync();
      console.log('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  // Set up notification listeners
  public setupNotificationListeners(): {
    notificationListener: any;
    responseListener: any;
  } {
    const notificationListener = Notifications?.addNotificationReceivedListener((notification: any) => {
      console.log('Notification received:', notification);
      // Handle notification received while app is open
    });

    const responseListener = Notifications?.addNotificationResponseReceivedListener((response: any) => {
      console.log('Notification response:', response);
      // Handle user tapping on notification
      const data = response.notification.request.content.data;
      
      if (data.type === 'family-alert') {
        // Navigate to map or specific family member
        console.log('User tapped on family alert notification for:', data.familyMemberName);
      } else if (data.type === 'crowd-alert') {
        // Navigate to crowd alert details
        console.log('User tapped on crowd alert notification for:', data.location);
        // You can emit an event here to navigate to the alerts screen
        // or use a navigation service to redirect the officer
      } else if (data.type === 'ambulance_accepted') {
        // Navigate to ambulance request details
        console.log('User tapped on ambulance accepted notification for:', data.patientName);
      } else if (data.type === 'user_traveling') {
        // Navigate to user route details
        console.log('User tapped on user traveling notification for:', data.userName);
      } else if (data.type === 'ambulance_arriving') {
        // Navigate to ambulance route details
        console.log('User tapped on ambulance arriving notification for:', data.hospitalName);
      }
    });

    return { notificationListener, responseListener };
  }

  // Remove notification listeners
  public removeNotificationListeners(listeners: { notificationListener: any; responseListener: any }): void {
    if (!Notifications) {
      console.warn('Notifications not available - cannot remove listeners');
      return;
    }
    
    if (listeners.notificationListener) {
      Notifications.removeNotificationSubscription(listeners.notificationListener);
    }
    if (listeners.responseListener) {
      Notifications.removeNotificationSubscription(listeners.responseListener);
    }
  }

  // Send medical notification for ambulance request accepted
  public async sendAmbulanceAcceptedNotification(data: MedicalNotificationData): Promise<string | null> {
    if (!Notifications) {
      console.warn('Notifications not available - cannot send medical notification');
      return null;
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚑 Ambulance Request Accepted',
          body: `Patient ${data.patientName} - Ambulance request accepted for ${data.hospitalName}`,
          data: {
            ...data,
            type: 'ambulance_accepted',
            notificationId: Date.now().toString(),
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: 'medical-notifications',
          subtitle: `Hospital: ${data.hospitalName}`,
          badge: 1,
        },
        trigger: null, // Show immediately
      });

      console.log('Ambulance accepted notification sent with ID:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error sending ambulance accepted notification:', error);
      return null;
    }
  }

  // Send medical notification for user traveling to hospital
  public async sendUserTravelingNotification(data: MedicalNotificationData): Promise<string | null> {
    if (!Notifications) {
      console.warn('Notifications not available - cannot send medical notification');
      return null;
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏥 User En Route to Hospital',
          body: `${data.userName} is traveling to ${data.hospitalName}`,
          data: {
            ...data,
            type: 'user_traveling',
            notificationId: Date.now().toString(),
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MEDIUM,
          categoryIdentifier: 'medical-notifications',
          subtitle: `Destination: ${data.hospitalName}`,
          badge: 1,
        },
        trigger: null, // Show immediately
      });

      console.log('User traveling notification sent with ID:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error sending user traveling notification:', error);
      return null;
    }
  }

  // Send medical notification for ambulance arriving
  public async sendAmbulanceArrivingNotification(data: MedicalNotificationData): Promise<string | null> {
    if (!Notifications) {
      console.warn('Notifications not available - cannot send medical notification');
      return null;
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚑 Ambulance is On the Way!',
          body: `The ambulance has started arriving, it's on the way, reach soon on place`,
          data: {
            ...data,
            type: 'ambulance_arriving',
            notificationId: Date.now().toString(),
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: 'medical-notifications',
          subtitle: `Hospital: ${data.hospitalName}`,
          badge: 1,
        },
        trigger: null, // Show immediately
      });

      console.log('Ambulance arriving notification sent with ID:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error sending ambulance arriving notification:', error);
      return null;
    }
  }
}

export default NotificationService.getInstance();
