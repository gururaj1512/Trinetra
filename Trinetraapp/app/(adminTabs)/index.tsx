
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { collection, doc, getDoc, getDocs, onSnapshot, orderBy, query } from "firebase/firestore"
import { useEffect, useState } from "react"
import { Dimensions, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { type AlertData, AlertStorage } from "../../lib/alertStorage"
import { auth, db } from "../../lib/firebase"

const { width, height } = Dimensions.get("window")

interface DashboardStats {
  totalAlerts: number
  unreadAlerts: number
  criticalAlerts: number
  totalMissingReports: number
  findingReports: number
  foundReports: number
  totalUsers: number
  activeUsers: number
}

interface UserData {
  name: string
  role: string
  imageUrl?: string
}

export default function AdminHomeScreen() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalAlerts: 0,
    unreadAlerts: 0,
    criticalAlerts: 0,
    totalMissingReports: 0,
    findingReports: 0,
    foundReports: 0,
    totalUsers: 0,
    activeUsers: 0,
  })
  const [recentAlerts, setRecentAlerts] = useState<AlertData[]>([])
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState<boolean>(true) // Real-time connection status

  useEffect(() => {
    // Initial load
    loadDashboardData()
    loadUserData()

    // Set up real-time listeners
    const currentUser = auth.currentUser
    if (currentUser) {
      const userRef = doc(db, "users", currentUser.uid)

      // Real-time listener for user data and alerts
      const unsubscribeUser = onSnapshot(
        userRef,
        (doc) => {
          if (doc.exists()) {
            const userData = doc.data()
            setUserData(userData as UserData)

            // Update alerts from Firebase
            const firebaseAlerts = userData.futureCrowdDetectionAlerts || []
            const sortedAlerts = firebaseAlerts.sort(
              (a: AlertData, b: AlertData) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
            )

            const unreadCount = sortedAlerts.filter((alert: AlertData) => !alert.isRead).length
            const criticalCount = sortedAlerts.filter((alert: AlertData) => alert.priority === "critical").length

            setRecentAlerts(sortedAlerts.slice(0, 5))

            // Update stats with alerts data
            setStats((prevStats) => ({
              ...prevStats,
              totalAlerts: sortedAlerts.length,
              unreadAlerts: unreadCount,
              criticalAlerts: criticalCount,
            }))

            setIsConnected(true)
          }
        },
        (error) => {
          console.error("Error listening to user data:", error)
          setIsConnected(false)
        },
      )

      // Real-time listener for missing person reports
      const missingQuery = query(collection(db, "missingPersonReports"), orderBy("createdAt", "desc"))
      const unsubscribeMissing = onSnapshot(
        missingQuery,
        (snapshot) => {
          const missingReports = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

          const findingCount = missingReports.filter((report: any) => report.status === "finding").length
          const foundCount = missingReports.filter((report: any) => report.status === "found").length

          setStats((prevStats) => ({
            ...prevStats,
            totalMissingReports: missingReports.length,
            findingReports: findingCount,
            foundReports: foundCount,
          }))

          setIsConnected(true)
        },
        (error) => {
          console.error("Error listening to missing reports:", error)
          setIsConnected(false)
        },
      )

      // Real-time listener for users data
      const usersQuery = query(collection(db, "users"))
      const unsubscribeUsers = onSnapshot(
        usersQuery,
        (snapshot) => {
          const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

          const activeUsersCount = users.filter((user: any) => user.isActive).length

          setStats((prevStats) => ({
            ...prevStats,
            totalUsers: users.length,
            activeUsers: activeUsersCount,
          }))

          setIsConnected(true)
        },
        (error) => {
          console.error("Error listening to users data:", error)
          setIsConnected(false)
        },
      )

      // Cleanup listeners on component unmount
      return () => {
        unsubscribeUser()
        unsubscribeMissing()
        unsubscribeUsers()
      }
    } else {
      console.warn("No authenticated user, loading from local storage only")
      loadDashboardData()
      loadUserData()
    }
  }, [])

  const loadUserData = async () => {
    try {
      const user = auth.currentUser
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData)
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load alerts data
      const alerts = await AlertStorage.getAllAlerts()
      const unreadCount = alerts.filter((alert) => !alert.isRead).length
      const criticalCount = alerts.filter((alert) => alert.priority === "critical").length

      // Load missing person reports
      const missingQuery = query(collection(db, "missingPersonReports"), orderBy("createdAt", "desc"))
      const missingSnapshot = await getDocs(missingQuery)
      const missingReports = missingSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

      const findingCount = missingReports.filter((report: any) => report.status === "finding").length
      const foundCount = missingReports.filter((report: any) => report.status === "found").length

      // Load users data
      const usersQuery = query(collection(db, "users"))
      const usersSnapshot = await getDocs(usersQuery)
      const users = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

      const activeUsersCount = users.filter((user: any) => user.isActive).length

      setStats({
        totalAlerts: alerts.length,
        unreadAlerts: unreadCount,
        criticalAlerts: criticalCount,
        totalMissingReports: missingReports.length,
        findingReports: findingCount,
        foundReports: foundCount,
        totalUsers: users.length,
        activeUsers: activeUsersCount,
      })

      // Set recent alerts (last 5)
      setRecentAlerts(alerts.slice(0, 5))
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getCrowdLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "low":
        return "#4CAF50"
      case "medium":
        return "#FF9800"
      case "high":
        return "#F44336"
      case "very_high":
        return "#9C27B0"
      default:
        return "#2196F3"
    }
  }

  const getCrowdLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case "low":
        return "checkmark-circle"
      case "medium":
        return "warning"
      case "high":
        return "alert-circle"
      case "very_high":
        return "close-circle"
      default:
        return "information-circle"
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffHours > 0) {
      return `${diffHours}h ago`
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`
    } else {
      return "Just now"
    }
  }

  const StatCard = ({
    title,
    value,
    subtitle,
    color,
    icon,
  }: {
    title: string
    value: number | string
    subtitle: string
    color: string
    icon: string
  }) => (
    <View style={[styles.statCard, { backgroundColor: color }]} key={title}>
      <View style={styles.statContent}>
        <View style={styles.statHeader}>
          <Text style={styles.statValue}>{value}</Text>
          <Ionicons name={icon as any} size={24} color="rgba(255,255,255,0.8)" />
        </View>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statSubtitle}>{subtitle}</Text>
      </View>
    </View>
  )

  const ProjectCard = ({
    title,
    status,
    progress,
    color,
    icon,
  }: {
    title: string
    status: string
    progress: string
    color: string
    icon: string
  }) => (
    <View style={styles.projectCard}>
      <View style={styles.projectHeader}>
        <View style={[styles.projectIcon, { backgroundColor: color }]} key={title}>
          <Ionicons name={icon as any} size={20} color="#fff" />
        </View>
        <View style={styles.projectInfo}>
          <Text style={styles.projectTitle}>{title}</Text>
          <Text style={styles.projectStatus}>{status}</Text>
        </View>
      </View>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: progress as any, backgroundColor: color }]} />
        </View>
        <Text style={styles.progressText}>{progress}</Text>
      </View>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Simplified Admin Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={[styles.liveIndicator, { backgroundColor: isConnected ? "#16A34A" : "#F44336" }]}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>{isConnected ? "LIVE" : "OFFLINE"}</Text>
            </View>

            <Text style={styles.adminTitle}>Admin Dashboard</Text>

            <TouchableOpacity style={styles.profileButton} onPress={() => router.push("/profile")}>
              {userData?.imageUrl ? (
                <Image source={{ uri: userData.imageUrl }} style={styles.profileImage} />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Ionicons name="person" size={24} color="#FF8C00" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Admin Info Section */}
        <View style={styles.adminInfoSection}>
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeEmoji}>👋</Text>
              <View style={styles.welcomeTextContainer}>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.userName}>{userData?.name || "Administrator"}</Text>
              </View>
            </View>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: isConnected ? "#16A34A" : "#F44336" }]} />
              <Text style={[styles.statusText, { color: isConnected ? "#16A34A" : "#F44336" }]}>
                {isConnected ? "All systems operational" : "Connection issues detected"}
              </Text>
            </View>
          </View>
        </View>

        {/* Key Performance Indicators */}
        <View style={styles.section}>
          <View style={styles.statsGrid}>
            <StatCard
              title="Active Alerts"
              value={stats.totalAlerts}
              subtitle={`${stats.unreadAlerts} New Today`}
              color="#4CAF50"
              icon="notifications"
            />
            <StatCard
              title="Critical Issues"
              value={stats.criticalAlerts}
              subtitle={`${stats.criticalAlerts} New in 7 Days`}
              color="#F44336"
              icon="warning"
            />
            <StatCard
              title="Missing Reports"
              value={stats.findingReports}
              subtitle={`${stats.findingReports} New Today`}
              color="#FF9800"
              icon="person-search"
            />
            <StatCard
              title="Active Users"
              value={stats.activeUsers}
              subtitle="No Upcoming"
              color="#2196F3"
              icon="people"
            />
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activities</Text>
            <TouchableOpacity onPress={() => router.push("/(adminTabs)/alerts")}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentAlerts.length > 0 ? (
            <View style={styles.activitiesContainer}>
              {recentAlerts.slice(0, 3).map((alert, index) => (
                <ProjectCard
                  key={alert.id}
                  title={`Crowd Analysis - ${alert.data.crowd_level.toUpperCase()}`}
                  status={alert.priority === "critical" ? "Critical" : "Active"}
                  progress={`${Math.floor(Math.random() * 100)}%`}
                  color={getCrowdLevelColor(alert.data.crowd_level)}
                  icon={getCrowdLevelIcon(alert.data.crowd_level)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No recent activities</Text>
            </View>
          )}
        </View>

        {/* System Overview - Beautiful Design */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>System Overview</Text>
            <TouchableOpacity onPress={() => router.push("/(adminTabs)/alerts")}>
              <Text style={styles.seeAllText}>View Details</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.overviewContainer}>
            {/* Main Status Card */}
            <View style={styles.mainStatusCard}>
              <View style={styles.statusHeader}>
                <View style={styles.statusIconContainer}>
                  <Ionicons name="shield-checkmark" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.statusInfo}>
                  <Text style={styles.statusTitle}>System Health</Text>
                  <Text style={styles.statusSubtitle}>
                    {isConnected ? "All systems operational" : "Connection issues detected"}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: isConnected ? "#DCFCE7" : "#FFEBEE" }]}>
                  <Text style={[styles.statusBadgeText, { color: isConnected ? "#16A34A" : "#F44336" }]}>
                    {isConnected ? "99.9%" : "OFFLINE"}
                  </Text>
                </View>
              </View>

              <View style={styles.statusMetrics}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{stats.totalUsers}</Text>
                  <Text style={styles.metricLabel}>Total Users</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{stats.activeUsers}</Text>
                  <Text style={styles.metricLabel}>Active Now</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>24/7</Text>
                  <Text style={styles.metricLabel}>Uptime</Text>
                </View>
              </View>
            </View>

            {/* Performance Cards */}
            <View style={styles.performanceGrid}>
              <View style={styles.performanceCard}>
                <View style={styles.performanceIcon}>
                  <Ionicons name="speedometer" size={24} color="#4CAF50" />
                </View>
                <Text style={styles.performanceTitle}>Response Time</Text>
                <Text style={styles.performanceValue}>45ms</Text>
                <View style={styles.performanceBar}>
                  <View style={[styles.performanceFill, { width: "85%", backgroundColor: "#4CAF50" }]} />
                </View>
              </View>

              <View style={styles.performanceCard}>
                <View style={styles.performanceIcon}>
                  <Ionicons name="server" size={24} color="#2196F3" />
                </View>
                <Text style={styles.performanceTitle}>Server Load</Text>
                <Text style={styles.performanceValue}>23%</Text>
                <View style={styles.performanceBar}>
                  <View style={[styles.performanceFill, { width: "23%", backgroundColor: "#2196F3" }]} />
                </View>
              </View>

              <View style={styles.performanceCard}>
                <View style={styles.performanceIcon}>
                  <Ionicons name="wifi" size={24} color="#FF9800" />
                </View>
                <Text style={styles.performanceTitle}>Network</Text>
                <Text style={styles.performanceValue}>Excellent</Text>
                <View style={styles.performanceBar}>
                  <View style={[styles.performanceFill, { width: "95%", backgroundColor: "#FF9800" }]} />
                </View>
              </View>

              <View style={styles.performanceCard}>
                <View style={styles.performanceIcon}>
                  <Ionicons name="battery-charging" size={24} color="#9C27B0" />
                </View>
                <Text style={styles.performanceTitle}>Battery</Text>
                <Text style={styles.performanceValue}>87%</Text>
                <View style={styles.performanceBar}>
                  <View style={[styles.performanceFill, { width: "87%", backgroundColor: "#9C27B0" }]} />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push("/(adminTabs)/alerts")}>
              <View style={[styles.quickActionIcon, { backgroundColor: "#F44336" }]}>
                <Ionicons name="notifications" size={24} color="#fff" />
              </View>
              <Text style={styles.quickActionText}>View Alerts</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push("/(adminTabs)/missing")}>
              <View style={[styles.quickActionIcon, { backgroundColor: "#FF9800" }]}>
                <Ionicons name="person" size={24} color="#fff" />
              </View>
              <Text style={styles.quickActionText}>Missing Persons</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push("/(adminTabs)/disaster")}>
              <View style={[styles.quickActionIcon, { backgroundColor: "#2196F3" }]}>
                <Ionicons name="videocam" size={24} color="#fff" />
              </View>
              <Text style={styles.quickActionText}>CCTV Monitor</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push("/(adminTabs)/unusual-detection")}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: "#9C27B0" }]}>
                <Ionicons name="eye" size={24} color="#fff" />
              </View>
              <Text style={styles.quickActionText}>Unusual Detection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF", // White background to match header
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF", // White background
  },
  loadingText: {
    fontSize: 18,
    color: "#1E293B", // Dark text for white background
    fontWeight: "600", // Slightly bolder for better readability
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 25,
    paddingBottom: 20, // Increased padding for better spacing
    paddingHorizontal: 24, // Increased horizontal padding
    borderBottomLeftRadius: 0, // Removed rournded corners for cleaner look
    borderBottomRightRadius: 0,
    marginBottom: 0, // Removed margin for seamless design
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0", // Softer border color
  },
  topStatusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9", // Professional gray background
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8, // Less rounded for professional look
  },
  timeText: {
    fontSize: 12,
    color: "#64748B", // Professional gray text
    marginLeft: 6,
    fontWeight: "500",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  adminTitle: {
    fontSize: 20, // Larger title for hierarchy
    fontWeight: "700", // Bolder weight
    color: "#1E293B", // Darker professional color
    textAlign: "center",
    flex: 1,
  },
  welcomeSection: {
    flex: 1,
  },
  greetingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  welcomeEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  greetingText: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14, // Slightly smaller for hierarchy
    color: "#64748B", // Professional gray
    marginBottom: 2,
    fontWeight: "500",
  },
  userName: {
    fontSize: 18, // Larger for emphasis
    fontWeight: "700", // Bolder
    color: "#1E293B", // Professional dark color
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7", // Softer green background
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8, // Less rounded for professional look
    alignSelf: "flex-start",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#16A34A", // Professional green
    marginRight: 8,
  },
  statusText: {
    fontSize: 14, // Consistent sizing
    color: "#16A34A", // Professional green
    fontWeight: "600",
  },
  profileButton: {
    width: 44, // Slightly larger for better touch target
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  profilePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9", // Professional gray
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E2E8F0", // Softer border
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF", // White background to match container
  },
  scrollContent: {
    paddingBottom: 100,
    paddingTop: 16, // Reduced top padding to move content upward
  },
  adminInfoSection: {
    paddingHorizontal: 24, // Consistent padding
    marginTop: 16, // Added margin from top
    marginBottom: 32, // Increased spacing
  },
  welcomeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12, // Less rounded for professional look
    padding: 24, // Increased padding
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1, // Subtle shadow
    },
    shadowOpacity: 0.05, // Very subtle
    shadowRadius: 4,
    elevation: 2, // Reduced elevation
    borderWidth: 1,
    borderColor: "#E2E8F0", // Softer border
  },
  welcomeContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  welcomeTextContainer: {
    marginLeft: 12,
  },
  quickStatsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#F8FAFC", // Professional background
    borderRadius: 12, // Less rounded
    paddingVertical: 20, // Increased padding
    paddingHorizontal: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0", // Added border
  },
  quickStat: {
    alignItems: "center",
    flex: 1,
  },
  quickStatValue: {
    fontSize: 18, // Larger for emphasis
    fontWeight: "700", // Bolder
    color: "#1E293B", // Professional dark color
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 14, // Consistent sizing
    color: "#64748B", // Professional gray
    fontWeight: "500",
  },
  quickStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#E2E8F0", // Professional divider color
    marginHorizontal: 16,
  },
  section: {
    marginBottom: 32, // Increased spacing
    paddingHorizontal: 24, // Consistent padding
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20, // Increased spacing
  },
  sectionTitle: {
    fontSize: 18, // Larger for hierarchy
    fontWeight: "700", // Bolder
    color: "#1E293B", // Professional dark color
    marginBottom: 0, // Removed redundant margin
  },
  seeAllText: {
    fontSize: 14, // Smaller for secondary action
    color: "#1E40AF", // Professional blue
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16, // Increased gap
  },
  statCard: {
    width: (width - 64) / 2, // Adjusted for new padding
    borderRadius: 12, // Less rounded
    padding: 24, // Increased padding
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2, // Subtle shadow
    },
    shadowOpacity: 0.08, // More subtle
    shadowRadius: 8,
    elevation: 4, // Reduced elevation
  },
  statContent: {
    flex: 1,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18, // Larger for emphasis
    fontWeight: "700", // Bolder
    color: "#FFFFFF",
  },
  statTitle: {
    fontSize: 14, // Consistent sizing
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12, // Smaller for hierarchy
    color: "rgba(255,255,255,0.8)",
  },
  activitiesContainer: {
    gap: 16, // Increased gap
  },
  projectCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12, // Less rounded
    padding: 24, // Increased padding
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2, // Subtle shadow
    },
    shadowOpacity: 0.05, // Very subtle
    shadowRadius: 8,
    elevation: 2, // Reduced elevation
    borderWidth: 1,
    borderColor: "#E2E8F0", // Added border
  },
  projectHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  projectIcon: {
    width: 48, // Larger icon container
    height: 48,
    borderRadius: 12, // Less rounded
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16, // Increased spacing
  },
  projectInfo: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B", // Professional dark color
    marginBottom: 4,
  },
  projectStatus: {
    fontSize: 14, // Consistent sizing
    color: "#64748B", // Professional gray
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressBar: {
    flex: 1,
    height: 6, // Thinner progress bar
    backgroundColor: "#F1F5F9", // Professional background
    borderRadius: 3,
    marginRight: 12,
    borderWidth: 0, // Removed border for cleaner look
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: "#64748B", // Professional gray
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48, // Increased padding
    backgroundColor: "#FFFFFF",
    borderRadius: 12, // Less rounded
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1, // Subtle shadow
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E2E8F0", // Added border
  },
  emptyText: {
    fontSize: 14, // Consistent sizing
    color: "#64748B", // Professional gray
    marginTop: 12,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16A34A", // Professional green
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8, // Less rounded
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: "600", // Consistent weight
    color: "#FFFFFF",
  },
  overviewContainer: {
    gap: 20, // Increased gap
  },
  mainStatusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16, // Slightly less rounded
    padding: 28, // Increased padding
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4, // Reduced shadow
    },
    shadowOpacity: 0.08, // More subtle
    shadowRadius: 12,
    elevation: 6, // Reduced elevation
    borderWidth: 1,
    borderColor: "#E2E8F0", // Added border
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24, // Increased spacing
  },
  statusIconContainer: {
    width: 64, // Larger icon container
    height: 64,
    borderRadius: 16, // Less rounded
    backgroundColor: "#16A34A", // Professional green
    alignItems: "center",
    justifyContent: "center",
    marginRight: 20, // Increased spacing
    shadowColor: "#16A34A",
    shadowOffset: {
      width: 0,
      height: 2, // Subtle shadow
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 22, // Larger for emphasis
    fontWeight: "700", // Bolder
    color: "#1E293B", // Professional dark color
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: "#64748B", // Professional gray
  },
  statusBadge: {
    backgroundColor: "#DCFCE7", // Softer green background
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8, // Less rounded
  },
  statusBadgeText: {
    fontSize: 12, // Smaller for badge
    fontWeight: "600",
    color: "#16A34A", // Professional green
  },
  statusMetrics: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 24, // Increased padding
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0", // Softer border
  },
  metricItem: {
    alignItems: "center",
    flex: 1,
  },
  metricValue: {
    fontSize: 28, // Larger for emphasis
    fontWeight: "700", // Bolder
    color: "#1E293B", // Professional dark color
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: "#64748B", // Professional gray
    textAlign: "center",
    fontWeight: "500", // Slightly bolder
  },
  metricDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E2E8F0", // Professional divider color
    marginHorizontal: 16,
  },
  performanceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16, // Increased gap
  },
  performanceCard: {
    width: (width - 64) / 2, // Adjusted for new padding
    backgroundColor: "#FFFFFF",
    borderRadius: 12, // Less rounded
    padding: 24, // Increased padding
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2, // Subtle shadow
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E2E8F0", // Added border
  },
  performanceIcon: {
    width: 52, // Larger icon
    height: 52,
    borderRadius: 12, // Less rounded
    backgroundColor: "#F8FAFC", // Professional background
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16, // Increased spacing
  },
  performanceTitle: {
    fontSize: 14, // Consistent sizing
    color: "#64748B", // Professional gray
    marginBottom: 8,
    fontWeight: "500",
  },
  performanceValue: {
    fontSize: 20, // Larger for emphasis
    fontWeight: "700", // Bolder
    color: "#1E293B", // Professional dark color
    marginBottom: 16, // Increased spacing
  },
  performanceBar: {
    height: 4, // Thinner bar
    backgroundColor: "#E2E8F0", // Professional background
    borderRadius: 2,
    overflow: "hidden",
  },
  performanceFill: {
    height: "100%",
    borderRadius: 2,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16, // Increased gap
  },
  quickActionCard: {
    width: (width - 64) / 2, // Adjusted for new padding
    backgroundColor: "#FFFFFF",
    borderRadius: 12, // Less rounded
    padding: 24, // Increased padding
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2, // Subtle shadow
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E2E8F0", // Added border
  },
  quickActionIcon: {
    width: 52, // Larger icon
    height: 52,
    borderRadius: 12, // Less rounded
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16, // Increased spacing
  },
  quickActionText: {
    fontSize: 14, // Consistent sizing
    fontWeight: "600",
    color: "#1E293B", // Professional dark color
    textAlign: "center",
  },
})
