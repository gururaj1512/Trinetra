import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Water as WaterIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';

const FloodAnalysisWidget = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <Card className="dashboard-card">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Flood Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No flood analysis data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (level) => {
    switch (level) {
      case 'high':
        return 'error';
      case 'moderate':
        return 'warning';
      default:
        return 'success';
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'high':
        return <WarningIcon color="error" />;
      case 'moderate':
        return <WarningIcon color="warning" />;
      default:
        return <WaterIcon color="success" />;
    }
  };

  return (
    <Card className="dashboard-card">
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">
            Flood Analysis
          </Typography>
          <WaterIcon color="primary" />
        </Box>

        {/* Risk Assessment */}
        <Box mb={3}>
          <Typography variant="h4" color={getRiskColor(data.risk_level)} fontWeight="bold">
            {(data.flood_risk * 100).toFixed(1)}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Flood Risk Probability
          </Typography>
          <Box mt={1}>
            <Chip 
              icon={getRiskIcon(data.risk_level)}
              label={data.risk_level?.toUpperCase() || 'LOW'} 
              color={getRiskColor(data.risk_level)}
              size="small"
            />
          </Box>
        </Box>

        {/* Risk Progress Bar */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Risk Level
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {(data.flood_risk * 100).toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={data.flood_risk * 100} 
            color={getRiskColor(data.risk_level)}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Flood Metrics */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Flood Metrics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box textAlign="center">
                <Typography variant="h6" color="info.main">
                  {data.affected_area_km2?.toFixed(1) || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Affected Area (km²)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box textAlign="center">
                <Typography variant="h6" color={data.water_level_change > 0 ? 'error' : 'success'}>
                  {data.water_level_change > 0 ? '+' : ''}{data.water_level_change?.toFixed(1) || 0}m
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Water Level Change
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Recommendations */}
        {data.recommendations && data.recommendations.length > 0 && (
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Recommendations
            </Typography>
            <List dense>
              {data.recommendations.slice(0, 3).map((recommendation, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <TrendingIcon color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={recommendation}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Analysis Status */}
        <Box>
          <Chip 
            icon={<VisibilityIcon />}
            label="Satellite analysis complete"
            color="success"
            size="small"
            variant="outlined"
          />
        </Box>

        {/* Timestamp */}
        <Box mt={2} textAlign="center">
          <Typography variant="caption" color="text.secondary">
            Last updated: {new Date(data.analysis_timestamp).toLocaleTimeString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default FloodAnalysisWidget;
