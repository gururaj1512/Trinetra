import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Grid,
  Chip,
} from '@mui/material';
import {
  DirectionsCar as TrafficIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';

const TrafficWidget = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <Card className="dashboard-card">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Traffic Monitoring
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No traffic data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const getCongestionColor = (level) => {
    switch (level) {
      case 'severe':
        return 'error';
      case 'high':
        return 'warning';
      case 'moderate':
        return 'info';
      default:
        return 'success';
    }
  };

  const overallConditions = data.overall_conditions || {};
  const bottlenecks = data.bottlenecks || [];

  return (
    <Card className="dashboard-card">
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">
            Traffic Monitoring
          </Typography>
          <TrafficIcon color="primary" />
        </Box>

        {/* Overall Conditions */}
        <Box mb={3}>
          <Typography variant="h4" color="primary" fontWeight="bold">
            {overallConditions.overall_level?.toUpperCase() || 'GOOD'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Overall Traffic Conditions
          </Typography>
          
          <Box mt={2}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Congestion Score
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {overallConditions.average_congestion_score || 0}/4
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={(overallConditions.average_congestion_score / 4) * 100 || 0} 
              color={getCongestionColor(overallConditions.overall_level)}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        </Box>

        {/* Route Status */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Route Status
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {overallConditions.open_routes || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Open Routes
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box textAlign="center">
                <Typography variant="h4" color="error.main">
                  {overallConditions.total_routes - (overallConditions.open_routes || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Closed Routes
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Congestion Breakdown */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Congestion Levels
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Low
                </Typography>
                <Typography variant="h6" color="success.main">
                  {overallConditions.low_congestion || 0}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Moderate
                </Typography>
                <Typography variant="h6" color="info.main">
                  {overallConditions.moderate_congestion || 0}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  High
                </Typography>
                <Typography variant="h6" color="warning.main">
                  {overallConditions.high_congestion || 0}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Severe
                </Typography>
                <Typography variant="h6" color="error.main">
                  {overallConditions.severe_congestion || 0}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Bottlenecks */}
        {bottlenecks.length > 0 && (
          <Box mb={2}>
            <Typography variant="h6" gutterBottom>
              Active Bottlenecks
            </Typography>
            {bottlenecks.slice(0, 2).map((bottleneck, index) => (
              <Box key={index} mb={1}>
                <Typography variant="body2" fontWeight="bold">
                  {bottleneck.route_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Delay: {bottleneck.estimated_delay} minutes
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Emergency Routes */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Emergency Access
          </Typography>
          <Chip 
            icon={<CheckIcon />}
            label={`${data.emergency_routes?.length || 0} routes available`}
            color="success"
            size="small"
          />
        </Box>

        {/* Timestamp */}
        <Box mt={2} textAlign="center">
          <Typography variant="caption" color="text.secondary">
            Last updated: {new Date(data.timestamp).toLocaleTimeString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TrafficWidget;
