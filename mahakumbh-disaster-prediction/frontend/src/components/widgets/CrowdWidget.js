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
  Groups as GroupsIcon,
} from '@mui/icons-material';

const CrowdWidget = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <Card className="dashboard-card">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Crowd Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No crowd data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (level) => {
    switch (level) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'moderate':
        return 'info';
      default:
        return 'success';
    }
  };

  const overallMetrics = data.overall_metrics || {};
  const zones = data.zones || [];
  const riskAssessment = data.risk_assessment || {};

  return (
    <Card className="dashboard-card">
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">
            Crowd Analytics
          </Typography>
          <GroupsIcon color="primary" />
        </Box>

        {/* Overall Metrics */}
        <Box mb={3}>
          <Typography variant="h4" color="primary" fontWeight="bold">
            {overallMetrics.current_occupancy?.toLocaleString() || 0}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Current Occupancy
          </Typography>
          
          <Box mt={2}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Occupancy Rate
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {overallMetrics.occupancy_percentage?.toFixed(1) || 0}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={overallMetrics.occupancy_percentage || 0} 
              color={overallMetrics.occupancy_percentage > 90 ? 'error' : overallMetrics.occupancy_percentage > 70 ? 'warning' : 'success'}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        </Box>

        {/* Risk Assessment */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Risk Assessment
          </Typography>
          <Chip 
            label={riskAssessment.level?.toUpperCase() || 'LOW'} 
            color={getRiskColor(riskAssessment.level)}
            size="small"
            sx={{ mb: 1 }}
          />
          <Typography variant="body2" color="text.secondary">
            {riskAssessment.high_risk_zones || 0} high-risk zones out of {riskAssessment.total_zones || 0}
          </Typography>
        </Box>

        {/* Zone Summary */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Zone Summary
          </Typography>
          <Grid container spacing={1}>
            {zones.slice(0, 4).map((zone) => (
              <Grid item xs={6} key={zone.id}>
                <Box>
                  <Typography variant="body2" fontWeight="bold" noWrap>
                    {zone.name}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LinearProgress 
                      variant="determinate" 
                      value={zone.current_density * 100} 
                      color={getRiskColor(zone.risk_level)}
                      sx={{ flexGrow: 1, height: 4, borderRadius: 2 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {(zone.current_density * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Quick Stats */}
        <Box mt={2}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Total Capacity
              </Typography>
              <Typography variant="h6" color="primary">
                {overallMetrics.total_capacity?.toLocaleString() || 0}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Max Density
              </Typography>
              <Typography variant="h6" color="warning.main">
                {(overallMetrics.max_density * 100)?.toFixed(1) || 0}%
              </Typography>
            </Grid>
          </Grid>
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

export default CrowdWidget;
