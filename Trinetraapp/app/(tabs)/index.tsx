
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { doc, getDoc } from "firebase/firestore"
import { useEffect, useRef, useState } from "react"
import {
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { auth, db } from "../../lib/firebase"

const { width, height } = Dimensions.get("window")

export default function HomeScreen() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState("Just for you")
  const [searchQuery, setSearchQuery] = useState("")

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 17) return "Good Afternoon"
    return "Good Evening"
  }

  const renderPromotionalSlide = ({ item }: { item: (typeof promotionalSlides)[0] }) => (
    <View style={[styles.promoBanner, { backgroundColor: item.backgroundColor }]}>
      <View style={styles.promoContent}>
        <View style={styles.templeInfo}>
          <Text style={styles.promoTitle}>{item.title}</Text>
          <Text style={styles.promoSubtitle}>{item.subtitle}</Text>
          <Text style={styles.promoBrand}>{item.brand}</Text>
        </View>
        <TouchableOpacity style={styles.shopNowButton}>
          <Text style={styles.shopNowText}>{item.buttonText}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.promoImageContainer}>
        <Image 
          source={{ uri: item.image }} 
          style={styles.templeImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.emojiCorner}>
        <Text style={styles.promoEmoji}>{item.emoji}</Text>
      </View>
    </View>
  )

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentSlideIndex(viewableItems[0].index)
    }
  }).current

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current

  const [onlineFamilyCount, setOnlineFamilyCount] = useState(0)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)

  // Popular Spiritual Spots of Mahadev in Ujjain
  const promotionalSlides = [
    {
      id: 1,
      title: "Mahakaleshwar Temple",
      subtitle: "Jyotirlinga of Lord Shiva",
      brand: "Ujjain, Madhya Pradesh",
      emoji: "ॐ",
      backgroundColor: "#FF8C00",
      buttonText: "Visit Now",
      image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&h=300&fit=crop",
    },
    {
      id: 2,
      title: "Bade Ganeshji Ka Mandir",
      subtitle: "Sacred Ganesha Temple",
      brand: "Near Mahakaleshwar",
      emoji: "ॐ",
      backgroundColor: "#4ECDC4",
      buttonText: "Explore",
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
    },
    {
      id: 3,
      title: "Harsiddhi Temple",
      subtitle: "Goddess Annapurna",
      brand: "Sacred Shakti Peeth",
      emoji: "ॐ",
      backgroundColor: "#9C27B0",
      buttonText: "Darshan",
      image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=300&fit=crop",
    },
    {
      id: 4,
      title: "Kal Bhairav Temple",
      subtitle: "Lord of Time & Death",
      brand: "Ancient Shiva Temple",
      emoji: "ॐ",
      backgroundColor: "#FF6B6B",
      buttonText: "Seek Blessings",
      image: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=400&h=300&fit=crop",
    },
    {
      id: 5,
      title: "Mangalnath Temple",
      subtitle: "Birthplace of Mars",
      brand: "Astrological Significance",
      emoji: "ॐ",
      backgroundColor: "#E91E63",
      buttonText: "Worship",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
    },
    {
      id: 6,
      title: "Chintaman Ganesh Temple",
      subtitle: "Wish Fulfilling Ganesha",
      brand: "Ancient Temple",
      emoji: "ॐ",
      backgroundColor: "#795548",
      buttonText: "Make Wishes",
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
    },
    
  ]

  useEffect(() => {
    fetchOnlineFamilyCount()
  }, [])

  // Auto-scroll functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlideIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % promotionalSlides.length
        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true })
        return nextIndex
      })
    }, 4000) // Change slide every 4 seconds

    return () => clearInterval(interval)
  }, [])

  const fetchOnlineFamilyCount = async () => {
    try {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          const familyMembers = userData.familyMembers || []
          // Count family members who are currently online (you can add online status logic here)
          setOnlineFamilyCount(familyMembers.length)
        }
      }
    } catch (error) {
      console.error("Error fetching family count:", error)
    }
  }

  const userServices = [
    { 
      id: 1, 
      name: "Family Tracking",
      description: "Track family members",
      image: "👨‍👩‍👧‍👦",
      time: "24/7",
      route: "/(tabs)/map",
      color: "#4CAF50",
    },
    { 
      id: 2, 
      name: "Emergency Help",
      description: "Get immediate help",
      image: "🚨",
      time: "24/7",
      route: "/(tabs)/medical",
      color: "#F44336",
    },
    { 
      id: 3, 
      name: "Ambulance Request",
      description: "Request ambulance",
      image: "🚑",
      time: "24/7",
      route: "/user-ambulance-request",
      color: "#FF9800",
    },
    { 
      id: 4, 
      name: "Online Family",
      description: `${onlineFamilyCount} members online`, 
      image: "👥",
      time: "Live",
      route: "/(tabs)/explore",
      color: "#2196F3",
    },
    { 
      id: 5, 
      name: "Family Alerts",
      description: "Family notifications",
      image: "🔔",
      time: "Live",
      route: "/(tabs)/explore",
      color: "#9C27B0",
    },
    { 
      id: 6, 
      name: "Missing Person",
      description: "Find lost people",
      image: "🔍",
      time: "Live",
      route: "/(tabs)/missing-person",
      color: "#FF5722",
    },
    { 
      id: 7, 
      name: "Trinetra",
      description: "AI assistance",
      image: "🤖",
      time: "24/7",
      route: "/(tabs)/trinetra-webview",
      color: "#795548",
    },
    { 
      id: 8, 
      name: "Emergency Offline",
      description: "24/7 Emergency Service",
      image: "🚨",
      time: "Live",
      route: "/emergency-offline-service",
      color: "#E91E63",
    },
    { 
      id: 9, 
      name: "Profile",
      description: "Manage your account",
      image: "👤",
      time: "Settings",
      route: "/profile",
      color: "#607D8B",
    },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.header}>
        <View style={styles.locationSection}>
          <View style={styles.locationIconContainer}>
          <Text style={styles.locationIcon}>📍</Text>
          </View>
          <Text style={styles.locationText}>Sangam, Prayagraj</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={() => router.push("/profile")}>
          <Ionicons name="person-outline" size={18} color="#FF8C00" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.greetingSection}>
          <View style={styles.greetingLeft}>
            <View style={styles.profileImageContainer}>
            <View style={styles.profileImage}>
                <Ionicons name="person" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.onlineIndicator} />
            </View>
            <View style={styles.greetingText}>
              <Text style={styles.greetingName}>Hey, Devotee</Text>
              <Text style={styles.greetingTime}>{getGreeting()}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={22} color="#FF8C00" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#FF8C00" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search services, help, or family..."
              placeholderTextColor="#999999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="options-outline" size={20} color="#FF8C00" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.carouselContainer}>
          <FlatList
            ref={flatListRef}
            data={promotionalSlides}
            renderItem={renderPromotionalSlide}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            style={styles.carousel}
          />

          <View style={styles.paginationContainer}>
            {promotionalSlides.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.paginationDot, index === currentSlideIndex && styles.paginationDotActive]}
                onPress={() => {
                  setCurrentSlideIndex(index)
                  flatListRef.current?.scrollToIndex({ index, animated: true })
                }}
              />
            ))}
          </View>
        </View>

        <View style={styles.servicesSection}>
          <View style={styles.sectionHeader}>
            <View>
            <Text style={styles.sectionTitle}>My Services</Text>
              <Text style={styles.sectionSubtitle}>Quick access to all features</Text>
            </View>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See all</Text>
              <Ionicons name="arrow-forward" size={14} color="#FF8C00" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.servicesGrid}>
            {userServices.map((service) => (
              <TouchableOpacity 
                key={service.id} 
                style={styles.serviceCard}
                onPress={() => router.push(service.route as any)}
              >
                <View style={[styles.serviceIconContainer, { backgroundColor: service.color + "15" }]}>
                  <Text style={styles.serviceIcon}>{service.image}</Text>
                </View>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceDescription}>{service.description}</Text>
                <View style={styles.serviceFooter}>
                  <View style={[styles.serviceTimeContainer, { backgroundColor: service.color + "20" }]}>
                  <Text style={[styles.serviceTime, { color: service.color }]}>{service.time}</Text>
                  </View>
                  <View style={[styles.serviceArrow, { backgroundColor: service.color + "15" }]}>
                    <Ionicons name="arrow-forward" size={14} color={service.color} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFBFC",
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  locationSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  locationIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFF4E6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  locationIcon: {
    fontSize: 14,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1D29",
    letterSpacing: 0.3,
  },
  profileButton: {
    position: "absolute",
    right: 24,
    top: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#FF8C00",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF8C00",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  scrollView: {
    flex: 1,
  },
  greetingSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  greetingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  profileImageContainer: {
    position: "relative",
    marginRight: 16,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FF8C00",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF8C00",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  greetingText: {
    flex: 1,
  },
  greetingName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1D29",
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  greetingTime: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF4E6",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#F44336",
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  searchSection: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
    paddingVertical: 4,
  },
  filterButton: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  carouselContainer: {
    marginBottom: 24,
  },
  carousel: {
    height: width < 400 ? 200 : width < 500 ? 220 : 240,
  },
  promoBanner: {
    marginHorizontal: width < 400 ? 16 : width < 500 ? 20 : 24,
    borderRadius: 20,
    padding: width < 400 ? 20 : width < 500 ? 24 : 28,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    width: width - (width < 400 ? 32 : width < 500 ? 40 : 48),
    minHeight: width < 400 ? 160 : width < 500 ? 180 : 200,
    position: 'relative',
  },
  promoContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  templeInfo: {
    flex: 1,
  },
  promoTitle: {
    fontSize: width < 400 ? 18 : width < 500 ? 22 : 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: 0.2,
    lineHeight: width < 400 ? 22 : width < 500 ? 26 : 28,
  },
  promoSubtitle: {
    fontSize: width < 400 ? 14 : width < 500 ? 16 : 18,
    color: "rgba(255, 255, 255, 0.95)",
    marginBottom: 2,
    fontWeight: "500",
    lineHeight: width < 400 ? 18 : width < 500 ? 20 : 22,
  },
  promoBrand: {
    fontSize: width < 400 ? 12 : width < 500 ? 14 : 15,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 16,
    fontWeight: "600",
    lineHeight: width < 400 ? 16 : width < 500 ? 18 : 20,
  },
  shopNowButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: width < 400 ? 16 : width < 500 ? 20 : 24,
    paddingVertical: width < 400 ? 8 : width < 500 ? 10 : 12,
    borderRadius: 20,
    alignSelf: "flex-start",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  shopNowText: {
    fontSize: width < 400 ? 14 : width < 500 ? 16 : 18,
    fontWeight: "600",
    color: "#FF8C00",
    letterSpacing: 0.2,
    lineHeight: width < 400 ? 18 : width < 500 ? 20 : 22,
  },
  promoImageContainer: {
    marginTop: width < 400 ? 30 : width < 500 ? 35 : 40,
    width: width < 400 ? 140 : width < 500 ? 160 : 170,
    height: width < 400 ? 130 : width < 500 ? 150 : 160,
    borderRadius: 24,
    marginLeft: width < 400 ? 16 : width < 500 ? 20 : 24,
    position: 'relative',
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  templeImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  emojiCorner: {
    position: 'absolute',
    top: 5,
    right: width < 400 ? 8 : width < 500 ? 12 : 16,
    width: width < 400 ? 40 : width < 500 ? 48 : 52,
    height: width < 400 ? 40 : width < 500 ? 48 : 52,
    borderRadius: width < 400 ? 20 : width < 500 ? 24 : 26,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  promoEmoji: {
    color: "#FFFFFF",
    fontSize: width < 400 ? 20 : width < 500 ? 24 : 26,
    fontWeight: 'bold',
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D1D5DB",
    opacity: 0.5,
  },
  paginationDotActive: {
    backgroundColor: "#FF8C00",
    opacity: 1,
    width: 28,
    height: 8,
    borderRadius: 4,
  },
  servicesSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1D29",
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
    fontWeight: "500",
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF4E6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: "#FF8C00",
    fontWeight: "700",
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  serviceCard: {
    width: (width - 64) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F8F9FA",
  },
  serviceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    alignSelf: "center",
  },
  serviceIcon: {
    fontSize: 28,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1D29",
    marginBottom: 6,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  serviceDescription: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 18,
    fontWeight: "500",
  },
  serviceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceTimeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  serviceTime: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  serviceArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
})
