from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import threading
import time
import json
import os
from datetime import datetime, timedelta
import random

from config import Config
from services.weather_service import WeatherService
from services.earthquake_service import EarthquakeService
from services.crowd_service import CrowdService
from services.traffic_service import TrafficService
from services.alert_service import AlertService
from services.satellite_service import SatelliteService

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize services
weather_service = WeatherService()
earthquake_service = EarthquakeService()
crowd_service = CrowdService()
traffic_service = TrafficService()
alert_service = AlertService()
satellite_service = SatelliteService()

# Global data storage
dashboard_data = {
    'weather': {},
    'earthquakes': [],
    'crowd': {},
    'traffic': {},
    'alerts': [],
    'satellite': {},
    'risk_score': 0
}

@app.route('/')
def index():
    return jsonify({
        'message': 'Disaster Prediction & Management API',
        'status': 'running',
        'version': '1.0.0'
    })

@app.route('/api/dashboard')
def get_dashboard_data():
    """Get all dashboard data"""
    return jsonify(dashboard_data)

@app.route('/api/weather')
def get_weather():
    """Get current weather data"""
    try:
        weather_data = weather_service.get_current_weather()
        dashboard_data['weather'] = weather_data
        return jsonify(weather_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/weather/forecast')
def get_weather_forecast():
    """Get weather forecast"""
    try:
        forecast_data = weather_service.get_forecast()
        return jsonify(forecast_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/earthquakes')
def get_earthquakes():
    """Get recent earthquakes"""
    try:
        earthquakes = earthquake_service.get_recent_earthquakes()
        dashboard_data['earthquakes'] = earthquakes
        return jsonify(earthquakes)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/crowd')
def get_crowd_data():
    """Get crowd analytics data"""
    try:
        crowd_data = crowd_service.get_crowd_analytics()
        dashboard_data['crowd'] = crowd_data
        return jsonify(crowd_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/traffic')
def get_traffic_data():
    """Get traffic data"""
    try:
        traffic_data = traffic_service.get_traffic_conditions()
        dashboard_data['traffic'] = traffic_data
        return jsonify(traffic_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts')
def get_alerts():
    """Get all alerts"""
    try:
        alerts = alert_service.get_all_alerts()
        dashboard_data['alerts'] = alerts
        return jsonify(alerts)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/risk-score')
def get_risk_score():
    """Get current risk score"""
    try:
        risk_score = alert_service.calculate_risk_score(dashboard_data)
        dashboard_data['risk_score'] = risk_score
        return jsonify(risk_score)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/emergency/contacts')
def get_emergency_contacts():
    """Get emergency contact information"""
    contacts = {
        'police': '+91-100',
        'fire': '+91-101',
        'ambulance': '+91-102',
        'disaster_management': '+91-1070'
    }
    return jsonify(contacts)

@app.route('/api/satellite/imagery')
def get_satellite_imagery():
    """Get satellite imagery data"""
    try:
        satellite_data = satellite_service.get_area_imagery()
        dashboard_data['satellite'] = satellite_data
        return jsonify(satellite_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/satellite/flood-analysis')
def get_flood_analysis():
    """Get flood analysis from satellite data"""
    try:
        flood_data = satellite_service.get_flood_analysis()
        return jsonify(flood_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/satellite/terrain-analysis')
def get_terrain_analysis():
    """Get terrain analysis from satellite data"""
    try:
        terrain_data = satellite_service.get_terrain_analysis()
        return jsonify(terrain_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/satellite/evacuation-routes')
def get_satellite_evacuation_routes():
    """Get evacuation routes based on satellite analysis"""
    try:
        evacuation_data = satellite_service.get_evacuation_route_analysis()
        return jsonify(evacuation_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/evacuation-routes')
def get_evacuation_routes():
    """Get evacuation routes"""
    routes = {
        'primary_routes': [
            {
                'name': 'Route 1 - Main Exit',
                'coordinates': [[25.4358, 81.8463], [25.4400, 81.8500]],
                'capacity': 50000,
                'status': 'open'
            },
            {
                'name': 'Route 2 - Emergency Exit',
                'coordinates': [[25.4358, 81.8463], [25.4300, 81.8400]],
                'capacity': 30000,
                'status': 'open'
            }
        ],
        'emergency_assembly_points': [
            {'name': 'Ground A', 'coordinates': [25.4500, 81.8600], 'capacity': 100000},
            {'name': 'Ground B', 'coordinates': [25.4200, 81.8300], 'capacity': 80000}
        ]
    }
    return jsonify(routes)

@socketio.on('connect')
def handle_connect():
    print('Client connected')
    emit('connected', {'data': 'Connected to Disaster Prediction System'})

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

def background_task():
    """Background task to update data and emit to connected clients"""
    while True:
        try:
            # Update weather data
            weather_data = weather_service.get_current_weather()
            dashboard_data['weather'] = weather_data
            
            # Update earthquake data
            earthquakes = earthquake_service.get_recent_earthquakes()
            dashboard_data['earthquakes'] = earthquakes
            
            # Update crowd data
            crowd_data = crowd_service.get_crowd_analytics()
            dashboard_data['crowd'] = crowd_data
            
            # Update traffic data
            traffic_data = traffic_service.get_traffic_conditions()
            dashboard_data['traffic'] = traffic_data
            
            # Update satellite data
            satellite_data = satellite_service.get_area_imagery()
            dashboard_data['satellite'] = satellite_data
            
            # Update alerts
            alerts = alert_service.get_all_alerts()
            dashboard_data['alerts'] = alerts
            
            # Calculate risk score
            risk_score = alert_service.calculate_risk_score(dashboard_data)
            dashboard_data['risk_score'] = risk_score
            
            # Emit updated data to all connected clients
            socketio.emit('dashboard_update', dashboard_data)
            
            # Check for critical alerts
            critical_alerts = alert_service.get_critical_alerts()
            if critical_alerts:
                socketio.emit('critical_alert', critical_alerts)
            
            time.sleep(30)  # Update every 30 seconds
            
        except Exception as e:
            print(f"Error in background task: {e}")
            time.sleep(60)  # Wait longer on error

if __name__ == '__main__':
    # Start background task
    background_thread = threading.Thread(target=background_task, daemon=True)
    background_thread.start()
    
    # Get port from environment variable (for Render) or use default
    port = int(os.environ.get('PORT', 5001))
    host = os.environ.get('HOST', '0.0.0.0')
    
    # Run the application
    socketio.run(app, host=host, port=port, debug=False)
