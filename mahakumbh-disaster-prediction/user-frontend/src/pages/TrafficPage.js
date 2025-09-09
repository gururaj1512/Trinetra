import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import { useData } from '../contexts/DataContext';
import { DirectionsCar } from '@mui/icons-material';

const TrafficPage = () => {
  const { fetchTrafficData } = useData();
  const [trafficData, setTrafficData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTrafficData = async () => {
      try {
        setLoading(true);
        const data = await fetchTrafficData();
        setTrafficData(data);
      } catch (err) {
        setError('Failed to load traffic information');
      } finally {
        setLoading(false);
      }
    };

    loadTrafficData();
  }, [fetchTrafficData]);

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

  const getCongestionIcon = (level) => {
    switch (level) {
      case 'severe':
        return '🔴';
      case 'high':
        return '🟠';
      case 'moderate':
        return '🟡';
      default:
        return '🟢';
    }
  };

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
          <DirectionsCar sx={{ fontSize: 'inherit' }} />
        </Box>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: '1.75rem', sm: '2.125rem', md: '3rem' } }}>
          Traffic Information
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' } }}>
          Current Traffic Conditions & Safety Information
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* Overall Traffic Status */}
        <Grid item xs={12} md={6}>
          <Card className="dashboard-card">
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6">Overall Traffic Status</Typography>
                <DirectionsCar color="primary" />
              </Box>
              
              {trafficData ? (
                <Box>
                  <Box textAlign="center" mb={3}>
                    <Typography variant="h2" color={getCongestionColor(trafficData.overall_conditions?.overall_level)} fontWeight="bold">
                      {getCongestionIcon(trafficData.overall_conditions?.overall_level)}
                    </Typography>
                    <Typography variant="h4" color="primary" fontWeight="bold">
                      {trafficData.overall_conditions?.overall_level?.toUpperCase() || 'GOOD'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Current Traffic Conditions
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h6" color="success.main">
                          {trafficData.overall_conditions?.open_routes || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Open Routes
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h6" color="error.main">
                          {trafficData.overall_conditions?.total_routes - (trafficData.overall_conditions?.open_routes || 0)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Closed Routes
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Traffic information not available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Congestion Breakdown */}
        <Grid item xs={12} md={6}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Congestion Levels
              </Typography>
              {trafficData ? (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h6" color="success.main">
                        {trafficData.overall_conditions?.low_congestion || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Low
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h6" color="info.main">
                        {trafficData.overall_conditions?.moderate_congestion || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Moderate
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h6" color="warning.main">
                        {trafficData.overall_conditions?.high_congestion || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        High
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h6" color="error.main">
                        {trafficData.overall_conditions?.severe_congestion || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Severe
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  No congestion data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Bottlenecks */}
      {trafficData && trafficData.bottlenecks && trafficData.bottlenecks.length > 0 && (
        <Grid container spacing={3} sx={{ mt: 3 }}>
          <Grid item xs={12}>
            <Card className="dashboard-card">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Active Traffic Bottlenecks
                </Typography>
                <List>
                  {trafficData.bottlenecks.slice(0, 5).map((bottleneck, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <DirectionsCar color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={bottleneck.route_name}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Congestion: {bottleneck.congestion_level}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Estimated Delay: {bottleneck.estimated_delay} minutes
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Recommendation: {bottleneck.recommendation}
                            </Typography>
                          </Box>
                        }
                      />
                      <Chip 
                        label={bottleneck.congestion_level} 
                        color={getCongestionColor(bottleneck.congestion_level)}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Traffic Safety Information */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        {/* Traffic Safety Tips */}
        <Grid item xs={12} md={6}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Traffic Safety Tips
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" fontWeight="bold" color="warning.main">
                    During High Traffic:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Allow extra travel time<br/>
                    • Use designated pedestrian crossings<br/>
                    • Follow traffic signals<br/>
                    • Stay alert and patient<br/>
                    • Avoid sudden movements
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="bold" color="info.main">
                    Emergency Vehicles:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Give way to emergency vehicles<br/>
                    • Follow traffic police instructions<br/>
                    • Use designated emergency routes<br/>
                    • Stay calm during emergencies
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    General Safety:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Stay on designated paths<br/>
                    • Keep children close<br/>
                    • Be aware of surroundings<br/>
                    • Follow crowd flow directions
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Route Recommendations */}
        <Grid item xs={12} md={6}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Route Recommendations
              </Typography>
              {trafficData && trafficData.recommendations ? (
                <Box>
                  {trafficData.recommendations.slice(0, 6).map((recommendation, index) => (
                    <Box key={index} mb={2} p={2} 
                         sx={{ 
                           border: '1px solid',
                           borderColor: 'primary.light',
                           borderRadius: 2,
                           backgroundColor: 'primary.light',
                           opacity: 0.1
                         }}>
                      <Typography variant="body2" color="primary.dark" fontWeight="bold">
                        {recommendation}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    <strong>General Recommendations:</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    • Use main thoroughfares during peak hours
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    • Follow posted traffic signs and signals
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    • Allow extra time for travel during events
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    • Use designated pedestrian zones
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Stay informed about route changes
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Emergency Access Information */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Emergency Access Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Box textAlign="center" p={2}>
                    <DirectionsCar color="error" sx={{ fontSize: 48 }} />
                    <Typography variant="h6" sx={{ mt: 1 }}>
                      Emergency Routes
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Designated routes for emergency vehicles. Keep these routes clear during emergencies.
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box textAlign="center" p={2}>
                    <DirectionsCar color="warning" sx={{ fontSize: 48 }} />
                    <Typography variant="h6" sx={{ mt: 1 }}>
                      Traffic Control
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Follow instructions from traffic police and security personnel at all times.
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box textAlign="center" p={2}>
                    <DirectionsCar color="info" sx={{ fontSize: 48 }} />
                    <Typography variant="h6" sx={{ mt: 1 }}>
                      Information Updates
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Monitor this portal for real-time traffic updates and safety information.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TrafficPage;
