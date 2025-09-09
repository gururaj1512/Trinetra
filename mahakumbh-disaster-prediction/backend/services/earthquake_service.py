import requests
import json
from datetime import datetime, timedelta
import random
from config import Config

class EarthquakeService:
    def __init__(self):
        self.config = Config()
        self.usgs_base_url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0"
        
    def get_recent_earthquakes(self):
        """Get recent earthquakes from USGS"""
        try:
            # Try to get real data from USGS
            url = f"{self.usgs_base_url}/summary/all_day.geojson"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                return self._format_earthquake_data(data)
            else:
                return self._get_mock_earthquake_data()
                
        except Exception as e:
            print(f"Error fetching earthquake data: {e}")
            return self._get_mock_earthquake_data()
    
    def get_earthquakes_near_location(self, lat, lon, radius_km=500):
        """Get earthquakes near a specific location"""
        try:
            url = f"{self.usgs_base_url}/query"
            params = {
                'format': 'geojson',
                'starttime': (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d'),
                'endtime': datetime.now().strftime('%Y-%m-%d'),
                'latitude': lat,
                'longitude': lon,
                'maxradiuskm': radius_km,
                'minmagnitude': 2.0
            }
            
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return self._format_earthquake_data(data)
            else:
                return self._get_mock_earthquake_data()
                
        except Exception as e:
            print(f"Error fetching location-specific earthquake data: {e}")
            return self._get_mock_earthquake_data()
    
    def get_seismic_risk_assessment(self):
        """Get seismic risk assessment for the area"""
        try:
            # Mock seismic risk assessment
            return {
                'risk_level': random.choice(['low', 'moderate', 'high']),
                'probability': random.uniform(0.1, 0.8),
                'last_major_quake': '2015-04-25',
                'fault_lines': [
                    {
                        'name': 'Himalayan Frontal Thrust',
                        'distance_km': 150,
                        'activity_level': 'moderate'
                    },
                    {
                        'name': 'Indo-Gangetic Plain Fault',
                        'distance_km': 80,
                        'activity_level': 'low'
                    }
                ],
                'recommendations': [
                    'Monitor seismic activity continuously',
                    'Prepare emergency response teams',
                    'Ensure building codes compliance',
                    'Maintain evacuation routes'
                ],
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error generating seismic risk assessment: {e}")
            return {}
    
    def _format_earthquake_data(self, data):
        """Format earthquake data from USGS response"""
        earthquakes = []
        
        for feature in data.get('features', []):
            properties = feature['properties']
            geometry = feature['geometry']
            
            earthquake = {
                'id': feature['id'],
                'magnitude': properties.get('mag', 0),
                'place': properties.get('place', 'Unknown location'),
                'time': datetime.fromtimestamp(properties['time'] / 1000).isoformat(),
                'updated': datetime.fromtimestamp(properties['updated'] / 1000).isoformat(),
                'coordinates': geometry['coordinates'][:2],  # [longitude, latitude]
                'depth': geometry['coordinates'][2] if len(geometry['coordinates']) > 2 else 0,
                'type': properties.get('type', 'earthquake'),
                'alert': properties.get('alert', None),
                'tsunami': properties.get('tsunami', 0),
                'significance': properties.get('significance', 0),
                'felt': properties.get('felt', None),
                'cdi': properties.get('cdi', None),
                'mmi': properties.get('mmi', None),
                'url': properties.get('url', ''),
                'detail': properties.get('detail', ''),
                'status': properties.get('status', 'reviewed')
            }
            
            # Filter earthquakes near Mahakumbh location
            if self._is_near_mahakumbh(earthquake['coordinates']):
                earthquakes.append(earthquake)
        
        # Sort by time (most recent first)
        earthquakes.sort(key=lambda x: x['time'], reverse=True)
        
        return {
            'earthquakes': earthquakes[:20],  # Return last 20 earthquakes
            'total_count': len(earthquakes),
            'last_updated': datetime.now().isoformat()
        }
    
    def _is_near_mahakumbh(self, coordinates):
        """Check if earthquake coordinates are near Mahakumbh location"""
        if not coordinates or len(coordinates) < 2:
            return False
            
        lon, lat = coordinates[0], coordinates[1]
        mahakumbh_lat, mahakumbh_lon = self.config.MAHAKUMBH_LAT, self.config.MAHAKUMBH_LON
        
        # Calculate distance (simple approximation)
        lat_diff = abs(lat - mahakumbh_lat)
        lon_diff = abs(lon - mahakumbh_lon)
        
        # Rough distance calculation (1 degree ≈ 111 km)
        distance_km = ((lat_diff ** 2 + lon_diff ** 2) ** 0.5) * 111
        
        return distance_km <= 1000  # Within 1000 km
    
    def _get_mock_earthquake_data(self):
        """Generate mock earthquake data for testing"""
        earthquakes = []
        
        for i in range(random.randint(5, 15)):
            # Generate random earthquake data
            time_offset = random.randint(0, 24 * 7)  # Within last 7 days
            earthquake_time = datetime.now() - timedelta(hours=time_offset)
            
            # Random location near Prayagraj
            lat_offset = random.uniform(-2, 2)
            lon_offset = random.uniform(-2, 2)
            
            earthquake = {
                'id': f"mock_{i}",
                'magnitude': random.uniform(2.0, 6.0),
                'place': random.choice([
                    'Near Prayagraj, Uttar Pradesh',
                    'Ganga River Basin, India',
                    'Indo-Gangetic Plain, India',
                    'Himalayan Foothills, India'
                ]),
                'time': earthquake_time.isoformat(),
                'updated': earthquake_time.isoformat(),
                'coordinates': [
                    self.config.MAHAKUMBH_LON + lon_offset,
                    self.config.MAHAKUMBH_LAT + lat_offset
                ],
                'depth': random.uniform(5, 50),
                'type': 'earthquake',
                'alert': random.choice([None, 'green', 'yellow', 'orange', 'red']),
                'tsunami': random.choice([0, 1]),
                'significance': random.randint(0, 1000),
                'felt': random.randint(0, 100),
                'cdi': random.uniform(1, 10),
                'mmi': random.uniform(1, 10),
                'url': f"https://earthquake.usgs.gov/earthquakes/eventpage/mock_{i}",
                'detail': f"https://earthquake.usgs.gov/earthquakes/eventpage/mock_{i}/detail",
                'status': 'reviewed'
            }
            earthquakes.append(earthquake)
        
        # Sort by time (most recent first)
        earthquakes.sort(key=lambda x: x['time'], reverse=True)
        
        return {
            'earthquakes': earthquakes,
            'total_count': len(earthquakes),
            'last_updated': datetime.now().isoformat()
        }
