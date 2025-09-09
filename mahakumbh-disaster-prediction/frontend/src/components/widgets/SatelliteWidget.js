import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
} from '@mui/material';
import {
  Satellite as SatelliteIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';

const SatelliteWidget = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <Card className="dashboard-card">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Satellite Monitoring
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No satellite data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dashboard-card">
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">
            Satellite Monitoring
          </Typography>
          <SatelliteIcon color="primary" />
        </Box>

        {/* Satellite Info */}
        <Box mb={3}>
          <Typography variant="h4" color="primary" fontWeight="bold">
            {data.satellite || 'Sentinel-2'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {data.resolution || '10m'} Resolution
          </Typography>
        </Box>

        {/* Image Status */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Image Status
          </Typography>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <VisibilityIcon color="success" fontSize="small" />
            <Typography variant="body2">
              {data.image_data ? 'Image Available' : 'No Image'}
            </Typography>
          </Box>
          <Chip 
            label={data.bands?.join(', ') || 'RGB'} 
            color="primary" 
            size="small" 
            variant="outlined"
          />
        </Box>

        {/* Coverage Area */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Coverage Area
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Latitude
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {data.bbox?.[1]?.toFixed(4) || 'N/A'} - {data.bbox?.[3]?.toFixed(4) || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Longitude
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {data.bbox?.[0]?.toFixed(4) || 'N/A'} - {data.bbox?.[2]?.toFixed(4) || 'N/A'}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Time Range */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Time Range
          </Typography>
          <Typography variant="body2" color="text.secondary">
            From: {data.time_range?.from ? new Date(data.time_range.from).toLocaleDateString() : 'N/A'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            To: {data.time_range?.to ? new Date(data.time_range.to).toLocaleDateString() : 'N/A'}
          </Typography>
        </Box>

        {/* Status */}
        <Box>
          <Chip 
            icon={<SatelliteIcon />}
            label="Satellite monitoring active"
            color="success"
            size="small"
            variant="outlined"
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

export default SatelliteWidget;
