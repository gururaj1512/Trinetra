import random
from datetime import datetime, timedelta
from config import Config

class AlertService:
    def __init__(self):
        self.config = Config()
        self.alert_history = []
        self.critical_alerts = []
        
    def get_all_alerts(self):
        """Get all current alerts"""
        try:
            # Generate various types of alerts
            alerts = []
            
            # Weather alerts
            weather_alerts = self._generate_weather_alerts()
            alerts.extend(weather_alerts)
            
            # Earthquake alerts
            earthquake_alerts = self._generate_earthquake_alerts()
            alerts.extend(earthquake_alerts)
            
            # Crowd alerts
            crowd_alerts = self._generate_crowd_alerts()
            alerts.extend(crowd_alerts)
            
            # Traffic alerts
            traffic_alerts = self._generate_traffic_alerts()
            alerts.extend(traffic_alerts)
            
            # Emergency alerts
            emergency_alerts = self._generate_emergency_alerts()
            alerts.extend(emergency_alerts)
            
            # Sort alerts by priority and timestamp
            alerts.sort(key=lambda x: (self._get_priority_score(x['priority']), x['timestamp']), reverse=True)
            
            return {
                'alerts': alerts,
                'total_alerts': len(alerts),
                'critical_alerts': len([a for a in alerts if a['priority'] == 'critical']),
                'high_priority_alerts': len([a for a in alerts if a['priority'] == 'high']),
                'last_updated': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error generating alerts: {e}")
            return {'alerts': [], 'total_alerts': 0, 'critical_alerts': 0, 'high_priority_alerts': 0}
    
    def get_critical_alerts(self):
        """Get only critical alerts"""
        try:
            all_alerts = self.get_all_alerts()
            critical_alerts = [alert for alert in all_alerts['alerts'] if alert['priority'] == 'critical']
            
            # Update critical alerts history
            self.critical_alerts = critical_alerts
            
            return critical_alerts
        except Exception as e:
            print(f"Error getting critical alerts: {e}")
            return []
    
    def calculate_risk_score(self, dashboard_data):
        """Calculate overall risk score based on all data"""
        try:
            risk_factors = {
                'weather_risk': self._calculate_weather_risk(dashboard_data.get('weather', {})),
                'earthquake_risk': self._calculate_earthquake_risk(dashboard_data.get('earthquakes', [])),
                'crowd_risk': self._calculate_crowd_risk(dashboard_data.get('crowd', {})),
                'traffic_risk': self._calculate_traffic_risk(dashboard_data.get('traffic', {}))
            }
            
            # Weighted risk calculation
            weights = {
                'weather_risk': 0.25,
                'earthquake_risk': 0.20,
                'crowd_risk': 0.35,
                'traffic_risk': 0.20
            }
            
            total_risk_score = sum(risk_factors[factor] * weights[factor] for factor in risk_factors)
            
            # Normalize to 0-100 scale
            normalized_score = min(100, max(0, total_risk_score * 100))
            
            return {
                'overall_score': round(normalized_score, 2),
                'risk_level': self._get_risk_level(normalized_score),
                'risk_factors': risk_factors,
                'weights': weights,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error calculating risk score: {e}")
            return {'overall_score': 0, 'risk_level': 'low', 'risk_factors': {}, 'weights': {}}
    
    def create_alert(self, alert_type, message, priority, location=None, data=None):
        """Create a new alert"""
        alert = {
            'id': f"alert_{len(self.alert_history) + 1}",
            'type': alert_type,
            'message': message,
            'priority': priority,
            'location': location or 'Prayagraj, Uttar Pradesh',
            'timestamp': datetime.now().isoformat(),
            'status': 'active',
            'data': data or {},
            'acknowledged': False,
            'acknowledged_by': None,
            'acknowledged_at': None
        }
        
        self.alert_history.append(alert)
        
        if priority == 'critical':
            self.critical_alerts.append(alert)
        
        return alert
    
    def acknowledge_alert(self, alert_id, acknowledged_by):
        """Acknowledge an alert"""
        for alert in self.alert_history:
            if alert['id'] == alert_id:
                alert['acknowledged'] = True
                alert['acknowledged_by'] = acknowledged_by
                alert['acknowledged_at'] = datetime.now().isoformat()
                return alert
        return None
    
    def _generate_weather_alerts(self):
        """Generate weather-related alerts"""
        alerts = []
        
        # Simulate weather alerts based on conditions
        if random.random() < 0.3:  # 30% chance of weather alert
            weather_conditions = [
                {
                    'type': 'heavy_rain',
                    'message': 'Heavy rainfall expected in the next 2 hours',
                    'priority': 'high',
                    'data': {'rainfall_mm': random.randint(20, 50), 'duration_hours': 2}
                },
                {
                    'type': 'heat_wave',
                    'message': 'Heat wave conditions with temperature above 40°C',
                    'priority': 'moderate',
                    'data': {'temperature': random.uniform(40, 45), 'humidity': random.uniform(20, 40)}
                },
                {
                    'type': 'storm_warning',
                    'message': 'Thunderstorm warning for the area',
                    'priority': 'high',
                    'data': {'wind_speed': random.uniform(30, 60), 'lightning_probability': random.uniform(0.7, 0.9)}
                },
                {
                    'type': 'flood_warning',
                    'message': 'River water level rising, flood alert issued',
                    'priority': 'critical',
                    'data': {'water_level': random.uniform(85, 95), 'threshold': 90}
                }
            ]
            
            selected_condition = random.choice(weather_conditions)
            alerts.append(self.create_alert(
                'weather',
                selected_condition['message'],
                selected_condition['priority'],
                data=selected_condition['data']
            ))
        
        return alerts
    
    def _generate_earthquake_alerts(self):
        """Generate earthquake-related alerts"""
        alerts = []
        
        # Simulate earthquake alerts
        if random.random() < 0.1:  # 10% chance of earthquake alert
            magnitude = random.uniform(3.0, 6.0)
            
            if magnitude >= 5.0:
                priority = 'critical'
                message = f'Earthquake detected! Magnitude {magnitude:.1f} - Immediate evacuation recommended'
            elif magnitude >= 4.0:
                priority = 'high'
                message = f'Earthquake detected! Magnitude {magnitude:.1f} - Monitor situation closely'
            else:
                priority = 'moderate'
                message = f'Minor earthquake detected! Magnitude {magnitude:.1f} - No immediate action required'
            
            alerts.append(self.create_alert(
                'earthquake',
                message,
                priority,
                data={'magnitude': magnitude, 'depth_km': random.uniform(5, 50)}
            ))
        
        return alerts
    
    def _generate_crowd_alerts(self):
        """Generate crowd-related alerts"""
        alerts = []
        
        # Simulate crowd alerts
        if random.random() < 0.4:  # 40% chance of crowd alert
            crowd_conditions = [
                {
                    'type': 'high_density',
                    'message': 'High crowd density detected in Main Ghat area',
                    'priority': 'high',
                    'data': {'density': random.uniform(0.8, 0.95), 'zone': 'Main Ghat Area'}
                },
                {
                    'type': 'stampede_risk',
                    'message': 'Stampede risk detected - Immediate crowd control required',
                    'priority': 'critical',
                    'data': {'risk_score': random.uniform(0.7, 0.9), 'affected_zones': ['Main Ghat', 'Triveni Sangam']}
                },
                {
                    'type': 'flow_anomaly',
                    'message': 'Unusual crowd flow pattern detected',
                    'priority': 'moderate',
                    'data': {'anomaly_type': 'sudden_direction_change', 'location': 'Prayagraj Fort'}
                },
                {
                    'type': 'bottleneck',
                    'message': 'Crowd bottleneck forming at entrance',
                    'priority': 'high',
                    'data': {'location': 'Main Entrance', 'estimated_delay': '20 minutes'}
                }
            ]
            
            selected_condition = random.choice(crowd_conditions)
            alerts.append(self.create_alert(
                'crowd',
                selected_condition['message'],
                selected_condition['priority'],
                data=selected_condition['data']
            ))
        
        return alerts
    
    def _generate_traffic_alerts(self):
        """Generate traffic-related alerts"""
        alerts = []
        
        # Simulate traffic alerts
        if random.random() < 0.3:  # 30% chance of traffic alert
            traffic_conditions = [
                {
                    'type': 'severe_congestion',
                    'message': 'Severe traffic congestion on main routes',
                    'priority': 'high',
                    'data': {'affected_routes': ['Route 1', 'Route 2'], 'estimated_delay': '45 minutes'}
                },
                {
                    'type': 'road_closure',
                    'message': 'Emergency road closure due to incident',
                    'priority': 'moderate',
                    'data': {'route': 'Route 3', 'reason': 'Vehicle breakdown', 'estimated_duration': '30 minutes'}
                },
                {
                    'type': 'emergency_vehicle_blocked',
                    'message': 'Emergency vehicle access blocked by traffic',
                    'priority': 'critical',
                    'data': {'location': 'Main Junction', 'vehicle_type': 'Ambulance'}
                }
            ]
            
            selected_condition = random.choice(traffic_conditions)
            alerts.append(self.create_alert(
                'traffic',
                selected_condition['message'],
                selected_condition['priority'],
                data=selected_condition['data']
            ))
        
        return alerts
    
    def _generate_emergency_alerts(self):
        """Generate emergency-related alerts"""
        alerts = []
        
        # Simulate emergency alerts
        if random.random() < 0.05:  # 5% chance of emergency alert
            emergency_types = [
                {
                    'type': 'medical_emergency',
                    'message': 'Medical emergency reported in crowd',
                    'priority': 'critical',
                    'data': {'location': 'Main Ghat', 'emergency_type': 'Heat stroke'}
                },
                {
                    'type': 'security_incident',
                    'message': 'Security incident reported',
                    'priority': 'critical',
                    'data': {'location': 'Prayagraj Fort', 'incident_type': 'Suspicious activity'}
                },
                {
                    'type': 'fire_incident',
                    'message': 'Fire incident reported',
                    'priority': 'critical',
                    'data': {'location': 'Food Court', 'severity': 'minor'}
                }
            ]
            
            selected_emergency = random.choice(emergency_types)
            alerts.append(self.create_alert(
                'emergency',
                selected_emergency['message'],
                selected_emergency['priority'],
                data=selected_emergency['data']
            ))
        
        return alerts
    
    def _calculate_weather_risk(self, weather_data):
        """Calculate weather risk score"""
        if not weather_data:
            return 0.1
        
        risk_score = 0.0
        
        # Temperature risk
        temp = weather_data.get('temperature', 25)
        if temp > 40:
            risk_score += 0.4
        elif temp > 35:
            risk_score += 0.2
        
        # Humidity risk
        humidity = weather_data.get('humidity', 50)
        if humidity > 80:
            risk_score += 0.2
        
        # Wind speed risk
        wind_speed = weather_data.get('wind_speed', 5)
        if wind_speed > 30:
            risk_score += 0.3
        
        # Visibility risk
        visibility = weather_data.get('visibility', 10000)
        if visibility < 5000:
            risk_score += 0.2
        
        return min(1.0, risk_score)
    
    def _calculate_earthquake_risk(self, earthquakes):
        """Calculate earthquake risk score"""
        if not earthquakes:
            return 0.1
        
        risk_score = 0.0
        
        # Handle both list and dict formats
        if isinstance(earthquakes, dict):
            # If it's a dict with 'earthquakes' key (from USGS API)
            earthquake_list = earthquakes.get('earthquakes', [])
        elif isinstance(earthquakes, list):
            # If it's directly a list
            earthquake_list = earthquakes
        else:
            return 0.1
        
        # Consider last 5 earthquakes
        for earthquake in earthquake_list[:5]:
            magnitude = earthquake.get('magnitude', 0)
            if magnitude >= 5.0:
                risk_score += 0.4
            elif magnitude >= 4.0:
                risk_score += 0.2
            elif magnitude >= 3.0:
                risk_score += 0.1
        
        return min(1.0, risk_score)
    
    def _calculate_crowd_risk(self, crowd_data):
        """Calculate crowd risk score"""
        if not crowd_data:
            return 0.1
        
        risk_score = 0.0
        
        # Overall metrics risk
        overall_metrics = crowd_data.get('overall_metrics', {})
        occupancy_percentage = overall_metrics.get('occupancy_percentage', 0)
        if occupancy_percentage > 90:
            risk_score += 0.5
        elif occupancy_percentage > 70:
            risk_score += 0.3
        elif occupancy_percentage > 50:
            risk_score += 0.1
        
        # Zone-specific risk
        zones = crowd_data.get('zones', [])
        high_risk_zones = len([zone for zone in zones if zone.get('risk_level') in ['high', 'critical']])
        if high_risk_zones > 0:
            risk_score += 0.3
        
        return min(1.0, risk_score)
    
    def _calculate_traffic_risk(self, traffic_data):
        """Calculate traffic risk score"""
        if not traffic_data:
            return 0.1
        
        risk_score = 0.0
        
        # Overall conditions risk
        overall_conditions = traffic_data.get('overall_conditions', {})
        overall_level = overall_conditions.get('overall_level', 'good')
        
        if overall_level == 'severe':
            risk_score += 0.5
        elif overall_level == 'poor':
            risk_score += 0.3
        elif overall_level == 'moderate':
            risk_score += 0.1
        
        # Bottlenecks risk
        bottlenecks = traffic_data.get('bottlenecks', [])
        if bottlenecks:
            risk_score += 0.2
        
        return min(1.0, risk_score)
    
    def _get_priority_score(self, priority):
        """Get numerical score for priority sorting"""
        priority_scores = {
            'critical': 4,
            'high': 3,
            'moderate': 2,
            'low': 1
        }
        return priority_scores.get(priority, 0)
    
    def _get_risk_level(self, score):
        """Get risk level based on score"""
        if score >= 80:
            return 'critical'
        elif score >= 60:
            return 'high'
        elif score >= 40:
            return 'moderate'
        elif score >= 20:
            return 'low'
        else:
            return 'minimal'
