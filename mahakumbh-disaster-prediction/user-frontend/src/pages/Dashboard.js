import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Warning as AlertIcon,
  EmergencyShareRounded,
  EmergencyShareRounded as EmergencyIcon,
  DirectionsCar as TrafficIcon,
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import WeatherWidget from '../components/widgets/WeatherWidget';

const Dashboard = () => {
  const { dashboardData, loading, error } = useData();

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

  // Filter alerts to show only public safety information
  const publicAlerts = (dashboardData.alerts?.alerts || dashboardData.alerts || [])
    .filter(alert => 
      alert.priority === 'critical' || 
      (alert.priority === 'high' && ['weather', 'emergency', 'traffic'].includes(alert.type))
    );

  return (
    <Box>
      {/* Header */}
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
          <EmergencyShareRounded sx={{ fontSize: 'inherit' }} />
        </Box>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: '1.75rem', sm: '2.125rem', md: '3rem' } }}>
          Public Safety Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' } }}>
          Essential Safety Information for Mahakumbh Visitors
        </Typography>
      </Box>
      
      {/* Public Safety Status Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Card className="dashboard-card">
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography variant="h5" fontWeight="bold">
                  Public Safety Status
                </Typography>
                <EmergencyIcon color="primary" sx={{ fontSize: '2rem' }} />
              </Box>
              
              <Box textAlign="center" mb={3}>
                <Typography variant="h2" color="primary" fontWeight="bold">
                  {dashboardData.risk_score?.risk_level?.toUpperCase() || 'LOW'}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Current Safety Level
                </Typography>
                <Chip 
                  label={dashboardData.risk_score?.risk_level || 'low'} 
                  color={dashboardData.risk_score?.risk_level === 'critical' ? 'error' : 
                         dashboardData.risk_score?.risk_level === 'high' ? 'warning' : 'success'}
                  size="large"
                  sx={{ mt: 1, fontSize: '1rem', fontWeight: 'bold' }}
                />
              </Box>

              <Typography variant="body1" color="text.secondary" textAlign="center">
                {dashboardData.risk_score?.risk_level === 'critical' ? 
                  '⚠️ Immediate attention required. Follow emergency protocols.' :
                 dashboardData.risk_score?.risk_level === 'high' ? 
                  '⚠️ Exercise caution. Monitor safety updates.' :
                  '✅ Normal conditions. Continue with regular activities.'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Key Information Cards */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card className="dashboard-card" sx={{
              background: 'linear-gradient(135deg, #FF6B35 0%, #FF9800 100%)',
              color: 'white',
              textAlign: 'center',
              py: 3,
              height: '100%'
            }}>
              <CardContent>
                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {publicAlerts.filter(alert => alert.priority === 'critical').length || 0}
                </Typography>
                <Typography variant="body1">Critical Alerts</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Immediate Action Required
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card className="dashboard-card" sx={{
              background: 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)',
              color: 'white',
              textAlign: 'center',
              py: 3,
              height: '100%'
            }}>
              <CardContent>
                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {publicAlerts.length || 0}
                </Typography>
                <Typography variant="body1">Public Alerts</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Safety Information
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card className="dashboard-card" sx={{
              background: 'linear-gradient(135deg, #388E3C 0%, #66BB6A 100%)',
              color: 'white',
              textAlign: 'center',
              py: 3,
              height: '100%'
            }}>
              <CardContent>
                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {dashboardData.weather?.temperature ? Math.round(dashboardData.weather.temperature) : 'N/A'}°C
                </Typography>
                <Typography variant="body1">Current Weather</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {dashboardData.weather?.description || 'Weather Info'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card className="dashboard-card" sx={{
              background: 'linear-gradient(135deg, #D32F2F 0%, #F44336 100%)',
              color: 'white',
              textAlign: 'center',
              py: 3,
              height: '100%'
            }}>
              <CardContent>
                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {dashboardData.traffic?.overall_conditions?.open_routes || 0}
                </Typography>
                <Typography variant="body1">Open Routes</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Traffic Status
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Main Information Section */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={3}>
          {/* Weather Information */}
          <Grid item xs={12} md={6}>
            <WeatherWidget data={dashboardData.weather} />
          </Grid>
          
          {/* Public Safety Alerts */}
          <Grid item xs={12} md={6}>
            <Card className="dashboard-card">
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">Public Safety Alerts</Typography>
                  <AlertIcon color="primary" />
                </Box>
                
                {publicAlerts.length > 0 ? (
                  <Box>
                    {publicAlerts.slice(0, 5).map((alert, index) => (
                      <Box key={alert.id || index} mb={2} p={2} 
                           sx={{ 
                             border: '1px solid',
                             borderColor: alert.priority === 'critical' ? 'error.main' : 'warning.main',
                             borderRadius: 2,
                             backgroundColor: alert.priority === 'critical' ? 'error.light' : 'warning.light'
                           }}>
                        <Typography variant="body2" fontWeight="bold" color={alert.priority === 'critical' ? 'error.dark' : 'warning.dark'}>
                          {alert.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {new Date(alert.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    No active public safety alerts at this time.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Traffic & Safety Information Section */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={3}>
          {/* Basic Traffic Status */}
          <Grid item xs={12} md={6}>
            <Card className="dashboard-card">
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">Traffic Status</Typography>
                  <TrafficIcon color="primary" />
                </Box>
                
                {dashboardData.traffic ? (
                  <Box>
                    <Box textAlign="center" mb={2}>
                      <Typography variant="h4" color="primary" fontWeight="bold">
                        {dashboardData.traffic.overall_conditions?.overall_level?.toUpperCase() || 'GOOD'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Overall Traffic Conditions
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-around" textAlign="center">
                      <Box>
                        <Typography variant="h6" color="success.main">
                          {dashboardData.traffic.overall_conditions?.open_routes || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Open Routes
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="h6" color="warning.main">
                          {dashboardData.traffic.bottlenecks?.length || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Bottlenecks
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    Traffic information not available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Safety Guidelines */}
          <Grid item xs={12} md={6}>
            <Card className="dashboard-card">
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">Safety Guidelines</Typography>
                  <EmergencyIcon color="primary" />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      During Emergencies:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Follow instructions from authorities<br/>
                      • Use designated evacuation routes<br/>
                      • Stay calm and help others<br/>
                      • Keep emergency contacts handy
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" color="warning.main">
                      Weather Safety:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Stay hydrated in hot weather<br/>
                      • Seek shelter during storms<br/>
                      • Avoid flooded areas<br/>
                      • Monitor weather updates
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Emergency Contacts */}
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card className="dashboard-card">
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">Emergency Contacts</Typography>
                  <EmergencyIcon color="error" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                  <Box>
                    <Typography variant="h6" color="primary">+91-100</Typography>
                    <Typography variant="body2" color="text.secondary">Police</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" color="error">+91-101</Typography>
                    <Typography variant="body2" color="text.secondary">Fire</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" color="success">+91-102</Typography>
                    <Typography variant="body2" color="text.secondary">Ambulance</Typography>
                  </Box>
                </Box>
                <Box mt={2} textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    For immediate assistance, call the appropriate emergency number
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card className="dashboard-card">
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">Traffic Safety Tips</Typography>
                  <TrafficIcon color="warning" />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" color="warning.main">
                      During High Traffic:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Allow extra travel time<br/>
                      • Use designated pedestrian crossings<br/>
                      • Follow traffic signals<br/>
                      • Stay alert and patient
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" color="info.main">
                      Emergency Vehicles:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Give way to emergency vehicles<br/>
                      • Follow traffic police instructions<br/>
                      • Use designated emergency routes
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;
