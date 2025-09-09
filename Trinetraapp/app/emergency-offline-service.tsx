import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Alert, Dimensions, Linking, SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function EmergencyOfflineService() {
  const router = useRouter();

  const handleCall = () => {
    const phoneNumber = '08045883460';
    const url = `tel:${phoneNumber}`;
    
    Alert.alert(
      'Emergency Call',
      `Are you sure you want to call the emergency IVR service?\n\nNumber: ${phoneNumber}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Call',
          onPress: () => {
            Linking.openURL(url).catch(err => {
              Alert.alert('Error', 'Unable to make the call. Please try again.');
              console.error('Error opening phone dialer:', err);
            });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Offline Service</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Emergency Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusIndicator}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>LIVE</Text>
            </View>
            <Text style={styles.statusTitle}>Emergency Service Active</Text>
          </View>
          <Text style={styles.statusDescription}>
            24/7 Emergency IVR service is available for immediate assistance during Mahakumbh 2025
          </Text>
        </View>

        {/* IVR Service Card */}
        <View style={styles.ivrCard}>
          <View style={styles.ivrHeader}>
            <View style={styles.ivrIconContainer}>
              <Ionicons name="call" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.ivrInfo}>
              <Text style={styles.ivrTitle}>Emergency IVR Service</Text>
              <Text style={styles.ivrSubtitle}>Interactive Voice Response</Text>
            </View>
          </View>
          
          <View style={styles.phoneNumberContainer}>
            <Text style={styles.phoneLabel}>Emergency Number</Text>
            <Text style={styles.phoneNumber}>08045883460</Text>
          </View>

          <TouchableOpacity style={styles.callButton} onPress={handleCall}>
            <Ionicons name="call" size={24} color="#FFFFFF" />
            <Text style={styles.callButtonText}>Call Now</Text>
          </TouchableOpacity>
        </View>

        {/* Service Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Service Features</Text>
          
          <View style={styles.featuresGrid}>
                         <View style={styles.featureCard}>
               <View style={styles.featureIconContainer}>
                 <Ionicons name="time" size={24} color="#FF8C00" />
               </View>
               <Text style={styles.featureTitle}>24/7 Available</Text>
               <Text style={styles.featureDescription}>Round the clock emergency support</Text>
             </View>

             <View style={styles.featureCard}>
               <View style={styles.featureIconContainer}>
                 <Ionicons name="shield-checkmark" size={24} color="#FF8C00" />
               </View>
               <Text style={styles.featureTitle}>Secure & Reliable</Text>
               <Text style={styles.featureDescription}>Trusted emergency response system</Text>
             </View>

             <View style={styles.featureCard}>
               <View style={styles.featureIconContainer}>
                 <Ionicons name="location" size={24} color="#FF8C00" />
               </View>
               <Text style={styles.featureTitle}>Location Aware</Text>
               <Text style={styles.featureDescription}>GPS-based emergency assistance</Text>
             </View>

             <View style={styles.featureCard}>
               <View style={styles.featureIconContainer}>
                 <Ionicons name="people" size={24} color="#FF8C00" />
               </View>
               <Text style={styles.featureTitle}>Multi-language</Text>
               <Text style={styles.featureDescription}>Support in multiple languages</Text>
             </View>
          </View>
        </View>

        {/* Emergency Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Emergency Instructions</Text>
          
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>1</Text>
            </View>
            <Text style={styles.instructionText}>
              Call the emergency number 08045883460
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>2</Text>
            </View>
            <Text style={styles.instructionText}>
              Follow the IVR prompts to select your emergency type
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>3</Text>
            </View>
            <Text style={styles.instructionText}>
              Provide your location and emergency details
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>4</Text>
            </View>
            <Text style={styles.instructionText}>
              Stay on the line until help arrives
            </Text>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Additional Information</Text>
          
                     <View style={styles.contactItem}>
             <Ionicons name="information-circle" size={20} color="#FF8C00" />
             <Text style={styles.contactText}>
               This service is specifically designed for Mahakumbh 2025 pilgrims
             </Text>
           </View>

          <View style={styles.contactItem}>
            <Ionicons name="warning" size={20} color="#FF9800" />
            <Text style={styles.contactText}>
              For life-threatening emergencies, call 100 (Police) or 108 (Ambulance)
            </Text>
          </View>

          <View style={styles.contactItem}>
            <Ionicons name="time" size={20} color="#4CAF50" />
            <Text style={styles.contactText}>
              Average response time: 2-5 minutes
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 12,
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
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  statusDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  ivrCard: {
    backgroundColor: '#FF8C00',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#FF8C00',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ivrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  ivrIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  ivrInfo: {
    flex: 1,
  },
  ivrTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  ivrSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  phoneNumberContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  phoneLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  phoneNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  callButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  callButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF8C00',
    marginLeft: 8,
  },
  featuresSection: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: (width - 60) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF8C0020',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
  instructionsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF8C00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  instructionNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 32,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  contactText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginLeft: 12,
  },
});
