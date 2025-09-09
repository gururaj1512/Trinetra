# Medical Features - Trinetra App

## Overview
The medical module is now a standalone feature accessible directly from the main app, providing access to **real-time hospital data** fetched from web APIs based on your current location.

## Features

### 1. Standalone Medical Module
- **Independent Access**: Medical features are now outside of admin tabs
- **Single Medical Tab**: Only one medical tab screen is visible
- **Combined Functionality**: Map and list views in one integrated screen
- **Medical-themed Design**: Uses distinct medical color scheme (#FF6B6B)

### 2. Real-Time Hospital Data
- **Live Data Fetching**: Scrapes real hospital information from web APIs
- **Location-Based Search**: Automatically finds hospitals near your current location
- **Multiple Data Sources**: 
  - Primary: Google Places API (with your existing API key)
  - Fallback: OpenStreetMap Overpass API
  - Emergency fallback: Basic emergency information
- **Real Information**: Names, addresses, phone numbers, ratings, specialties, opening hours

### 3. Integrated Medical Screen
- **Tab Navigation**: Switch between Map View and List View
- **Interactive Map**: Shows user's current location with a blue person icon
- **Hospital Markers**: 
  - 🔴 **Red markers** for hospitals
  - 🔵 **Teal markers** for medical clinics  
  - 🔵 **Blue markers** for pharmacies
- **User Location**: Automatically detects and displays current position
- **Map Controls**: Includes Google Maps controls and "My Location" button
- **Color-coded Legend**: Explains marker types and colors

### 4. Comprehensive Hospital Information
- **Real-time Data**: Live information from web APIs
- **Detailed Information**: 
  - Name, type, address, distance, and rating
  - Color-coded type badges
  - Star ratings with visual indicators
  - Specialties and medical services
  - Opening hours and availability status
  - Emergency service indicators
- **Interactive Actions**:
  - 📞 **Call button** - Direct phone dialing (when available)
  - 🧭 **Directions button** - Opens Google Maps with navigation
  - 🌐 **Website button** - Visit hospital website (when available)
- **Distance Calculations**: Real distance from your current location

## Technical Implementation

### Dependencies Used
- `react-native-maps`: For interactive map functionality
- `expo-location`: For user location services
- `@expo/vector-icons`: For UI icons and markers
- **Web APIs**: Google Places API + OpenStreetMap Overpass API

### File Structure
```
app/medical/
├── _layout.tsx          # Medical tab layout (single tab)
└── index.tsx            # Integrated medical screen (map + list)

lib/
└── hospitalService.ts   # Real hospital data fetching service
```

### Data Sources
1. **Google Places API** (Primary)
   - Nearby hospital search
   - Hospital details and ratings
   - Phone numbers and websites
   - Opening hours and reviews

2. **OpenStreetMap Overpass API** (Fallback)
   - Medical facilities data
   - Address information
   - Facility types and specialties

3. **Emergency Fallback**
   - Basic emergency information
   - Contact details for emergencies

### Key Features
1. **Location Permissions**: Automatically requests location access
2. **Real-time Data**: Fetches live hospital information from web
3. **Smart Fallbacks**: Multiple API sources for reliability
4. **Responsive Design**: Works on both iOS and Android
5. **Error Handling**: Graceful fallbacks for API failures
6. **Pull-to-Refresh**: Update hospital data manually
7. **Distance Calculations**: Accurate distance using Haversine formula

## Usage Instructions

### Accessing Medical Features
1. Navigate to the main app
2. Tap on the "Medical" tab
3. Use the integrated interface with both map and list views

### Using the Medical Screen
1. **Tab Navigation**: Switch between "Map View" and "List View"
2. **Map View**: 
   - View your current location (blue person icon)
   - Tap on hospital markers for details
   - Use map controls to zoom and navigate
   - See color-coded hospital types
3. **List View**: 
   - View all nearby medical facilities
   - Tap on any hospital item for actions
   - Use Call, Directions, or Website buttons
   - Pull down to refresh data

### Interactive Features
- **Hospital Markers**: Tap to see real-time details
- **Call Function**: Direct phone dialing (when available)
- **Directions**: Opens Google Maps with navigation
- **Website Access**: Visit hospital websites
- **Real-time Location**: Always shows your current position
- **Pull-to-Refresh**: Update hospital data manually

## Data Accuracy & Reliability

### Real Information
- **Hospital Names**: Actual facility names from web databases
- **Addresses**: Real street addresses and locations
- **Phone Numbers**: Actual contact numbers when available
- **Ratings**: Real user ratings from Google Places
- **Specialties**: Actual medical services offered
- **Opening Hours**: Current availability status

### Fallback System
- **Primary API**: Google Places API (most comprehensive)
- **Secondary API**: OpenStreetMap (free, reliable)
- **Emergency Fallback**: Basic emergency information
- **Offline Support**: Cached data when APIs unavailable

## Future Enhancements
- Integration with additional medical APIs
- Emergency contact integration
- Appointment booking capabilities
- Real-time availability status
- User reviews and ratings
- Emergency services integration
- Medical insurance information
- Prescription services

## Permissions Required
- Location access (foreground)
- Phone dialing (for call functionality)
- Internet access (for real-time data fetching)

## Notes
- **Real-time Data**: No more hardcoded sample data
- **API Integration**: Uses your existing Google Maps API key
- **Smart Fallbacks**: Multiple data sources for reliability
- **Location Accuracy**: High-accuracy GPS for precise hospital locations
- **Data Freshness**: Pull-to-refresh for latest information
- **Offline Support**: Graceful degradation when internet unavailable
- **Standalone Module**: No admin access required
- **Single Tab Interface**: Simplified navigation
