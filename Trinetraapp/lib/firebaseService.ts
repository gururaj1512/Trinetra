import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from './firebase';
import NotificationService from './notificationService';

export interface AmbulanceRequest {
  id?: string;
  patientName: string;
  patientPhone: string;
  patientAddress: string;
  emergencyType: string;
  description: string;
  latitude: number;
  longitude: number;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  hospitalId?: string;
  hospitalName?: string;
  ambulanceId?: string;
  ambulanceName?: string;
  createdAt: Timestamp;
  acceptedAt?: Timestamp;
  completedAt?: Timestamp;
  estimatedTime?: number; // in minutes
  distance?: number; // in km
}

export interface AmbulanceCount {
  total: number;
  available: number;
  busy: number;
  offline: number;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface UserRoute {
  id?: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  userAadhaar: string;
  userRole: string;
  userRelationship: string;
  userCreatedAt: Date | any;
  userLastSeen: Date | any;
  userIsActive: boolean;
  userFamilyMembers: string[];
  hospitalId: string;
  hospitalName: string;
  hospitalType: 'hospital' | 'medical' | 'clinic';
  startLatitude: number;
  startLongitude: number;
  endLatitude: number;
  endLongitude: number;
  routePoints: RoutePoint[];
  distance: number;
  estimatedTime: number;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date | any;
  completedAt?: Date | null;
  cancelledAt?: Date | null;
}

export interface MissingPersonReport {
  id?: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  missingPersonName: string;
  missingPersonAge: string;
  missingPersonDescription: string;
  missingPersonImageUrl?: string;
  lastSeenLocation?: string;
  lastSeenDate?: string;
  relationship: string;
  status: 'finding' | 'found' | 'not found';
  adminNotes?: string;
  foundAddress?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export class FirebaseService {
  // Get ambulance count
  static async getAmbulanceCount(): Promise<AmbulanceCount> {
    try {
      // This would typically come from a real ambulance tracking system
      // For now, returning mock data
      return {
        total: 25,
        available: 18,
        busy: 5,
        offline: 2
      };
    } catch (error) {
      console.error('Error getting ambulance count:', error);
      return {
        total: 0,
        available: 0,
        busy: 0,
        offline: 0
      };
    }
  }

  // Create new ambulance request
  static async createAmbulanceRequest(request: Omit<AmbulanceRequest, 'id' | 'createdAt' | 'status'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'ambulanceRequests'), {
        ...request,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating ambulance request:', error);
      throw error;
    }
  }

  // Get all ambulance requests
  static async getAmbulanceRequests(): Promise<AmbulanceRequest[]> {
    try {
      const q = query(
        collection(db, 'ambulanceRequests'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AmbulanceRequest[];
    } catch (error) {
      console.error('Error getting ambulance requests:', error);
      return [];
    }
  }

  // Get ambulance requests by status
  static async getAmbulanceRequestsByStatus(status: AmbulanceRequest['status']): Promise<AmbulanceRequest[]> {
    try {
      const q = query(
        collection(db, 'ambulanceRequests'),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AmbulanceRequest[];
    } catch (error) {
      console.error('Error getting ambulance requests by status:', error);
      return [];
    }
  }

  // Accept ambulance request
  static async acceptAmbulanceRequest(
    requestId: string, 
    hospitalId: string, 
    hospitalName: string,
    estimatedTime: number,
    distance: number
  ): Promise<void> {
    try {
      const requestRef = doc(db, 'ambulanceRequests', requestId);
      await updateDoc(requestRef, {
        status: 'accepted',
        hospitalId,
        hospitalName,
        acceptedAt: serverTimestamp(),
        estimatedTime,
        distance
      });

      // Send notification that ambulance request was accepted
      try {
        // Get the ambulance request to get patient details
        const requestDoc = await getDoc(requestRef);
        if (requestDoc.exists()) {
          const requestData = requestDoc.data() as AmbulanceRequest;
          
          await NotificationService.sendAmbulanceAcceptedNotification({
            type: 'ambulance_accepted',
            patientName: requestData.patientName,
            hospitalName: hospitalName,
            timestamp: new Date().toISOString(),
            priority: 'high'
          });
          
          console.log('✅ Ambulance acceptance notification sent successfully');
        }
      } catch (notificationError) {
        console.error('❌ Error sending ambulance acceptance notification:', notificationError);
        // Don't fail the main operation if notification fails
      }
    } catch (error) {
      console.error('Error accepting ambulance request:', error);
      throw error;
    }
  }

  // Complete ambulance request
  static async completeAmbulanceRequest(requestId: string): Promise<void> {
    try {
      const requestRef = doc(db, 'ambulanceRequests', requestId);
      await updateDoc(requestRef, {
        status: 'completed',
        completedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error completing ambulance request:', error);
      throw error;
    }
  }

  // Cancel ambulance request
  static async cancelAmbulanceRequest(requestId: string): Promise<void> {
    try {
      const requestRef = doc(db, 'ambulanceRequests', requestId);
      await updateDoc(requestRef, {
        status: 'cancelled'
      });
    } catch (error) {
      console.error('Error cancelling ambulance request:', error);
      throw error;
    }
  }

  // Listen to ambulance requests in real-time
  static subscribeToAmbulanceRequests(callback: (requests: AmbulanceRequest[]) => void) {
    const q = query(
      collection(db, 'ambulanceRequests'),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const requests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AmbulanceRequest[];
      callback(requests);
    });
  }

  // Calculate route between two points (simplified - would use Google Directions API in production)
  static calculateRoute(
    startLat: number, 
    startLng: number, 
    endLat: number, 
    endLng: number
  ): RoutePoint[] {
    // Simple straight line route - in production, use Google Directions API
    return [
      { latitude: startLat, longitude: startLng },
      { latitude: endLat, longitude: endLng }
    ];
  }

  // Create user route to hospital
  static async createUserRoute(route: Omit<UserRoute, 'id' | 'createdAt' | 'status'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'userRoutes'), {
        ...route,
        status: 'active',
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating user route:', error);
      throw error;
    }
  }

  // Get all user routes
  static async getUserRoutes(): Promise<UserRoute[]> {
    try {
      const q = query(
        collection(db, 'userRoutes'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserRoute[];
    } catch (error) {
      console.error('Error getting user routes:', error);
      return [];
    }
  }

  // Get user routes by status
  static async getUserRoutesByStatus(status: UserRoute['status']): Promise<UserRoute[]> {
    try {
      const q = query(
        collection(db, 'userRoutes'),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserRoute[];
    } catch (error) {
      console.error('Error getting user routes by status:', error);
      return [];
    }
  }

  // Update user route status
  static async updateUserRouteStatus(routeId: string, status: UserRoute['status']): Promise<void> {
    try {
      const routeRef = doc(db, 'userRoutes', routeId);
      const updateData: any = { status };
      
      if (status === 'completed') {
        updateData.completedAt = serverTimestamp();
      } else if (status === 'cancelled') {
        updateData.cancelledAt = serverTimestamp();
      }
      
      await updateDoc(routeRef, updateData);
    } catch (error) {
      console.error('Error updating user route status:', error);
      throw error;
    }
  }

  // Listen to user routes in real-time
  static subscribeToUserRoutes(callback: (routes: UserRoute[]) => void) {
    const q = query(
      collection(db, 'userRoutes'),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const routes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserRoute[];
      callback(routes);
    });
  }

  // Get current user data from Firestore
  static async getCurrentUserData(userId: string) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting current user data:', error);
      return null;
    }
  }

  // Debug function to check user document structure
  static async debugUserDocument(userId: string) {
    try {
      console.log('Debug: Checking user document for:', userId);
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('Debug: User document exists:', userData);
        console.log('Debug: Family members field:', userData.familyMembers);
        console.log('Debug: Family members type:', typeof userData.familyMembers);
        console.log('Debug: Family members length:', userData.familyMembers?.length || 0);
        return userData;
      } else {
        console.log('Debug: User document does not exist');
        return null;
      }
    } catch (error) {
      console.error('Debug: Error checking user document:', error);
      return null;
    }
  }

  // Search users by name, email, or phone
  static async searchUsers(searchTerm: string, currentUserId: string): Promise<any[]> {
    try {
      console.log('Searching for:', searchTerm, 'Current user:', currentUserId);
      const usersRef = collection(db, 'users');
      
      // Search by name
      const nameQuery = query(
        usersRef,
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff')
      );
      
      // Search by email
      const emailQuery = query(
        usersRef,
        where('email', '>=', searchTerm),
        where('email', '<=', searchTerm + '\uf8ff')
      );

      const [nameSnapshot, emailSnapshot] = await Promise.all([
        getDocs(nameQuery),
        getDocs(emailQuery)
      ]);

      const allUsers = new Map();
      
      // Combine results and remove duplicates
      [...nameSnapshot.docs, ...emailSnapshot.docs].forEach(doc => {
        const userData = { id: doc.id, ...doc.data() };
        if (userData.id !== currentUserId) { // Exclude current user
          allUsers.set(userData.id, userData);
        }
      });

      // Also search by phone if the search term looks like a phone number
      if (searchTerm.match(/^\d+$/)) {
        try {
          const phoneQuery = query(
            usersRef,
            where('phone', '>=', searchTerm),
            where('phone', '<=', searchTerm + '\uf8ff')
          );
          const phoneSnapshot = await getDocs(phoneQuery);
          
          phoneSnapshot.docs.forEach(doc => {
            const userData = { id: doc.id, ...doc.data() };
            if (userData.id !== currentUserId) {
              allUsers.set(userData.id, userData);
            }
          });
        } catch (phoneError) {
          console.log('Phone search failed (field might not exist):', phoneError);
        }
      }

      const results = Array.from(allUsers.values());
      console.log('Search results:', results.length, 'users found');
      return results;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  // Get family members for a user (returns user objects from emails)
  static async getFamilyMembers(userId: string): Promise<any[]> {
    try {
      console.log('Fetching family members for user:', userId);
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('User data:', userData);
        const familyMemberEmails = userData.familyMembers || [];
        console.log('Family member emails found:', familyMemberEmails.length);
        
        // Convert emails to user objects
        const familyMembers = [];
        for (const email of familyMemberEmails) {
          const familyMemberUser = await this.findUserByEmail(email);
          if (familyMemberUser) {
            familyMembers.push(familyMemberUser);
          }
        }
        
        console.log('Family members converted to user objects:', familyMembers.length);
        return familyMembers;
      }
      console.log('User document does not exist');
      return [];
    } catch (error) {
      console.error('Error getting family members:', error);
      return [];
    }
  }

  // Helper function to find user by email
  static async findUserByEmail(email: string): Promise<any | null> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  // Add family member to user profile (bidirectional - email only)
  static async addFamilyMember(userId: string, familyMember: {
    id: string;
    name: string;
    email: string;
    phone: string;
    relationship: string;
  }): Promise<void> {
    try {
      console.log('Adding family member email:', familyMember.email, 'to user:', userId);
      
      // Get current user data first
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }
      
      const userData = userDoc.data();
      const currentFamilyMembers = userData.familyMembers || [];
      console.log('Current family members (emails):', currentFamilyMembers);
      
      // Check if family member email already exists
      const exists = currentFamilyMembers.includes(familyMember.email);
      
      if (exists) {
        throw new Error('This person is already in your family members list');
      }
      
      // Get the family member's user data
      const familyMemberRef = doc(db, 'users', familyMember.id);
      const familyMemberDoc = await getDoc(familyMemberRef);
      
      if (!familyMemberDoc.exists()) {
        throw new Error('Family member user not found');
      }
      
      const familyMemberData = familyMemberDoc.data();
      const familyMemberFamilyMembers = familyMemberData.familyMembers || [];
      
      // Check if current user's email is already in family member's list
      const reverseExists = familyMemberFamilyMembers.includes(userData.email);
      
      console.log('Adding family member email:', familyMember.email);
      console.log('Adding reverse family member email:', userData.email);
      
      // Update both users' family member lists (emails only)
      await Promise.all([
        // Add family member email to current user's list
        updateDoc(userRef, {
          familyMembers: [...currentFamilyMembers, familyMember.email]
        }),
        // Add current user's email to family member's list (if not already there)
        ...(reverseExists ? [] : [
          updateDoc(familyMemberRef, {
            familyMembers: [...familyMemberFamilyMembers, userData.email]
          })
        ])
      ]);
      
      console.log('Bidirectional family member relationship added successfully (emails only)');
    } catch (error) {
      console.error('Error adding family member:', error);
      throw error;
    }
  }

  // Helper function to get reverse relationship
  private static getReverseRelationship(relationship: string): string {
    const relationshipMap: { [key: string]: string } = {
      'Father': 'Son/Daughter',
      'Mother': 'Son/Daughter',
      'Son': 'Father/Mother',
      'Daughter': 'Father/Mother',
      'Brother': 'Brother/Sister',
      'Sister': 'Brother/Sister',
      'Husband': 'Wife',
      'Wife': 'Husband',
      'Uncle': 'Nephew/Niece',
      'Aunt': 'Nephew/Niece',
      'Nephew': 'Uncle/Aunt',
      'Niece': 'Uncle/Aunt',
      'Grandfather': 'Grandson/Granddaughter',
      'Grandmother': 'Grandson/Granddaughter',
      'Grandson': 'Grandfather/Grandmother',
      'Granddaughter': 'Grandfather/Grandmother',
      'Cousin': 'Cousin',
      'Friend': 'Friend',
      'Colleague': 'Colleague',
      'Neighbor': 'Neighbor'
    };
    
    return relationshipMap[relationship] || 'Family Member';
  }

  // Remove family member from user profile (bidirectional - email only)
  static async removeFamilyMember(userId: string, familyMemberEmail: string): Promise<void> {
    try {
      console.log('Removing family member email:', familyMemberEmail, 'from user:', userId);
      
      // Get current user data
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }
      
      const userData = userDoc.data();
      const currentFamilyMembers = userData.familyMembers || [];
      
      // Find the family member by email to get their user ID
      const familyMemberUser = await this.findUserByEmail(familyMemberEmail);
      if (!familyMemberUser) {
        throw new Error('Family member user not found');
      }
      
      const familyMemberRef = doc(db, 'users', familyMemberUser.id);
      const familyMemberDoc = await getDoc(familyMemberRef);
      
      if (!familyMemberDoc.exists()) {
        throw new Error('Family member user not found');
      }
      
      const familyMemberData = familyMemberDoc.data();
      const familyMemberFamilyMembers = familyMemberData.familyMembers || [];
      
      // Remove family member email from current user's list
      const updatedFamilyMembers = currentFamilyMembers.filter(
        (email: string) => email !== familyMemberEmail
      );
      
      // Remove current user's email from family member's list
      const updatedFamilyMemberFamilyMembers = familyMemberFamilyMembers.filter(
        (email: string) => email !== userData.email
      );
      
      console.log('Removing bidirectional family member relationship (emails)');
      
      // Update both users' family member lists
      await Promise.all([
        // Remove family member email from current user's list
        updateDoc(userRef, {
          familyMembers: updatedFamilyMembers
        }),
        // Remove current user's email from family member's list
        updateDoc(familyMemberRef, {
          familyMembers: updatedFamilyMemberFamilyMembers
        })
      ]);
      
      console.log('Bidirectional family member relationship removed successfully (emails only)');
    } catch (error) {
      console.error('Error removing family member:', error);
      throw error;
    }
  }

  // Create missing person report
  static async createMissingPersonReport(report: Omit<MissingPersonReport, 'id' | 'createdAt' | 'status'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'missingPersonReports'), {
        ...report,
        status: 'finding',
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating missing person report:', error);
      throw error;
    }
  }

  // Get missing person reports by user ID
  static async getMissingPersonReportsByUser(userId: string): Promise<MissingPersonReport[]> {
    try {
      const q = query(
        collection(db, 'missingPersonReports'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      const reports = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MissingPersonReport[];
      
      // Sort by createdAt in descending order (newest first)
      return reports.sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return bTime - aTime;
      });
    } catch (error) {
      console.error('Error getting missing person reports by user:', error);
      return [];
    }
  }

  // Get all missing person reports (for admin)
  static async getAllMissingPersonReports(): Promise<MissingPersonReport[]> {
    try {
      const q = query(
        collection(db, 'missingPersonReports'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MissingPersonReport[];
    } catch (error) {
      console.error('Error getting all missing person reports:', error);
      return [];
    }
  }

  // Update missing person report status (admin only)
  static async updateMissingPersonReportStatus(
    reportId: string, 
    status: MissingPersonReport['status'],
    adminNotes?: string,
    foundAddress?: string
  ): Promise<void> {
    try {
      const reportRef = doc(db, 'missingPersonReports', reportId);
      const updateData: any = { 
        status,
        updatedAt: serverTimestamp()
      };
      
      if (adminNotes) {
        updateData.adminNotes = adminNotes;
      }
      
      if (foundAddress) {
        updateData.foundAddress = foundAddress;
      }
      
      await updateDoc(reportRef, updateData);
    } catch (error) {
      console.error('Error updating missing person report status:', error);
      throw error;
    }
  }

  // Listen to missing person reports in real-time
  static subscribeToMissingPersonReports(callback: (reports: MissingPersonReport[]) => void) {
    const q = query(
      collection(db, 'missingPersonReports'),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const reports = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MissingPersonReport[];
      callback(reports);
    });
  }

  // Listen to user's missing person reports in real-time
  static subscribeToUserMissingPersonReports(userId: string, callback: (reports: MissingPersonReport[]) => void) {
    const q = query(
      collection(db, 'missingPersonReports'),
      where('userId', '==', userId)
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const reports = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MissingPersonReport[];
      
      // Sort by createdAt in descending order (newest first)
      const sortedReports = reports.sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return bTime - aTime;
      });
      
      callback(sortedReports);
    });
  }
}

export default FirebaseService;
