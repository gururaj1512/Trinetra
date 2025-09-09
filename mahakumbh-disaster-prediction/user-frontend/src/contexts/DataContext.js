import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSocket } from './SocketContext';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [dashboardData, setDashboardData] = useState({
    weather: {},
    traffic: {},
    alerts: { alerts: [] },
    risk_score: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isConnected, lastUpdate } = useSocket();

  // Get API base URL from environment variable or use localhost for development
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch only essential data for users
      const [weatherResponse, trafficResponse, alertsResponse, riskResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/weather`),
        axios.get(`${API_BASE_URL}/api/traffic`),
        axios.get(`${API_BASE_URL}/api/alerts`),
        axios.get(`${API_BASE_URL}/api/risk-score`)
      ]);

      const weatherData = weatherResponse.data;
      const trafficData = trafficResponse.data;
      const alertsData = alertsResponse.data;
      const riskData = riskResponse.data;

      // Filter alerts to show only public safety information
      const publicAlerts = {
        ...alertsData,
        alerts: (alertsData.alerts || []).filter(alert => 
          alert.priority === 'critical' || 
          (alert.priority === 'high' && ['weather', 'emergency', 'traffic'].includes(alert.type))
        )
      };

      setDashboardData({
        weather: weatherData,
        traffic: trafficData,
        alerts: publicAlerts,
        risk_score: riskData,
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to fetch safety information');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // Fetch initial data
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Update data when socket receives updates
  useEffect(() => {
    if (lastUpdate) {
      fetchDashboardData();
    }
  }, [lastUpdate, fetchDashboardData]);

  const fetchWeatherData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/weather`);
      return response.data;
    } catch (err) {
      console.error('Error fetching weather data:', err);
      throw err;
    }
  };

  const fetchWeatherForecast = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/weather/forecast`);
      return response.data;
    } catch (err) {
      console.error('Error fetching weather forecast:', err);
      throw err;
    }
  };

  const fetchTrafficData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/traffic`);
      return response.data;
    } catch (err) {
      console.error('Error fetching traffic data:', err);
      throw err;
    }
  };

  const fetchEmergencyContacts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/emergency/contacts`);
      return response.data;
    } catch (err) {
      console.error('Error fetching emergency contacts:', err);
      throw err;
    }
  };

  const fetchEvacuationRoutes = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/evacuation-routes`);
      return response.data;
    } catch (err) {
      console.error('Error fetching evacuation routes:', err);
      throw err;
    }
  };

  const refreshData = () => {
    // Store current scroll position
    const currentScrollY = window.scrollY;
    
    fetchDashboardData().then(() => {
      // Restore scroll position after data refresh
      setTimeout(() => {
        window.scrollTo(0, currentScrollY);
      }, 100);
    });
  };

  const value = {
    dashboardData,
    loading,
    error,
    isConnected,
    lastUpdate,
    refreshData,
    fetchWeatherData,
    fetchWeatherForecast,
    fetchTrafficData,
    fetchEmergencyContacts,
    fetchEvacuationRoutes,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
