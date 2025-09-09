
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { Dimensions, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native"

const { width } = Dimensions.get("window")

export default function CCTVScreen() {
  const router = useRouter()

  const cctvFeatures = [
    {
      id: 1,
      title: "Crowd Detection",
      description: "Monitor crowd density and detect overcrowding",
      icon: "people",
      color: "#4CAF50",
      route: "/crowdDetection",
    },
    {
      id: 2,
      title: "Face Detection Analysis",
      description: "Advanced facial recognition and analysis",
      icon: "person",
      color: "#2196F3",
      route: "/faceDetectionAnalysis",
    },
    {
      id: 3,
      title: "Future Crowd Alert",
      description: "Predictive crowd management system",
      icon: "trending-up",
      color: "#9C27B0",
      route: "/futureCrowdAlert",
    },
    {
      id: 4,
      title: "Anomaly Detection",
      description: "Detect unusual behavior and suspicious activities",
      icon: "warning",
      color: "#FF5722",
      route: "/unusual-detection",
    },
  ]

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.titleSection}>
              <View style={styles.cctvIconContainer}>
                <Ionicons name="videocam" size={32} color="#3B82F6" />
            </View>
              <View style={styles.titleTextContainer}>
                <Text style={styles.title}>CCTV Monitoring</Text>
                <Text style={styles.subtitle}>Surveillance & Security Center</Text>
              </View>
            </View>
            <View style={styles.statusIndicator}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>LIVE</Text>
            </View>
          </View>
        </View>

        {/* System Overview */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Overview</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <View style={styles.overviewIcon}>
                <Ionicons name="eye" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.overviewValue}>24/7</Text>
              <Text style={styles.overviewLabel}>Monitoring</Text>
                </View>
            <View style={styles.overviewCard}>
              <View style={styles.overviewIcon}>
                <Ionicons name="shield-checkmark" size={24} color="#2196F3" />
              </View>
              <Text style={styles.overviewValue}>100%</Text>
              <Text style={styles.overviewLabel}>Coverage</Text>
            </View>
            <View style={styles.overviewCard}>
              <View style={styles.overviewIcon}>
                <Ionicons name="flash" size={24} color="#FF9800" />
              </View>
              <Text style={styles.overviewValue}>Real-time</Text>
              <Text style={styles.overviewLabel}>Alerts</Text>
                </View>
                </View>
              </View>
              
        {/* CCTV Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Surveillance Features</Text>
          <View style={styles.featuresGrid}>
            {cctvFeatures.map((feature) => (
              <TouchableOpacity key={feature.id} style={styles.featureCard} onPress={() => router.push(feature.route)}>
                <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
                  <Ionicons name={feature.icon as any} size={28} color="#FFFFFF" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
                <View style={styles.featureArrow}>
                  <Ionicons name="chevron-forward" size={20} color="#666666" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionCard}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="play" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>Start Recording</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="pause" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>Pause System</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="settings" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>System Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="download" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>Export Data</Text>
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
    backgroundColor: "#F8FAFC",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  cctvIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  titleTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "500",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#059669",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  section: {
    marginBottom: 28,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 20,
  },
  overviewGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  overviewIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    fontWeight: "500",
  },
  featuresGrid: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 20,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 15,
    color: "#64748B",
    lineHeight: 20,
  },
  featureArrow: {
    marginLeft: 16,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  quickActionCard: {
    width: (width - 64) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  quickActionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    textAlign: "center",
    lineHeight: 20,
  },
})
