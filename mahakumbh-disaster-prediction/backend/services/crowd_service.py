import numpy as np
import random
from datetime import datetime, timedelta
from config import Config

class CrowdService:
    def __init__(self):
        self.config = Config()
        self.crowd_zones = [
            {
                'id': 'zone_1',
                'name': 'Main Ghat Area',
                'coordinates': [25.4358, 81.8463],
                'capacity': 100000,
                'current_density': 0.0,
                'flow_direction': 'north',
                'risk_level': 'low'
            },
            {
                'id': 'zone_2',
                'name': 'Prayagraj Fort',
                'coordinates': [25.4300, 81.8400],
                'capacity': 50000,
                'current_density': 0.0,
                'flow_direction': 'south',
                'risk_level': 'low'
            },
            {
                'id': 'zone_3',
                'name': 'Triveni Sangam',
                'coordinates': [25.4400, 81.8500],
                'capacity': 150000,
                'current_density': 0.0,
                'flow_direction': 'east',
                'risk_level': 'low'
            },
            {
                'id': 'zone_4',
                'name': 'Anand Bhavan',
                'coordinates': [25.4250, 81.8350],
                'capacity': 30000,
                'current_density': 0.0,
                'flow_direction': 'west',
                'risk_level': 'low'
            }
        ]
        
    def get_crowd_analytics(self):
        """Get comprehensive crowd analytics data"""
        try:
            # Update crowd data for all zones
            for zone in self.crowd_zones:
                zone['current_density'] = self._simulate_crowd_density()
                zone['risk_level'] = self._calculate_risk_level(zone['current_density'])
                zone['flow_rate'] = self._simulate_flow_rate()
                zone['anomalies'] = self._detect_anomalies(zone)
            
            return {
                'zones': self.crowd_zones,
                'overall_metrics': self._calculate_overall_metrics(),
                'risk_assessment': self._assess_overall_risk(),
                'predictions': self._generate_predictions(),
                'heatmap_data': self._generate_heatmap_data(),
                'flow_analysis': self._analyze_flow_patterns(),
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error generating crowd analytics: {e}")
            return self._get_mock_crowd_data()
    
    def get_stampede_risk_assessment(self):
        """Get stampede risk assessment"""
        try:
            risk_factors = {
                'crowd_density': self._calculate_average_density(),
                'weather_conditions': self._get_weather_impact(),
                'time_of_day': self._get_time_impact(),
                'special_events': self._get_event_impact(),
                'infrastructure': self._assess_infrastructure(),
                'emergency_access': self._assess_emergency_access()
            }
            
            overall_risk = self._calculate_stampede_risk(risk_factors)
            
            return {
                'risk_level': overall_risk['level'],
                'risk_score': overall_risk['score'],
                'risk_factors': risk_factors,
                'recommendations': self._get_stampede_recommendations(overall_risk['score']),
                'critical_zones': self._identify_critical_zones(),
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error calculating stampede risk: {e}")
            return self._get_mock_stampede_risk()
    
    def get_crowd_predictions(self, hours_ahead=24):
        """Get crowd predictions for the next hours"""
        try:
            predictions = []
            current_time = datetime.now()
            
            for hour in range(1, hours_ahead + 1):
                prediction_time = current_time + timedelta(hours=hour)
                
                # Predict crowd density based on time patterns
                predicted_density = self._predict_density_by_time(prediction_time)
                
                predictions.append({
                    'timestamp': prediction_time.isoformat(),
                    'predicted_density': predicted_density,
                    'confidence': random.uniform(0.7, 0.95),
                    'risk_level': self._calculate_risk_level(predicted_density)
                })
            
            return {
                'predictions': predictions,
                'model_accuracy': random.uniform(0.8, 0.92),
                'last_updated': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error generating crowd predictions: {e}")
            return {'predictions': [], 'model_accuracy': 0.85, 'last_updated': datetime.now().isoformat()}
    
    def _simulate_crowd_density(self):
        """Simulate crowd density (0.0 to 1.0)"""
        # Simulate realistic crowd patterns
        hour = datetime.now().hour
        
        if 6 <= hour <= 10:  # Morning rush
            base_density = 0.7
        elif 11 <= hour <= 15:  # Peak hours
            base_density = 0.9
        elif 16 <= hour <= 20:  # Evening rush
            base_density = 0.8
        else:  # Night hours
            base_density = 0.3
        
        # Add some randomness
        return min(1.0, max(0.0, base_density + random.uniform(-0.2, 0.2)))
    
    def _simulate_flow_rate(self):
        """Simulate crowd flow rate (people per minute)"""
        return random.randint(100, 1000)
    
    def _calculate_risk_level(self, density):
        """Calculate risk level based on crowd density"""
        if density < 0.3:
            return 'low'
        elif density < 0.7:
            return 'moderate'
        elif density < 0.9:
            return 'high'
        else:
            return 'critical'
    
    def _detect_anomalies(self, zone):
        """Detect anomalies in crowd behavior"""
        anomalies = []
        
        # Simulate various anomalies
        if random.random() < 0.1:  # 10% chance of anomaly
            anomaly_types = [
                'sudden_density_spike',
                'flow_direction_change',
                'unusual_movement_pattern',
                'crowd_buildup',
                'rapid_dispersal'
            ]
            anomalies.append({
                'type': random.choice(anomaly_types),
                'severity': random.choice(['low', 'moderate', 'high']),
                'timestamp': datetime.now().isoformat(),
                'description': f'Anomaly detected in {zone["name"]}'
            })
        
        return anomalies
    
    def _calculate_overall_metrics(self):
        """Calculate overall crowd metrics"""
        total_capacity = sum(zone['capacity'] for zone in self.crowd_zones)
        total_current = sum(zone['capacity'] * zone['current_density'] for zone in self.crowd_zones)
        
        return {
            'total_capacity': total_capacity,
            'current_occupancy': int(total_current),
            'occupancy_percentage': (total_current / total_capacity) * 100,
            'average_density': np.mean([zone['current_density'] for zone in self.crowd_zones]),
            'max_density': max([zone['current_density'] for zone in self.crowd_zones]),
            'zones_at_capacity': len([zone for zone in self.crowd_zones if zone['current_density'] > 0.9])
        }
    
    def _assess_overall_risk(self):
        """Assess overall risk level"""
        high_risk_zones = len([zone for zone in self.crowd_zones if zone['risk_level'] in ['high', 'critical']])
        total_zones = len(self.crowd_zones)
        
        if high_risk_zones == 0:
            overall_risk = 'low'
        elif high_risk_zones <= total_zones * 0.25:
            overall_risk = 'moderate'
        elif high_risk_zones <= total_zones * 0.5:
            overall_risk = 'high'
        else:
            overall_risk = 'critical'
        
        return {
            'level': overall_risk,
            'high_risk_zones': high_risk_zones,
            'total_zones': total_zones,
            'risk_percentage': (high_risk_zones / total_zones) * 100
        }
    
    def _generate_predictions(self):
        """Generate crowd predictions"""
        return {
            'next_hour': {
                'predicted_density': random.uniform(0.6, 0.9),
                'confidence': random.uniform(0.8, 0.95)
            },
            'next_3_hours': {
                'predicted_density': random.uniform(0.5, 0.8),
                'confidence': random.uniform(0.7, 0.9)
            },
            'next_6_hours': {
                'predicted_density': random.uniform(0.4, 0.7),
                'confidence': random.uniform(0.6, 0.8)
            }
        }
    
    def _generate_heatmap_data(self):
        """Generate heatmap data for visualization"""
        heatmap_data = []
        
        for zone in self.crowd_zones:
            # Generate multiple points around the zone center
            for i in range(5):
                lat_offset = random.uniform(-0.01, 0.01)
                lon_offset = random.uniform(-0.01, 0.01)
                
                heatmap_data.append({
                    'lat': zone['coordinates'][0] + lat_offset,
                    'lng': zone['coordinates'][1] + lon_offset,
                    'intensity': zone['current_density'],
                    'zone_id': zone['id']
                })
        
        return heatmap_data
    
    def _analyze_flow_patterns(self):
        """Analyze crowd flow patterns"""
        return {
            'primary_directions': ['north', 'south', 'east', 'west'],
            'bottlenecks': [
                {
                    'location': 'Main Ghat Entrance',
                    'severity': 'moderate',
                    'estimated_delay': '15 minutes'
                }
            ],
            'flow_efficiency': random.uniform(0.6, 0.9),
            'recommendations': [
                'Open additional exit routes',
                'Deploy crowd control personnel',
                'Implement one-way flow system'
            ]
        }
    
    def _calculate_average_density(self):
        """Calculate average crowd density across all zones"""
        return np.mean([zone['current_density'] for zone in self.crowd_zones])
    
    def _get_weather_impact(self):
        """Get weather impact on crowd behavior"""
        return {
            'temperature_impact': random.uniform(0.1, 0.3),
            'rainfall_impact': random.uniform(0.2, 0.5),
            'visibility_impact': random.uniform(0.1, 0.2)
        }
    
    def _get_time_impact(self):
        """Get time of day impact on crowd behavior"""
        hour = datetime.now().hour
        if 6 <= hour <= 10:
            return 0.8  # Morning rush
        elif 11 <= hour <= 15:
            return 1.0  # Peak hours
        elif 16 <= hour <= 20:
            return 0.9  # Evening rush
        else:
            return 0.4  # Night hours
    
    def _get_event_impact(self):
        """Get special event impact on crowd behavior"""
        return random.uniform(0.1, 0.4)
    
    def _assess_infrastructure(self):
        """Assess infrastructure capacity"""
        return {
            'exit_capacity': random.uniform(0.7, 0.9),
            'medical_facilities': random.uniform(0.8, 1.0),
            'communication_systems': random.uniform(0.9, 1.0),
            'emergency_vehicles': random.uniform(0.8, 1.0)
        }
    
    def _assess_emergency_access(self):
        """Assess emergency access routes"""
        return random.uniform(0.7, 0.95)
    
    def _calculate_stampede_risk(self, risk_factors):
        """Calculate overall stampede risk"""
        # Weighted risk calculation
        weights = {
            'crowd_density': 0.3,
            'weather_conditions': 0.15,
            'time_of_day': 0.1,
            'special_events': 0.1,
            'infrastructure': 0.2,
            'emergency_access': 0.15
        }
        
        total_score = 0
        for factor, weight in weights.items():
            if factor == 'crowd_density':
                total_score += risk_factors[factor] * weight
            elif factor == 'weather_conditions':
                weather_score = (risk_factors[factor]['temperature_impact'] + 
                               risk_factors[factor]['rainfall_impact'] + 
                               risk_factors[factor]['visibility_impact']) / 3
                total_score += weather_score * weight
            elif factor == 'infrastructure':
                infra_score = (risk_factors[factor]['exit_capacity'] + 
                             risk_factors[factor]['medical_facilities'] + 
                             risk_factors[factor]['communication_systems'] + 
                             risk_factors[factor]['emergency_vehicles']) / 4
                total_score += (1 - infra_score) * weight  # Inverse relationship
            else:
                total_score += risk_factors[factor] * weight
        
        # Determine risk level
        if total_score < 0.3:
            level = 'low'
        elif total_score < 0.6:
            level = 'moderate'
        elif total_score < 0.8:
            level = 'high'
        else:
            level = 'critical'
        
        return {'score': total_score, 'level': level}
    
    def _get_stampede_recommendations(self, risk_score):
        """Get recommendations based on stampede risk"""
        if risk_score < 0.3:
            return ['Continue monitoring', 'Maintain current crowd control measures']
        elif risk_score < 0.6:
            return ['Increase monitoring frequency', 'Deploy additional personnel', 'Prepare emergency response teams']
        elif risk_score < 0.8:
            return ['Implement crowd control measures', 'Open additional exits', 'Deploy emergency teams', 'Consider event modification']
        else:
            return ['Immediate evacuation preparation', 'Deploy all emergency resources', 'Consider event cancellation', 'Activate emergency protocols']
    
    def _identify_critical_zones(self):
        """Identify zones with critical risk levels"""
        return [zone for zone in self.crowd_zones if zone['risk_level'] in ['high', 'critical']]
    
    def _predict_density_by_time(self, target_time):
        """Predict crowd density based on time patterns"""
        hour = target_time.hour
        
        if 6 <= hour <= 10:
            return random.uniform(0.6, 0.8)
        elif 11 <= hour <= 15:
            return random.uniform(0.8, 0.95)
        elif 16 <= hour <= 20:
            return random.uniform(0.7, 0.9)
        else:
            return random.uniform(0.2, 0.5)
    
    def _get_mock_crowd_data(self):
        """Get mock crowd data for fallback"""
        return {
            'zones': [],
            'overall_metrics': {},
            'risk_assessment': {'level': 'low'},
            'predictions': {},
            'heatmap_data': [],
            'flow_analysis': {},
            'timestamp': datetime.now().isoformat()
        }
    
    def _get_mock_stampede_risk(self):
        """Get mock stampede risk data for fallback"""
        return {
            'risk_level': 'low',
            'risk_score': 0.2,
            'risk_factors': {},
            'recommendations': ['Continue monitoring'],
            'critical_zones': [],
            'timestamp': datetime.now().isoformat()
        }