import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
} from '@mui/material';
import {
  WbSunny as SunIcon,
  Opacity as HumidityIcon,
  Air as WindIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';

const WeatherWidget = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <Card className="dashboard-card">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Weather Information
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No weather data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const getWeatherIcon = (description) => {
    if (description.includes('rain')) return '🌧️';
    if (description.includes('cloud')) return '☁️';
    if (description.includes('clear')) return '☀️';
    if (description.includes('storm')) return '⛈️';
    return '🌤️';
  };

  const getTemperatureColor = (temp) => {
    if (temp > 35) return 'error.main';
    if (temp > 30) return 'warning.main';
    return 'primary.main';
  };

  return (
    <Card className="dashboard-card">
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">
            Weather Conditions
          </Typography>
          <Box fontSize="2rem">
            {getWeatherIcon(data.description)}
          </Box>
        </Box>

        {/* Temperature */}
        <Box textAlign="center" mb={2}>
          <Typography 
            variant="h3" 
            color={getTemperatureColor(data.temperature)}
            fontWeight="bold"
          >
            {Math.round(data.temperature)}°C
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Feels like {Math.round(data.feels_like)}°C
          </Typography>
          <Typography variant="body1" color="text.primary" sx={{ mt: 1 }}>
            {data.description}
          </Typography>
        </Box>

        {/* Weather Details */}
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box display="flex" alignItems="center" gap={1}>
              <HumidityIcon color="primary" fontSize="small" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Humidity
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {data.humidity}%
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={6}>
            <Box display="flex" alignItems="center" gap={1}>
              <WindIcon color="primary" fontSize="small" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Wind Speed
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {data.wind_speed} m/s
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={6}>
            <Box display="flex" alignItems="center" gap={1}>
              <VisibilityIcon color="primary" fontSize="small" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Visibility
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {(data.visibility / 1000).toFixed(1)} km
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={6}>
            <Box display="flex" alignItems="center" gap={1}>
              <SunIcon color="primary" fontSize="small" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Pressure
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {data.pressure} hPa
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Location */}
        <Box mt={2} textAlign="center">
          <Chip 
            label={data.location || 'Prayagraj, UP'} 
            color="primary" 
            variant="outlined"
            size="small"
          />
        </Box>

        {/* Timestamp */}
        <Box mt={1} textAlign="center">
          <Typography variant="caption" color="text.secondary">
            Last updated: {new Date(data.timestamp).toLocaleTimeString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WeatherWidget;
