# API Documentation for Disaster Prediction System

This document provides detailed information about the APIs used in the Disaster Prediction & Management System for Mahakumbh, including authentication methods, endpoints, and usage examples.

## Overview

The system integrates with the following APIs:
1. **OpenWeatherMap API** - Weather data and forecasts
2. **USGS Earthquake API** - Seismic activity monitoring
3. **Google Maps Platform** - Traffic and geospatial services
4. **Sentinel Hub API** - Satellite imagery and remote sensing

## 1. OpenWeatherMap API

### Authentication
- **Method**: API Key
- **Required**: Yes
- **Rate Limits**: 60 calls/minute (free tier), 1000 calls/minute (paid tier)

### Getting API Key
1. Visit https://openweathermap.org/api
2. Sign up for a free account
3. Navigate to "My API Keys"
4. Generate a new API key

### Configuration
```bash
# In .env file
OPENWEATHER_API_KEY=your_api_key_here
```

### Usage in Code
```python
# Current weather
url = "https://api.openweathermap.org/data/2.5/weather"
params = {
    'lat': 25.4358,
    'lon': 81.8463,
    'appid': config.OPENWEATHER_API_KEY,
    'units': 'metric'
}

# 5-day forecast
url = "https://api.openweathermap.org/data/2.5/forecast"
```

### Available Endpoints
- Current weather: `/weather`
- 5-day forecast: `/forecast`
- Weather alerts: `/onecall` (requires paid plan)

## 2. USGS Earthquake API

### Authentication
- **Method**: None required for public feeds
- **Required**: No
- **Rate Limits**: No strict limits for public feeds

### Getting API Key (Optional)
- USGS public feeds don't require authentication
- API keys may be required for higher rate limits or premium features

### Configuration
```bash
# In .env file (optional)
USGS_API_KEY=
```

### Usage in Code
```python
# Recent earthquakes
url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"

# Location-specific earthquakes
url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/query"
params = {
    'format': 'geojson',
    'starttime': '2024-01-01',
    'endtime': '2024-01-31',
    'latitude': 25.4358,
    'longitude': 81.8463,
    'maxradiuskm': 500,
    'minmagnitude': 2.0
}
```

### Available Endpoints
- All earthquakes (past day): `/summary/all_day.geojson`
- All earthquakes (past 7 days): `/summary/all_week.geojson`
- All earthquakes (past 30 days): `/summary/all_month.geojson`
- Custom query: `/query`

## 3. Google Maps Platform

### Authentication
- **Method**: API Key
- **Required**: Yes
- **Rate Limits**: Varies by service and billing tier

### Getting API Key
1. Visit https://developers.google.com/maps/documentation/javascript/get-api-key
2. Create a Google Cloud project
3. Enable required APIs:
   - Maps JavaScript API
   - Directions API
   - Distance Matrix API
   - Geocoding API
4. Create credentials (API key)

### Configuration
```bash
# In .env file
GOOGLE_MAPS_API_KEY=your_api_key_here
```

### Usage in Code
```python
# Traffic data
url = "https://maps.googleapis.com/maps/api/directions/json"
params = {
    'origin': '25.4358,81.8463',
    'destination': '25.4400,81.8500',
    'key': config.GOOGLE_MAPS_API_KEY,
    'departure_time': 'now',
    'traffic_model': 'best_guess'
}

# Geocoding
url = "https://maps.googleapis.com/maps/api/geocode/json"
params = {
    'address': 'Prayagraj, Uttar Pradesh',
    'key': config.GOOGLE_MAPS_API_KEY
}
```

### Available Services
- Directions API
- Distance Matrix API
- Geocoding API
- Maps JavaScript API
- Places API
- Roads API

## 4. Sentinel Hub API

### Authentication
- **Method**: OAuth 2.0 (Client Credentials)
- **Required**: Yes
- **Rate Limits**: Based on subscription plan

### Getting Credentials
1. Visit https://apps.sentinel-hub.com/oauth/register
2. Create an account
3. Register your application
4. Get `client_id` and `client_secret`

### Configuration
```bash
# In .env file
SENTINEL_HUB_CLIENT_ID=your_client_id_here
SENTINEL_HUB_CLIENT_SECRET=your_client_secret_here
```

### Authentication Flow
```python
# Step 1: Get access token
auth_url = "https://services.sentinel-hub.com/oauth/token"
auth_data = {
    'grant_type': 'client_credentials',
    'client_id': config.SENTINEL_HUB_CLIENT_ID,
    'client_secret': config.SENTINEL_HUB_CLIENT_SECRET
}

response = requests.post(auth_url, data=auth_data)
token_data = response.json()
access_token = token_data['access_token']

# Step 2: Use access token for API calls
headers = {
    'Authorization': f'Bearer {access_token}',
    'Content-Type': 'application/json'
}
```

### Usage in Code
```python
# Get satellite imagery
url = "https://services.sentinel-hub.com/api/v1/process"
payload = {
    "input": {
        "bounds": {
            "bbox": [81.7463, 25.3358, 81.9463, 25.5358],
            "properties": {
                "crs": "http://www.opengis.net/def/crs/OGC/1.3/CRS84"
            }
        },
        "data": [
            {
                "type": "sentinel-2-l2a",
                "dataFilter": {
                    "mosaickingOrder": "leastCC"
                }
            }
        ]
    },
    "output": {
        "width": 512,
        "height": 512,
        "responses": [
            {
                "identifier": "default",
                "format": {
                    "type": "image/png"
                }
            }
        ]
    },
    "evalscript": """
        //VERSION=3
        function setup() {
            return {
                input: ["B02", "B03", "B04"],
                output: { bands: 3 }
            };
        }
        
        function evaluatePixel(sample) {
            return [sample.B04, sample.B03, sample.B02];
        }
    """
}

response = requests.post(url, json=payload, headers=headers)
```

### Available Services
- Sentinel-2 L2A imagery
- Sentinel-1 radar data
- Custom evalscripts for data processing
- Statistical analysis
- Time series analysis

## Environment Variables Summary

```bash
# Required API Keys
OPENWEATHER_API_KEY=your_openweather_api_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Sentinel Hub Authentication
SENTINEL_HUB_CLIENT_ID=your_sentinel_hub_client_id_here
SENTINEL_HUB_CLIENT_SECRET=your_sentinel_hub_client_secret_here

# Optional
USGS_API_KEY=  # Not required for public feeds

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

## Rate Limiting and Best Practices

### OpenWeatherMap
- Free tier: 60 calls/minute
- Cache weather data for 10-15 minutes
- Use forecast API for future planning

### USGS
- No strict limits for public feeds
- Be respectful of server resources
- Cache earthquake data for 5-10 minutes

### Google Maps
- Varies by service and billing tier
- Implement request caching
- Use batch requests when possible

### Sentinel Hub
- Based on subscription plan
- Cache access tokens (valid for 1 hour)
- Optimize evalscripts for performance

## Error Handling

All API services include:
- Timeout handling (10-60 seconds)
- Fallback to mock data on failure
- Comprehensive error logging
- Graceful degradation

## Security Considerations

1. **API Key Protection**
   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys regularly

2. **Rate Limiting**
   - Implement request throttling
   - Monitor API usage
   - Handle rate limit errors gracefully

3. **Data Validation**
   - Validate all API responses
   - Sanitize user inputs
   - Implement proper error handling

## Testing

Each API service includes:
- Mock data generation for testing
- Error simulation
- Unit tests for core functionality
- Integration tests for API endpoints

## Support and Documentation

- **OpenWeatherMap**: https://openweathermap.org/api
- **USGS**: https://earthquake.usgs.gov/fdsnws/event/1/
- **Google Maps**: https://developers.google.com/maps/documentation
- **Sentinel Hub**: https://docs.sentinel-hub.com/api/
