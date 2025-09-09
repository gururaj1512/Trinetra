import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  EmergencyShareRounded as EmergencyIcon,
  EmergencyShareRounded,
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';

const EmergencyPage = () => {
  const { fetchEmergencyContacts, fetchEvacuationRoutes } = useData();
  const [contacts, setContacts] = useState(null);
  const [routes, setRoutes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadEmergencyData = async () => {
      try {
        setLoading(true);
        const [contactsData, routesData] = await Promise.all([
          fetchEmergencyContacts(),
          fetchEvacuationRoutes()
        ]);
        setContacts(contactsData);
        setRoutes(routesData);
      } catch (err) {
        setError('Failed to load emergency data');
      } finally {
        setLoading(false);
      }
    };

    loadEmergencyData();
  }, [fetchEmergencyContacts, fetchEvacuationRoutes]);

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
          Emergency Response
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' } }}>
          Divine Emergency Protection for Mahakumbh
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* Emergency Contacts */}
        <Grid item xs={12} md={6}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Emergency Contacts
              </Typography>
              {contacts && (
                <List>
                  {Object.entries(contacts).map(([service, number]) => (
                    <ListItem key={service}>
                      <ListItemIcon>
                        <PhoneIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={service.charAt(0).toUpperCase() + service.slice(1)}
                        secondary={number}
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        href={`tel:${number}`}
                      >
                        Call
                      </Button>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Evacuation Routes */}
        <Grid item xs={12} md={6}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Evacuation Routes
              </Typography>
              {routes && routes.primary_routes && (
                <List>
                  {routes.primary_routes.map((route, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <LocationIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={route.name}
                        secondary={`Capacity: ${route.capacity.toLocaleString()} people`}
                      />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Status: {route.status}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Emergency Procedures */}
        <Grid item xs={12}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Emergency Procedures
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Box textAlign="center" p={2}>
                    <EmergencyIcon color="error" sx={{ fontSize: 48 }} />
                    <Typography variant="h6" sx={{ mt: 1 }}>
                      Immediate Response
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Activate emergency protocols and deploy response teams
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box textAlign="center" p={2}>
                    <LocationIcon color="warning" sx={{ fontSize: 48 }} />
                    <Typography variant="h6" sx={{ mt: 1 }}>
                      Evacuation
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Direct crowds to designated evacuation routes
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box textAlign="center" p={2}>
                    <PhoneIcon color="info" sx={{ fontSize: 48 }} />
                    <Typography variant="h6" sx={{ mt: 1 }}>
                      Communication
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Maintain communication with all emergency services
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

export default EmergencyPage;
