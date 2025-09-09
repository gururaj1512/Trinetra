import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Landscape as EarthquakeIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';

const EarthquakeWidget = ({ data }) => {
  if (!data || !Array.isArray(data.earthquakes)) {
    return (
      <Card className="dashboard-card">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Earthquake Monitoring
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No earthquake data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const getMagnitudeColor = (magnitude) => {
    if (magnitude >= 5.0) return 'error';
    if (magnitude >= 4.0) return 'warning';
    if (magnitude >= 3.0) return 'info';
    return 'success';
  };

  const getMagnitudeSeverity = (magnitude) => {
    if (magnitude >= 5.0) return 'Major';
    if (magnitude >= 4.0) return 'Moderate';
    if (magnitude >= 3.0) return 'Minor';
    return 'Micro';
  };

  const recentEarthquakes = data.earthquakes.slice(0, 5);
  const totalCount = data.total_count || 0;

  return (
    <Card className="dashboard-card">
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">
            Earthquake Monitoring
          </Typography>
          <EarthquakeIcon color="primary" />
        </Box>

        {/* Summary */}
        <Box mb={3}>
          <Typography variant="h4" color="primary" fontWeight="bold">
            {totalCount}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Recent Earthquakes (24h)
          </Typography>
        </Box>

        {/* Recent Earthquakes */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          {recentEarthquakes.length > 0 ? (
            <List dense>
              {recentEarthquakes.map((earthquake, index) => (
                <ListItem key={earthquake.id || index} sx={{ px: 0 }}>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={`M${earthquake.magnitude?.toFixed(1)}`}
                          color={getMagnitudeColor(earthquake.magnitude)}
                          size="small"
                        />
                        <Typography variant="body2" fontWeight="bold">
                          {getMagnitudeSeverity(earthquake.magnitude)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {earthquake.place}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {new Date(earthquake.time).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No recent earthquakes detected
            </Typography>
          )}
        </Box>

        {/* Statistics */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Statistics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box textAlign="center">
                <Typography variant="h6" color="error.main">
                  {recentEarthquakes.filter(eq => eq.magnitude >= 5.0).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Major (≥5.0)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box textAlign="center">
                <Typography variant="h6" color="warning.main">
                  {recentEarthquakes.filter(eq => eq.magnitude >= 4.0 && eq.magnitude < 5.0).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Moderate (4.0-4.9)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box textAlign="center">
                <Typography variant="h6" color="info.main">
                  {recentEarthquakes.filter(eq => eq.magnitude >= 3.0 && eq.magnitude < 4.0).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Minor (3.0-3.9)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box textAlign="center">
                <Typography variant="h6" color="success.main">
                  {recentEarthquakes.filter(eq => eq.magnitude < 3.0).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Micro (&lt;3.0)
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Monitoring Status */}
        <Box mt={2}>
          <Chip 
            icon={<TimelineIcon />}
            label="Seismic monitoring active"
            color="success"
            size="small"
            variant="outlined"
          />
        </Box>

        {/* Timestamp */}
        <Box mt={2} textAlign="center">
          <Typography variant="caption" color="text.secondary">
            Last updated: {new Date(data.last_updated).toLocaleTimeString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EarthquakeWidget;
