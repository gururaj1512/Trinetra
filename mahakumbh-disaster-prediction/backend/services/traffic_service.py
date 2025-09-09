import requests
import random
from datetime import datetime, timedelta
from config import Config

class TrafficService:
    def __init__(self):
        self.config = Config()
        self.traffic_routes = [
            {
                'id': 'route_1',
                'name': 'Prayagraj Junction to Triveni Sangam',
                'start_coords': [25.4500, 81.8300],
                'end_coords': [25.4400, 81.8500],
                'distance_km': 3.2,
                'normal_travel_time': 8,  # minutes
                'current_travel_time': 8,
                'congestion_level': 'low',
                'status': 'open'
            },
            {
                'id': 'route_2',
                'name': 'Prayagraj Fort to Main Ghat',
                'start_coords': [25.4300, 81.8400],
                'end_coords': [25.4358, 81.8463],
                'distance_km': 1.8,
                'normal_travel_time': 5,
                'current_travel_time': 5,
                'congestion_level': 'low',
                'status': 'open'
            },
            {
                'id': 'route_3',
                'name': 'Anand Bhavan to Prayagraj Junction',
                'start_coords': [25.4250, 81.8350],
                'end_coords': [25.4500, 81.8300],
                'distance_km': 4.5,
                'normal_travel_time': 12,
                'current_travel_time': 12,
                'congestion_level': 'low',
                'status': 'open'
            },
            {
                'id': 'route_4',
                'name': 'Emergency Route - Bypass Road',
                'start_coords': [25.4200, 81.8200],
                'end_coords': [25.4600, 81.8600],
                'distance_km': 6.8,
                'normal_travel_time': 15,
                'current_travel_time': 15,
                'congestion_level': 'low',
                'status': 'open'
            }
        ]
        
    def get_traffic_conditions(self):
        """Get current traffic conditions"""
        try:
            # Update traffic data for all routes
            for route in self.traffic_routes:
                route['current_travel_time'] = self._simulate_travel_time(route)
                route['congestion_level'] = self._calculate_congestion_level(route)
                route['status'] = self._determine_route_status(route)
            
            return {
                'routes': self.traffic_routes,
                'overall_conditions': self._calculate_overall_conditions(),
                'bottlenecks': self._identify_bottlenecks(),
                'recommendations': self._generate_traffic_recommendations(),
                'emergency_routes': self._get_emergency_routes(),
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error generating traffic conditions: {e}")
            return self._get_mock_traffic_data()
    
    def get_route_optimization(self, start_coords, end_coords, priority='fastest'):
        """Get optimized route between two points"""
        try:
            # Simulate route optimization
            routes = self._generate_route_options(start_coords, end_coords)
            
            if priority == 'fastest':
                routes.sort(key=lambda x: x['travel_time'])
            elif priority == 'safest':
                routes.sort(key=lambda x: x['safety_score'], reverse=True)
            elif priority == 'least_congested':
                routes.sort(key=lambda x: x['congestion_level'])
            
            return {
                'optimal_route': routes[0] if routes else None,
                'alternative_routes': routes[1:3] if len(routes) > 1 else [],
                'route_analysis': self._analyze_routes(routes),
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error optimizing route: {e}")
            return {'optimal_route': None, 'alternative_routes': [], 'route_analysis': {}}
    
    def get_emergency_vehicle_routes(self):
        """Get optimized routes for emergency vehicles"""
        try:
            emergency_routes = []
            
            for route in self.traffic_routes:
                if route['status'] == 'open':
                    emergency_route = {
                        'route_id': route['id'],
                        'route_name': route['name'],
                        'start_coords': route['start_coords'],
                        'end_coords': route['end_coords'],
                        'estimated_time': max(3, route['current_travel_time'] * 0.5),  # Emergency vehicles get priority
                        'congestion_level': route['congestion_level'],
                        'priority_level': 'high',
                        'clearance_needed': route['congestion_level'] in ['high', 'severe']
                    }
                    emergency_routes.append(emergency_route)
            
            return {
                'emergency_routes': emergency_routes,
                'total_routes': len(emergency_routes),
                'clear_routes': len([r for r in emergency_routes if r['congestion_level'] == 'low']),
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error generating emergency routes: {e}")
            return {'emergency_routes': [], 'total_routes': 0, 'clear_routes': 0}
    
    def get_traffic_predictions(self, hours_ahead=6):
        """Get traffic predictions for the next hours"""
        try:
            predictions = []
            current_time = datetime.now()
            
            for hour in range(1, hours_ahead + 1):
                prediction_time = current_time + timedelta(hours=hour)
                
                # Predict traffic conditions based on time patterns
                predicted_congestion = self._predict_congestion_by_time(prediction_time)
                
                predictions.append({
                    'timestamp': prediction_time.isoformat(),
                    'predicted_congestion': predicted_congestion,
                    'confidence': random.uniform(0.7, 0.9),
                    'recommendations': self._get_prediction_recommendations(predicted_congestion)
                })
            
            return {
                'predictions': predictions,
                'model_accuracy': random.uniform(0.75, 0.85),
                'last_updated': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error generating traffic predictions: {e}")
            return {'predictions': [], 'model_accuracy': 0.8, 'last_updated': datetime.now().isoformat()}
    
    def _simulate_travel_time(self, route):
        """Simulate travel time based on current conditions"""
        base_time = route['normal_travel_time']
        hour = datetime.now().hour
        
        # Time-based congestion factors
        if 7 <= hour <= 9:  # Morning rush
            congestion_factor = random.uniform(1.2, 2.0)
        elif 17 <= hour <= 19:  # Evening rush
            congestion_factor = random.uniform(1.3, 2.2)
        elif 11 <= hour <= 15:  # Peak hours
            congestion_factor = random.uniform(1.1, 1.8)
        else:  # Off-peak hours
            congestion_factor = random.uniform(0.8, 1.2)
        
        # Add some randomness
        random_factor = random.uniform(0.9, 1.1)
        
        return int(base_time * congestion_factor * random_factor)
    
    def _calculate_congestion_level(self, route):
        """Calculate congestion level based on travel time"""
        normal_time = route['normal_travel_time']
        current_time = route['current_travel_time']
        
        ratio = current_time / normal_time
        
        if ratio < 1.2:
            return 'low'
        elif ratio < 1.5:
            return 'moderate'
        elif ratio < 2.0:
            return 'high'
        else:
            return 'severe'
    
    def _determine_route_status(self, route):
        """Determine if route is open or closed"""
        if route['congestion_level'] == 'severe' and random.random() < 0.1:  # 10% chance of closure
            return 'closed'
        else:
            return 'open'
    
    def _calculate_overall_conditions(self):
        """Calculate overall traffic conditions"""
        total_routes = len(self.traffic_routes)
        open_routes = len([r for r in self.traffic_routes if r['status'] == 'open'])
        
        congestion_levels = [r['congestion_level'] for r in self.traffic_routes]
        low_congestion = congestion_levels.count('low')
        moderate_congestion = congestion_levels.count('moderate')
        high_congestion = congestion_levels.count('high')
        severe_congestion = congestion_levels.count('severe')
        
        # Calculate overall congestion score
        congestion_scores = {'low': 1, 'moderate': 2, 'high': 3, 'severe': 4}
        total_score = sum(congestion_scores[level] for level in congestion_levels)
        average_score = total_score / total_routes
        
        if average_score < 1.5:
            overall_level = 'good'
        elif average_score < 2.5:
            overall_level = 'moderate'
        elif average_score < 3.5:
            overall_level = 'poor'
        else:
            overall_level = 'severe'
        
        return {
            'overall_level': overall_level,
            'open_routes': open_routes,
            'total_routes': total_routes,
            'low_congestion': low_congestion,
            'moderate_congestion': moderate_congestion,
            'high_congestion': high_congestion,
            'severe_congestion': severe_congestion,
            'average_congestion_score': round(average_score, 2)
        }
    
    def _identify_bottlenecks(self):
        """Identify traffic bottlenecks"""
        bottlenecks = []
        
        for route in self.traffic_routes:
            if route['congestion_level'] in ['high', 'severe']:
                bottleneck = {
                    'route_id': route['id'],
                    'route_name': route['name'],
                    'congestion_level': route['congestion_level'],
                    'estimated_delay': route['current_travel_time'] - route['normal_travel_time'],
                    'recommendation': self._get_bottleneck_recommendation(route['congestion_level'])
                }
                bottlenecks.append(bottleneck)
        
        return bottlenecks
    
    def _generate_traffic_recommendations(self):
        """Generate traffic management recommendations"""
        recommendations = []
        conditions = self._calculate_overall_conditions()
        
        if conditions['overall_level'] == 'severe':
            recommendations.extend([
                'Implement traffic diversion measures',
                'Deploy additional traffic police',
                'Consider temporary road closures',
                'Activate emergency traffic protocols'
            ])
        elif conditions['overall_level'] == 'poor':
            recommendations.extend([
                'Increase traffic monitoring',
                'Deploy traffic control personnel',
                'Optimize traffic signal timing',
                'Prepare for potential diversions'
            ])
        elif conditions['overall_level'] == 'moderate':
            recommendations.extend([
                'Monitor traffic flow closely',
                'Prepare contingency plans',
                'Maintain current traffic management'
            ])
        else:
            recommendations.extend([
                'Continue current traffic management',
                'Monitor for potential congestion',
                'Maintain emergency response readiness'
            ])
        
        return recommendations
    
    def _get_emergency_routes(self):
        """Get routes suitable for emergency vehicles"""
        return [route for route in self.traffic_routes if route['status'] == 'open' and route['congestion_level'] == 'low']
    
    def _generate_route_options(self, start_coords, end_coords):
        """Generate route options between two points"""
        routes = []
        
        # Generate 3-5 route options
        for i in range(random.randint(3, 5)):
            route = {
                'route_id': f'opt_route_{i}',
                'start_coords': start_coords,
                'end_coords': end_coords,
                'distance_km': random.uniform(2.0, 8.0),
                'travel_time': random.randint(5, 25),
                'congestion_level': random.choice(['low', 'moderate', 'high']),
                'safety_score': random.uniform(0.7, 1.0),
                'route_type': random.choice(['primary', 'secondary', 'emergency']),
                'toll_required': random.choice([True, False])
            }
            routes.append(route)
        
        return routes
    
    def _analyze_routes(self, routes):
        """Analyze route options"""
        if not routes:
            return {}
        
        return {
            'fastest_route': min(routes, key=lambda x: x['travel_time']),
            'safest_route': max(routes, key=lambda x: x['safety_score']),
            'shortest_distance': min(routes, key=lambda x: x['distance_km']),
            'average_travel_time': sum(r['travel_time'] for r in routes) / len(routes),
            'route_count': len(routes)
        }
    
    def _predict_congestion_by_time(self, target_time):
        """Predict congestion level based on time"""
        hour = target_time.hour
        
        if 7 <= hour <= 9:
            return random.choice(['moderate', 'high'])
        elif 17 <= hour <= 19:
            return random.choice(['high', 'severe'])
        elif 11 <= hour <= 15:
            return random.choice(['moderate', 'high'])
        else:
            return random.choice(['low', 'moderate'])
    
    def _get_prediction_recommendations(self, predicted_congestion):
        """Get recommendations based on predicted congestion"""
        if predicted_congestion == 'severe':
            return ['Prepare traffic diversion', 'Deploy emergency teams', 'Consider event modification']
        elif predicted_congestion == 'high':
            return ['Increase traffic monitoring', 'Prepare diversion routes', 'Deploy additional personnel']
        elif predicted_congestion == 'moderate':
            return ['Monitor traffic flow', 'Prepare contingency plans']
        else:
            return ['Continue current management', 'Monitor for changes']
    
    def _get_bottleneck_recommendation(self, congestion_level):
        """Get specific recommendation for bottleneck"""
        if congestion_level == 'severe':
            return 'Immediate traffic diversion required'
        elif congestion_level == 'high':
            return 'Consider traffic diversion or signal optimization'
        else:
            return 'Monitor and prepare for potential diversion'
    
    def _get_mock_traffic_data(self):
        """Get mock traffic data for fallback"""
        return {
            'routes': [],
            'overall_conditions': {'overall_level': 'good'},
            'bottlenecks': [],
            'recommendations': ['Continue monitoring'],
            'emergency_routes': [],
            'timestamp': datetime.now().isoformat()
        }
