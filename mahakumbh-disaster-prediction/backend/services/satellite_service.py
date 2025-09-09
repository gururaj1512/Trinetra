import requests
import json
import base64
from datetime import datetime, timedelta
import random
from config import Config
import os

class SatelliteService:
    def __init__(self):
        self.config = Config()
        self.access_token = None
        self.token_expiry = None
        
    def _get_access_token(self):
        """Get OAuth 2.0 access token from Sentinel Hub"""
        try:
            # Check if credentials are provided
            if (self.config.SENTINEL_HUB_CLIENT_ID == 'your_sentinel_hub_client_id_here' or 
                self.config.SENTINEL_HUB_CLIENT_SECRET == 'your_sentinel_hub_client_secret_here'):
                print("Sentinel Hub credentials not configured. Using mock data.")
                return None
            
            # Check if we have a valid token
            if self.access_token and self.token_expiry and datetime.now() < self.token_expiry:
                return self.access_token
            
            # Request new token
            auth_data = {
                'grant_type': 'client_credentials',
                'client_id': self.config.SENTINEL_HUB_CLIENT_ID,
                'client_secret': self.config.SENTINEL_HUB_CLIENT_SECRET
            }
            
            response = requests.post(
                self.config.SENTINEL_HUB_AUTH_URL,
                data=auth_data,
                timeout=30
            )
            
            if response.status_code == 200:
                token_data = response.json()
                self.access_token = token_data['access_token']
                # Set expiry to 50 minutes (tokens typically last 1 hour)
                self.token_expiry = datetime.now() + timedelta(minutes=50)
                return self.access_token
            else:
                print(f"Failed to get Sentinel Hub access token: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"Error getting Sentinel Hub access token: {e}")
            return None
    
    def get_area_imagery(self, bbox=None, time_range=None):
        """Get satellite imagery for a specific area"""
        try:
            # Use Mahakumbh area if no bbox provided
            if not bbox:
                bbox = [
                    self.config.MAHAKUMBH_LON - 0.1,  # min_lon
                    self.config.MAHAKUMBH_LAT - 0.1,  # min_lat
                    self.config.MAHAKUMBH_LON + 0.1,  # max_lon
                    self.config.MAHAKUMBH_LAT + 0.1   # max_lat
                ]
            
            # Use last 7 days if no time range provided
            if not time_range:
                end_time = datetime.now()
                start_time = end_time - timedelta(days=7)
                time_range = {
                    'from': start_time.isoformat() + 'Z',
                    'to': end_time.isoformat() + 'Z'
                }
            
            access_token = self._get_access_token()
            if not access_token:
                print("DEBUG: No access token available, using static image fallback")
                return self._get_mock_satellite_data()
            
            # Prepare request payload for Sentinel Hub
            payload = {
                "input": {
                    "bounds": {
                        "bbox": bbox,
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
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.post(
                f"{self.config.SENTINEL_HUB_API_URL}/process",
                json=payload,
                headers=headers,
                timeout=60
            )
            
            if response.status_code == 200:
                return self._format_satellite_data(response.content, bbox, time_range)
            else:
                print(f"Failed to get satellite imagery: {response.status_code}")
                return self._get_mock_satellite_data()
                
        except Exception as e:
            print(f"Error getting satellite imagery: {e}")
            print("DEBUG: Using static image fallback due to error")
            return self._get_mock_satellite_data()
    
    def get_flood_analysis(self, bbox=None):
        """Analyze satellite imagery for flood detection"""
        try:
            # Get recent imagery
            imagery_data = self.get_area_imagery(bbox)
            
            # Mock flood analysis (in real implementation, this would use ML models)
            flood_risk = random.uniform(0.1, 0.8)
            
            return {
                'flood_risk': flood_risk,
                'risk_level': self._get_risk_level(flood_risk),
                'affected_area_km2': random.uniform(0, 50),
                'water_level_change': random.uniform(-2, 5),
                'analysis_timestamp': datetime.now().isoformat(),
                'imagery_data': imagery_data,
                'recommendations': self._get_flood_recommendations(flood_risk)
            }
        except Exception as e:
            print(f"Error analyzing flood data: {e}")
            return self._get_mock_flood_analysis()
    
    def get_terrain_analysis(self, bbox=None):
        """Analyze terrain and elevation data"""
        try:
            # Mock terrain analysis
            return {
                'elevation_range': {
                    'min': random.uniform(70, 80),
                    'max': random.uniform(85, 95),
                    'average': random.uniform(75, 85)
                },
                'slope_analysis': {
                    'average_slope': random.uniform(1, 5),
                    'steep_areas': random.randint(0, 3),
                    'flood_prone_areas': random.randint(1, 5)
                },
                'land_cover': {
                    'water_bodies': random.uniform(5, 15),
                    'vegetation': random.uniform(20, 40),
                    'urban_areas': random.uniform(30, 60),
                    'bare_soil': random.uniform(5, 20)
                },
                'analysis_timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error analyzing terrain: {e}")
            return {}
    
    def get_evacuation_route_analysis(self):
        """Analyze satellite data for evacuation route planning"""
        try:
            # Get terrain analysis
            terrain = self.get_terrain_analysis()
            
            # Mock evacuation route analysis
            routes = [
                {
                    'route_id': 'evac_route_1',
                    'name': 'Primary Evacuation Route',
                    'coordinates': [
                        [self.config.MAHAKUMBH_LAT, self.config.MAHAKUMBH_LON],
                        [self.config.MAHAKUMBH_LAT + 0.05, self.config.MAHAKUMBH_LON + 0.05]
                    ],
                    'distance_km': random.uniform(2, 5),
                    'elevation_gain': random.uniform(0, 20),
                    'accessibility': 'high',
                    'flood_risk': random.uniform(0, 0.3)
                },
                {
                    'route_id': 'evac_route_2',
                    'name': 'Secondary Evacuation Route',
                    'coordinates': [
                        [self.config.MAHAKUMBH_LAT, self.config.MAHAKUMBH_LON],
                        [self.config.MAHAKUMBH_LAT - 0.03, self.config.MAHAKUMBH_LON - 0.03]
                    ],
                    'distance_km': random.uniform(3, 6),
                    'elevation_gain': random.uniform(0, 15),
                    'accessibility': 'medium',
                    'flood_risk': random.uniform(0, 0.2)
                }
            ]
            
            return {
                'routes': routes,
                'terrain_analysis': terrain,
                'recommendations': [
                    'Primary route is optimal for mass evacuation',
                    'Secondary route available as backup',
                    'Monitor flood-prone areas during monsoon'
                ],
                'analysis_timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error analyzing evacuation routes: {e}")
            return {'routes': [], 'recommendations': []}
    
    def _format_satellite_data(self, image_data, bbox, time_range):
        """Format satellite imagery data"""
        try:
            # Encode image data as base64
            image_base64 = base64.b64encode(image_data).decode('utf-8')
            
            return {
                'image_data': image_base64,
                'bbox': bbox,
                'time_range': time_range,
                'resolution': '10m',
                'satellite': 'Sentinel-2',
                'bands': ['B02', 'B03', 'B04'],
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error formatting satellite data: {e}")
            return {}
    
    def _get_risk_level(self, risk_score):
        """Convert risk score to risk level"""
        if risk_score >= 0.7:
            return 'high'
        elif risk_score >= 0.4:
            return 'moderate'
        else:
            return 'low'
    
    def _get_flood_recommendations(self, flood_risk):
        """Get recommendations based on flood risk"""
        if flood_risk >= 0.7:
            return [
                'Immediate evacuation recommended',
                'Activate emergency response protocols',
                'Monitor water levels continuously',
                'Prepare rescue operations'
            ]
        elif flood_risk >= 0.4:
            return [
                'Monitor situation closely',
                'Prepare evacuation plans',
                'Deploy emergency teams',
                'Alert local authorities'
            ]
        else:
            return [
                'Continue normal operations',
                'Monitor weather conditions',
                'Maintain emergency preparedness'
            ]
    
    def _get_mock_satellite_data(self):
        """Generate mock satellite data for testing"""
        print("DEBUG: _get_mock_satellite_data called - generating valid mock image")
        try:
            # Try to create an enhanced mock image, fallback to minimal if needed
            mock_image = self._create_enhanced_mock_image()
            print(f"DEBUG: Generated enhanced mock image, length: {len(mock_image)}")
            
            return {
                'image_data': mock_image,
                'bbox': [
                    self.config.MAHAKUMBH_LON - 0.1,
                    self.config.MAHAKUMBH_LAT - 0.1,
                    self.config.MAHAKUMBH_LON + 0.1,
                    self.config.MAHAKUMBH_LAT + 0.1
                ],
                'time_range': {
                    'from': (datetime.now() - timedelta(days=7)).isoformat() + 'Z',
                    'to': datetime.now().isoformat() + 'Z'
                },
                'resolution': '10m',
                'satellite': 'Sentinel-2',
                'bands': ['B02', 'B03', 'B04'],
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"DEBUG: Error generating enhanced mock image: {e}")
            print("DEBUG: Falling back to static image")
            # Return static image data as fallback
            fallback_data = {
                'image_data': self._get_static_image_fallback(),
                'bbox': [81.7463, 25.3358, 81.9463, 25.5358],
                'time_range': {
                    'from': (datetime.now() - timedelta(days=7)).isoformat() + 'Z',
                    'to': datetime.now().isoformat() + 'Z'
                },
                'resolution': '10m',
                'satellite': 'Sentinel-2',
                'bands': ['B02', 'B03', 'B04'],
                'timestamp': datetime.now().isoformat()
            }
            print(f"DEBUG: Returning fallback data with image length: {len(fallback_data['image_data'])}")
            return fallback_data
    
    def _get_mock_flood_analysis(self):
        """Generate mock flood analysis data"""
        return {
            'flood_risk': random.uniform(0.1, 0.8),
            'risk_level': random.choice(['low', 'moderate', 'high']),
            'affected_area_km2': random.uniform(0, 50),
            'water_level_change': random.uniform(-2, 5),
            'analysis_timestamp': datetime.now().isoformat(),
            'recommendations': ['Monitor water levels', 'Prepare evacuation plans']
        }

    def _get_minimal_png_fallback(self):
        """Return a minimal PNG image that is guaranteed to be valid"""
        return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    
    def _load_static_satellite_image(self):
        """Load the static satellite image from the backend directory"""
        try:
            # Get the path to the backend directory and look for the static image
            backend_dir = os.path.dirname(os.path.dirname(__file__))
            static_image_path = os.path.join(backend_dir, 'satellite-imagery.png')
            
            if os.path.exists(static_image_path):
                print(f"DEBUG: Loading static satellite image from: {static_image_path}")
                with open(static_image_path, 'rb') as image_file:
                    image_data = image_file.read()
                    base64_data = base64.b64encode(image_data).decode('utf-8')
                    print(f"DEBUG: Static image loaded successfully, size: {len(image_data)} bytes, base64 length: {len(base64_data)}")
                    return base64_data
            else:
                print(f"DEBUG: Static image not found at: {static_image_path}")
                return None
        except Exception as e:
            print(f"DEBUG: Error loading static image: {e}")
            return None
    
    def _get_static_image_fallback(self):
        """Get the static satellite image as fallback, or minimal PNG if not available"""
        static_image = self._load_static_satellite_image()
        if static_image:
            return static_image
        else:
            print("DEBUG: Static image not available, using minimal PNG fallback")
            return self._get_minimal_png_fallback()
    
    def _create_enhanced_mock_image(self):
        """Create an enhanced mock image using PIL if available"""
        try:
            from PIL import Image, ImageDraw
            import io
            
            # Create a 256x256 image with terrain-like features
            width, height = 256, 256
            image = Image.new('RGB', (width, height), color=(34, 139, 34))  # Forest green base
            
            # Add some terrain features
            draw = ImageDraw.Draw(image)
            
            # Add water bodies (blue areas)
            for _ in range(3):
                x1 = random.randint(0, width)
                y1 = random.randint(0, height)
                x2 = x1 + random.randint(40, 120)
                y2 = y1 + random.randint(40, 120)
                draw.ellipse([x1, y1, x2, y2], fill=(70, 130, 180))  # Steel blue
            
            # Add urban areas (gray areas)
            for _ in range(5):
                x1 = random.randint(0, width)
                y1 = random.randint(0, height)
                x2 = x1 + random.randint(20, 80)
                y2 = y1 + random.randint(20, 80)
                draw.rectangle([x1, y1, x2, y2], fill=(128, 128, 128))  # Gray
            
            # Add roads (dark lines)
            for _ in range(4):
                x1 = random.randint(0, width)
                y1 = random.randint(0, height)
                x2 = x1 + random.randint(80, 200)
                y2 = y1 + random.randint(80, 200)
                draw.line([x1, y1, x2, y2], fill=(64, 64, 64), width=6)
            
            # Convert to base64
            buffer = io.BytesIO()
            image.save(buffer, format='PNG')
            image_data = buffer.getvalue()
            buffer.close()
            
            return base64.b64encode(image_data).decode('utf-8')
            
        except ImportError:
            print("DEBUG: PIL not available, using minimal PNG")
            return self._get_minimal_png_fallback()
        except Exception as e:
            print(f"DEBUG: Error creating enhanced mock image: {e}")
            return self._get_minimal_png_fallback()
