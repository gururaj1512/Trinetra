# Disaster Prediction & Management Module for Mahakumbh

A comprehensive admin dashboard for disaster prediction and management during large gatherings like Mahakumbh.

## Features

- **Weather & Natural Disaster Prediction**: Real-time weather data, flood alerts, and extreme weather warnings
- **Earthquake Monitoring**: Seismic activity tracking and alerts
- **Crowd Disaster Prediction**: AI-powered crowd density analysis and stampede risk assessment
- **Satellite & Geospatial Data**: Terrain monitoring and evacuation planning
- **Real-Time Alerts**: Integrated alert system for all disaster types
- **Traffic & Navigation**: Real-time traffic monitoring and route optimization

## Tech Stack

- **Frontend**: React.js with Material-UI
- **Backend**: Flask (Python)
- **Database**: SQLite (for simplicity)
- **Real-time**: WebSocket connections
- **APIs**: OpenWeatherMap, USGS, Google Maps, Sentinel Hub, and more

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   # Backend
   cd backend
   pip install -r requirements.txt
   
   # Frontend
   cd frontend
   npm install
   ```
3. Configure environment variables in `.env` file
4. Run the application:
   ```bash
   # Backend
   cd backend
   python app.py
   
   # Frontend
   cd frontend
   npm start
   ```

## Environment Variables

Create a `.env` file in the backend directory with the following API keys:

```
# Required API Keys
OPENWEATHER_API_KEY=your_openweather_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Sentinel Hub Authentication (for satellite imagery)
SENTINEL_HUB_CLIENT_ID=your_sentinel_hub_client_id
SENTINEL_HUB_CLIENT_SECRET=your_sentinel_hub_client_secret

# Optional
USGS_API_KEY=your_usgs_api_key  # Not required for public feeds
```

## Dashboard Sections

1. **Weather Monitoring**: Real-time weather data, forecasts, and alerts
2. **Disaster Alerts**: Earthquake, flood, and natural disaster warnings
3. **Crowd Analytics**: Live crowd density, flow analysis, and risk assessment
4. **Traffic Monitoring**: Real-time traffic conditions and route optimization
5. **Emergency Response**: Quick access to emergency contacts and evacuation routes
6. **Historical Data**: Past incidents and trend analysis

## API Integration

### OpenWeatherMap API
- **Purpose**: Real-time weather data, forecasts, and alerts
- **Authentication**: API key required
- **Documentation**: https://openweathermap.org/api
- **Rate Limits**: 60 calls/minute for free tier

### USGS Earthquake API
- **Purpose**: Global earthquake monitoring and seismic data
- **Authentication**: No authentication required for public feeds
- **Documentation**: https://earthquake.usgs.gov/fdsnws/event/1/
- **Rate Limits**: No strict limits for public feeds

### Google Maps Platform
- **Purpose**: Traffic data, navigation, and geospatial services
- **Authentication**: API key required
- **Documentation**: https://developers.google.com/maps/documentation
- **Rate Limits**: Varies by service and billing tier

### Sentinel Hub API
- **Purpose**: Satellite imagery and remote sensing data
- **Authentication**: OAuth 2.0 with client_id and client_secret
- **Documentation**: https://docs.sentinel-hub.com/api/
- **Rate Limits**: Based on subscription plan

## Getting API Keys

1. **OpenWeatherMap**: 
   - Visit https://openweathermap.org/api
   - Sign up for a free account
   - Generate an API key

2. **Google Maps Platform**:
   - Visit https://developers.google.com/maps/documentation/javascript/get-api-key
   - Create a project and enable required APIs
   - Generate an API key

3. **Sentinel Hub**:
   - Visit https://apps.sentinel-hub.com/oauth/register
   - Create an account
   - Register your application to get client_id and client_secret

## API Usage Examples

### Weather Data
```python
# Get current weather
weather_data = weather_service.get_current_weather()

# Get 5-day forecast
forecast_data = weather_service.get_forecast()
```

### Earthquake Data
```python
# Get recent earthquakes
earthquakes = earthquake_service.get_recent_earthquakes()

# Get earthquakes near location
nearby_quakes = earthquake_service.get_earthquakes_near_location(lat, lon, radius_km=500)
```

### Satellite Imagery
```python
# Get satellite data for area
satellite_data = satellite_service.get_area_imagery(bbox, time_range)
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
