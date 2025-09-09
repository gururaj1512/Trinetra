import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  EmergencyShareRounded
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import RiskScoreWidget from '../components/widgets/RiskScoreWidget';

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
          Divine Protection Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' } }}>
          Sacred Monitoring & Safety Management for Mahakumbh
        </Typography>
      </Box>
      
      {/* Risk Score Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <RiskScoreWidget data={dashboardData.risk_score} />
        </Grid>
      </Grid>

      {/* Creative Dashboard Layout */}
      
      {/* Top Row - Key Metrics Cards */}
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
                  {dashboardData.risk_score?.overall_score || 0}
                </Typography>
                <Typography variant="body1">Risk Score</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {dashboardData.risk_score?.risk_level || 'Low'} Risk
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
                  {(dashboardData.alerts?.alerts || dashboardData.alerts || []).filter(alert => alert.priority === 'critical').length || 0}
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
                  {dashboardData.crowd?.overall_metrics?.current_occupancy?.toLocaleString() || 0}
                </Typography>
                <Typography variant="body1">Current Crowd</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {dashboardData.crowd?.overall_metrics?.occupancy_percentage?.toFixed(1) || 0}% Capacity
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
                  {dashboardData.traffic?.overall_conditions?.open_routes || 0}
                </Typography>
                <Typography variant="body1">Open Routes</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Traffic Flow Normal
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;
