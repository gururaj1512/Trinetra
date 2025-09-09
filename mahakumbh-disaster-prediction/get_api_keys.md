# Getting API Keys for Disaster Prediction System

## Quick Setup Guide

### 1. OpenWeatherMap API Key (Required)
**Free tier available**

1. Go to: https://openweathermap.org/api
2. Click "Sign Up" and create a free account
3. After login, go to "My API Keys"
4. Copy your API key
5. Add to `.env` file: `OPENWEATHER_API_KEY=your_key_here`

### 2. Google Maps API Key (Required)
**Free tier available**

1. Go to: https://developers.google.com/maps/documentation/javascript/get-api-key
2. Create a Google Cloud project
3. Enable these APIs:
   - Maps JavaScript API
   - Directions API
   - Distance Matrix API
   - Geocoding API
4. Create credentials (API key)
5. Add to `.env` file: `GOOGLE_MAPS_API_KEY=your_key_here`

### 3. Sentinel Hub Credentials (Optional - for satellite imagery)
**Free tier available**

1. Go to: https://apps.sentinel-hub.com/oauth/register
2. Create an account
3. Register your application
4. Copy `client_id` and `client_secret`
5. Add to `.env` file:
   ```
   SENTINEL_HUB_CLIENT_ID=your_client_id_here
   SENTINEL_HUB_CLIENT_SECRET=your_client_secret_here
   ```

### 4. USGS API Key (Optional)
**Not required for public feeds**

- USGS public feeds work without authentication
- Leave empty in `.env` file: `USGS_API_KEY=`

## Complete .env File Example

```bash
# Required API Keys
OPENWEATHER_API_KEY=your_openweather_api_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Sentinel Hub Authentication (Optional)
SENTINEL_HUB_CLIENT_ID=your_sentinel_hub_client_id_here
SENTINEL_HUB_CLIENT_SECRET=your_sentinel_hub_client_secret_here

# Optional
USGS_API_KEY=

# Application Configuration
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your_secret_key_here

# Database Configuration
DATABASE_URL=sqlite:///disaster_prediction.db

# Mahakumbh Location
MAHAKUMBH_LAT=25.4358
MAHAKUMBH_LON=81.8463

# Alert Thresholds
CROWD_DENSITY_THRESHOLD=0.8
WEATHER_ALERT_THRESHOLD=50
EARTHQUAKE_MAGNITUDE_THRESHOLD=4.0
FLOOD_ALERT_THRESHOLD=100
```

## Testing Your Setup

After adding your API keys:

1. **Start the backend:**
   ```bash
   cd backend
   source venv/bin/activate
   python app.py
   ```

2. **Test the APIs:**
   ```bash
   # Test weather API
   curl http://localhost:5001/api/weather
   
   # Test risk score
   curl http://localhost:5001/api/risk-score
   
   # Test satellite data (will use mock data if no credentials)
   curl http://localhost:5001/api/satellite/imagery
   ```

## Troubleshooting

### Sentinel Hub 401 Error
- This is normal if you haven't added credentials yet
- The system will automatically use mock data
- Add your Sentinel Hub credentials to use real satellite imagery

### API Rate Limits
- OpenWeatherMap: 60 calls/minute (free tier)
- Google Maps: Varies by service
- USGS: No strict limits for public feeds
- Sentinel Hub: Based on subscription plan

### Missing API Keys
- The system will use mock data for missing APIs
- All functionality will work with mock data
- Add real API keys for live data
