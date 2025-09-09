
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore"
import { useEffect, useState } from "react"
import { Alert, Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { auth, db } from "../../lib/firebase"
import NotificationService from "../../lib/notificationService"

const { width } = Dimensions.get("window")

type FamilyNotification = {
  id: string
  familyMemberId: string
  familyMemberName: string
  familyMemberEmail: string
  timestamp: Date
  location: {
    latitude: number
    longitude: number
  }
  distance: number
  message: string
  isRead: boolean
}

export default function TabTwoScreen() {
  const [familyNotifications, setFamilyNotifications] = useState<FamilyNotification[]>([])
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    if (auth.currentUser) {
      fetchUserNotifications()

      // Set up real-time listener for notifications
      const userRef = doc(db, "users", auth.currentUser.uid)
      const unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data()
          if (data.notifications && Array.isArray(data.notifications)) {
            // Sort notifications by timestamp (recent first)
            const sortedNotifications = data.notifications.sort(
              (a: FamilyNotification, b: FamilyNotification) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
            )
            setFamilyNotifications(sortedNotifications)
          }
        }
      })

      // Setup notification listeners for this tab
      const notificationListeners = NotificationService.setupNotificationListeners()

      return () => {
        unsubscribe()
        NotificationService.removeNotificationListeners(notificationListeners)
      }
    }
  }, [auth.currentUser])

  const fetchUserNotifications = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser!.uid))
      if (userDoc.exists()) {
        const data = userDoc.data()
        setUserData(data)

        if (data.notifications && Array.isArray(data.notifications)) {
          // Sort notifications by timestamp (recent first)
          const sortedNotifications = data.notifications.sort(
            (a: FamilyNotification, b: FamilyNotification) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )
          setFamilyNotifications(sortedNotifications)
        }
      }
    } catch (error) {
      console.error("Error fetching user notifications:", error)
    }
  }

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const userRef = doc(db, "users", auth.currentUser!.uid)
      const updatedNotifications = familyNotifications.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification,
      )

      await updateDoc(userRef, { notifications: updatedNotifications })
      setFamilyNotifications(updatedNotifications)
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const clearNotification = async (notificationId: string) => {
    try {
      const userRef = doc(db, "users", auth.currentUser!.uid)
      const updatedNotifications = familyNotifications.filter((notification) => notification.id !== notificationId)

      await updateDoc(userRef, { notifications: updatedNotifications })
      setFamilyNotifications(updatedNotifications)
      console.log(`🗑️ Cleared notification: ${notificationId}`)
    } catch (error) {
      console.error("Error clearing notification:", error)
    }
  }

  const clearAllNotifications = async () => {
    try {
      const userRef = doc(db, "users", auth.currentUser!.uid)

      // Clear all notifications from Firestore collection
      await updateDoc(userRef, { notifications: [] })

      // Clear local state
      setFamilyNotifications([])

      // Also clear any distance alerts that might exist in the user's data
      // This ensures complete cleanup of all alert-related data
      await updateDoc(userRef, {
        notifications: [],
        distanceAlerts: [], // Clear distance alerts if they exist
      })

      console.log("🗑️ Cleared ALL notifications and distance alerts from Firestore collection")

      // Show success message
      Alert.alert("Success", "All notifications and alerts have been completely cleared from the database!", [
        { text: "OK", style: "default" },
      ])
    } catch (error) {
      console.error("Error clearing all notifications:", error)
      Alert.alert("Error", "Failed to clear notifications. Please try again.", [{ text: "OK", style: "default" }])
    }
  }

  const renderNotification = ({ item }: { item: FamilyNotification }) => (
    <View style={[styles.notificationCard, item.isRead && styles.notificationCardRead]}>
      <View style={styles.notificationHeader}>
        <View style={styles.notificationTitleContainer}>
          <View style={[styles.familyIconContainer, !item.isRead && styles.familyIconContainerUnread]}>
            <Text style={styles.familyIcon}>👥</Text>
          </View>
          <View style={styles.titleContainer}>
            <Text style={[styles.notificationTitle, item.isRead && styles.notificationTitleRead]}>Family Alert</Text>
            {!item.isRead && <View style={styles.unreadIndicator} />}
          </View>
        </View>
        <Text style={styles.notificationTime}>{new Date(item.timestamp).toLocaleString()}</Text>
      </View>

      <Text style={[styles.notificationMessage, item.isRead && styles.notificationMessageRead]}>{item.message}</Text>

      <View style={styles.notificationDetails}>
        <View style={styles.notificationDetailRow}>
          <View style={styles.detailIconContainer}>
            <Text style={styles.detailIcon}>📍</Text>
          </View>
          <Text style={styles.notificationDetailText}>
            Distance: <Text style={styles.notificationDetailValue}>{item.distance.toFixed(2)} km</Text>
          </Text>
        </View>
        <View style={styles.notificationDetailRow}>
          <View style={styles.detailIconContainer}>
            <Text style={styles.detailIcon}>🌍</Text>
          </View>
          <Text style={styles.notificationDetailText}>
            Location:{" "}
            <Text style={styles.notificationDetailValue}>
              {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
            </Text>
          </Text>
        </View>
      </View>

      <View style={styles.notificationActions}>
        {!item.isRead && (
          <TouchableOpacity
            style={styles.markReadButton}
            onPress={() => markNotificationAsRead(item.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.markReadButtonText}>Mark Read</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.clearButton} onPress={() => clearNotification(item.id)} activeOpacity={0.8}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Family Alerts</Text>
          <Text style={styles.headerSubtitle}>Stay connected with your family</Text>
        </View>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>🔔</Text>
        </View>
      </View>

      {/* Notification Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Text style={styles.statIcon}>📊</Text>
          </View>
          <Text style={styles.statNumber}>{familyNotifications.length}</Text>
          <Text style={styles.statLabel}>Total Alerts</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Text style={styles.statIcon}>🔴</Text>
          </View>
          <Text style={styles.statNumber}>{familyNotifications.filter((n) => !n.isRead).length}</Text>
          <Text style={styles.statLabel}>Unread</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Text style={styles.statIcon}>📍</Text>
          </View>
          <Text style={styles.statNumber}>{familyNotifications.filter((n) => n.distance >= 1).length}</Text>
          <Text style={styles.statLabel}>Far Away</Text>
        </View>
      </View>

      {/* Notifications List */}
      {familyNotifications.length > 0 ? (
        <FlatList
          data={familyNotifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          style={styles.notificationsList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.notificationsContent}
        />
      ) : (
        <View style={styles.noNotificationsContainer}>
          <View style={styles.noNotificationsIcon}>
            <Text style={styles.noNotificationsIconText}>📱</Text>
          </View>
          <Text style={styles.noNotificationsText}>No Family Alerts Yet</Text>
          <Text style={styles.noNotificationsSubtext}>
            You'll receive notifications here when family members are far away (500m+)
          </Text>
          <View style={styles.noNotificationsInfo}>
            <Text style={styles.noNotificationsInfoText}>
              💡 Tip: Make sure location sharing is enabled for all family members
            </Text>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      {familyNotifications.length > 0 && (
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.quickActionButton}
            activeOpacity={0.8}
            onPress={() => {
              const unreadCount = familyNotifications.filter((n) => !n.isRead).length
              if (unreadCount > 0) {
                Alert.alert("Mark All as Read", `Mark ${unreadCount} unread notifications as read?`, [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Mark All Read",
                    style: "default",
                    onPress: () => {
                      familyNotifications.forEach((notification) => {
                        if (!notification.isRead) {
                          markNotificationAsRead(notification.id)
                        }
                      })
                    },
                  },
                ])
              } else {
                Alert.alert("All Read", "All notifications are already marked as read!")
              }
            }}
          >
            <Text style={styles.quickActionButtonText}>Mark All Read</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionButton, styles.quickActionButtonSecondary]}
            activeOpacity={0.8}
            onPress={() => {
              Alert.alert(
                "Clear All Notifications",
                "Are you sure you want to clear all notifications? This action cannot be undone.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Clear All",
                    style: "destructive",
                    onPress: clearAllNotifications,
                  },
                ],
              )
            }}
          >
            <Text style={[styles.quickActionButtonText, styles.quickActionButtonTextSecondary]}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: "#FAFBFC",
  },

  // Header - Enhanced gradient-like effect and improved spacing
  header: {
    backgroundColor: "#FF8C00",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
    position: "relative",
    zIndex: 1,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  headerIcon: {
    width: 44,
    height: 44,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerIconText: {
    fontSize: 18,
  },

  // Stats Container - Improved spacing and card design
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    marginTop: -10,
    zIndex: 2,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F1F3F4",
  },
  statIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: "#FFF8F0",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#FFE4CC",
  },
  statIcon: {
    fontSize: 14,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FF8C00",
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
    fontWeight: "500",
    letterSpacing: 0.2,
  },

  // Notifications List
  notificationsList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  notificationsContent: {
    paddingBottom: 24,
  },

  // No Notifications - Enhanced empty state design
  noNotificationsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  noNotificationsIcon: {
    width: 100,
    height: 100,
    backgroundColor: "#FFF8F0",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 3,
    borderColor: "#FFE4CC",
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  noNotificationsIconText: {
    fontSize: 48,
  },
  noNotificationsText: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  noNotificationsSubtext: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
    fontWeight: "500",
  },
  noNotificationsInfo: {
    backgroundColor: "#FFF8F0",
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FFE4CC",
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  noNotificationsInfoText: {
    fontSize: 14,
    color: "#D97706",
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "600",
  },

  // Notification Cards - Enhanced card design with better visual hierarchy
  notificationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F3F4",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  notificationCardRead: {
    borderColor: "#E5E7EB",
    backgroundColor: "#FAFBFC",
    opacity: 0.85,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  notificationTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  familyIconContainer: {
    width: 44,
    height: 44,
    backgroundColor: "#FFF8F0",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFE4CC",
  },
  familyIconContainerUnread: {
    backgroundColor: "#FF8C00",
    borderColor: "#FF8C00",
  },
  familyIcon: {
    fontSize: 18,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF8C00",
    letterSpacing: 0.2,
  },
  notificationTitleRead: {
    color: "#9CA3AF",
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    backgroundColor: "#FF8C00",
    borderRadius: 5,
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  notificationMessage: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 20,
    lineHeight: 24,
    fontWeight: "500",
  },
  notificationMessageRead: {
    color: "#6B7280",
  },
  notificationDetails: {
    marginBottom: 24,
    backgroundColor: "#FAFBFC",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F3F4",
  },
  notificationDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailIconContainer: {
    width: 36,
    height: 36,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  detailIcon: {
    fontSize: 14,
  },
  notificationDetailText: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
    fontWeight: "500",
  },
  notificationDetailValue: {
    fontWeight: "700",
    color: "#FF8C00",
  },
  notificationActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  markReadButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  markReadButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  clearButton: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  clearButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // Quick Actions - Enhanced button design with secondary style
  quickActionsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F3F4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 6,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: "#FF8C00",
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  quickActionButtonSecondary: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#FF8C00",
  },
  quickActionButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  quickActionButtonTextSecondary: {
    color: "#FF8C00",
  },
})
