import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import FirebaseService, { UserRoute } from '../../lib/firebaseService';

const { width } = Dimensions.get('window');

const getStatusColor = (status: UserRoute['status']) => {
  switch (status) {
    case 'active': return '#20B2AA';
    case 'completed': return '#32CD32';
    case 'cancelled': return '#E74C3C';
    default: return '#7F8C8D';
  }
};

const getStatusIcon = (status: UserRoute['status']) => {
  switch (status) {
    case 'active': return 'navigate';
    case 'completed': return 'checkmark-circle';
    case 'cancelled': return 'close-circle';
    default: return 'help-circle';
  }
};

const getStatusText = (status: UserRoute['status']) => {
  switch (status) {
    case 'active': return 'En Route';
    case 'completed': return 'Arrived';
    case 'cancelled': return 'Cancelled';
    default: return 'Unknown';
  }
};

const getHospitalTypeIcon = (type: UserRoute['hospitalType']) => {
  switch (type) {
    case 'hospital': return 'medical';
    case 'clinic': return 'medical-outline';
    case 'medical': return 'medical';
    default: return 'location';
  }
};

const getHospitalTypeColor = (type: UserRoute['hospitalType']) => {
  switch (type) {
    case 'hospital': return '#20B2AA';
    case 'clinic': return '#4ECDC4';
    case 'medical': return '#20B2AA';
    default: return '#7F8C8D';
  }
};

export default function UsersComingScreen() {
  const [routes, setRoutes] = useState<UserRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    loadRoutes();
    const unsubscribe = FirebaseService.subscribeToUserRoutes(setRoutes);
    return unsubscribe;
  }, []);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      const data = await FirebaseService.getUserRoutes();
      setRoutes(data);
    } catch (error) {
      console.error('Error loading user routes:', error);
      Alert.alert('Error', 'Failed to load user routes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRoutes();
    setRefreshing(false);
  };

  const handleUpdateStatus = async (routeId: string, newStatus: UserRoute['status']) => {
    try {
      await FirebaseService.updateUserRouteStatus(routeId, newStatus);
      Alert.alert('Success', `Route status updated to ${getStatusText(newStatus)}`);
    } catch (error) {
      console.error('Error updating route status:', error);
      Alert.alert('Error', 'Failed to update route status. Please try again.');
    }
  };

  const handleShowRoute = (route: UserRoute) => {
    // Navigate to a map view showing the route
    // This could be implemented to show the route on a map
    Alert.alert(
      'Route Details',
      `From: ${route.startLatitude.toFixed(4)}, ${route.startLongitude.toFixed(4)}\n` +
      `To: ${route.endLatitude.toFixed(4)}, ${route.endLongitude.toFixed(4)}\n` +
      `Distance: ${route.distance.toFixed(1)} km\n` +
      `ETA: ${route.estimatedTime} minutes`
    );
  };

  const filteredRoutes = selectedFilter === 'all' 
    ? routes 
    : routes.filter(route => route.status === selectedFilter);

  const renderRouteItem = ({ item }: { item: UserRoute }) => (
    <View style={styles.routeCard}>
      {/* User Header */}
      <View style={styles.userHeader}>
        <View style={styles.userAvatar}>
          <Text style={styles.userInitial}>
            {item.userName?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.userName}</Text>
          <Text style={styles.userContact}>{item.userPhone} • {item.userEmail}</Text>
          <View style={styles.userDetails}>
            <Text style={styles.userDetailText}>
              Aadhaar: {item.userAadhaar} • Role: {item.userRole}
            </Text>
            <Text style={styles.userDetailText}>
              Status: {item.userIsActive ? 'Active' : 'Inactive'} • Family: {item.userFamilyMembers?.length || 0}
            </Text>
          </View>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Ionicons 
            name={getStatusIcon(item.status)} 
            size={14} 
            color="white" 
          />
          <Text style={styles.statusText}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      {/* Hospital Information */}
      <View style={styles.hospitalSection}>
        <View style={styles.hospitalHeader}>
          <Ionicons name="business" size={20} color="#20B2AA" />
          <Text style={styles.hospitalLabel}>Destination Hospital</Text>
        </View>
        <View style={styles.hospitalInfo}>
          <View style={[
            styles.hospitalTypeBadge,
            { backgroundColor: getHospitalTypeColor(item.hospitalType) }
          ]}>
            <Ionicons 
              name={getHospitalTypeIcon(item.hospitalType)} 
              size={14} 
              color="white" 
            />
            <Text style={styles.hospitalTypeText}>
              {item.hospitalType.charAt(0).toUpperCase() + item.hospitalType.slice(1)}
            </Text>
          </View>
          <Text style={styles.hospitalName}>{item.hospitalName}</Text>
        </View>
      </View>

      {/* Route Information */}
      <View style={styles.routeSection}>
        <View style={styles.routeHeader}>
          <Ionicons name="navigate" size={20} color="#20B2AA" />
          <Text style={styles.routeLabel}>Route Information</Text>
        </View>
        <View style={styles.routeDetails}>
          <View style={styles.routePoint}>
            <Ionicons name="location" size={16} color="#32CD32" />
            <Text style={styles.routePointText}>
              Start: {item.startLatitude.toFixed(4)}, {item.startLongitude.toFixed(4)}
            </Text>
          </View>
          <View style={styles.routePoint}>
            <Ionicons name="location" size={16} color="#E74C3C" />
            <Text style={styles.routePointText}>
              Destination: {item.endLatitude.toFixed(4)}, {item.endLongitude.toFixed(4)}
            </Text>
          </View>
          <View style={styles.routePoint}>
            <Ionicons name="map-outline" size={16} color="#20B2AA" />
            <Text style={styles.routePointText}>
              Waypoints: {item.routePoints.length} points
            </Text>
          </View>
        </View>
      </View>

      {/* Metrics */}
      <View style={styles.metricsSection}>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <Ionicons name="map" size={20} color="#20B2AA" />
            </View>
            <Text style={styles.metricValue}>{item.distance.toFixed(1)} km</Text>
            <Text style={styles.metricLabel}>Distance</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <Ionicons name="time" size={20} color="#FFA500" />
            </View>
            <Text style={styles.metricValue}>{item.estimatedTime} min</Text>
            <Text style={styles.metricLabel}>ETA</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <Ionicons name="calendar" size={20} color="#7F8C8D" />
            </View>
            <Text style={styles.metricValue}>
              {item.createdAt?.toDate?.()?.toLocaleDateString() || 'Today'}
            </Text>
            <Text style={styles.metricLabel}>Created</Text>
          </View>
        </View>
      </View>

      {/* User Registration Info */}
      <View style={styles.registrationSection}>
        <View style={styles.registrationGrid}>
          <View style={styles.registrationItem}>
            <Ionicons name="person-add" size={14} color="#20B2AA" />
            <Text style={styles.registrationText}>
              Registered: {item.userCreatedAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
            </Text>
          </View>
          <View style={styles.registrationItem}>
            <Ionicons name="time" size={14} color="#20B2AA" />
            <Text style={styles.registrationText}>
              Last Seen: {item.userLastSeen?.toDate?.()?.toLocaleDateString() || 'Unknown'}
            </Text>
          </View>
        </View>
      </View>

      {/* Family Members Info */}
      {item.userFamilyMembers && item.userFamilyMembers.length > 0 && (
        <View style={styles.familySection}>
          <View style={styles.familyHeader}>
            <Ionicons name="people" size={16} color="#20B2AA" />
            <Text style={styles.familyLabel}>Family Members</Text>
          </View>
          <Text style={styles.familyText}>
            {item.userFamilyMembers.length} family members connected
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewRouteButton]}
            onPress={() => handleShowRoute(item)}
          >
            <Ionicons name="map" size={16} color="white" />
            <Text style={styles.actionButtonText}>View Route</Text>
          </TouchableOpacity>

          {item.status === 'active' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={() => handleUpdateStatus(item.id!, 'completed')}
              >
                <Ionicons name="checkmark" size={16} color="white" />
                <Text style={styles.actionButtonText}>Mark Arrived</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => handleUpdateStatus(item.id!, 'cancelled')}
              >
                <Ionicons name="close" size={16} color="white" />
                <Text style={styles.actionButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Status Info */}
        {item.status === 'completed' && (
          <View style={styles.statusInfo}>
            <Ionicons name="checkmark-circle" size={16} color="#32CD32" />
            <Text style={styles.statusInfoText}>
              Arrived at {item.completedAt?.toLocaleTimeString() || 'recently'}
            </Text>
          </View>
        )}

        {item.status === 'cancelled' && (
          <View style={styles.statusInfo}>
            <Ionicons name="close-circle" size={16} color="#E74C3C" />
            <Text style={styles.statusInfoText}>
              Cancelled at {item.cancelledAt?.toLocaleTimeString() || 'recently'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Users Coming to Hospitals</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#20B2AA" />
          <Text style={styles.loadingText}>Loading user routes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Users Coming to Hospitals</Text>
            <Text style={styles.headerSubtitle}>Track user routes and arrivals</Text>
          </View>
          <View style={styles.statusIndicator}>
            <View style={styles.statusDot} />
            <Text style={styles.headerStatusText}>LIVE</Text>
          </View>
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === 'all' && styles.filterButtonActive
            ]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[
              styles.filterButtonText,
              selectedFilter === 'all' && styles.filterButtonTextActive
            ]}>
              All ({routes.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === 'active' && styles.filterButtonActive
            ]}
            onPress={() => setSelectedFilter('active')}
          >
            <Text style={[
              styles.filterButtonText,
              selectedFilter === 'active' && styles.filterButtonTextActive
            ]}>
              En Route ({routes.filter(r => r.status === 'active').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === 'completed' && styles.filterButtonActive
            ]}
            onPress={() => setSelectedFilter('completed')}
          >
            <Text style={[
              styles.filterButtonText,
              selectedFilter === 'completed' && styles.filterButtonTextActive
            ]}>
              Arrived ({routes.filter(r => r.status === 'completed').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === 'cancelled' && styles.filterButtonActive
            ]}
            onPress={() => setSelectedFilter('cancelled')}
          >
            <Text style={[
              styles.filterButtonText,
              selectedFilter === 'cancelled' && styles.filterButtonTextActive
            ]}>
              Cancelled ({routes.filter(r => r.status === 'cancelled').length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Routes List */}
      <FlatList
        data={filteredRoutes}
        renderItem={renderRouteItem}
        keyExtractor={(item) => item.id || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#20B2AA']}
            tintColor="#20B2AA"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="navigate-outline" size={48} color="#BDC3C7" />
            </View>
            <Text style={styles.emptyText}>No user routes found</Text>
            <Text style={styles.emptySubtext}>
              {selectedFilter === 'all' 
                ? 'Users will appear here when they request routes to hospitals'
                : `No ${selectedFilter} routes found`
              }
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },
  headerStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    marginHorizontal: 0,
    borderRadius: 0,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterScroll: {
    paddingHorizontal: 24,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 80,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.2,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7F8C8D',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
  },
  routeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  userInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  userContact: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  userDetails: {
    gap: 2,
  },
  userDetailText: {
    fontSize: 11,
    color: '#64748B',
    flexWrap: 'wrap',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  hospitalSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  hospitalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hospitalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#20B2AA',
    marginLeft: 8,
    letterSpacing: 0.2,
  },
  hospitalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hospitalTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  hospitalTypeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  hospitalName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    letterSpacing: -0.1,
  },
  routeSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#20B2AA',
    marginLeft: 8,
    letterSpacing: 0.2,
  },
  routeDetails: {
    gap: 8,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routePointText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
    flexWrap: 'wrap',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  metricsSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    minWidth: (width - 80) / 3, // Responsive width with gap consideration
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  registrationSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  registrationGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  registrationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  registrationText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
    flexWrap: 'wrap',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  familySection: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  familyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  familyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#20B2AA',
    marginLeft: 8,
    letterSpacing: 0.2,
  },
  familyText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  actionSection: {
    gap: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    minWidth: 100,
    flex: 1,
    maxWidth: (width - 80) / 3, // Responsive width based on screen size
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  viewRouteButton: {
    backgroundColor: '#10B981',
  },
  completeButton: {
    backgroundColor: '#059669',
  },
  cancelButton: {
    backgroundColor: '#DC2626',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
    letterSpacing: 0.2,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statusInfoText: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
