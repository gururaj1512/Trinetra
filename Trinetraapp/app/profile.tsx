
import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { useRouter } from "expo-router"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { auth, db } from "../lib/firebase"
import FirebaseService from "../lib/firebaseService"

const CLOUDINARY_UPLOAD_PRESET = "sachin"
const CLOUDINARY_CLOUD_NAME = "drxliiejo"

export default function ProfileScreen() {
  const [userData, setUserData] = useState<any>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [familyMembers, setFamilyMembers] = useState<any[]>([])
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [showRelationshipModal, setShowRelationshipModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [relationship, setRelationship] = useState("")
  const user = auth.currentUser
  const router = useRouter()

  useEffect(() => {
    if (user) {
      fetchUserData()
      fetchFamilyMembers()
      // Debug user document
      FirebaseService.debugUserDocument(user.uid)
    }
  }, [user])

  const fetchUserData = async () => {
    if (!user) return
    const docRef = doc(db, "users", user.uid)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) setUserData(docSnap.data())
  }

  const fetchFamilyMembers = async () => {
    try {
      console.log("Profile: Fetching family members for user:", user?.uid)
      const members = await FirebaseService.getFamilyMembers(user?.uid || "")
      console.log("Profile: Received family members:", members)
      setFamilyMembers(members)
    } catch (error) {
      console.error("Profile: Error fetching family members:", error)
    }
  }

  const searchUsers = async (term: string) => {
    if (term.length < 2) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      console.log("Profile: Searching for users with term:", term)
      const results = await FirebaseService.searchUsers(term, user?.uid || "")
      console.log("Profile: Search results:", results)
      setSearchResults(results)
    } catch (error) {
      console.error("Profile: Error searching users:", error)
      Alert.alert("Error", "Failed to search users")
    } finally {
      setSearching(false)
    }
  }

  const handleAddFamilyMember = (user: any) => {
    setSelectedUser(user)
    setShowRelationshipModal(true)
    setShowAddFamilyModal(false)
  }

  const confirmAddFamilyMember = async () => {
    if (!relationship.trim()) {
      Alert.alert("Error", "Please specify the relationship")
      return
    }

    try {
      console.log("Profile: Adding family member:", selectedUser)
      await FirebaseService.addFamilyMember(user?.uid || "", {
        id: selectedUser.id,
        name: selectedUser.name,
        email: selectedUser.email,
        phone: selectedUser.phone || "",
        relationship: relationship.trim(),
      })

      Alert.alert(
        "Success",
        `${selectedUser.name} has been added to your family members. You have also been added to their family members list.`,
      )
      setShowRelationshipModal(false)
      setSelectedUser(null)
      setRelationship("")
      console.log("Profile: Refreshing family members after add")
      fetchFamilyMembers()
    } catch (error: any) {
      console.error("Profile: Error adding family member:", error)
      Alert.alert("Error", error.message || "Failed to add family member")
    }
  }

  const removeFamilyMember = async (memberEmail: string, memberName: string) => {
    Alert.alert(
      "Remove Family Member",
      `Are you sure you want to remove ${memberName} from your family members? This will also remove you from their family members list.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await FirebaseService.removeFamilyMember(user?.uid || "", memberEmail)
              Alert.alert("Success", "Family member removed successfully from both sides")
              fetchFamilyMembers()
            } catch (error) {
              Alert.alert("Error", "Failed to remove family member")
            }
          },
        },
      ],
    )
  }

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permissionResult.granted) {
      alert("Permission to access media library is required!")
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    })
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri
      uploadImageToCloudinary(uri)
    }
  }

  const uploadImageToCloudinary = async (uri: string) => {
    setImageUploading(true)
    const data = new FormData()
    data.append("file", {
      uri,
      type: "image/jpeg",
      name: "profile.jpg",
    } as any)
    data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET)

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: data,
      })
      const file = await res.json()
      if (file.secure_url && user) {
        await updateDoc(doc(db, "users", user.uid), { imageUrl: file.secure_url })
        fetchUserData()
        Alert.alert("Success", "Profile image updated successfully!")
      } else {
        alert("Cloudinary upload failed: " + (file.error?.message || "Unknown error"))
      }
    } catch (err: any) {
      alert("Upload error: " + (err.message || err))
    }
    setImageUploading(false)
  }

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await auth.signOut()
            router.replace("/LoginScreen")
          } catch (error) {
            console.error("Sign out error:", error)
            Alert.alert("Error", "Failed to sign out")
          }
        },
      },
    ])
  }

  if (!userData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            // Try to go back, if that fails, navigate to the appropriate dashboard
            if (router.canGoBack()) {
              router.back()
            } else {
              // Fallback to the appropriate dashboard based on user role
              if (userData?.role === "admin") {
                router.replace("/(adminTabs)")
              } else if (userData?.role === "medicalAdmin") {
                router.replace("/(medicalAdminTabs)")
              } else {
                router.replace("/(tabs)")
              }
            }
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#FFA500" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {userData.imageUrl ? (
              <Image source={{ uri: userData.imageUrl }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={50} color="#ccc" />
              </View>
            )}
            <TouchableOpacity style={styles.editImageButton} onPress={pickImage} disabled={imageUploading}>
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{userData.name}</Text>
          <Text style={styles.userRole}>
            {userData.role === "admin"
              ? "Administrator"
              : userData.role === "medicalAdmin"
                ? "Medical Administrator"
                : "User"}
          </Text>
          <Text style={styles.userEmail}>{userData.email}</Text>
        </View>

        {/* User Information */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={18} color="#FFA500" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{userData.name}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={18} color="#FFA500" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{userData.email}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={18} color="#FFA500" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{userData.phone || "Not provided"}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="card-outline" size={18} color="#FFA500" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Aadhaar</Text>
                <Text style={styles.infoValue}>{userData.aadhaar || "Not provided"}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="shield-outline" size={18} color="#FFA500" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Role</Text>
                <Text style={styles.infoValue}>
                  {userData.role === "admin"
                    ? "Administrator"
                    : userData.role === "medicalAdmin"
                      ? "Medical Administrator"
                      : "User"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Account Information */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={18} color="#FFA500" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>
                  {userData.createdAt ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString() : "Unknown"}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={18} color="#FFA500" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Last Updated</Text>
                <Text style={styles.infoValue}>
                  {userData.updatedAt ? new Date(userData.updatedAt.seconds * 1000).toLocaleDateString() : "Unknown"}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFA500" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={[styles.infoValue, { color: userData.isActive ? "#4CAF50" : "#F44336" }]}>
                  {userData.isActive ? "Active" : "Inactive"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Family Members Section */}
        <View style={styles.infoSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Family Members</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowAddFamilyModal(true)}>
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            {familyMembers.length > 0 ? (
              familyMembers.map((member, index) => (
                <View key={index} style={styles.familyMemberRow}>
                  <View style={styles.familyMemberInfo}>
                    <Text style={styles.familyMemberName}>{member.name}</Text>
                    <Text style={styles.familyMemberDetails}>
                      {member.relationship} • {member.email}
                    </Text>
                    {member.phone && <Text style={styles.familyMemberPhone}>{member.phone}</Text>}
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFamilyMember(member.email, member.name)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#F44336" />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyFamilyContainer}>
                <Ionicons name="people-outline" size={48} color="#CCCCCC" />
                <Text style={styles.emptyFamilyText}>No family members added yet</Text>
                <Text style={styles.emptyFamilySubtext}>
                  Add family members to easily select them when reporting missing persons
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={pickImage} disabled={imageUploading}>
            <Ionicons name="camera" size={20} color="#FFA500" />
            <Text style={styles.actionButtonText}>{imageUploading ? "Uploading..." : "Change Profile Picture"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.signOutButton]} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
            <Text style={[styles.actionButtonText, styles.signOutButtonText]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Family Member Modal */}
      <Modal visible={showAddFamilyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Family Member</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowAddFamilyModal(false)
                  setSearchTerm("")
                  setSearchResults([])
                }}
              >
                <Ionicons name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChangeText={(text) => {
                  setSearchTerm(text)
                  searchUsers(text)
                }}
              />
              {searching && <ActivityIndicator size="small" color="#FFA500" />}
            </View>

            <ScrollView style={styles.searchResultsContainer}>
              {searchResults.map((user, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.searchResultItem}
                  onPress={() => handleAddFamilyMember(user)}
                >
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName}>{user.name}</Text>
                    <Text style={styles.searchResultEmail}>{user.email}</Text>
                    {user.phone && <Text style={styles.searchResultPhone}>{user.phone}</Text>}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
                </TouchableOpacity>
              ))}

              {searchTerm.length >= 2 && searchResults.length === 0 && !searching && (
                <View style={styles.noResultsContainer}>
                  <Ionicons name="search" size={48} color="#CCCCCC" />
                  <Text style={styles.noResultsText}>No users found</Text>
                  <Text style={styles.noResultsSubtext}>Try searching with a different term</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Relationship Modal */}
      <Modal visible={showRelationshipModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Specify Relationship</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowRelationshipModal(false)
                  setSelectedUser(null)
                  setRelationship("")
                }}
              >
                <Ionicons name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>

            <View style={styles.relationshipContainer}>
              <Text style={styles.selectedUserText}>
                Adding: <Text style={styles.selectedUserName}>{selectedUser?.name}</Text>
              </Text>
              <Text style={styles.selectedUserEmail}>{selectedUser?.email}</Text>

              <Text style={styles.relationshipLabel}>Relationship *</Text>
              <TextInput
                style={styles.relationshipInput}
                placeholder="e.g., Father, Mother, Brother, Sister, etc."
                value={relationship}
                onChangeText={setRelationship}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowRelationshipModal(false)
                  setSelectedUser(null)
                  setRelationship("")
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={confirmAddFamilyMember}>
                <Text style={styles.confirmButtonText}>Add Family Member</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  backButton: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#FFF8F0",
    borderWidth: 1,
    borderColor: "#FFE4B5",
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.3,
  },
  headerRight: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingVertical: 15,
    marginBottom: 20,
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F8F9FA",
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 0,
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFF8F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFE4B5",
  },
  editImageButton: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#FF8C00",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  userRole: {
    fontSize: 16,
    color: "#FF8C00",
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  userEmail: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    textAlign: "center",
  },
  infoSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#FFE4B5",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F8F9FA",
  },
  infoContent: {
    marginLeft: 20,
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 3,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  infoValue: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "600",
    lineHeight: 20,
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  actionButtonText: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "600",
    marginLeft: 16,
  },
  signOutButton: {
    borderWidth: 2,
    borderColor: "#FEE2E2",
    backgroundColor: "#FEF2F2",
  },
  signOutButtonText: {
    color: "#DC2626",
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF8C00",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 6,
    letterSpacing: 0.2,
  },
  familyMemberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  familyMemberInfo: {
    flex: 1,
  },
  familyMemberName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 3,
    letterSpacing: -0.1,
  },
  familyMemberDetails: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 3,
    fontWeight: "500",
  },
  familyMemberPhone: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  removeButton: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
  },
  emptyFamilyContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyFamilyText: {
    fontSize: 18,
    color: "#6B7280",
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyFamilySubtext: {
    fontSize: 15,
    color: "#9CA3AF",
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 22,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    width: "92%",
    maxHeight: "85%",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  searchInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    marginRight: 16,
    fontWeight: "500",
    backgroundColor: "#F9FAFB",
  },
  searchResultsContainer: {
    maxHeight: 320,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  searchResultEmail: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 4,
    fontWeight: "500",
  },
  searchResultPhone: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  noResultsContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  noResultsText: {
    fontSize: 18,
    color: "#6B7280",
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  noResultsSubtext: {
    fontSize: 15,
    color: "#9CA3AF",
    textAlign: "center",
    fontWeight: "500",
  },
  relationshipContainer: {
    padding: 24,
  },
  selectedUserText: {
    fontSize: 17,
    color: "#111827",
    marginBottom: 6,
    fontWeight: "600",
  },
  selectedUserName: {
    fontWeight: "800",
    color: "#FF8C00",
  },
  selectedUserEmail: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 24,
    fontWeight: "500",
  },
  relationshipLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  relationshipInput: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontWeight: "500",
    backgroundColor: "#F9FAFB",
  },
  modalButtons: {
    flexDirection: "row",
    padding: 24,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  cancelButtonText: {
    color: "#6B7280",
    fontWeight: "700",
    fontSize: 16,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#FF8C00",
    alignItems: "center",
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.3,
  },
})
