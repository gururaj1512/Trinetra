import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FirebaseService, { AmbulanceRequest } from '../../lib/firebaseService';

const { width } = Dimensions.get('window');

export default function MedicalAdminDashboard() {
  const [ambulanceRequests, setAmbulanceRequests] = useState<AmbulanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    acceptedRequests: 0,
    completedRequests: 0,
    activeAmbulances: 0,
    totalPatients: 0
  });

  useEffect(() => {
    loadData();
    const unsubscribe = FirebaseService.subscribeToAmbulanceRequests(setAmbulanceRequests);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (ambulanceRequests.length > 0) {
      const newStats = {
        totalRequests: ambulanceRequests.length,
        pendingRequests: ambulanceRequests.filter(r => r.status === 'pending').length,
        acceptedRequests: ambulanceRequests.filter(r => r.status === 'accepted').length,
        completedRequests: ambulanceRequests.filter(r => r.status === 'completed').length,
        activeAmbulances: ambulanceRequests.filter(r => r.status === 'accepted').length,
        totalPatients: ambulanceRequests.length
      };
      setStats(newStats);
    }
  }, [ambulanceRequests]);

  const loadData = async () => {
    try {
      setLoading(true);
      const requests = await FirebaseService.getAmbulanceRequests();
      setAmbulanceRequests(requests);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceNavigation = (service: string) => {
    switch (service) {
      case 'Ambulance':
        router.push('/(medicalAdminTabs)/ambulance-requests');
        break;
      case 'Users Coming':
        router.push('/(medicalAdminTabs)/users-coming');
        break;
      case 'Profile':
        router.push('/(medicalAdminTabs)/profile');
        break;
      case 'Navigation':
        // You can add specific navigation logic here
        console.log('Navigation service tapped');
        break;
      case 'Settings':
        // You can add settings navigation here
        console.log('Settings service tapped');
        break;
      default:
        console.log(`${service} service tapped`);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.greetingSection}>
              <Text style={styles.greeting}>Hello, Admin</Text>
              <Text style={styles.subGreeting}>Medical Operations Center</Text>
            </View>
            <View style={styles.statusIndicator}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>LIVE</Text>
            </View>
          </View>
        </View>

        {/* Featured Emergency Card */}
        <View style={styles.featuredCard}>
          <View style={styles.featuredContent}>
            <View style={styles.featuredInfo}>
              <Text style={styles.featuredTitle}>Emergency Response</Text>
              <Text style={styles.featuredSubtitle}>Critical Care Unit</Text>
              <TouchableOpacity style={styles.featuredButton}>
                <Text style={styles.featuredButtonText}>View Emergencies</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.featuredIcon}>
              <Ionicons name="medical" size={40} color="#20B2AA" />
            </View>
          </View>
        </View>

        {/* Medical Services */}
        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Medical Services</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            <TouchableOpacity 
              style={styles.categoryItem}
              onPress={() => handleServiceNavigation('Ambulance')}
            >
              <View style={styles.categoryIcon}>
                <Ionicons name="medical" size={24} color="#20B2AA" />
              </View>
              <Text style={styles.categoryText}>Ambulance</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.categoryItem}
              onPress={() => handleServiceNavigation('Users Coming')}
            >
              <View style={styles.categoryIcon}>
                <Ionicons name="people" size={24} color="#20B2AA" />
              </View>
              <Text style={styles.categoryText}>Users Coming</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.categoryItem}
              onPress={() => handleServiceNavigation('Profile')}
            >
              <View style={styles.categoryIcon}>
                <Ionicons name="person" size={24} color="#20B2AA" />
              </View>
              <Text style={styles.categoryText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.categoryItem}
              onPress={() => handleServiceNavigation('Navigation')}
            >
              <View style={styles.categoryIcon}>
                <Ionicons name="navigate" size={24} color="#20B2AA" />
              </View>
              <Text style={styles.categoryText}>Navigation</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.categoryItem}
              onPress={() => handleServiceNavigation('Settings')}
            >
              <View style={styles.categoryIcon}>
                <Ionicons name="settings" size={24} color="#20B2AA" />
              </View>
              <Text style={styles.categoryText}>Settings</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>System Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="medical" size={20} color="#20B2AA" />
              </View>
              <Text style={styles.statNumber}>{stats.totalRequests}</Text>
              <Text style={styles.statLabel}>Total Requests</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="time" size={20} color="#FFA500" />
              </View>
              <Text style={styles.statNumber}>{stats.pendingRequests}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="checkmark-circle" size={20} color="#32CD32" />
              </View>
              <Text style={styles.statNumber}>{stats.acceptedRequests}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="people" size={20} color="#FF6B6B" />
              </View>
              <Text style={styles.statNumber}>{stats.totalPatients}</Text>
              <Text style={styles.statLabel}>Patients</Text>
            </View>
          </View>
        </View>

        {/* Recent Emergency Requests */}
        <View style={styles.requestsContainer}>
          <View style={styles.requestsHeader}>
            <Text style={styles.sectionTitle}>Recent Emergencies</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color="#20B2AA" />
            </TouchableOpacity>
          </View>
          
          {ambulanceRequests.slice(0, 5).map((request, index) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={styles.patientInfo}>
                  <View style={styles.patientAvatar}>
                    <Text style={styles.patientInitial}>
                      {request.patientName?.charAt(0)?.toUpperCase() || 'P'}
                    </Text>
                  </View>
                  <View style={styles.patientDetails}>
                    <Text style={styles.patientName}>{request.patientName}</Text>
                    <Text style={styles.emergencyType}>{request.emergencyType}</Text>
                  </View>
                </View>
                <View style={styles.requestActions}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(request.status) }
                  ]}>
                    <Text style={styles.statusText}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="chevron-forward" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.requestFooter}>
                <Text style={styles.requestTime}>
                  {request.createdAt?.toDate?.()?.toLocaleString() || 'Just now'}
                </Text>
                <View style={styles.priorityIndicator}>
                  <Ionicons name="alert-circle" size={12} color="#FF6B6B" />
                  <Text style={styles.priorityText}>High Priority</Text>
                </View>
              </View>
            </View>
          ))}
          
          {ambulanceRequests.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="medical-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No emergency requests yet</Text>
              <Text style={styles.emptySubtext}>Emergency requests will appear here</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => handleServiceNavigation('Ambulance')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="medical" size={24} color="#20B2AA" />
              </View>
              <Text style={styles.quickActionText}>Ambulance Requests</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => handleServiceNavigation('Users Coming')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="people" size={24} color="#20B2AA" />
              </View>
              <Text style={styles.quickActionText}>Users Coming</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => handleServiceNavigation('Profile')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="person" size={24} color="#20B2AA" />
              </View>
              <Text style={styles.quickActionText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => handleServiceNavigation('Settings')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="settings" size={24} color="#20B2AA" />
              </View>
              <Text style={styles.quickActionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStatusColor = (status: AmbulanceRequest['status']) => {
  switch (status) {
    case 'pending': return '#ffc107';
    case 'accepted': return '#28a745';
    case 'completed': return '#6c757d';
    case 'cancelled': return '#dc3545';
    default: return '#6c757d';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#20B2AA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#20B2AA',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  featuredCard: {
    backgroundColor: '#20B2AA',
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#20B2AA',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  featuredContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredInfo: {
    flex: 1,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featuredSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  featuredButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuredButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#20B2AA',
  },
  featuredIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesContainer: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  categoriesScroll: {
    flexDirection: 'row',
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
  },
  statsContainer: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '600',
    textAlign: 'center',
  },
  requestsContainer: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  requestsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#20B2AA',
    marginRight: 4,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  patientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#20B2AA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  patientInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 2,
  },
  emergencyType: {
    fontSize: 14,
    color: '#E74C3C',
    fontWeight: '600',
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  actionButton: {
    padding: 4,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestTime: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  priorityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 12,
    color: '#E74C3C',
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 12,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BDC3C7',
    marginTop: 4,
  },
  quickActionsContainer: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - 60) / 2,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
  },
});


