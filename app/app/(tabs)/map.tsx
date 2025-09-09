import * as Location from 'expo-location';
import { arrayUnion, collection, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, Alert, Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { auth, db } from '../../lib/firebase';
import NotificationService from '../../lib/notificationService';

// Suppress text component warnings
const originalWarn = console.warn;
console.warn = (message, ...args) => {
  if (typeof message === 'string' && message.includes('Text strings must be rendered within a <Text> component')) {
    return;
  }
  originalWarn(message, ...args);
};

type UserLocation = {
  id: string;
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
  name: string;
  color: string;

  userData?: any; // Full user data
  isOnline?: boolean; // Whether user is currently online
  lastSeen?: string; // Last seen timestamp
  distance?: number; // Distance from current user
  isFamilyMember?: boolean; // Whether this user is a family member
};

type FamilyMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  aadhaar: string;
  imageUrl?: string;
  distance?: number;
  lastSeen?: string;
  defaultLocation?: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
};

type NearbyUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  distance: number;
  lastSeen: string;
  isOnline: boolean;
};

type RouteInfo = {
  coordinates: Array<{ latitude: number; longitude: number }>;
  distance: string;
  duration: string;
  isVisible: boolean;
  isMinimized: boolean;
};

type FamilyNotification = {
  id: string;
  familyMemberId: string;
  familyMemberName: string;
  familyMemberEmail: string;
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
  };
  distance: number;
  message: string;
  isRead: boolean;
};

type DistanceAlert = {
  id: string;
  familyMemberId: string;
  familyMemberName: string;
  familyMemberEmail: string;
  isActive: boolean;
  startTime: Date;
  lastAlertTime: Date;
  distance: number;
  location: {
    latitude: number;
    longitude: number;
  };
};

const { width, height } = Dimensions.get('window');

// Default location (Mumbai, India)
const DEFAULT_LATITUDE = 19.0760;
const DEFAULT_LONGITUDE = 72.8777;

// Colors for different users
const USER_COLORS = [
  '#FF5252', // Red
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#FFC107', // Amber
  '#9C27B0', // Purple
  '#00BCD4', // Cyan
  '#FF9800', // Orange
  '#E91E63', // Pink
];


// Calculate distance between two coordinates in kilometers
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Check if user is online (location updated in last 2 minutes)
const isUserOnline = (timestamp: any): boolean => {
  if (!timestamp) return false;
  
  let lastUpdate: Date;
  if (timestamp.toDate) {
    lastUpdate = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    lastUpdate = timestamp;
  } else {
    lastUpdate = new Date(timestamp);
  }
  
  const now = new Date();
  const diffMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
  return diffMinutes <= 2; // 2 minutes threshold for more accurate online status
};

export default function MapScreen() {
  const [location, setLocation] = useState<UserLocation | null>(null);

  const [allUsers, setAllUsers] = useState<UserLocation[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [isTracking, setIsTracking] = useState(true);

  const [selectedUser, setSelectedUser] = useState<UserLocation | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo>({
    coordinates: [],
    distance: '',
    duration: '',
    isVisible: false,
    isMinimized: false
  });
  const [familyNotifications, setFamilyNotifications] = useState<FamilyNotification[]>([]);
  const [distanceAlerts, setDistanceAlerts] = useState<DistanceAlert[]>([]);
  const [mobileNotification, setMobileNotification] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'alert' | 'success' | 'info';
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const mapRef = useRef<MapView>(null);

  // Setup notifications and fetch family members on component mount
  useEffect(() => {
    let notificationListeners: { notificationListener: any; responseListener: any } | null = null;

    const setupNotifications = async () => {
      try {
        // Register for notifications
        await NotificationService.registerForPushNotifications();
        
        // Setup notification listeners
        notificationListeners = NotificationService.setupNotificationListeners();
        
        console.log('✅ Notifications setup completed');
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };

    const setupInitialData = async () => {
      try {
        // Fetch family members immediately when component mounts
        if (auth.currentUser) {
          console.log('🚀 Initial fetch of family members...');
          await fetchFamilyMembers(auth.currentUser.uid);
        }
      } catch (error) {
        console.error('Error in initial setup:', error);
      }
    };

    setupNotifications();
    setupInitialData();

    // Cleanup on unmount
    return () => {
      if (notificationListeners) {
        NotificationService.removeNotificationListeners(notificationListeners);
      }
    };
  }, [auth.currentUser]);

  // DISABLED: Automatic distance checking - only manual analysis will send notifications
  // This prevents multiple notification systems from running simultaneously
  useEffect(() => {
    if (familyMembers.length > 0 && location && location.coords) {
      const farAwayMembers = familyMembers.filter(member => 
        member.distance !== undefined && member.distance >= 0.5
      );
      
      if (farAwayMembers.length > 0) {
        console.log(`ℹ️ ${farAwayMembers.length} family members are far away - notifications will be sent via manual analysis only`);
      }
    }
  }, [familyMembers, location]);

  // Save or update current user's location in Firestore
  const updateUserLocation = async (locationData: Location.LocationObject) => {
    if (!auth.currentUser) return;

    const userLocation = {
      coords: {
        latitude: locationData.coords.latitude,
        longitude: locationData.coords.longitude,
        altitude: locationData.coords.altitude || null,
        accuracy: locationData.coords.accuracy || null,
        altitudeAccuracy: locationData.coords.altitudeAccuracy || null,
        heading: locationData.coords.heading || null,
        speed: locationData.coords.speed || null,
      },
      timestamp: serverTimestamp(),
      name: 'User ' + auth.currentUser.uid.slice(0, 6),

      updatedAt: serverTimestamp(),
      lastSeen: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid),

        { 
          location: userLocation,
          lastLocation: userLocation, // Also update last known location
          lastSeen: serverTimestamp()
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error updating user location:', error);
    }
  };


  // Fetch user's family members and calculate distances
  const fetchFamilyMembers = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        if (userData.familyMembers && Array.isArray(userData.familyMembers)) {
          const members: FamilyMember[] = [];
          
          for (const email of userData.familyMembers) {
            // Query for family member by email
            const q = query(collection(db, 'users'), where('email', '==', email));
            const querySnap = await getDocs(q);
            
            querySnap.forEach((doc) => {
              const memberData = doc.data();
              
              // Check if family member has current location OR last known location
              const hasCurrentLocation = memberData.location && memberData.location.coords;
              const hasLastLocation = memberData.lastLocation && memberData.lastLocation.coords;
              const hasAnyLocation = hasCurrentLocation || hasLastLocation;
              
              if (hasAnyLocation && location && location.coords) {
                // Use current location if available, otherwise use last known location
                const locationToUse = hasCurrentLocation ? memberData.location : memberData.lastLocation;
                const isCurrentlyOnline = hasCurrentLocation && isUserOnline(memberData.location.timestamp);
                
                // Calculate distance from current location
                const distance = calculateDistance(
                  location.coords.latitude,
                  location.coords.longitude,
                  locationToUse.coords.latitude,
                  locationToUse.coords.longitude
                );
                
                if (distance !== null && distance !== undefined && !isNaN(distance)) {
                  members.push({
                    id: doc.id,
                    name: memberData.name || 'Unknown',
                    email: memberData.email,
                    role: memberData.role || 'user',
                    phone: memberData.phone || 'N/A',
                    aadhaar: memberData.aadhaar || 'N/A',
                    imageUrl: memberData.imageUrl,
                    distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
                    lastSeen: memberData.lastSeen?.toDate?.()?.toLocaleString() || 
                             locationToUse.timestamp?.toDate?.()?.toLocaleString() || 'Unknown'
                  });
                }
              } else {
                // Family member has no location data at all (completely offline)
                if (memberData.name && memberData.email) {
                  // Even if no location, add them to the map with a default location
                  // This ensures all family members are visible
                  const defaultLocation = {
                    latitude: location ? location.coords.latitude + (Math.random() - 0.5) * 0.01 : 19.0760,
                    longitude: location ? location.coords.longitude + (Math.random() - 0.5) * 0.01 : 72.8777,
                    altitude: null,
                    accuracy: 1000,
                    altitudeAccuracy: null,
                    heading: null,
                    speed: null,
                  };
                  
                  members.push({
                    id: doc.id,
                    name: memberData.name || 'Unknown',
                    email: memberData.email,
                    role: memberData.role || 'user',
                    phone: memberData.phone || 'N/A',
                    aadhaar: memberData.aadhaar || 'N/A',
                    imageUrl: memberData.imageUrl,
                    distance: undefined, // No distance for completely offline members
                    lastSeen: memberData.lastSeen?.toDate?.()?.toLocaleString() || 'Never',
                    // Add default location for map display
                    defaultLocation: defaultLocation
                  });
                }
              }
            });
          }
          
          // Sort by distance (closest first), put those without distance at the end
          members.sort((a, b) => {
            if (a.distance === undefined && b.distance === undefined) return 0;
            if (a.distance === undefined) return 1;
            if (b.distance === undefined) return -1;
            return (a.distance || 0) - (b.distance || 0);
          });
          
          setFamilyMembers(members);
          
          // DISABLED: Automatic notification checking - only manual analysis will send notifications
          // This prevents multiple notification systems from running simultaneously
          if (members.length > 0 && location && location.coords) {
            const farAwayMembers = members.filter(member => 
              member.distance !== undefined && member.distance >= 0.5
            );
            
            if (farAwayMembers.length > 0) {
              console.log(`ℹ️ ${farAwayMembers.length} family members are far away - notifications will be sent via manual analysis only`);
            }
          }
          
          // Automatically add all family members to the map (allUsers array)
          // This ensures family members are always visible on the map
          const familyMembersForMap: UserLocation[] = members.map(member => {
            if (member.defaultLocation) {
              // Family member has no real location, use default location
              return {
                id: member.id,
                coords: member.defaultLocation,
                timestamp: Date.now(),
                name: member.name,
                color: '#FF6B35', // Orange for family members
                userData: {
                  email: member.email,
                  role: member.role,
                  phone: member.phone,
                  aadhaar: member.aadhaar,
                  name: member.name,
                  imageUrl: member.imageUrl
                },
                isOnline: false,
                lastSeen: member.lastSeen || 'No Location Data',
                isFamilyMember: true
              };
            } else if (member.distance !== undefined) {
              // Family member has real location data
              // Find their location from the allUsers array or create a marker
              const existingUser = allUsers.find(u => u.id === member.id);
              if (existingUser) {
                return existingUser;
              } else {
                // Create a UserLocation object for the family member
                // This will be handled by the fetchAllUsers function
                return null;
              }
            }
            return null;
          }).filter(Boolean) as UserLocation[];
          
                    // Update allUsers to include family members
          setAllUsers(prevUsers => {
            const nonFamilyUsers = prevUsers.filter(u => !u.isFamilyMember);
            return [...nonFamilyUsers, ...familyMembersForMap];
          });
          
          // Automatically check distances and send notifications for family members who are far away
          if (members.length > 0 && location && location.coords) {
            console.log('🔍 Automatically checking family member distances on load...');
            
            // Check each family member for distance alerts
            for (const member of members) {
              if (member.distance !== undefined && member.distance >= 0.5) {
                console.log(`🚨 ${member.name} is ${member.distance} km away - sending immediate alert`);
                
                // Send mobile notification immediately
                try {
                  await NotificationService.sendFamilyAlertNotification({
                    familyMemberName: member.name,
                    familyMemberId: member.id,
                    distance: member.distance,
                    timestamp: new Date().toLocaleTimeString(),
                    location: {
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude
                    }
                  });
                  console.log(`📱 Sent immediate mobile notification for ${member.name}`);
                } catch (notificationError) {
                  console.error('Error sending immediate notification:', notificationError);
                }
                
                // Create notification for explore tab
                const notification: FamilyNotification = {
                  id: `${member.id}-auto-alert-${Date.now()}`,
                  familyMemberId: member.id,
                  familyMemberName: member.name,
                  familyMemberEmail: member.email,
                  timestamp: new Date(),
                  location: {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude
                  },
                  distance: member.distance,
                  message: `🚨 ALERT: ${member.name} is ${member.distance.toFixed(2)} km away from you!`,
                  isRead: false
                };
                
                // Add to current user's notifications in Firestore
                if (auth.currentUser) {
                  const userRef = doc(db, 'users', auth.currentUser.uid);
                  await updateDoc(userRef, {
                    notifications: arrayUnion(notification)
                  });
                  console.log(`📱 Added notification to explore tab for ${member.name}`);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching family members:', error);
    }
  };

  // Fetch only current user and family members (not all users)
  const fetchAllUsers = async (): Promise<UserLocation[]> => {
    try {
      console.log('Fetching only current user and family members...');
      
      const usersData: UserLocation[] = [];

      // First, get current user's family members
      let currentUserFamilyMembers: string[] = [];
      if (auth.currentUser) {
        try {
          const currentUserDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (currentUserDoc.exists()) {
            const currentUserData = currentUserDoc.data();
            currentUserFamilyMembers = currentUserData.familyMembers || [];
            console.log('Current user family members:', currentUserFamilyMembers);
          }
        } catch (error) {
          console.log('Error getting current user family members:', error);
        }
      }

      // Only fetch current user and family members
      if (auth.currentUser) {
        // Add current user
        try {
          const currentUserDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (currentUserDoc.exists()) {
            const currentUserData = currentUserDoc.data();
            
            if (currentUserData.location && currentUserData.location.coords) {
              usersData.push({
                id: auth.currentUser.uid,
                coords: currentUserData.location.coords,
                timestamp: currentUserData.location.timestamp?.toDate?.()?.getTime() || Date.now(),
                name: 'You',
                color: '#0000FF', // Blue for current user
                userData: currentUserData,
                isOnline: true,
                lastSeen: 'Now',
                isFamilyMember: false
              });
            }
          }
        } catch (error) {
          console.log('Error getting current user data:', error);
        }

        // Add family members
        for (const email of currentUserFamilyMembers) {
          try {
            const q = query(collection(db, 'users'), where('email', '==', email));
            const querySnap = await getDocs(q);
            
            querySnap.forEach((doc) => {
              const userData = doc.data();
              
              // Check if user has any location data
              const hasCurrentLocation = userData.location && userData.location.coords;
              const hasLastLocation = userData.lastLocation && userData.lastLocation.coords;
              const hasAnyLocation = hasCurrentLocation || hasLastLocation;
              
              if (userData.email && hasAnyLocation) {
                // Determine which location to use
                let coords: any;
                let timestamp: any;
                let isOnline: boolean = false;
                
                if (hasCurrentLocation) {
                  coords = userData.location.coords;
                  timestamp = userData.location.timestamp;
                  isOnline = isUserOnline(timestamp);
                } else if (hasLastLocation) {
                  coords = userData.lastLocation.coords;
                  timestamp = userData.lastLocation.timestamp;
                  isOnline = false;
                }
                
                usersData.push({
                  id: doc.id,
                  coords: coords,
                  timestamp: timestamp?.toDate?.()?.getTime() || Date.now(),
                  name: userData.name || userData.email.split('@')[0] || 'Family Member',
                  color: '#FF6B35', // Orange for family members
                  userData: userData,
                  isOnline: isOnline,
                  lastSeen: userData.lastSeen?.toDate?.()?.toLocaleString() || 
                           timestamp?.toDate?.()?.toLocaleString() || 'Unknown',
                  isFamilyMember: true
                });
              } else if (userData.email) {
                // Family member without location data - add with default location
                console.log('Adding family member without location data:', userData.email, userData.name);
                
                const defaultCoords = {
                  latitude: location ? location.coords.latitude + (Math.random() - 0.5) * 0.01 : 19.0760,
                  longitude: location ? location.coords.longitude + (Math.random() - 0.5) * 0.01 : 72.8777,
                  altitude: null,
                  accuracy: 1000,
                  altitudeAccuracy: null,
                  heading: null,
                  speed: null,
                };
                
                usersData.push({
                  id: doc.id,
                  coords: defaultCoords,
                  timestamp: Date.now(),
                  name: userData.name || userData.email.split('@')[0] || 'Family Member',
                  color: '#FF6B35', // Orange for family members
                  userData: userData,
                  isOnline: false,
                  lastSeen: 'No Location Data',
                  isFamilyMember: true
                });
              }
            });
          } catch (error) {
            console.log('Error getting family member data:', error);
          }
        }
      }
      
      const onlineCount = usersData.filter(u => u.isOnline).length;
      const offlineCount = usersData.filter(u => !u.isOnline).length;
      const familyCount = usersData.filter(u => u.isFamilyMember).length;
      
      console.log('=== User Count Summary ===');
      console.log('Total users with location data:', usersData.length);
      console.log('🟢 Online users (live location):', onlineCount);
      console.log('🔴 Offline users (last known):', offlineCount);
      console.log('👨‍👩‍👧‍👦 Family members:', familyCount);
      console.log('========================');
     
      setAllUsers(usersData);
      
      // Calculate nearby users for the selected user
      if (selectedUser && location) {
        calculateNearbyUsers(selectedUser, usersData);
      }
      
      return usersData;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  };

  // Calculate route from current user to a specific location and send tracking notification
  const calculateRoute = async (destinationLat: number, destinationLng: number, destinationUser?: UserLocation) => {
    if (!location) return;
    
    try {
      const origin = `${location.coords.latitude},${location.coords.longitude}`;
      const destination = `${destinationLat},${destinationLng}`;
      
      // Using Google Maps Directions API with optimized settings
      const apiKey = 'AIzaSyBIOC5weP0UHUucbi4EwAMAk-ollFzJ5nA';
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${apiKey}&optimize=true&avoid=highways&mode=driving`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];
        
        // Decode polyline to get coordinates
        const points = decodePolyline(route.overview_polyline.points);
        
        console.log('🗺️ Route calculated successfully!');
        console.log('📍 Start:', origin);
        console.log('🎯 End:', destination);
        console.log('📏 Distance:', leg.distance.text);
        console.log('⏱️ Duration:', leg.duration.text);
        console.log('🛣️ Route points:', points.length);
        
        setRouteInfo({
          coordinates: points,
          distance: leg.distance.text,
          duration: leg.duration.text,
          isVisible: true,
          isMinimized: false
        });
        
        // Send tracking notification if destination user is provided
        if (destinationUser && auth.currentUser) {
          try {
            // Get current user's data from Firestore
            const currentUserDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
            const currentUserName = currentUserDoc.exists() ? currentUserDoc.data()?.name || 'Unknown User' : 'Unknown User';
            
                          // Send mobile notification about tracking
              await NotificationService.sendFamilyAlertNotification({
                familyMemberName: `${currentUserName} is tracking to ${destinationUser.name}`,
                familyMemberId: destinationUser.id,
                distance: 0, // Not distance-based, it's a tracking notification
                timestamp: new Date().toLocaleTimeString(),
                location: {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude
                }
              });
            
            // Create tracking notification for explore tab
            const trackingNotification: FamilyNotification = {
              id: `tracking-${destinationUser.id}-${Date.now()}`,
              familyMemberId: destinationUser.id,
              familyMemberName: destinationUser.name,
              familyMemberEmail: destinationUser.userData?.email || 'Unknown',
              timestamp: new Date(),
              location: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
              },
              distance: 0,
              message: `🗺️ He is tracking to you - ${destinationUser.name}`,
              isRead: false
            };
            
            // Add to current user's notifications in Firestore
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, {
              notifications: arrayUnion(trackingNotification)
            });
            
            console.log(`📱 Sent tracking notification: ${currentUserName} is tracking to ${destinationUser.name}`);
          } catch (notificationError) {
            console.error('Error sending tracking notification:', notificationError);
          }
        }
        
        // Enhanced map animation to show the complete route
        if (mapRef.current && points.length > 0) {
          // Calculate bounds to include the entire route
          const lats = points.map(p => p.latitude);
          const lngs = points.map(p => p.longitude);
          const minLat = Math.min(...lats, location.coords.latitude);
          const maxLat = Math.max(...lats, location.coords.latitude);
          const minLng = Math.min(...lngs, location.coords.longitude);
          const maxLng = Math.max(...lngs, location.coords.longitude);
          
          const bounds = {
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2,
            latitudeDelta: (maxLat - minLat) * 1.3,
            longitudeDelta: (maxLng - minLng) * 1.3,
          };
          
          // Smooth animation to show the route
          mapRef.current.animateToRegion(bounds, 1500);
          
          // Show success message
          Alert.alert(
            '🗺️ Route Found!',
            `Shortest route: ${leg.distance.text} in ${leg.duration.text}\n\nFollow the highlighted orange path on the map!`,
            [{ text: 'OK', style: 'default' }]
          );
        }
      } else {
        Alert.alert('No Route Found', 'Could not find a route to the destination. Please try again.');
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      Alert.alert('Error', 'Could not calculate route. Please check your internet connection and try again.');
    }
  };

  // Decode Google Maps polyline
  const decodePolyline = (encoded: string): Array<{ latitude: number; longitude: number }> => {
    const poly = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      poly.push({
        latitude: lat / 1E5,
        longitude: lng / 1E5
      });
    }
    return poly;
  };

  // Get turn-by-turn directions from Google Maps API response
  const getTurnByTurnDirections = (leg: any): string[] => {
    const directions: string[] = [];
    if (leg.steps) {
      leg.steps.forEach((step: any, index: number) => {
        if (index === 0) {
          directions.push(`🚗 Start from your location`);
        }
        directions.push(`${step.maneuver?.instruction || step.html_instructions?.replace(/<[^>]*>/g, '') || `Step ${index + 1}`}`);
        if (index === leg.steps.length - 1) {
          directions.push(`🎯 Arrive at destination`);
        }
      });
    }
    return directions;
  };

  // Calculate nearby users for a specific user
  const calculateNearbyUsers = (targetUser: UserLocation, allUsers: UserLocation[]) => {
    if (!targetUser.coords) return;

    const nearby: NearbyUser[] = [];
    
    allUsers.forEach(user => {
      if (user.id !== targetUser.id && user.coords) {
        const distance = calculateDistance(
          targetUser.coords.latitude,
          targetUser.coords.longitude,
          user.coords.latitude,
          user.coords.longitude
        );
        
        nearby.push({
          id: user.id,
          name: user.name,
          email: user.userData?.email || 'Unknown',
          role: user.userData?.role || 'user',
          distance: Math.round(distance * 100) / 100,
          lastSeen: user.lastSeen || 'Unknown',
          isOnline: user.isOnline || false
        });
      }
    });

    // Sort by distance (closest first) and limit to top 10
    nearby.sort((a, b) => a.distance - b.distance);
    setNearbyUsers(nearby.slice(0, 10));
  };

  // Subscribe to real-time location updates
  useEffect(() => {
    if (!auth.currentUser) return;

    const usersRef = collection(db, 'users');
    
    // Listen to all users for location updates (both current and last known)
    const unsubscribe = onSnapshot(usersRef, async (snapshot) => {
      // Update real-time locations for online users
      const updatedUsers = [...allUsers];
      
      for (const change of snapshot.docChanges()) {
        if (change.doc.id === auth.currentUser?.uid) continue;
        
        const userData = change.doc.data();
        const hasCurrentLocation = userData.location && userData.location.coords;
        const hasLastLocation = userData.lastLocation && userData.lastLocation.coords;
        
        if (hasCurrentLocation || hasLastLocation) {
          const existingUserIndex = updatedUsers.findIndex(u => u.id === change.doc.id);
          
          if (existingUserIndex >= 0) {
            // Update existing user
            if (hasCurrentLocation) {
              // User has current location - check if they are online
              const isCurrentlyOnline = isUserOnline(userData.location.timestamp);
              updatedUsers[existingUserIndex] = {
                ...updatedUsers[existingUserIndex],
                coords: userData.location.coords,
                timestamp: userData.location.timestamp?.toDate().getTime() || Date.now(),
                isOnline: isCurrentlyOnline,
                lastSeen: isCurrentlyOnline ? 'Now' : userData.location.timestamp?.toDate().toLocaleString() || 'Unknown'
              };
            } else if (hasLastLocation) {
              // User is offline with last known location
              updatedUsers[existingUserIndex] = {
                ...updatedUsers[existingUserIndex],
                coords: userData.lastLocation.coords,
                timestamp: userData.lastLocation.timestamp?.toDate().getTime() || Date.now(),
                isOnline: false,
                lastSeen: userData.lastLocation.timestamp?.toDate().toLocaleString() || 'Unknown'
              };
            }
          }
        }
      }
      
      setAllUsers(updatedUsers);
      
      // Recalculate nearby users if modal is open
      if (selectedUser) {
        calculateNearbyUsers(selectedUser, updatedUsers);
      }
    });

    return () => unsubscribe();

  }, [auth.currentUser?.uid, allUsers, selectedUser]);

  // Initial fetch of all users
  useEffect(() => {
    if (auth.currentUser) {
      fetchAllUsers();
      
      // No automatic distance monitoring - only manual analysis when clicking "You"
      
      // Set up periodic refresh of family members (every 2 minutes)
      const familyRefreshInterval = setInterval(() => {
        if (auth.currentUser) {
          fetchFamilyMembers(auth.currentUser.uid);
        }
      }, 2 * 60 * 1000); // 2 minutes
      
      return () => {
        clearInterval(familyRefreshInterval);
      };
    }
  }, [auth.currentUser, location, familyMembers]);

  // Periodically check online status (every 30 seconds)
  useEffect(() => {
    if (!allUsers.length) return;
    
    const interval = setInterval(() => {
      const updatedUsers = allUsers.map(user => {
        if (user.timestamp) {
          const isCurrentlyOnline = isUserOnline(user.timestamp);
          return {
            ...user,
            isOnline: isCurrentlyOnline,
            lastSeen: isCurrentlyOnline ? 'Now' : new Date(user.timestamp).toLocaleString()
          };
        }
        return user;
      });
      
      setAllUsers(updatedUsers);
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [allUsers.length]);

  // Get user's current location with error handling
  const getLocation = async (): Promise<UserLocation> => {
    try {
      // Request foreground location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access location was denied');
      }

      // Check if location services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        throw new Error('Location services are not enabled');
      }

      // Get current position with high accuracy
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      console.log('Got location:', position);

      const userLocation = {
        id: auth.currentUser?.uid || 'unknown',
        coords: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude || null,
          accuracy: position.coords.accuracy || null,
          altitudeAccuracy: position.coords.altitudeAccuracy || null,
          heading: position.coords.heading || null,
          speed: position.coords.speed || null,
        },
        timestamp: position.timestamp,
        name: 'You',

        color: '#0000FF', // Blue for current user
        isOnline: true,
        lastSeen: 'Now'
      };

      // Save user location to Firestore
      if (auth.currentUser) {
        await updateUserLocation(position);

          // Fetch family members after updating location
          await fetchFamilyMembers(auth.currentUser.uid);
          // Also fetch all users to ensure family members are on the map
          await fetchAllUsers();
          
          // Check for existing distance alerts after location and family members are loaded
          if (familyMembers && familyMembers.length > 0) {
            await checkExistingDistanceAlerts();
          }
      }

      return userLocation;
    } catch (error) {
      console.error('Error getting location:', error);
      throw error;
    }
  };

  useEffect(() => {
    let isMounted = true;
    let subscription: Location.LocationSubscription | null = null;

    const startWatching = async () => {
      try {
        const currentLocation = await getLocation();
        if (!isMounted) return;

        setLocation(currentLocation);
        setMapReady(true);

        // Set up location updates
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,

            timeInterval: 20000,
            distanceInterval: 10,
          },
          (newLocation) => {
            if (!isMounted) return;
            setLocation(prev => {
              // Only update if location has changed significantly
              if (!prev ||
                Math.abs(prev.coords.latitude - newLocation.coords.latitude) > 0.0001 ||
                Math.abs(prev.coords.longitude - newLocation.coords.longitude) > 0.0001) {
                return {
                  ...prev!,
                  coords: {
                    ...newLocation.coords,
                    altitude: newLocation.coords.altitude || null,
                    accuracy: newLocation.coords.accuracy || null,
                    altitudeAccuracy: newLocation.coords.altitudeAccuracy || null,
                    heading: newLocation.coords.heading || null,
                    speed: newLocation.coords.speed || null,
                  },
                  timestamp: newLocation.timestamp
                };
              }
              return prev;
            });
          }
        );
      } catch (error) {
        console.error('Error initializing location:', error);
        setErrorMsg(error instanceof Error ? error.message : 'Failed to get location');

        // Fallback to default location
        if (isMounted) {
          setLocation({
            id: 'default-location',
            coords: {
              latitude: DEFAULT_LATITUDE,
              longitude: DEFAULT_LONGITUDE,
              altitude: null,
              accuracy: 1000,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: Date.now(),
            name: 'Default Location',

            color: '#808080',
            isOnline: false,
            lastSeen: 'Unknown'
          });
          setMapReady(true);
        }
      }
    };

    startWatching();

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);


  // Handle marker press
  const handleMarkerPress = async (user: UserLocation) => {
    setSelectedUser(user);
    setShowUserModal(true);
    
    // Calculate nearby users for this user
    // Ensure allUsers is populated before calculating
    if (allUsers.length > 0) {
      calculateNearbyUsers(user, allUsers);
    } else {
      // If allUsers is empty, fetch users first then calculate
      fetchAllUsers().then((usersData) => {
        // Use the returned data directly instead of relying on state update
        calculateNearbyUsers(user, usersData);
      });
    }
    
    // If this is the current user, analyze family members and send notifications
    if (user.name === 'You' && auth.currentUser) {
      fetchFamilyMembers(auth.currentUser.uid);
      
      // Check if we already have notifications in Firestore to prevent duplicates
      if (auth.currentUser) {
        try {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const hasExistingNotifications = userData.notifications && userData.notifications.length > 0;
            
            if (!hasExistingNotifications) {
              console.log('🔍 No existing notifications found - running manual analysis...');
              setTimeout(() => {
                analyzeFamilyMembersAndSendNotifications();
              }, 1000); // Small delay to ensure family members are loaded
            } else {
              console.log('ℹ️ Existing notifications already exist - skipping manual analysis to prevent duplicates');
            }
          }
        } catch (error) {
          console.log('Error checking existing notifications:', error);
        }
      }
    }
    
    // If this is a family member, show route option
    if (user.isFamilyMember && location) {
      // Don't automatically show route, let user choose from popup
      console.log('Family member marker pressed:', user.name);
    }
  };

  // Clear route
  const clearRoute = () => {
    setRouteInfo({
      coordinates: [],
      distance: '',
      duration: '',
      isVisible: false,
      isMinimized: false
    });
  };

  // Minimize route info
  const minimizeRoute = () => {
    setRouteInfo(prev => ({
      ...prev,
      isMinimized: true
    }));
  };

  // Restore route info
  const restoreRoute = () => {
    setRouteInfo(prev => ({
      ...prev,
      isMinimized: false
    }));
  };

  // Check family member distance and create notifications (DEPRECATED - use manageDistanceAlerts instead)
  const checkFamilyMemberDistance = async (familyMember: FamilyMember, currentLocation: UserLocation) => {
    // This function is deprecated and should not be used
    // Use manageDistanceAlerts instead for proper distance monitoring
    console.log('checkFamilyMemberDistance is deprecated - use manageDistanceAlerts instead');
    return;
  };

  // Manage distance alerts for family members (only on state changes)
  const manageDistanceAlerts = async (familyMember: FamilyMember, currentLocation: UserLocation) => {
    if (!familyMember.distance) return;
    
    const isFarAway = familyMember.distance >= 0.5; // 500 meters or more
    const existingAlert = distanceAlerts.find(alert => alert.familyMemberId === familyMember.id);
    
    try {
      if (isFarAway) {
        // Family member is far away - only start alert if not already active
        if (!existingAlert) {
          // Start new alert (ONLY ONCE when they first go far away)
          const newAlert: DistanceAlert = {
            id: `${familyMember.id}-alert`,
            familyMemberId: familyMember.id,
            familyMemberName: familyMember.name,
            familyMemberEmail: familyMember.email,
            isActive: true,
            startTime: new Date(),
            lastAlertTime: new Date(),
            distance: familyMember.distance,
            location: {
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude
            }
          };
          
          setDistanceAlerts(prev => [...prev, newAlert]);
          
          // Send initial alert (ONLY ONCE)
          await sendDistanceAlert(familyMember, currentLocation);
          
        } else if (existingAlert.isActive) {
          // Just update the distance, but DON'T send repeated alerts
          const updatedAlert = {
            ...existingAlert,
            distance: familyMember.distance
          };
          
          setDistanceAlerts(prev => 
            prev.map(alert => 
              alert.id === existingAlert.id ? updatedAlert : alert
            )
          );
          
          // NO REPEATED ALERTS - just update the distance silently
        }
      } else {
        // Family member is within range - stop alert if active
        if (existingAlert && existingAlert.isActive) {
          // Stop the alert
          setDistanceAlerts(prev => {
            const updatedAlerts = prev.map(alert => 
              alert.id === existingAlert.id 
                ? { ...alert, isActive: false }
                : alert
            );
            
            // Check if all alerts are now inactive
            const hasActiveAlerts = updatedAlerts.some(alert => alert.isActive);
            // No need to stop countdown timer since we removed it
            
            return updatedAlerts;
          });
          
          // Send "back in range" notification (ONLY ONCE when they come back)
          await sendBackInRangeNotification(familyMember, currentLocation);
        }
      }
    } catch (error) {
      console.error('Error managing distance alerts:', error);
    }
  };

  // Send distance alert notification
  const sendDistanceAlert = async (familyMember: FamilyMember, currentLocation: UserLocation) => {
    if (!familyMember.distance) return; // Skip if no distance data
    
    try {
      const currentTime = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
      });
      const alertMessage = `🚨 ${familyMember.name} is ${familyMember.distance.toFixed(2)} km away from you at ${currentTime}!`;
      
      // Create notification for current user
      const notification: FamilyNotification = {
        id: `${familyMember.id}-distance-alert-${Date.now()}`,
        familyMemberId: familyMember.id,
        familyMemberName: familyMember.name,
        familyMemberEmail: familyMember.email,
        timestamp: new Date(),
        location: {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude
        },
        distance: familyMember.distance,
        message: alertMessage,
        isRead: false
      };

      // Add to current user's notifications
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          notifications: arrayUnion(notification)
        });
      }

      // Add to family member's notifications
      const familyMemberQuery = query(collection(db, 'users'), where('email', '==', familyMember.email));
      const familyMemberSnapshot = await getDocs(familyMemberQuery);
      if (!familyMemberSnapshot.empty) {
        const familyMemberDoc = familyMemberSnapshot.docs[0];
        const familyMemberNotification: FamilyNotification = {
          ...notification,
          id: `${auth.currentUser?.uid}-distance-alert-${Date.now()}`,
          familyMemberId: auth.currentUser?.uid || '',
          familyMemberName: 'You',
          familyMemberEmail: auth.currentUser?.email || '',
          message: `🚨 You are ${familyMember.distance.toFixed(2)} km away from ${familyMember.name} at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`,
        };
        
        await updateDoc(doc(db, 'users', familyMemberDoc.id), {
          notifications: arrayUnion(familyMemberNotification)
        });
      }

      // Update local state
      setFamilyNotifications(prev => [notification, ...prev]);
      
      // Send Expo mobile notification
      try {
        await NotificationService.sendFamilyAlertNotification({
          familyMemberName: familyMember.name,
          familyMemberId: familyMember.id,
          distance: familyMember.distance,
          timestamp: currentTime,
          location: {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude
          }
        });
        console.log(`📱 Sent mobile push notification for ${familyMember.name} (${familyMember.distance.toFixed(2)} km away)`);
      } catch (notificationError) {
        console.error('Error sending mobile notification:', notificationError);
      }

      // Show in-app mobile notification banner
      showMobileNotification(
        '🚨 Family Member Distance Alert',
        alertMessage,
        'alert'
      );

    } catch (error) {
      console.error('Error sending distance alert:', error);
    }
  };

  // Send "back in range" notification
  const sendBackInRangeNotification = async (familyMember: FamilyMember, currentLocation: UserLocation) => {
    if (!familyMember.distance) return; // Skip if no distance data
    
    try {
      const currentTime = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
      });
      const backInRangeMessage = `✅ ${familyMember.name} is back within range at ${currentTime}!`;
      
      // Create notification for current user
      const notification: FamilyNotification = {
        id: `${familyMember.id}-back-in-range-${Date.now()}`,
        familyMemberId: familyMember.id,
        familyMemberName: familyMember.name,
        familyMemberEmail: familyMember.email,
        timestamp: new Date(),
        location: {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude
        },
        distance: familyMember.distance,
        message: backInRangeMessage,
        isRead: false
      };

      // Add to current user's notifications
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          notifications: arrayUnion(notification)
        });
      }

      // Add to family member's notifications
      const familyMemberQuery = query(collection(db, 'users'), where('email', '==', familyMember.email));
      const familyMemberSnapshot = await getDocs(familyMemberQuery);
      if (!familyMemberSnapshot.empty) {
        const familyMemberDoc = familyMemberSnapshot.docs[0];
        const familyMemberNotification: FamilyNotification = {
          ...notification,
          id: `${auth.currentUser?.uid}-back-in-range-${Date.now()}`,
          familyMemberId: auth.currentUser?.uid || '',
          familyMemberName: 'You',
          familyMemberEmail: auth.currentUser?.email || '',
          message: `✅ You are back within range of ${familyMember.name} at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`,
        };
        
        await updateDoc(doc(db, 'users', familyMemberDoc.id), {
          notifications: arrayUnion(familyMemberNotification)
        });
      }

      // Update local state
      setFamilyNotifications(prev => [notification, ...prev]);
      
      // Send Expo mobile notification for family member coming back
      try {
        await NotificationService.sendFamilyNearbyNotification(familyMember.name);
        console.log(`📱 Sent mobile notification: ${familyMember.name} is back within range`);
      } catch (notificationError) {
        console.error('Error sending nearby notification:', notificationError);
      }

      // Show in-app mobile notification banner
      showMobileNotification(
        '✅ Family Member Back in Range',
        backInRangeMessage,
        'success'
      );

    } catch (error) {
      console.error('Error sending back in range notification:', error);
    }
  };

  // Check for existing distance alerts when app starts (ONCE ONLY)
  const checkExistingDistanceAlerts = async () => {
    if (!location || !familyMembers || familyMembers.length === 0) return;
    
    // Use a flag to ensure this only runs once per session
    const hasCheckedAlerts = await AsyncStorage.getItem('hasCheckedInitialAlerts');
    if (hasCheckedAlerts === 'true') return;
    
    try {
      const currentTime = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
      });
      
      // Check each family member for existing distance alerts
      for (const member of familyMembers) {
        if (member && member.distance && member.distance >= 0.5) {
          // Family member is already far away - create immediate alert (ONCE ONLY)
          const newAlert: DistanceAlert = {
            id: `${member.id}-alert`,
            familyMemberId: member.id,
            familyMemberName: member.name,
            familyMemberEmail: member.email,
            isActive: true,
            startTime: new Date(),
            lastAlertTime: new Date(),
            distance: member.distance,
            location: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            }
          };
          
          setDistanceAlerts(prev => [...prev, newAlert]);
          
          // Send mobile notification for existing distance (ONCE ONLY)
          const alertMessage = `🚨 ${member.name} is already ${member.distance.toFixed(2)} km away from you at ${currentTime}!`;
          
          // Send Expo mobile notification for existing far away family member
          try {
            await NotificationService.sendFamilyAlertNotification({
              familyMemberName: member.name,
              familyMemberId: member.id,
              distance: member.distance,
              timestamp: currentTime,
              location: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
              }
            });
            console.log(`📱 Sent mobile notification for existing alert: ${member.name} (${member.distance.toFixed(2)} km away)`);
          } catch (notificationError) {
            console.error('Error sending existing alert notification:', notificationError);
          }
          
          showMobileNotification(
            '🚨 Family Member Already Far Away',
            alertMessage,
            'alert'
          );
          

        }
      }
      
      // Mark that we've checked initial alerts for this session
      await AsyncStorage.setItem('hasCheckedInitialAlerts', 'true');
    } catch (error) {
      console.error('Error checking existing distance alerts:', error);
    }
  };



  // Show mobile notification (simulates push notification)
  const showMobileNotification = (title: string, message: string, type: 'alert' | 'success' | 'info') => {
    setMobileNotification({
      visible: true,
      title,
      message,
      type
    });

    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setMobileNotification(null);
    }, 5000);
  };

  // Clear initial alert flag when user logs out (call this from logout function)
  const clearInitialAlertFlag = async () => {
    try {
      await AsyncStorage.removeItem('hasCheckedInitialAlerts');
    } catch (error) {
      console.error('Error clearing initial alert flag:', error);
    }
  };

  // Analyze family members and send notifications to explore tab (triggered by clicking "You")
  const analyzeFamilyMembersAndSendNotifications = async () => {
    // Prevent multiple simultaneous analyses
    if (isAnalyzing) {
      console.log('Analysis already in progress, skipping...');
      return;
    }

    if (!location || !familyMembers || familyMembers.length === 0) {
      console.log('No family members to analyze');
      return;
    }

    setIsAnalyzing(true);

    try {
      console.log('🔍 Analyzing family members...');
      console.log('📊 Total family members to analyze:', familyMembers.length);
      
      const currentTime = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
      });

      let farAwayCount = 0;
      let nearbyCount = 0;
      let offlineCount = 0;

      // Find all family members who are far away for consolidated notification
      const farAwayMembers = familyMembers.filter(member => 
        member && member.distance !== undefined && member.distance !== null && member.distance >= 0.5
      );
      
      if (farAwayMembers.length > 0) {
        farAwayCount = farAwayMembers.length;
        console.log(`🚨 ${farAwayMembers.length} family members are far away - sending ONE consolidated alert`);
        
        // Send ONE consolidated mobile notification for ALL far-away family members
        try {
          const memberNames = farAwayMembers.map(m => m.name).join(', ');
          const maxDistance = Math.max(...farAwayMembers.map(m => m.distance || 0));
          
          await NotificationService.sendFamilyAlertNotification({
            familyMemberName: memberNames,
            familyMemberId: 'consolidated',
            distance: maxDistance,
            timestamp: currentTime,
            location: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            }
          });
          console.log(`📱 Sent ONE consolidated mobile notification for ${farAwayMembers.length} family members`);
        } catch (notificationError) {
          console.error('Error sending consolidated mobile notification:', notificationError);
        }
        
        // Create ONE consolidated notification for explore tab
        const notification: FamilyNotification = {
          id: `consolidated-manual-${Date.now()}`,
          familyMemberId: 'consolidated',
          familyMemberName: farAwayMembers.map(m => m.name).join(', '),
          familyMemberEmail: 'consolidated',
          timestamp: new Date(),
          location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          },
          distance: Math.max(...farAwayMembers.map(m => m.distance || 0)),
          message: `🚨 ALERT: ${farAwayMembers.length} family members are far away at ${currentTime}! Check the map for details.`,
          isRead: false
        };
        
        // Add to current user's notifications in Firestore
        if (auth.currentUser) {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          await updateDoc(userRef, {
            notifications: arrayUnion(notification)
          });
          console.log(`📱 Added ONE consolidated notification to explore tab`);
        }
      }
      
      // Count nearby and offline members for summary
      for (const member of familyMembers) {
        if (member) {
          if (member.distance !== undefined && member.distance !== null) {
            if (member.distance < 0.5) {
              nearbyCount++;
              console.log(`✅ ${member.name} is nearby (${member.distance} km) - NO ALERT NEEDED`);
            }
          } else {
            offlineCount++;
            console.log(`📱 ${member.name} is offline (no location data) - NO ALERT NEEDED`);
          }
        }
      }

      // Show success message with summary
      const summaryMessage = `Analyzed ${familyMembers.length} family members:\n\n🚨 ${farAwayCount} far away (>500m) - ALERTS SENT\n✅ ${nearbyCount} nearby (<500m) - No alerts\n📱 ${offlineCount} offline - No alerts\n\nCheck the Explore tab for ALERT notifications!`;

      Alert.alert(
        '🔍 Family Analysis Complete',
        summaryMessage,
        [{ text: 'OK', style: 'default' }]
      );

    } catch (error) {
      console.error('Error analyzing family members:', error);
      Alert.alert(
        'Error',
        'Failed to analyze family members. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsAnalyzing(false);
    }
  };



  // Calculate region for the map
  const region: Region = location ? {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01 * (width / height),
  } : {
    latitude: DEFAULT_LATITUDE,
    longitude: DEFAULT_LONGITUDE,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01 * (width / height),
  };

  // Get accurate user counts
  const getAccurateUserCounts = () => {
    const totalWithLocation = 1 + (allUsers ? allUsers.length : 0); // Including current user
    const onlineWithLiveLocation = allUsers ? allUsers.filter(user => user.isOnline).length : 0;
    const offlineWithLastLocation = allUsers ? allUsers.filter(user => !user.isOnline).length : 0;
    const familyMembersOnMap = allUsers ? allUsers.filter(user => user.isFamilyMember).length : 0;
    
    return {
      total: totalWithLocation || 0,
      online: onlineWithLiveLocation || 0,
      offline: offlineWithLastLocation || 0,
      familyOnMap: familyMembersOnMap || 0
    };
  };

  const userCounts = getAccurateUserCounts();

  if (!mapReady) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading map...</Text>
        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Mobile Notification Banner */}
      {mobileNotification && (
        <View style={[
          styles.mobileNotificationContainer,
          mobileNotification.type === 'alert' ? styles.mobileNotificationAlert :
          mobileNotification.type === 'success' ? styles.mobileNotificationSuccess :
          styles.mobileNotificationInfo
        ]}>
          <View style={styles.mobileNotificationContent}>
            <Text style={styles.mobileNotificationTitle}>
              {mobileNotification.title}
            </Text>
            <Text style={styles.mobileNotificationMessage}>
              {mobileNotification.message}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.mobileNotificationClose}
            onPress={() => setMobileNotification(null)}
          >
            <Text style={styles.mobileNotificationCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.userCountContainer}>
        <Text style={styles.userCountText}>
          👥 {userCounts.total} {userCounts.total === 1 ? 'person' : 'people'} total
        </Text>
        <Text style={styles.onlineUsersText}>
          🟢 {userCounts.online} online | 🔴 {userCounts.offline} offline
        </Text>
        <Text style={styles.locationStatusText}>
           📍 {allUsers ? allUsers.filter(u => u.isOnline).length : 0} with live location | 📍 {allUsers ? allUsers.filter(u => !u.isOnline).length : 0} with last known location
         </Text>
         {familyMembers && familyMembers.length > 0 && (
           <Text style={styles.familyCountText}>
             👨‍👩‍👧‍👦 {familyMembers.length} family members nearby
           </Text>
         )}
         {allUsers && allUsers.filter(u => u.isFamilyMember).length > 0 && (
           <Text style={styles.familyMapText}>
             🗺️ {allUsers.filter(u => u.isFamilyMember).length} family members on map
           </Text>
         )}
         <Text style={styles.autoFamilyText}>
           👨‍👩‍👧‍👦 Family members automatically displayed
         </Text>
         <Text style={styles.manualAnalysisText}>
           💡 Click on "You" marker to analyze family members and send ALERTS to Explore tab for those {'>'}500m away
         </Text>
         
         {/* Route Information - Enhanced */}
          {routeInfo.isVisible && !routeInfo.isMinimized && (
            <View style={styles.routeInfoContainer}>
              <View style={styles.routeHeader}>
                <Text style={styles.routeInfoTitle}>🗺️ Shortest Route</Text>
                <View style={styles.routeHeaderButtons}>
                  <TouchableOpacity style={styles.minimizeButton} onPress={minimizeRoute}>
                    <Text style={styles.minimizeButtonText}>−</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.clearRouteButton} onPress={clearRoute}>
                    <Text style={styles.clearRouteButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.routeDetails}>
                <View style={styles.routeDetailItem}>
                  <Text style={styles.routeDetailLabel}>📍 Start:</Text>
                  <Text style={styles.routeDetailValue}>Your Location</Text>
                </View>
                <View style={styles.routeDetailItem}>
                  <Text style={styles.routeDetailLabel}>🎯 End:</Text>
                  <Text style={styles.routeDetailValue}>Destination</Text>
                </View>
                <View style={styles.routeDetailItem}>
                  <Text style={styles.routeDetailLabel}>📏 Distance:</Text>
                  <Text style={styles.routeDetailValue}>{routeInfo.distance}</Text>
                </View>
                <View style={styles.routeDetailItem}>
                  <Text style={styles.routeDetailLabel}>⏱️ Duration:</Text>
                  <Text style={styles.routeDetailValue}>{routeInfo.duration}</Text>
                </View>
              </View>
              
              <View style={styles.routeInstructions}>
                <Text style={styles.routeInstructionsText}>
                  🚗 Follow the highlighted orange route on the map
                </Text>
                <TouchableOpacity 
                  style={styles.directionsButton}
                  onPress={() => {
                    Alert.alert(
                      '🗺️ Navigation Instructions',
                      'Follow the highlighted orange route on the map. The route shows the shortest path from your current location to the destination.',
                      [{ text: 'Got it!', style: 'default' }]
                    );
                  }}
                >
                  <Text style={styles.directionsButtonText}>📋 Show Navigation Tips</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {/* Minimized Route Icon */}
          {routeInfo.isVisible && routeInfo.isMinimized && (
            <TouchableOpacity 
              style={styles.minimizedRouteIcon}
              onPress={restoreRoute}
            >
              <Text style={styles.minimizedRouteIconText}>🗺️</Text>
            </TouchableOpacity>
          )}
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={isTracking}
        onMapReady={() => setMapReady(true)}
        onUserLocationChange={(e) => {
          if (isTracking && e.nativeEvent.coordinate) {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            mapRef.current?.animateToRegion({
              latitude,
              longitude,
              latitudeDelta: region.latitudeDelta,
              longitudeDelta: region.longitudeDelta,
            });
          }
        }}
        zoomEnabled={true}
        zoomTapEnabled={true}
        rotateEnabled={true}
        loadingEnabled={true}
        loadingIndicatorColor="#666666"
        loadingBackgroundColor="#eeeeee"
        onMapLoaded={() => console.log('Map loaded successfully')}
      >
        {/* Current user location */}
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="You"
            description="Your current location"
            pinColor={location.color}
            onPress={() => handleMarkerPress(location)}
          />
        )}
        {/* All other users' locations */}
         {allUsers.map((user) => (
          <Marker
            key={user.id}
            coordinate={{
              latitude: user.coords.latitude,
              longitude: user.coords.longitude,
            }}
            title={user.name}
            description={
              user.isFamilyMember 
                ? (user.isOnline ? '👨‍👩‍👧‍👦 Family Member (Live)' : '👨‍👩‍👧‍👦 Family Member (Last Known)')
                : (user.isOnline ? '🟢 Live Location' : '🔴 Last Known Location')
            }
             pinColor={
               user.isFamilyMember ? '#FF6B35' : // Orange for family members
               (user.isOnline ? user.color : '#808080') // Original color or gray for offline
             }
             onPress={() => handleMarkerPress(user)}
           />
         ))}
        {/* Route Polyline - Enhanced for better visibility */}
          {routeInfo.isVisible && routeInfo.coordinates.length > 0 && (
            <>
              {/* Main route line */}
              <Polyline
                coordinates={routeInfo.coordinates}
                strokeColor="#FF6B35"
                strokeWidth={6}
                lineDashPattern={[1]}
                zIndex={1000}
              />
              {/* Route border for better visibility */}
              <Polyline
                coordinates={routeInfo.coordinates}
                strokeColor="#FFFFFF"
                strokeWidth={8}
                lineDashPattern={[1]}
                zIndex={999}
              />
              
              {/* Start Point Marker */}
              <Marker
                coordinate={routeInfo.coordinates[0]}
                title="Start Point"
                description="Your current location"
                pinColor="#4CAF50"
                zIndex={1001}
              />
              
              {/* End Point Marker */}
              <Marker
                coordinate={routeInfo.coordinates[routeInfo.coordinates.length - 1]}
                title="Destination"
                description="Route destination"
                pinColor="#FF6B35"
                zIndex={1001}
              />
            </>
          )}
       </MapView>

      {/* User Details Modal */}
      <Modal
        visible={showUserModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedUser?.name === 'You' ? 'Your Profile' : 'User Profile'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowUserModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              </View>


            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {selectedUser && (
                <>
                  {/* User Basic Info */}
                  <View style={styles.userInfoSection}>
                    <View style={styles.userAvatar}>
                      {selectedUser.userData?.imageUrl ? (
                        <Image 
                          source={{ uri: selectedUser.userData.imageUrl }} 
                          style={styles.avatarImage} 
                        />
                      ) : (
                        <Text style={styles.avatarText}>
                          {selectedUser.name.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.userName}>{selectedUser.name}</Text>
                    {selectedUser.userData?.role && (
                      <Text style={styles.userRole}>{selectedUser.userData.role}</Text>
                    )}
                                         <View style={styles.onlineStatus}>
                       <View style={[styles.statusDot, { backgroundColor: selectedUser.isOnline ? '#4CAF50' : '#F44336' }]} />
                       <Text style={[styles.statusText, { color: selectedUser.isOnline ? '#4CAF50' : '#F44336' }]}>
                         {selectedUser.isOnline ? '🟢 Live Location' : '🔴 Last Known Location'}
                       </Text>
                     </View>
                  </View>

                  {/* Location Info */}
                  <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>📍 Location Information</Text>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Latitude:</Text>
                      <Text style={styles.infoValue}>{selectedUser.coords.latitude.toFixed(6)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Longitude:</Text>
                      <Text style={styles.infoValue}>{selectedUser.coords.longitude.toFixed(6)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Last Updated:</Text>
                      <Text style={styles.infoValue}>
                        {new Date(selectedUser.timestamp).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Last Seen:</Text>
                      <Text style={styles.infoValue}>{selectedUser.lastSeen}</Text>
                    </View>
                    {selectedUser.coords.accuracy && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Accuracy:</Text>
                        <Text style={styles.infoValue}>{Math.round(selectedUser.coords.accuracy)}m</Text>
                      </View>
                    )}
                  </View>

                  {/* User Details */}
                  {selectedUser.userData && (
                    <View style={styles.infoSection}>
                      <Text style={styles.sectionTitle}>👤 User Details</Text>
                      {selectedUser.userData.email && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Email:</Text>
                          <Text style={styles.infoValue}>{selectedUser.userData.email}</Text>
                        </View>
                      )}
                      {selectedUser.userData.phone && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Phone:</Text>
                          <Text style={styles.infoValue}>{selectedUser.userData.phone}</Text>
                        </View>
                      )}
                      {selectedUser.userData.aadhaar && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Aadhaar:</Text>
                          <Text style={styles.infoValue}>{selectedUser.userData.aadhaar}</Text>
                        </View>
                      )}
                    </View>
                  )}
                  
                                     {/* Route Button for All Users */}
                   {location && (
                     <View style={styles.infoSection}>
                       <TouchableOpacity
                         style={[
                           styles.routeButton,
                           selectedUser.isFamilyMember && styles.familyRouteButton
                         ]}
                         onPress={() => {
                           console.log('Calculating route to user from modal:', selectedUser.name);
                           calculateRoute(
                             selectedUser.coords.latitude,
                             selectedUser.coords.longitude,
                             selectedUser // Pass the selectedUser for tracking notification
                           );
                           setShowUserModal(false); // Close modal to show route
                         }}
                       >
                         <Text style={styles.routeButtonText}>
                           🗺️ Show Route to {selectedUser.name}
                         </Text>
                       </TouchableOpacity>
                       

                       
                       {/* Additional route info for testing */}
                       <View style={styles.routeTestInfo}>
                         <Text style={styles.routeTestText}>
                           📍 From: Your Location ({location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)})
                         </Text>
                         <Text style={styles.routeTestText}>
                           🎯 To: {selectedUser.name} ({selectedUser.coords.latitude.toFixed(4)}, {selectedUser.coords.longitude.toFixed(4)})
                         </Text>
                       </View>
                     </View>
                   )}

                  {/* Nearby Users Section */}
                  {nearbyUsers.length > 0 && (
                    <View style={styles.infoSection}>
                      <Text style={styles.sectionTitle}>👥 Nearby Users</Text>
                      {nearbyUsers.map((nearbyUser, index) => (
                        <View key={nearbyUser.id} style={styles.nearbyUserCard}>
                          <View style={styles.nearbyUserHeader}>
                            <View style={styles.nearbyUserInfo}>
                              <Text style={styles.nearbyUserName}>{nearbyUser.name}</Text>
                              <Text style={styles.nearbyUserEmail}>{nearbyUser.email}</Text>
                              <Text style={styles.nearbyUserRole}>{nearbyUser.role}</Text>
                            </View>
                            <View style={styles.distanceContainer}>
                              <Text style={styles.distanceText}>{nearbyUser.distance} km</Text>
                              <Text style={styles.distanceLabel}>away</Text>
                            </View>
                          </View>
                          <View style={styles.nearbyUserDetails}>
                                                       <View style={styles.onlineStatus}>
                             <View style={[styles.statusDot, { backgroundColor: nearbyUser.isOnline ? '#4CAF50' : '#F44336' }]} />
                             <Text style={[styles.statusText, { color: nearbyUser.isOnline ? '#4CAF50' : '#F44336' }]}>
                               {nearbyUser.isOnline ? '🟢 Live' : '🔴 Last Known'}
                             </Text>
                           </View>
                            <Text style={styles.lastSeenText}>Last seen: {nearbyUser.lastSeen}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Family Members Section */}
                  {selectedUser.name === 'You' && familyMembers.length > 0 && (
                    <View style={styles.infoSection}>
                      <Text style={styles.sectionTitle}>👨‍👩‍👧‍👦 Family Members</Text>
                      {familyMembers.map((member, index) => (
                        <View key={member.id} style={styles.familyMemberCard}>
                          <View style={styles.familyMemberHeader}>
                            <View style={styles.familyMemberAvatar}>
                              {member.imageUrl ? (
                                <Image source={{ uri: member.imageUrl }} style={styles.familyAvatarImage} />
                              ) : (
                                <Text style={styles.familyAvatarText}>
                                  {member.name.charAt(0).toUpperCase()}
                                </Text>
                              )}
                            </View>
                            <View style={styles.familyMemberInfo}>
                              <Text style={styles.familyMemberName}>{member.name}</Text>
                              <Text style={styles.familyMemberRole}>{member.role}</Text>
                            </View>
                            <View style={styles.distanceContainer}>
                              {member.distance ? (
                                <>
                                  <Text style={styles.distanceText}>{member.distance} km</Text>
                                  <Text style={styles.distanceLabel}>away</Text>
                                </>
                              ) : (
                                <Text style={styles.offlineText}>Offline</Text>
                              )}
                            </View>
                          </View>
                                                     <View style={styles.familyMemberDetails}>
                             <Text style={styles.familyMemberEmail}>{member.email}</Text>
                             <Text style={styles.familyMemberPhone}>📱 {member.phone}</Text>
                             <Text style={styles.lastSeenText}>
                               {member.distance ? 'Last seen: ' : 'Last active: '}
                               {member.lastSeen}
                             </Text>
                             
                                                           {/* Navigation Button */}
                              {member.distance && (
                                <TouchableOpacity
                                  style={styles.navigateButton}
                                  onPress={() => {
                                    // Find the family member's location from allUsers
                                    const familyMemberUser = allUsers.find(u => u.userData?.email === member.email);
                                    if (familyMemberUser) {
                                      console.log('Calculating route to family member:', member.name);
                                      calculateRoute(
                                        familyMemberUser.coords.latitude,
                                        familyMemberUser.coords.longitude,
                                        familyMemberUser // Pass the family member user for tracking notification
                                      );
                                      setShowUserModal(false); // Close modal to show route
                                    } else {
                                      Alert.alert('Error', 'Could not find family member location on map');
                                    }
                                  }}
                                >
                                  <Text style={styles.navigateButtonText}>🗺️ Navigate to {member.name}</Text>
                                </TouchableOpacity>
                              )}
                           </View>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {errorMsg && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
  },
  userCountContainer: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',

    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,

    paddingVertical: 12,
    borderRadius: 20,
    zIndex: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,

    minWidth: 200,
  },
  userCountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },

  onlineUsersText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',

    marginBottom: 4,
  },
  locationStatusText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginBottom: 4,
  },
  familyCountText: {
    fontSize: 14,
    color: '#FF8C00',
    textAlign: 'center',
    fontWeight: '600',
  },
  familyMapText: {
    fontSize: 14,
    color: '#FF6B35',
    textAlign: 'center',
    fontWeight: '600',
  },
  autoFamilyText: {
    fontSize: 10,
    color: '#FF8C00',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  distanceAlertText: {
    fontSize: 12,
    color: '#FF0000',
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 4,
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  manualAnalysisText: {
    fontSize: 12,
    color: '#FF6B35',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 4,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontStyle: 'italic',
  },
  countdownContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  countdownText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Mobile Notification Styles
  mobileNotificationContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    borderRadius: 12,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  mobileNotificationAlert: {
    backgroundColor: '#FF6B35',
  },
  mobileNotificationSuccess: {
    backgroundColor: '#4CAF50',
  },
  mobileNotificationInfo: {
    backgroundColor: '#2196F3',
  },
  mobileNotificationContent: {
    flex: 1,
  },
  mobileNotificationTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  mobileNotificationMessage: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 16,
  },
  mobileNotificationClose: {
    marginLeft: 12,
    padding: 4,
  },
  mobileNotificationCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',

    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,

    color: '#666',
    fontWeight: 'bold',

  },
  modalBody: {
    padding: 20,
  },
  userInfoSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF8C00',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },

  userRole: {
    fontSize: 16,
    color: '#666',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  nearbyUserCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  nearbyUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nearbyUserInfo: {
    flex: 1,
  },
  nearbyUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  nearbyUserEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  nearbyUserRole: {
    fontSize: 12,
    color: '#888',
  },
  distanceContainer: {
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
  },
  distanceLabel: {
    fontSize: 12,
    color: '#666',
  },
  nearbyUserDetails: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  familyMemberCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  familyMemberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  familyMemberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  familyAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  familyAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  familyMemberInfo: {
    flex: 1,
  },
  familyMemberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  familyMemberRole: {
    fontSize: 14,
    color: '#666',
  },
  familyMemberDetails: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  familyMemberEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  familyMemberPhone: {
    fontSize: 14,
    color: '#007bff',
    marginBottom: 4,
  },
  lastSeenText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  offlineText: {
    fontSize: 14,
    color: '#FF0000', // Red for offline
    fontWeight: 'bold',
  },
  navigateButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  navigateButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  routeInfoContainer: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
    zIndex: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    minWidth: 280,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  routeDetails: {
    width: '100%',
    marginBottom: 12,
  },
  routeDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  routeDetailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  routeDetailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  routeInstructions: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  routeInstructionsText: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  directionsButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  directionsButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  routeInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 4,
  },
  routeInfoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  clearRouteButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  clearRouteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  routeButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 8,
  },
  routeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },






  familyRouteButton: {
    backgroundColor: '#FF8C00', // Different color for family members
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  analysisButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#45A049',
  },
  analysisButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  routeTestInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  routeTestText: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'monospace',
  },

  routeHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  minimizeButton: {
    backgroundColor: '#FFA726',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  minimizeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  minimizedRouteIcon: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#FF6B35',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  minimizedRouteIconText: {
    fontSize: 20,
    color: 'white',
  },
  
  // Test User Management Styles
  testUserContainer: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFB74D',
  },
  testUserTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E65100',
    textAlign: 'center',
    marginBottom: 16,
  },
  testUserButton: {
    backgroundColor: '#FF8C00',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 8,
    minWidth: 200,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  testUserButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

