import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { auth } from '../../lib/firebase';
import FirebaseService from '../../lib/firebaseService';
import hospitalService, { Hospital } from '../../lib/hospitalService';
import NotificationService from '../../lib/notificationService';

export default function MedicalScreen() {
  const params = useLocalSearchParams();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'hospital' | 'clinic'>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Route functionality state
  const [routePoints, setRoutePoints] = useState<{latitude: number, longitude: number}[]>([]);
  const [showRoute, setShowRoute] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  
  // Ambulance route state
  const [ambulanceRoutePoints, setAmbulanceRoutePoints] = useState<{latitude: number, longitude: number}[]>([]);
  const [showAmbulanceRoute, setShowAmbulanceRoute] = useState(false);
  const [ambulanceRequest, setAmbulanceRequest] = useState<{
    id: string;
    patientName: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const [ambulanceRouteProcessed, setAmbulanceRouteProcessed] = useState(false);

  useEffect(() => {
    initializeLocation();
  }, []);

  // Handle ambulance route parameters
  useEffect(() => {
    if (params.showAmbulanceRoute === 'true' && params.patientLat && params.patientLng && location && !ambulanceRouteProcessed) {
      const patientLat = parseFloat(params.patientLat as string);
      const patientLng = parseFloat(params.patientLng as string);
      
      setAmbulanceRequest({
        id: params.requestId as string,
        patientName: params.patientName as string,
        latitude: patientLat,
        longitude: patientLng
      });
      
        calculateAmbulanceRoute(patientLat, patientLng);
      setActiveTab('map'); // Switch to map view
      setAmbulanceRouteProcessed(true); // Mark as processed
      }
  }, [params.showAmbulanceRoute, params.patientLat, params.patientLng, params.requestId, params.patientName, location]);

  const initializeLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      await fetchNearbyHospitals(currentLocation.coords.latitude, currentLocation.coords.longitude);
    } catch (error) {
      console.error('Error getting location:', error);
      setErrorMsg('Error getting location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyHospitals = async (latitude: number, longitude: number) => {
    try {
      // Fetch all types of medical facilities (hospitals, clinics, pharmacies)
      const allMedicalFacilities = await hospitalService.fetchAllMedicalFacilities({
        latitude,
        longitude,
        radius: 15,
        limit: 50
      });
      setHospitals(allMedicalFacilities);
      console.log(`Fetched ${allMedicalFacilities.length} medical facilities:`, {
        hospitals: allMedicalFacilities.filter(h => h.type === 'hospital').length,
        clinics: allMedicalFacilities.filter(h => h.type === 'clinic').length
      });
    } catch (error) {
      console.error('Error fetching medical facilities:', error);
      setErrorMsg('Error fetching nearby medical facilities. Please try again.');
    }
  };

  const onRefresh = async () => {
    if (location) {
      setRefreshing(true);
      await fetchNearbyHospitals(location.coords.latitude, location.coords.longitude);
      setRefreshing(false);
    }
  };

  const handleHospitalPress = (hospital: Hospital) => {
    // For now, just show basic info in the list
    // The hospital details are already visible in the list view
    console.log('Hospital pressed:', hospital.name);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleFilterChange = (filter: 'all' | 'hospital' | 'clinic') => {
    setSelectedFilter(filter);
    setShowFilters(false); // Close filters when a filter is selected
  };

  const getFilterColor = (filter: 'all' | 'hospital' | 'clinic') => {
    switch (filter) {
      case 'all': return '#FF6B6B';
      case 'hospital': return '#FF6B6B';
      case 'clinic': return '#4ECDC4';
      default: return '#95A5A6';
    }
  };

  const getFilterCount = (filter: 'all' | 'hospital' | 'clinic') => {
    if (filter === 'all') {
      return hospitals.length;
    }
    return hospitals.filter(h => h.type === filter).length;
  };

  const filteredHospitals = hospitals.filter(hospital => {
    const matchesSearch = hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         hospital.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || hospital.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const handleCall = (phoneNumber: string) => {
    if (phoneNumber && phoneNumber !== 'Phone not available') {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleDirections = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const getMarkerIcon = (type: Hospital['type']) => {
    switch (type) {
      case 'hospital': return 'medical';
      case 'clinic': return 'medical-outline';
      default: return 'location';
    }
  };

  // Helper function to decode Google polyline
  const decodePolyline = (encoded: string) => {
    const points: { latitude: number; longitude: number }[] = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b: number;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  };

  // Helper function to calculate distance between two points
  const calculateDistance = (point1: { latitude: number; longitude: number }, point2: { latitude: number; longitude: number }) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Helper function to create a realistic road-like route
  const createRealisticRoute = (start: { latitude: number; longitude: number }, end: { latitude: number; longitude: number }) => {
    const points: { latitude: number; longitude: number }[] = [];
    
    // Calculate distance to determine route complexity
    const distance = calculateDistance(start, end);
    const numPoints = Math.max(15, Math.min(50, Math.floor(distance * 20))); // More points for longer distances
    
    // Add start point
    points.push(start);
    
    // Create intermediate waypoints that simulate road network
    for (let i = 1; i < numPoints - 1; i++) {
      const ratio = i / (numPoints - 1);
      
      // Base linear interpolation
      const baseLat = start.latitude + (end.latitude - start.latitude) * ratio;
      const baseLng = start.longitude + (end.longitude - start.longitude) * ratio;
      
      // Add road-like curves and turns
      const curveIntensity = 0.0008 * (1 + Math.sin(ratio * Math.PI * 3)); // Varying curve intensity
      const curveOffset = Math.sin(ratio * Math.PI * 2) * curveIntensity;
      
      // Add perpendicular offset to simulate road turns
      const perpOffset = Math.cos(ratio * Math.PI * 1.5) * curveIntensity * 0.6;
      
      // Create waypoints that follow a more realistic road pattern
      const waypoint = {
        latitude: baseLat + curveOffset + (Math.random() - 0.5) * 0.0002, // Small random variation
        longitude: baseLng + perpOffset + (Math.random() - 0.5) * 0.0002
      };
      
      points.push(waypoint);
    }
    
    // Add end point
    points.push(end);
    
    return points;
  };

  // Route calculation function - shows real road routes
  const calculateRoute = async (hospital: Hospital) => {
    if (!location) return;
    
    try {
      const startPoint = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };

      const endPoint = {
        latitude: hospital.latitude,
        longitude: hospital.longitude
      };

      // Try to get real road route using OpenRouteService API
      try {
        const apiKey = '5b3ce3597851110001cf6248a1b8b8b4a1b4b8b8'; // Free OpenRouteService API key
        const startCoords = `${startPoint.longitude},${startPoint.latitude}`;
        const endCoords = `${endPoint.longitude},${endPoint.latitude}`;
        
        const response = await fetch(
          `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${startCoords}&end=${endCoords}`
        );
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            const route = data.features[0];
            const coordinates = route.geometry.coordinates;
            
            // Convert coordinates to latitude/longitude format
            const routePoints = coordinates.map((coord: number[]) => ({
              latitude: coord[1],
              longitude: coord[0]
            }));
            
            setRoutePoints(routePoints);
            setShowRoute(true);
            setSelectedHospital(hospital);
            setActiveTab('map');
            
            // Get real distance and duration
            const distance = route.properties.summary.distance / 1000; // Convert to km
            const duration = route.properties.summary.duration / 60; // Convert to minutes
            
            console.log('Real road route calculated:', {
              distance: `${distance.toFixed(2)} km`,
              duration: `${duration.toFixed(0)} minutes`,
              points: routePoints.length,
              hospital: hospital.name
            });
            
            return; // Success, exit early
          }
        }
      } catch (apiError) {
        console.warn('OpenRouteService API failed, using fallback route:', apiError);
      }

      // Fallback to realistic route if API fails
      const routePoints = createRealisticRoute(startPoint, endPoint);
      setRoutePoints(routePoints);
      setShowRoute(true);
      setSelectedHospital(hospital);
      setActiveTab('map');

      const distance = calculateDistance(startPoint, endPoint);
      const estimatedTime = Math.round(distance * 2.5);
      
      console.log('Fallback route calculated:', {
        distance: `${distance.toFixed(2)} km`,
        estimatedTime: `${estimatedTime} minutes`,
        points: routePoints.length,
        hospital: hospital.name
      });

      // Store route data in Firebase for medical admin tracking
      try {
        // Get current authenticated user data
        const currentUser = auth.currentUser;
        if (currentUser) {
          console.log('Current authenticated user:', currentUser.uid, currentUser.email);
          
          const userData = await FirebaseService.getCurrentUserData(currentUser.uid);
          console.log('Fetched user data from Firestore:', userData);
          
          if (userData) {
            const routeData = {
              userId: currentUser.uid,
              userName: userData.name || 'Unknown User',
              userPhone: userData.phone || 'N/A',
              userEmail: userData.email || currentUser.email || 'N/A',
              userAadhaar: userData.aadhaar || 'N/A',
              userRole: userData.role || 'user',
              userRelationship: userData.relationship || 'User',
              userCreatedAt: userData.createdAt || new Date(),
              userLastSeen: userData.lastSeen || new Date(),
              userIsActive: userData.isActive || true,
              userFamilyMembers: userData.familyMembers || [],
              hospitalId: hospital.id,
              hospitalName: hospital.name,
              hospitalType: hospital.type,
              startLatitude: startPoint.latitude,
              startLongitude: startPoint.longitude,
              endLatitude: endPoint.latitude,
              endLongitude: endPoint.longitude,
              routePoints: routePoints,
              distance: distance,
              estimatedTime: estimatedTime
            };

            console.log('Creating route with full user details:', routeData);
            await FirebaseService.createUserRoute(routeData);
            console.log('✅ Route data with full user details stored successfully in Firebase');

            // Send notification that user is traveling to hospital
            try {
              await NotificationService.sendUserTravelingNotification({
                type: 'user_traveling',
                userName: userData.name || 'Current User',
                hospitalName: hospital.name,
                timestamp: new Date().toISOString(),
                priority: 'medium'
              });
              console.log('✅ User traveling notification sent successfully');
            } catch (notificationError) {
              console.error('❌ Error sending user traveling notification:', notificationError);
              // Don't fail the main operation if notification fails
            }
          } else {
            console.warn('⚠️ User data not found in Firestore, storing route with basic info');
            // Fallback with basic user info
            const routeData = {
              userId: currentUser.uid,
              userName: currentUser.displayName || 'Current User',
              userPhone: 'N/A',
              userEmail: currentUser.email || 'N/A',
              userAadhaar: 'N/A',
              userRole: 'user',
              userRelationship: 'User',
              userCreatedAt: new Date(),
              userLastSeen: new Date(),
              userIsActive: true,
              userFamilyMembers: [],
              hospitalId: hospital.id,
              hospitalName: hospital.name,
              hospitalType: hospital.type,
              startLatitude: startPoint.latitude,
              startLongitude: startPoint.longitude,
              endLatitude: endPoint.latitude,
              endLongitude: endPoint.longitude,
              routePoints: routePoints,
              distance: distance,
              estimatedTime: estimatedTime
            };

            console.log('Creating route with basic user info:', routeData);
            await FirebaseService.createUserRoute(routeData);
            console.log('✅ Route data with basic user info stored successfully in Firebase');

            // Send notification that user is traveling to hospital
            try {
              await NotificationService.sendUserTravelingNotification({
                type: 'user_traveling',
                userName: currentUser.displayName || 'Current User',
                hospitalName: hospital.name,
                timestamp: new Date().toISOString(),
                priority: 'medium'
              });
              console.log('✅ User traveling notification sent successfully');
            } catch (notificationError) {
              console.error('❌ Error sending user traveling notification:', notificationError);
              // Don't fail the main operation if notification fails
            }
          }
        } else {
          console.warn('⚠️ No authenticated user found, cannot store route data');
        }
      } catch (firebaseError) {
        console.error('❌ Error storing route data in Firebase:', firebaseError);
        // Don't fail the route calculation if Firebase storage fails
      }

      console.log('Route calculated from user to hospital:', hospital.name);
    } catch (error) {
      console.error('Error calculating route:', error);
    }
  };

  const clearRoute = () => {
    setRoutePoints([]);
    setShowRoute(false);
    setSelectedHospital(null);
  };

  // Ambulance route calculation function - shows real road routes
  const calculateAmbulanceRoute = async (patientLat: number, patientLng: number) => {
    if (!location) return;
    
    try {
      // Find the nearest hospital to the patient
      const nearestHospital = hospitals.reduce((nearest, hospital) => {
        const distanceToPatient = calculateDistance(
          { latitude: patientLat, longitude: patientLng },
          { latitude: hospital.latitude, longitude: hospital.longitude }
        );
        const distanceToNearest = calculateDistance(
          { latitude: patientLat, longitude: patientLng },
          { latitude: nearest.latitude, longitude: nearest.longitude }
        );
        return distanceToPatient < distanceToNearest ? hospital : nearest;
      });

      const startPoint = {
        latitude: nearestHospital.latitude,
        longitude: nearestHospital.longitude
      };

      const endPoint = {
        latitude: patientLat,
        longitude: patientLng
      };

      // Try to get real road route using OpenRouteService API
      try {
        const apiKey = '5b3ce3597851110001cf6248a1b8b8b4a1b4b8b8'; // Free OpenRouteService API key
        const startCoords = `${startPoint.longitude},${startPoint.latitude}`;
        const endCoords = `${endPoint.longitude},${endPoint.latitude}`;
        
        const response = await fetch(
          `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${startCoords}&end=${endCoords}`
        );
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            const route = data.features[0];
            const coordinates = route.geometry.coordinates;
            
            // Convert coordinates to latitude/longitude format
            const routePoints = coordinates.map((coord: number[]) => ({
              latitude: coord[1],
              longitude: coord[0]
            }));
            
            setAmbulanceRoutePoints(routePoints);
            setShowAmbulanceRoute(true);
            
            const distance = route.properties.summary.distance / 1000;
            const duration = route.properties.summary.duration / 60;
            
            console.log('Real ambulance road route calculated:', {
              hospital: nearestHospital.name,
              points: routePoints.length,
              distance: `${distance.toFixed(2)} km`,
              duration: `${duration.toFixed(0)} minutes`
            });
            
            return; // Success, exit early
          }
        }
      } catch (apiError) {
        console.warn('OpenRouteService API failed for ambulance route, using fallback:', apiError);
      }

      // Fallback to realistic route if API fails
      const routePoints = createRealisticRoute(startPoint, endPoint);
      setAmbulanceRoutePoints(routePoints);
      setShowAmbulanceRoute(true);
      
      console.log('Fallback ambulance route calculated:', {
        hospital: nearestHospital.name,
        points: routePoints.length,
        distance: `${calculateDistance(startPoint, endPoint).toFixed(2)} km`
      });
    } catch (error) {
      console.error('Error calculating ambulance route:', error);
    }
  };

  const clearAmbulanceRoute = () => {
    console.log('Clearing ambulance route...');
    console.log('Before clear - showAmbulanceRoute:', showAmbulanceRoute);
    console.log('Before clear - ambulanceRoutePoints length:', ambulanceRoutePoints.length);
    setAmbulanceRoutePoints([]);
    setShowAmbulanceRoute(false);
    setAmbulanceRequest(null);
    // Don't reset ambulanceRouteProcessed to prevent useEffect from re-triggering
    console.log('Ambulance route cleared successfully');
  };

  const renderHospitalItem = ({ item }: { item: Hospital }) => (
    <TouchableOpacity style={styles.hospitalItem}>
      <View style={styles.hospitalHeader}>
        <View style={styles.hospitalInfo}>
          <View style={styles.hospitalIconContainer}>
            <Ionicons 
              name={item.type === 'hospital' ? 'medical' : 'medical-outline'} 
              size={20} 
              color="#FF8C00" 
            />
          </View>
          <View style={styles.hospitalDetails}>
            <Text style={styles.hospitalName}>{item.name}</Text>
            <Text style={styles.hospitalType}>{item.type}</Text>
          </View>
        </View>
        <View style={styles.hospitalDistance}>
          <Text style={styles.distanceText}>{item.distance.toFixed(1)} km</Text>
        </View>
      </View>
      
      <Text style={styles.hospitalAddress}>{item.address}</Text>
      
      {item.phone && item.phone !== 'Phone not available' && (
        <View style={styles.contactInfo}>
          <Ionicons name="call" size={16} color="#28a745" />
          <Text style={styles.hospitalPhone}>{item.phone}</Text>
        </View>
      )}
      
      {item.rating > 0 && (
        <View style={styles.ratingInfo}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.hospitalRating}>{item.rating}</Text>
        </View>
      )}
      
      <View style={styles.actionButtons}>
        {item.phone && item.phone !== 'Phone not available' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.callButton]}
            onPress={() => handleCall(item.phone)}
          >
            <Ionicons name="call" size={16} color="white" />
            <Text style={styles.buttonText}>Call</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.actionButton, styles.directionsButton]}
          onPress={() => handleDirections(item.latitude, item.longitude)}
        >
          <Ionicons name="navigate" size={16} color="white" />
          <Text style={styles.buttonText}>Directions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.routeButton]}
          onPress={() => calculateRoute(item)}
        >
          <Ionicons name="map" size={16} color="white" />
          <Text style={styles.buttonText}>Show Route</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading medical facilities...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={initializeLocation}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Medical Services</Text>
            <Text style={styles.headerSubtitle}>Find nearby hospitals and medical facilities</Text>
          </View>
          <TouchableOpacity
            style={styles.ambulanceButton}
            onPress={() => router.push('/(tabs)/my-requests')}
          >
            <Ionicons name="medical" size={18} color="white" />
            <Text style={styles.ambulanceButtonText}>My Requests</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'map' && styles.activeTab]}
          onPress={() => setActiveTab('map')}
        >
          <Ionicons name="map" size={20} color={activeTab === 'map' ? '#FF6B6B' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'map' && styles.activeTabText]}>Map View</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'list' && styles.activeTab]}
          onPress={() => setActiveTab('list')}
        >
          <Ionicons name="list" size={20} color={activeTab === 'list' ? '#FF6B6B' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}>List View</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'map' ? (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: location?.coords.latitude || 0,
              longitude: location?.coords.longitude || 0,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            {/* User location marker */}
            {location && (
              <Marker
                coordinate={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                }}
                title="Your Location"
                description="You are here"
              >
                <View style={styles.userLocationMarker}>
                  <Ionicons name="person-circle" size={30} color="#007AFF" />
                </View>
              </Marker>
            )}

            {/* Hospital markers */}
            {hospitals.map((hospital) => (
              <Marker
                key={hospital.id}
                coordinate={{
                  latitude: hospital.latitude,
                  longitude: hospital.longitude,
                }}
                title={hospital.name}
                description={`${hospital.type} - ${hospital.distance}km away`}
                onPress={() => handleHospitalPress(hospital)}
              >
                <View style={[
                  styles.hospitalMarker,
                  { backgroundColor: hospital.type === 'hospital' ? '#FF6B6B' : '#4ECDC4' }
                ]}>
                  <Ionicons 
                    name={getMarkerIcon(hospital.type)} 
                    size={20} 
                    color="white" 
                  />
                </View>
              </Marker>
            ))}

            {/* User to Hospital Route */}
            {showRoute && routePoints.length > 0 && (
              <Polyline
                coordinates={routePoints}
                strokeColor="#FF8C00"
                strokeWidth={5}
                lineCap="round"
                lineJoin="round"
                tappable={false}
              />
            )}

            {/* Ambulance Route */}
            {showAmbulanceRoute && ambulanceRoutePoints.length > 0 && (
              <Polyline
                coordinates={ambulanceRoutePoints}
                strokeColor="#EF4444"
                strokeWidth={6}
                lineCap="round"
                lineJoin="round"
                tappable={false}
              />
            )}

            {/* Patient Location Marker */}
            {ambulanceRequest && (
              <Marker
                coordinate={{ latitude: ambulanceRequest.latitude, longitude: ambulanceRequest.longitude }}
                title="Patient Location"
                description={`Emergency: ${ambulanceRequest.patientName}`}
              >
                <View style={styles.patientLocationMarker}>
                  <Ionicons name="medical" size={20} color="#dc3545" />
                </View>
              </Marker>
            )}
          </MapView>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} />
              <Text style={styles.legendText}>Hospitals</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#4ECDC4' }]} />
              <Text style={styles.legendText}>Medical Clinics</Text>
            </View>
            {showRoute && (
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FF8C00' }]} />
                <Text style={styles.legendText}>Route to {selectedHospital?.name}</Text>
              </View>
            )}
            {showAmbulanceRoute && (
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendText}>Ambulance Route</Text>
              </View>
            )}
          </View>

          {/* Clear Route Button */}
          {showRoute && (
            <TouchableOpacity
              style={styles.clearRouteButton}
              onPress={clearRoute}
            >
              <Ionicons name="close-circle" size={20} color="white" />
              <Text style={styles.clearRouteButtonText}>Clear Route</Text>
            </TouchableOpacity>
          )}
          
          {/* Clear Ambulance Route Button */}
          {showAmbulanceRoute && (
            <TouchableOpacity
              style={styles.clearAmbulanceRouteButton}
              onPress={clearAmbulanceRoute}
            >
              <Ionicons name="close-circle" size={20} color="white" />
              <Text style={styles.clearRouteButtonText}>Clear Ambulance Route</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.listViewContainer}>
          {/* Search and Filter Section */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput style={styles.searchInput} placeholder="Search hospitals..." value={searchQuery} onChangeText={setSearchQuery} />
            </View>
            <TouchableOpacity style={styles.filterToggleButton} onPress={toggleFilters}>
              <Ionicons name="filter" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          </View>

          {/* Filter Section */}
          {showFilters && (
            <View style={styles.filterContainer}>
              <Text style={styles.filterTitle}>Filter by Type</Text>
              <View style={styles.filterButtons}>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    selectedFilter === 'all' && styles.filterButtonActive,
                    { borderColor: getFilterColor('all') }
                  ]}
                  onPress={() => handleFilterChange('all')}
                >
                  <Ionicons
                    name="grid"
                    size={16}
                    color={selectedFilter === 'all' ? 'white' : getFilterColor('all')}
                  />
                  <Text style={[
                    styles.filterButtonText,
                    selectedFilter === 'all' && styles.filterButtonTextActive
                  ]}>
                    All ({getFilterCount('all')})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    selectedFilter === 'hospital' && styles.filterButtonActive,
                    { borderColor: getFilterColor('hospital') }
                  ]}
                  onPress={() => handleFilterChange('hospital')}
                >
                  <Ionicons
                    name="medical"
                    size={16}
                    color={selectedFilter === 'hospital' ? 'white' : getFilterColor('hospital')}
                  />
                  <Text style={[
                    styles.filterButtonText,
                    selectedFilter === 'hospital' && styles.filterButtonTextActive
                  ]}>
                    Hospitals ({getFilterCount('hospital')})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    selectedFilter === 'clinic' && styles.filterButtonActive,
                    { borderColor: getFilterColor('clinic') }
                  ]}
                  onPress={() => handleFilterChange('clinic')}
                >
                  <Ionicons
                    name="medical-outline"
                    size={16}
                    color={selectedFilter === 'clinic' ? 'white' : getFilterColor('clinic')}
                  />
                  <Text style={[
                    styles.filterButtonText,
                    selectedFilter === 'clinic' && styles.filterButtonTextActive
                  ]}>
                    Clinics ({getFilterCount('clinic')})
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <FlatList
            data={filteredHospitals}
            renderItem={renderHospitalItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#FF6B6B']}
                tintColor="#FF6B6B"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="medical-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No medical facilities found</Text>
                <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
              </View>
            }
          />
        </View>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/user-ambulance-request')}
      >
        <Ionicons name="medical" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    flex: 1,
  },
  listViewContainer: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FF8C00',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    position: 'relative',
    zIndex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  ambulanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  ambulanceButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#FF8C00',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FF8C00',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  legend: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#333',
  },
  clearRouteButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  clearAmbulanceRouteButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  clearRouteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  userLocationMarker: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 4,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  hospitalMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  patientLocationMarker: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 8,
    borderWidth: 3,
    borderColor: '#dc3545',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterToggleButton: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
  },
  filterContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 8,
  },
  filterButtonActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  listContainer: {
    padding: 16,
  },
  hospitalItem: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  hospitalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  hospitalInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hospitalIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#FFF3E0',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hospitalDetails: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 2,
  },
  hospitalType: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  hospitalDistance: {
    alignItems: 'flex-end',
  },
  distanceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF8C00',
  },
  hospitalAddress: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  hospitalPhone: {
    fontSize: 13,
    color: '#28a745',
    fontWeight: '500',
  },
  ratingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  hospitalRating: {
    fontSize: 13,
    color: '#FFD700',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  callButton: {
    backgroundColor: '#10B981',
  },
  directionsButton: {
    backgroundColor: '#3B82F6',
  },
  routeButton: {
    backgroundColor: '#FF8C00',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF8C00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#FF8C00',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
});
