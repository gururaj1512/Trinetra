import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import FirebaseService from '../lib/firebaseService';

interface FormData {
  patientName: string;
  patientPhone: string;
  emergencyType: string;
  description: string;
  patientAddress: string;
}

const emergencyTypes = [
  'Heart Attack',
  'Stroke',
  'Trauma/Accident',
  'Respiratory Distress',
  'Severe Bleeding',
  'Unconsciousness',
  'Other'
];

export default function UserAmbulanceRequestScreen() {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [formData, setFormData] = useState<FormData>({
    patientName: '',
    patientPhone: '',
    emergencyType: '',
    description: '',
    patientAddress: ''
  });

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to send ambulance requests.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Location Error', 'Unable to get your current location. Please enter your address manually.');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.patientName.trim()) {
      newErrors.patientName = 'Patient name is required';
    }

    if (!formData.patientPhone.trim()) {
      newErrors.patientPhone = 'Phone number is required';
    } else if (!/^[0-9+\-\s()]{10,}$/.test(formData.patientPhone.replace(/\s/g, ''))) {
      newErrors.patientPhone = 'Please enter a valid phone number';
    }

    if (!formData.emergencyType) {
      newErrors.emergencyType = 'Please select an emergency type';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Please describe the emergency situation';
    }

    if (!formData.patientAddress.trim() && !location) {
      newErrors.patientAddress = 'Please provide your address or allow location access';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!location) {
      Alert.alert('Location Required', 'Please allow location access or provide your address manually.');
      return;
    }

    setLoading(true);

    try {
      const ambulanceRequest = {
        patientName: formData.patientName.trim(),
        patientPhone: formData.patientPhone.trim(),
        emergencyType: formData.emergencyType,
        description: formData.description.trim(),
        patientAddress: formData.patientAddress.trim() || 'Location-based address',
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        status: 'pending' as const,
        createdAt: new Date(),
        userId: 'user_' + Date.now(), // In a real app, this would be the actual user ID
        hospitalName: '',
        estimatedTime: null,
        distance: null
      };

      await FirebaseService.createAmbulanceRequest(ambulanceRequest);

      Alert.alert(
        'Request Sent Successfully!',
        'Your ambulance request has been sent to medical administrators. They will review and respond shortly.',
        [
          {
            text: 'View My Requests',
            onPress: () => router.push('/(tabs)/my-requests')
          },
          {
            text: 'OK',
            style: 'default'
          }
        ]
      );

      // Reset form
      setFormData({
        patientName: '',
        patientPhone: '',
        emergencyType: '',
        description: '',
        patientAddress: ''
      });

    } catch (error) {
      console.error('Error submitting ambulance request:', error);
      Alert.alert(
        'Submission Failed',
        'There was an error sending your request. Please try again or contact emergency services directly.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyTypeSelect = (type: string) => {
    setFormData(prev => ({ ...prev, emergencyType: type }));
    setErrors(prev => ({ ...prev, emergencyType: undefined }));
  };

  const updateFormField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Request Ambulance</Text>
          <Text style={styles.headerSubtitle}>Emergency medical assistance</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="medical" size={18} color="#FFFFFF" />
        </View>
      </View>

      {/* Emergency Banner */}
      <View style={styles.emergencyBanner}>
        <Ionicons name="warning" size={20} color="white" />
        <Text style={styles.emergencyText}>
          This is for emergency situations only. For immediate life-threatening emergencies, call emergency services directly.
        </Text>
      </View>

      {/* Form */}
      <View style={styles.formContainer}>
        {/* Patient Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={[styles.input, errors.patientName && styles.inputError]}
              placeholder="Enter patient's full name"
              value={formData.patientName}
              onChangeText={(value) => updateFormField('patientName', value)}
            />
            {errors.patientName && <Text style={styles.errorText}>{errors.patientName}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={[styles.input, errors.patientPhone && styles.inputError]}
              placeholder="Enter phone number"
              value={formData.patientPhone}
              onChangeText={(value) => updateFormField('patientPhone', value)}
              keyboardType="phone-pad"
            />
            {errors.patientPhone && <Text style={styles.errorText}>{errors.patientPhone}</Text>}
          </View>
        </View>

        {/* Emergency Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Type *</Text>
          <View style={styles.emergencyTypeGrid}>
            {emergencyTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.emergencyTypeButton,
                  formData.emergencyType === type && styles.emergencyTypeButtonActive
                ]}
                onPress={() => handleEmergencyTypeSelect(type)}
              >
                <Text style={[
                  styles.emergencyTypeText,
                  formData.emergencyType === type && styles.emergencyTypeTextActive
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.emergencyType && <Text style={styles.errorText}>{errors.emergencyType}</Text>}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Description *</Text>
          <TextInput
            style={[styles.textArea, errors.description && styles.inputError]}
            placeholder="Describe the emergency situation, symptoms, and any relevant details..."
            value={formData.description}
            onChangeText={(value) => updateFormField('description', value)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          
          {location ? (
            <View style={styles.locationInfo}>
              <Ionicons name="checkmark-circle" size={20} color="#28a745" />
              <Text style={styles.locationText}>
                Location detected: {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
              </Text>
            </View>
          ) : (
            <View style={styles.locationInfo}>
              <Ionicons name="warning" size={20} color="#ffc107" />
              <Text style={styles.locationText}>Location not available</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your address if location is not detected"
              value={formData.patientAddress}
              onChangeText={(value) => updateFormField('patientAddress', value)}
            />
          </View>

          <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
            <Ionicons name="location" size={20} color="#007AFF" />
            <Text style={styles.locationButtonText}>Update Location</Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="medical" size={20} color="white" />
              <Text style={styles.submitButtonText}>Send Ambulance Request</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FF8C00',
    paddingTop: 60,
    paddingBottom: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    position: 'relative',
    zIndex: 1,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 1,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  headerIcon: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  emergencyBanner: {
    backgroundColor: '#EF4444',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emergencyText: {
    color: 'white',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  formContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#000000',
    fontWeight: '500',
  },
  textArea: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#000000',
    minHeight: 90,
    fontWeight: '500',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  emergencyTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emergencyTypeButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 110,
    alignItems: 'center',
  },
  emergencyTypeButtonActive: {
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  emergencyTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
  },
  emergencyTypeTextActive: {
    color: '#FFFFFF',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationText: {
    fontSize: 13,
    color: '#666666',
    flex: 1,
    fontWeight: '500',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF8C00',
  },
  submitButton: {
    backgroundColor: '#FF8C00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 15,
    fontWeight: '600',
  },
});
