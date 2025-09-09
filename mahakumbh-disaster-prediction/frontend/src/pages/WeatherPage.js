import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useData } from '../contexts/DataContext';
import WeatherWidget from '../components/widgets/WeatherWidget';
import { WbSunny } from '@mui/icons-material';

const WeatherPage = () => {
  const { fetchWeatherData, fetchWeatherForecast } = useData();
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadWeatherData = async () => {
      try {
        setLoading(true);
        const [current, forecast] = await Promise.all([
          fetchWeatherData(),
          fetchWeatherForecast()
        ]);
        setWeatherData(current);
        setForecastData(forecast);
      } catch (err) {
        setError('Failed to load weather data');
      } finally {
        setLoading(false);
      }
    };

    loadWeatherData();
  }, [fetchWeatherData, fetchWeatherForecast]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 4 } }}>
        <Box
          sx={{
            width: { xs: 60, sm: 70, md: 80 },
            height: { xs: 60, sm: 70, md: 80 },
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF6B35 0%, #FF9800 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
            fontWeight: 'bold',
            margin: '0 auto 16px',
            boxShadow: '0 8px 30px rgba(255, 107, 53, 0.4)',
          }}
        >
          <WbSunny sx={{ fontSize: 'inherit' }} />
        </Box>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: '1.75rem', sm: '2.125rem', md: '3rem' } }}>
          Weather Monitoring
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' } }}>
          Divine Weather Protection for Mahakumbh
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <WeatherWidget data={weatherData} />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Weather Forecast
              </Typography>
              {forecastData && forecastData.forecasts ? (
                <Box>
                  {forecastData.forecasts.slice(0, 8).map((forecast, index) => (
                    <Box key={index} mb={2} p={2} border="1px solid #e0e0e0" borderRadius={1}>
                      <Typography variant="body1" fontWeight="bold">
                        {new Date(forecast.datetime).toLocaleDateString()} - {new Date(forecast.datetime).toLocaleTimeString()}
                      </Typography>
                      <Typography variant="body2">
                        Temperature: {Math.round(forecast.temperature)}°C
                      </Typography>
                      <Typography variant="body2">
                        {forecast.description}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No forecast data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WeatherPage;
