import requests
import json
from datetime import datetime, timedelta
import random
from config import Config

class WeatherService:
    def __init__(self):
        self.config = Config()
        self.base_url = "https://api.openweathermap.org/data/2.5"
        
    def get_current_weather(self):
        """Get current weather data for Mahakumbh location"""
        try:
            # Try to get real data from OpenWeatherMap
            url = f"{self.base_url}/weather"
            params = {
                'lat': self.config.MAHAKUMBH_LAT,
                'lon': self.config.MAHAKUMBH_LON,
                'appid': self.config.OPENWEATHER_API_KEY,
                'units': 'metric'
            }
            
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return self._format_weather_data(data)
            else:
                # Fallback to mock data
                return self._get_mock_weather_data()
                
        except Exception as e:
            print(f"Error fetching weather data: {e}")
            return self._get_mock_weather_data()
    
    def get_forecast(self):
        """Get weather forecast for next 5 days"""
        try:
            url = f"{self.base_url}/forecast"
            params = {
                'lat': self.config.MAHAKUMBH_LAT,
                'lon': self.config.MAHAKUMBH_LON,
                'appid': self.config.OPENWEATHER_API_KEY,
                'units': 'metric'
            }
            
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return self._format_forecast_data(data)
            else:
                return self._get_mock_forecast_data()
                
        except Exception as e:
            print(f"Error fetching forecast data: {e}")
            return self._get_mock_forecast_data()
    
    def get_flood_alerts(self):
        """Get flood alerts from CWC"""
        try:
            # Mock flood alert data
            return {
                'alerts': [
                    {
                        'type': 'flood_warning',
                        'severity': 'moderate',
                        'message': 'River water level rising near Prayagraj',
                        'timestamp': datetime.now().isoformat(),
                        'location': 'Ganga River, Prayagraj',
                        'water_level': 85.5,
                        'threshold': 90.0
                    }
                ],
                'last_updated': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error fetching flood alerts: {e}")
            return {'alerts': [], 'last_updated': datetime.now().isoformat()}
    
    def _format_weather_data(self, data):
        """Format weather data from API response"""
        return {
            'temperature': data['main']['temp'],
            'feels_like': data['main']['feels_like'],
            'humidity': data['main']['humidity'],
            'pressure': data['main']['pressure'],
            'description': data['weather'][0]['description'],
            'icon': data['weather'][0]['icon'],
            'wind_speed': data['wind']['speed'],
            'wind_direction': data['wind'].get('deg', 0),
            'visibility': data.get('visibility', 10000),
            'clouds': data['clouds']['all'],
            'sunrise': datetime.fromtimestamp(data['sys']['sunrise']).isoformat(),
            'sunset': datetime.fromtimestamp(data['sys']['sunset']).isoformat(),
            'location': 'Prayagraj, Uttar Pradesh',
            'coordinates': [data['coord']['lat'], data['coord']['lon']],
            'timestamp': datetime.now().isoformat()
        }
    
    def _format_forecast_data(self, data):
        """Format forecast data from API response"""
        forecasts = []
        for item in data['list']:
            forecasts.append({
                'datetime': datetime.fromtimestamp(item['dt']).isoformat(),
                'temperature': item['main']['temp'],
                'description': item['weather'][0]['description'],
                'icon': item['weather'][0]['icon'],
                'humidity': item['main']['humidity'],
                'wind_speed': item['wind']['speed'],
                'precipitation': item.get('pop', 0) * 100  # Probability of precipitation
            })
        return {
            'forecasts': forecasts,
            'location': 'Prayagraj, Uttar Pradesh',
            'last_updated': datetime.now().isoformat()
        }
    
    def _get_mock_weather_data(self):
        """Generate mock weather data for testing"""
        return {
            'temperature': random.uniform(25, 35),
            'feels_like': random.uniform(27, 37),
            'humidity': random.randint(40, 80),
            'pressure': random.randint(1000, 1020),
            'description': random.choice(['clear sky', 'scattered clouds', 'light rain', 'moderate rain']),
            'icon': '01d',
            'wind_speed': random.uniform(2, 15),
            'wind_direction': random.randint(0, 360),
            'visibility': random.randint(5000, 10000),
            'clouds': random.randint(0, 100),
            'sunrise': (datetime.now() - timedelta(hours=6)).isoformat(),
            'sunset': (datetime.now() + timedelta(hours=6)).isoformat(),
            'location': 'Prayagraj, Uttar Pradesh',
            'coordinates': [self.config.MAHAKUMBH_LAT, self.config.MAHAKUMBH_LON],
            'timestamp': datetime.now().isoformat()
        }
    
    def _get_mock_forecast_data(self):
        """Generate mock forecast data for testing"""
        forecasts = []
        for i in range(40):  # 5 days * 8 forecasts per day
            forecast_time = datetime.now() + timedelta(hours=i*3)
            forecasts.append({
                'datetime': forecast_time.isoformat(),
                'temperature': random.uniform(20, 40),
                'description': random.choice(['clear sky', 'scattered clouds', 'light rain', 'moderate rain']),
                'icon': '01d',
                'humidity': random.randint(30, 90),
                'wind_speed': random.uniform(1, 20),
                'precipitation': random.uniform(0, 100)
            })
        
        return {
            'forecasts': forecasts,
            'location': 'Prayagraj, Uttar Pradesh',
            'last_updated': datetime.now().isoformat()
        }
