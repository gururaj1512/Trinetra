import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Dimensions, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../lib/firebase';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [role, setRole] = useState('user');
  const [phone, setPhone] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      console.log('Current user state:', user ? user.email : 'No user');
    });

    return () => unsubscribe();
  }, []);

  const validateForm = () => {
    if (!name || !phone || !aadhaar || !email || !password) {
      alert('Please fill in all fields');
      return false;
    }
    
    if (name.trim().length < 2) {
      alert('Name must be at least 2 characters long');
      return false;
    }
    
    if (phone.trim().length < 10) {
      alert('Phone number must be at least 10 digits');
      return false;
    }
    
    if (aadhaar.trim().length !== 12) {
      alert('Aadhaar number must be exactly 12 digits');
      return false;
    }
    
    if (password.length < 6) {
      alert('Password must be at least 6 characters long');
      return false;
    }
    
    return true;
  };

  const register = async () => {
    if (!validateForm()) {
      return;
    }
    
    console.log('Form data:', { name, phone, aadhaar, email, role });
    console.log('Firebase config - Project ID:', 'todoapp-c9ac2');

    setIsLoading(true);
    try {
      console.log('Starting registration process...');
      
      // Check if email already exists in users collection
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        alert('Email is already registered. Please use a different email.');
        return;
      }
      
      console.log('Email is available, proceeding with registration...');
      
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      console.log('User created with UID:', uid);
      
      // Verify user was created in Auth
      if (!userCredential.user) {
        throw new Error('User was not created in Firebase Auth');
      }
      
      console.log('User verified in Auth:', userCredential.user.email);
      
      // Prepare user data for database
      const timestamp = new Date();
      const userData = {
        name: name.trim(),
        role: role,
        phone: phone.trim(),
        aadhaar: aadhaar.trim(),
        email: email.trim().toLowerCase(),
        uid: uid,
        createdAt: timestamp,
        updatedAt: timestamp,
        isActive: true,
        familyMembers: [],
        notifications: [],
        location: null,
        lastLocation: null,
        lastSeen: timestamp,
        relationship: role === 'admin' ? 'Admin' : role === 'medicalAdmin' ? 'Medical Admin' : 'User',
        registrationTimestamp: timestamp.toISOString()
      };
      
      console.log('Saving user data to database:', userData);
      
      // Save user data to Firestore
      await setDoc(doc(db, 'users', uid), userData);
      console.log('User data saved successfully to database');
      
      // Verify the user was saved by reading it back
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          console.log('User verification successful:', userDoc.data());
        } else {
          console.error('User was not saved to database');
          throw new Error('User data was not saved properly');
        }
      } catch (verifyError) {
        console.error('Verification error:', verifyError);
        throw new Error('Failed to verify user data was saved');
      }
      
      // Set step to success
      setStep(2);
      
    } catch (e: any) {
      console.error('Registration error:', e);
      console.error('Error code:', e.code);
      console.error('Error message:', e.message);
      console.error('Full error object:', JSON.stringify(e, null, 2));
      
      let errorMessage = 'Registration failed';
      
      if (e.code === 'auth/email-already-in-use') {
        errorMessage = 'Email is already registered. Please use a different email.';
      } else if (e.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      } else if (e.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please check your email.';
      } else if (e.code === 'permission-denied') {
        errorMessage = 'Database permission denied. Please check Firebase rules.';
      } else if (e.message) {
        errorMessage = e.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 2) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successBackground}>
          <View style={styles.successContent}>
            <View style={styles.successIcon}>
              <Text style={styles.successIconText}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Welcome to Mahakumbh 2025!</Text>
            <Text style={styles.successSubtitle}>You are now part of the divine gathering</Text>
            <Text style={styles.successDetails}>May the sacred waters bless your pilgrimage</Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push('/LoginScreen')}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>Enter the Sacred Grounds</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={async () => {
                try {
                  await auth.signOut();
                  console.log('User signed out successfully');
                  alert('User signed out. You can now test the login flow.');
                } catch (error) {
                  console.error('Sign out error:', error);
                  alert('Sign out failed: ' + (error as any).message);
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.signOutButtonText}>Return to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Background Section */}
        <View style={styles.backgroundSection} />
        
        {/* Logo/Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>ॐ</Text>
            </View>
          </View>
          <Text style={styles.appTitle}>Trinetra</Text>
          <Text style={styles.appSubtitle}>Mahakumbh 2025 - Join the Divine Gathering</Text>
        </View>

        {/* Registration Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Join the Mahakumbh Pilgrimage</Text>
          <Text style={styles.formSubtitle}>Be part of the world's largest spiritual gathering</Text>

          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Phone Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your phone number"
                placeholderTextColor="#999"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Aadhaar Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Aadhaar Number</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your Aadhaar number"
                placeholderTextColor="#999"
                value={aadhaar}
                onChangeText={setAadhaar}
                keyboardType="number-pad"
                maxLength={12}
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your email address"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Create a strong password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Role Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Select Role</Text>
            <View style={[styles.inputWrapper, styles.pickerWrapper]}>
              <Picker
                selectedValue={role}
                style={styles.picker}
                onValueChange={(itemValue: string) => setRole(itemValue)}
              >
                <Picker.Item label="User" value="user" />
                <Picker.Item label="Admin" value="admin" />
                <Picker.Item label="Medical Admin" value="medicalAdmin" />
                <Picker.Item label="Global Admin" value="Globaladmin" />
              </Picker>
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={register}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.registerButtonText}>
              {isLoading ? 'Joining Pilgrimage...' : 'Join Mahakumbh 2025'}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Login Link */}
          <TouchableOpacity 
            onPress={() => router.push('/LoginScreen')} 
            style={styles.loginLink}
            activeOpacity={0.7}
          >
            <Text style={styles.loginText}>
              Already a pilgrim? <Text style={styles.loginTextBold}>Enter Sacred Space</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 Mahakumbh Trinetra. Blessed by the Divine.</Text>
    </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    minHeight: height,
  },
  backgroundSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.3,
    backgroundColor: '#FF8C00',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    shadowColor: '#FF8C00',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: height * 0.05,
    paddingBottom: 25,
  },
  logoContainer: {
    marginBottom: 14,
  },
  logoCircle: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#FFFFFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  appTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  appSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 18,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    marginTop: -12,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 5,
  },
  formSubtitle: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 18,
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 7,
    alignSelf: 'flex-start',
    width: '100%',
    maxWidth: 280,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    width: '100%',
    maxWidth: 280,
    height: 44,
  },
  pickerWrapper: {
    paddingVertical: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    height: '100%',
    paddingVertical: 0,
  },
  picker: {
    flex: 1,
    height: 44,
    color: '#000000',
  },
  registerButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#FF8C00',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    alignSelf: 'center',
    minWidth: 180,
    height: 46,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    width: '100%',
    maxWidth: 280,
    alignSelf: 'center',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  loginLink: {
    alignItems: 'center',
  },
  loginText: {
    fontSize: 13,
    color: '#666666',
  },
  loginTextBold: {
    color: '#FF8C00',
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  // Success Screen Styles
  successContainer: {
    flex: 1,
  },
  successBackground: {
    flex: 1,
    backgroundColor: '#FF8C00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    alignItems: 'center',
    padding: 32,
  },
  successIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  successIconText: {
    fontSize: 44,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
    textAlign: 'center',
  },
  successDetails: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 32,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loginButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 160,
    height: 46,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  signOutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginTop: 12,
    minWidth: 160,
    height: 42,
  },
  signOutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
