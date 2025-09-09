import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AlertData, AlertStorage } from '../../lib/alertStorage';
import { auth, db } from '../../lib/firebase';

const { width } = Dimensions.get('window');



export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<AlertData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all'); // For the filter tabs
  const [isConnected, setIsConnected] = useState<boolean>(true); // Real-time connection status
  const router = useRouter();

  // Load alerts from storage and set up real-time listener
  useEffect(() => {
    loadAlerts();
    
    // Set up real-time listener for Firebase alerts
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userRef = doc(db, 'users', currentUser.uid);
      
      const unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          const firebaseAlerts = userData.futureCrowdDetectionAlerts || [];
          
          // Sort by timestamp (newest first)
          const sortedAlerts = firebaseAlerts.sort((a: AlertData, b: AlertData) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          
          console.log('Real-time alerts received:', sortedAlerts.length);
          setAlerts(sortedAlerts);
          setIsConnected(true); // Connection is working
        }
      }, (error) => {
        console.error('Error listening to Firebase alerts:', error);
        setIsConnected(false); // Connection failed
        // Fallback to local storage on error
        loadAlerts();
      });

      // Cleanup listener on component unmount
      return () => {
        unsubscribe();
      };
    } else {
      console.warn('No authenticated user, loading from local storage only');
      loadAlerts();
    }
  }, []);

  const loadAlerts = async () => {
    try {
      const storedAlerts = await AlertStorage.getAllAlerts();
      setAlerts(storedAlerts);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      await AlertStorage.markAlertAsRead(alertId);
      setAlerts(prevAlerts =>
        prevAlerts.map(alert =>
          alert.id === alertId ? { ...alert, isRead: true } : alert
        )
      );
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await AlertStorage.markAllAlertsAsRead();
      setAlerts(prevAlerts =>
        prevAlerts.map(alert => ({ ...alert, isRead: true }))
      );
    } catch (error) {
      console.error('Failed to mark all alerts as read:', error);
    }
  };

  const clearAlert = async (alertId: string) => {
    Alert.alert(
      'Clear Alert',
      'Are you sure you want to clear this alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AlertStorage.deleteAlert(alertId);
              setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== alertId));
              if (selectedAlert?.id === alertId) {
                setShowModal(false);
                setSelectedAlert(null);
              }
            } catch (error) {
              console.error('Failed to clear alert:', error);
            }
          }
        }
      ]
    );
  };

  const clearAllAlerts = async () => {
    Alert.alert(
      'Clear All Alerts',
      'Are you sure you want to clear all alerts?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await AlertStorage.clearAllAlerts();
              setAlerts([]);
              setShowModal(false);
              setSelectedAlert(null);
            } catch (error) {
              console.error('Failed to clear all alerts:', error);
            }
          }
        }
      ]
    );
  };

  const openAlertDetails = async (alert: AlertData) => {
    setSelectedAlert(alert);
    setShowModal(true);
    if (!alert.isRead) {
      await markAsRead(alert.id);
    }
  };

  const refreshAlerts = async () => {
    try {
      // Force refresh from Firebase
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const firebaseAlerts = userData.futureCrowdDetectionAlerts || [];
          
          // Sort by timestamp (newest first)
          const sortedAlerts = firebaseAlerts.sort((a: AlertData, b: AlertData) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          
          console.log('Manual refresh - alerts received:', sortedAlerts.length);
          setAlerts(sortedAlerts);
        }
      } else {
        // Fallback to local storage
        await loadAlerts();
      }
    } catch (error) {
      console.error('Error refreshing alerts:', error);
      // Fallback to local storage
      await loadAlerts();
    }
  };

  const getPriorityStyle = (priority?: string) => {
    switch (priority) {
      case 'low': return styles.priorityLow;
      case 'medium': return styles.priorityMedium;
      case 'high': return styles.priorityHigh;
      case 'critical': return styles.priorityCritical;
      default: return styles.priorityMedium;
    }
  };

  const getStatusStyle = (status?: string) => {
    switch (status) {
      case 'active': return styles.statusActive;
      case 'resolved': return styles.statusResolved;
      case 'escalated': return styles.statusEscalated;
      default: return styles.statusActive;
    }
  };

  const getCrowdLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'high': return '#F44336';
      case 'very_high': return '#9C27B0';
      default: return '#2196F3';
    }
  };

  const getCrowdLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return 'checkmark-circle';
      case 'medium': return 'warning';
      case 'high': return 'alert-circle';
      case 'very_high': return 'close-circle';
      default: return 'information-circle';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  const getIncidentDescription = (crowdLevel: string, estimatedPeople: number, harmLikelihood: string) => {
    const level = crowdLevel.toLowerCase();
    const people = estimatedPeople;
    const risk = harmLikelihood.toLowerCase();

    if (level === 'very_high' || level === 'high') {
      if (people > 1000) {
        return `🚨 STAMPEDE RISK: ${people} people detected. Immediate crowd control required!`;
      } else if (people > 500) {
        return `⚠️ DANGEROUS CROWD: ${people} people in high density area. Risk of stampede!`;
      } else {
        return `⚠️ UNUSUAL ACTIVITY: ${people} people detected. Monitoring required.`;
      }
    } else if (level === 'medium') {
      if (people > 500) {
        return `📊 LARGE GATHERING: ${people} people detected. Standard monitoring.`;
      } else {
        return `📊 NORMAL ACTIVITY: ${people} people detected. Routine monitoring.`;
      }
    } else {
      return `✅ LOW RISK: ${people} people detected. Normal conditions.`;
    }
  };

  const unreadCount = alerts.filter(alert => !alert.isRead).length;

  // Filter alerts based on active filter
  const getFilteredAlerts = () => {
    switch (activeFilter) {
      case 'unread':
        return alerts.filter(alert => !alert.isRead);
      case 'critical':
        return alerts.filter(alert => alert.priority === 'critical');
      default:
        return alerts;
    }
  };

  const filteredAlerts = getFilteredAlerts();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Professional Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <View style={styles.iconContainer}>
                <Ionicons name="notifications" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.titleTextContainer}>
                <Text style={styles.title}>Security Alerts</Text>
                <Text style={styles.subtitle}>Real-time crowd monitoring system</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }]}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{isConnected ? 'LIVE' : 'OFFLINE'}</Text>
            </View>
          </View>
        </View>

        {/* KPI Summary Cards */}
        <View style={styles.kpiContainer}>
          <View style={[styles.kpiCard, styles.kpiCardPrimary]}>
            <View style={styles.kpiIconContainer}>
              <Ionicons name="notifications" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.kpiNumber}>{alerts.length}</Text>
            <Text style={styles.kpiLabel}>Total Alerts</Text>
          </View>
          
          <View style={[styles.kpiCard, styles.kpiCardSecondary]}>
            <View style={styles.kpiIconContainer}>
              <Ionicons name="eye" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.kpiNumber}>{unreadCount}</Text>
            <Text style={styles.kpiLabel}>Unread</Text>
          </View>
          
          <View style={[styles.kpiCard, styles.kpiCardTertiary]}>
            <View style={styles.kpiIconContainer}>
              <Ionicons name="warning" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.kpiNumber}>
              {alerts.filter(a => a.priority === 'critical').length}
            </Text>
            <Text style={styles.kpiLabel}>Critical</Text>
          </View>
        </View>

        {/* Alerts Section */}
        <View style={styles.alertsSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="list" size={18} color="#FF8C00" />
              <Text style={styles.sectionTitle}>Active Alerts</Text>
            </View>
            <View style={styles.alertsCount}>
              <Text style={styles.alertsCountText}>{filteredAlerts.length}</Text>
              <Text style={styles.alertsCountLabel}>
                {activeFilter === 'all' ? 'alerts' : 
                 activeFilter === 'unread' ? 'unread' : 
                 activeFilter === 'critical' ? 'critical' : 'alerts'}
              </Text>
            </View>
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterTabsContainer}>
            <TouchableOpacity 
              style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]}
              onPress={() => setActiveFilter('all')}
            >
              <Ionicons name="list" size={16} color={activeFilter === 'all' ? "#FF8C00" : "#666666"} />
              <Text style={[styles.filterTabText, activeFilter === 'all' && styles.filterTabTextActive]}>
                All Alerts
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterTab, activeFilter === 'unread' && styles.filterTabActive]}
              onPress={() => setActiveFilter('unread')}
            >
              <Ionicons name="eye" size={16} color={activeFilter === 'unread' ? "#FF8C00" : "#666666"} />
              <Text style={[styles.filterTabText, activeFilter === 'unread' && styles.filterTabTextActive]}>
                Unread ({unreadCount})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterTab, activeFilter === 'critical' && styles.filterTabActive]}
              onPress={() => setActiveFilter('critical')}
            >
              <Ionicons name="warning" size={16} color={activeFilter === 'critical' ? "#FF8C00" : "#666666"} />
              <Text style={[styles.filterTabText, activeFilter === 'critical' && styles.filterTabTextActive]}>
                Critical ({alerts.filter(a => a.priority === 'critical').length})
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Alerts List */}
          {filteredAlerts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="notifications-off" size={48} color="#CCCCCC" />
              </View>
              <Text style={styles.emptyTitle}>
                {activeFilter === 'all' ? 'No Security Alerts' :
                 activeFilter === 'unread' ? 'No Unread Alerts' :
                 activeFilter === 'critical' ? 'No Critical Alerts' : 'No Alerts'}
              </Text>
              <Text style={styles.emptyText}>
                {activeFilter === 'all' ? 'All alerts have been resolved or no new alerts have been generated.' :
                 activeFilter === 'unread' ? 'All alerts have been read.' :
                 activeFilter === 'critical' ? 'No critical alerts at this time.' : 'No alerts found.'}
              </Text>
            </View>
          ) : (
            <View style={styles.alertsListContainer}>
              {filteredAlerts.map((alert, index) => (
                <View key={alert.id} style={styles.alertCardWrapper}>
                  <View style={styles.alertNumberBadge}>
                    <Text style={styles.alertNumberText}>#{index + 1}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.alertCard, !alert.isRead && styles.unreadAlert]}
                    onPress={() => openAlertDetails(alert)}
                  >
                    {/* Alert Header */}
                    <View style={styles.alertHeader}>
                      <View style={styles.alertTypeContainer}>
                        <Ionicons 
                          name={getCrowdLevelIcon(alert.data.crowd_level)} 
                          size={20} 
                          color={getCrowdLevelColor(alert.data.crowd_level)} 
                        />
                        <Text style={styles.alertType}>Crowd Analysis</Text>
                      </View>
                      <View style={[styles.priorityBadge, getPriorityStyle(alert.priority)]}>
                        <Ionicons 
                          name={alert.priority === 'critical' ? 'warning' : alert.priority === 'high' ? 'alert-circle' : 'information-circle'} 
                          size={10} 
                          color="#FFFFFF" 
                        />
                        <Text style={styles.priorityText}>{alert.priority?.toUpperCase()}</Text>
                      </View>
                    </View>

                    {/* Alert Content */}
                    <View style={styles.alertContent}>
                      {/* Incident Description */}
                      <View style={styles.incidentDescription}>
                        <Text style={styles.incidentText}>
                          {getIncidentDescription(alert.data.crowd_level, alert.data.estimated_people, alert.data.harm_likelihood)}
                        </Text>
                      </View>

                      {/* Resource Requirements */}
                      <View style={styles.resourceRequirements}>
                        <View style={styles.resourceRow}>
                          <View style={styles.resourceItem}>
                            <Ionicons 
                              name="shield-checkmark" 
                              size={16} 
                              color={alert.data.police_required ? "#F44336" : "#4CAF50"} 
                            />
                            <Text style={styles.resourceLabel}>Police:</Text>
                            <Text style={[styles.resourceValue, { color: alert.data.police_required ? "#F44336" : "#4CAF50" }]}>
                              {alert.data.police_required ? `${alert.data.police_count} needed` : 'Not required'}
                            </Text>
                          </View>
                          <View style={styles.resourceItem}>
                            <Ionicons 
                              name="medical" 
                              size={16} 
                              color={alert.data.medical_required ? "#F44336" : "#4CAF50"} 
                            />
                            <Text style={styles.resourceLabel}>Medical:</Text>
                            <Text style={[styles.resourceValue, { color: alert.data.medical_required ? "#F44336" : "#4CAF50" }]}>
                              {alert.data.medical_required ? `${alert.data.medical_staff_count} staff` : 'Not required'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Alert Footer */}
                    <View style={styles.alertFooter}>
                      <Text style={styles.timestamp}>{formatTimestamp(alert.timestamp)}</Text>
                      <View style={styles.alertActions}>
                        {!alert.isRead && (
                          <TouchableOpacity onPress={() => markAsRead(alert.id)}>
                            <Ionicons name="checkmark-circle-outline" size={16} color="#FF8C00" />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => clearAlert(alert.id)}>
                          <Ionicons name="close" size={16} color="#666666" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Professional Alert Details Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Professional Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIconContainer}>
                  <Ionicons name="alert-circle" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.modalTitleContainer}>
                  <Text style={styles.modalTitle}>Alert Details</Text>
                  <Text style={styles.modalSubtitle}>Security Analysis Report</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <Ionicons name="close" size={20} color="#666666" />
              </TouchableOpacity>
            </View>

            {selectedAlert && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Incident Summary Card */}
                <View style={styles.incidentSummaryCard}>
                  <View style={styles.incidentSummaryHeader}>
                    <Ionicons name="warning" size={20} color="#FF8C00" />
                    <Text style={styles.incidentSummaryTitle}>Incident Summary</Text>
                  </View>
                  <Text style={styles.incidentSummaryText}>
                    {getIncidentDescription(selectedAlert.data.crowd_level, selectedAlert.data.estimated_people, selectedAlert.data.harm_likelihood)}
                  </Text>
                </View>

                {/* Crowd Assessment Card */}
                <View style={styles.assessmentCard}>
                  <View style={styles.assessmentHeader}>
                    <Ionicons name="analytics" size={20} color="#FF8C00" />
                    <Text style={styles.assessmentTitle}>Crowd Assessment</Text>
                  </View>
                  
                  <View style={styles.crowdLevelCard}>
                    <View style={styles.crowdLevelHeader}>
                      <Ionicons 
                        name={getCrowdLevelIcon(selectedAlert.data.crowd_level)} 
                        size={28} 
                        color={getCrowdLevelColor(selectedAlert.data.crowd_level)} 
                      />
                      <Text style={[styles.crowdLevelText, { color: getCrowdLevelColor(selectedAlert.data.crowd_level) }]}>
                        {selectedAlert.data.crowd_level.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.estimatedPeople}>
                      Estimated People: {selectedAlert.data.estimated_people}
                    </Text>
                  </View>
                </View>

                {/* Safety Recommendations Card */}
                <View style={styles.recommendationsCard}>
                  <View style={styles.recommendationsHeader}>
                    <Ionicons name="shield-checkmark" size={20} color="#FF8C00" />
                    <Text style={styles.recommendationsTitle}>Safety Recommendations</Text>
                  </View>
                  
                  <View style={styles.recommendationGrid}>
                    <View style={styles.recommendationItem}>
                      <View style={styles.recommendationIconContainer}>
                        <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
                      </View>
                      <Text style={styles.recommendationLabel}>Police</Text>
                      <Text style={styles.recommendationValue}>
                        {selectedAlert.data.police_required ? `${selectedAlert.data.police_count} needed` : 'Not required'}
                      </Text>
                    </View>

                    <View style={styles.recommendationItem}>
                      <View style={styles.recommendationIconContainer}>
                        <Ionicons name="medical" size={16} color="#2196F3" />
                      </View>
                      <Text style={styles.recommendationLabel}>Medical</Text>
                      <Text style={styles.recommendationValue}>
                        {selectedAlert.data.medical_required ? `${selectedAlert.data.medical_staff_count} staff` : 'Not required'}
                      </Text>
                    </View>

                    <View style={styles.recommendationItem}>
                      <View style={styles.recommendationIconContainer}>
                        <Ionicons 
                          name={selectedAlert.data.chokepoints_detected ? "warning" : "checkmark-circle"} 
                          size={16} 
                          color={selectedAlert.data.chokepoints_detected ? "#FF9800" : "#4CAF50"} 
                        />
                      </View>
                      <Text style={styles.recommendationLabel}>Chokepoints</Text>
                      <Text style={styles.recommendationValue}>
                        {selectedAlert.data.chokepoints_detected ? 'Detected' : 'Clear'}
                      </Text>
                    </View>

                    <View style={styles.recommendationItem}>
                      <View style={styles.recommendationIconContainer}>
                        <Ionicons 
                          name={selectedAlert.data.emergency_access_clear ? "checkmark-circle" : "close-circle"} 
                          size={16} 
                          color={selectedAlert.data.emergency_access_clear ? "#4CAF50" : "#F44336"} 
                        />
                      </View>
                      <Text style={styles.recommendationLabel}>Emergency Access</Text>
                      <Text style={styles.recommendationValue}>
                        {selectedAlert.data.emergency_access_clear ? 'Clear' : 'Blocked'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Activities Card */}
                <View style={styles.activitiesCard}>
                  <View style={styles.activitiesHeader}>
                    <Ionicons name="eye" size={20} color="#FF8C00" />
                    <Text style={styles.activitiesTitle}>Activities Observed</Text>
                  </View>
                  <View style={styles.activitiesContainer}>
                    {selectedAlert.data.activities.map((activity: string, index: number) => (
                      <View key={index} style={styles.activityTag}>
                        <Text style={styles.activityText}>{activity}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Risk Assessment Card */}
                <View style={styles.riskCard}>
                  <View style={styles.riskHeader}>
                    <Ionicons name="warning" size={20} color="#FF8C00" />
                    <Text style={styles.riskTitle}>Risk Assessment</Text>
                  </View>
                  <Text style={styles.riskText}>
                    Harm Likelihood: {selectedAlert.data.harm_likelihood}
                  </Text>
                  {selectedAlert.data.notes && (
                    <Text style={styles.notesText}>
                      Notes: {selectedAlert.data.notes}
                    </Text>
                  )}
                </View>

                {/* Alert Information Card */}
                <View style={styles.infoCard}>
                  <View style={styles.infoHeader}>
                    <Ionicons name="information-circle" size={20} color="#FF8C00" />
                    <Text style={styles.infoTitle}>Alert Information</Text>
                  </View>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Type</Text>
                      <Text style={styles.infoValue}>{selectedAlert.type.replace('_', ' ').toUpperCase()}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Time</Text>
                      <Text style={styles.infoValue}>{new Date(selectedAlert.timestamp).toLocaleString()}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Status</Text>
                      <Text style={styles.infoValue}>{selectedAlert.isRead ? 'Read' : 'Unread'}</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            )}

            {/* Modal Action Buttons */}
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.closeModalButton} 
                onPress={() => setShowModal(false)}
              >
                <Ionicons name="close" size={16} color="#666666" />
                <Text style={styles.closeModalButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.clearModalButton} 
                onPress={() => selectedAlert && clearAlert(selectedAlert.id)}
              >
                <Ionicons name="trash" size={16} color="#FFFFFF" />
                <Text style={styles.clearModalButtonText}>Clear Alert</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#FF8C00',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  kpiContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 80,
  },
  kpiCardPrimary: {
    backgroundColor: '#007BFF',
  },
  kpiCardSecondary: {
    backgroundColor: '#FF8C00',
  },
  kpiCardTertiary: {
    backgroundColor: '#F44336',
  },
  kpiIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textAlign: 'center',
  },
  alertsSection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginLeft: 8,
  },
  alertsCount: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF8C00',
  },
  alertsCountText: {
    fontSize: 20,
    color: '#FF8C00',
    fontWeight: 'bold',
  },
  alertsCountLabel: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  filterTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
  },
  filterTabTextActive: {
    fontSize: 12,
    color: '#FF8C00',
    fontWeight: 'bold',
  },
  alertsListContainer: {
    gap: 16,
  },
  alertCardWrapper: {
    position: 'relative',
  },
  alertNumberBadge: {
    position: 'absolute',
    top: -8,
    left: 16,
    zIndex: 10,
    backgroundColor: '#FF8C00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  alertNumberText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  unreadAlert: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF8C00',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  alertTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  alertType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 8,
  },
  alertContent: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  incidentDescription: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF8C00',
  },
  incidentText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
    lineHeight: 20,
  },
  resourceRequirements: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 12,
  },
  resourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resourceItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resourceLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
  },
  resourceValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  timestamp: {
    fontSize: 12,
    color: '#999999',
  },
  alertActions: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 20,
  },
  incidentSummaryCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF8C00',
    borderLeftWidth: 4,
  },
  incidentSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  incidentSummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF8C00',
    marginLeft: 8,
  },
  incidentSummaryText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    fontWeight: '600',
  },
  assessmentCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  assessmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  assessmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginLeft: 8,
  },
  crowdLevelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  crowdLevelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  crowdLevelText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  estimatedPeople: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
  },
  recommendationsCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginLeft: 8,
  },
  recommendationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recommendationItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  recommendationLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
    marginBottom: 4,
  },
  recommendationValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  activitiesCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activitiesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activitiesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginLeft: 8,
  },
  activitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityTag: {
    backgroundColor: '#FF8C00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  riskCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  riskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginLeft: 8,
  },
  riskText: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  infoCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginLeft: 8,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  closeModalButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  closeModalButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666666',
  },
  clearModalButton: {
    flex: 1,
    backgroundColor: '#F44336',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  clearModalButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  priorityLow: {
    backgroundColor: '#4CAF50',
  },
  priorityMedium: {
    backgroundColor: '#FF9800',
  },
  priorityHigh: {
    backgroundColor: '#F44336',
  },
  priorityCritical: {
    backgroundColor: '#9C27B0',
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  statusActive: {
    backgroundColor: '#2196F3',
  },
  statusResolved: {
    backgroundColor: '#4CAF50',
  },
  statusEscalated: {
    backgroundColor: '#FF9800',
  },
});
