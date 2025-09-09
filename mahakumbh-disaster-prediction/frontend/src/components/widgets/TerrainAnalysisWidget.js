import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Terrain as TerrainIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';

const TerrainAnalysisWidget = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <Card className="dashboard-card">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Terrain Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No terrain analysis data available
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
            Terrain Analysis
          </Typography>
          <TerrainIcon color="primary" />
        </Box>

        {/* Elevation Range */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Elevation Range
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box textAlign="center">
                <Typography variant="h6" color="info.main">
                  {data.elevation_range?.min?.toFixed(1) || 0}m
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Min
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box textAlign="center">
                <Typography variant="h6" color="primary.main">
                  {data.elevation_range?.average?.toFixed(1) || 0}m
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box textAlign="center">
                <Typography variant="h6" color="warning.main">
                  {data.elevation_range?.max?.toFixed(1) || 0}m
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Max
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Slope Analysis */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Slope Analysis
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Average Slope
                </Typography>
                <Typography variant="h6" color="primary.main">
                  {data.slope_analysis?.average_slope?.toFixed(1) || 0}°
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Steep Areas
                </Typography>
                <Typography variant="h6" color="warning.main">
                  {data.slope_analysis?.steep_areas || 0}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Flood Prone Areas
                </Typography>
                <Typography variant="h6" color="error.main">
                  {data.slope_analysis?.flood_prone_areas || 0}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Land Cover */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Land Cover Distribution
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Water Bodies
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <LinearProgress 
                    variant="determinate" 
                    value={data.land_cover?.water_bodies || 0} 
                    color="info"
                    sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {(data.land_cover?.water_bodies || 0).toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Vegetation
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <LinearProgress 
                    variant="determinate" 
                    value={data.land_cover?.vegetation || 0} 
                    color="success"
                    sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {(data.land_cover?.vegetation || 0).toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Urban Areas
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <LinearProgress 
                    variant="determinate" 
                    value={data.land_cover?.urban_areas || 0} 
                    color="primary"
                    sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {(data.land_cover?.urban_areas || 0).toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Bare Soil
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <LinearProgress 
                    variant="determinate" 
                    value={data.land_cover?.bare_soil || 0} 
                    color="warning"
                    sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {(data.land_cover?.bare_soil || 0).toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Analysis Status */}
        <Box>
          <Chip 
            icon={<VisibilityIcon />}
            label="Terrain analysis complete"
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

export default TerrainAnalysisWidget;
