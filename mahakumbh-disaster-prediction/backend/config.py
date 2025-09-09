import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # API Keys and Authentication
    OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY', 'your_openweather_api_key_here')
    GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY', 'your_google_maps_api_key_here')
    
    # Sentinel Hub Authentication (requires both client_id and client_secret)
    SENTINEL_HUB_CLIENT_ID = os.getenv('SENTINEL_HUB_CLIENT_ID', 'your_sentinel_hub_client_id_here')
    SENTINEL_HUB_CLIENT_SECRET = os.getenv('SENTINEL_HUB_CLIENT_SECRET', 'your_sentinel_hub_client_secret_here')
    
    # USGS doesn't require API key for public feeds, but we'll keep it for potential future use
    USGS_API_KEY = os.getenv('USGS_API_KEY', '')  # Optional for USGS public feeds
    
    # Application Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'your_secret_key_here')
    DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
    # Database Configuration
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///disaster_prediction.db')
    
    # Mahakumbh Location (Prayagraj/Allahabad)
    MAHAKUMBH_LAT = float(os.getenv('MAHAKUMBH_LAT', '25.4358'))
    MAHAKUMBH_LON = float(os.getenv('MAHAKUMBH_LON', '81.8463'))
    
    # API Endpoints
    # USGS Earthquake API (no authentication required for public feeds)
    USGS_BASE_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0"
    
    # Sentinel Hub API endpoints
    SENTINEL_HUB_AUTH_URL = "https://services.sentinel-hub.com/oauth/token"
    SENTINEL_HUB_API_URL = "https://services.sentinel-hub.com/api/v1"
    
    # Google Maps API endpoints
    GOOGLE_MAPS_BASE_URL = "https://maps.googleapis.com/maps/api"
    
    # OpenWeatherMap API endpoints
    OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5"
    
    # Alert Thresholds
    CROWD_DENSITY_THRESHOLD = float(os.getenv('CROWD_DENSITY_THRESHOLD', '0.8'))
    WEATHER_ALERT_THRESHOLD = float(os.getenv('WEATHER_ALERT_THRESHOLD', '50'))
    EARTHQUAKE_MAGNITUDE_THRESHOLD = float(os.getenv('EARTHQUAKE_MAGNITUDE_THRESHOLD', '4.0'))
    FLOOD_ALERT_THRESHOLD = float(os.getenv('FLOOD_ALERT_THRESHOLD', '100'))
