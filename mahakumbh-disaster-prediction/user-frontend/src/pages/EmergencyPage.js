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
  Chip,
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
          Emergency Information
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' } }}>
          Essential Emergency Contacts & Safety Procedures
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
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Important:</strong> In case of emergency, call the appropriate number immediately. 
                  For non-emergency assistance, contact local authorities.
                </Typography>
              </Box>
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
                        <Chip 
                          label={route.status} 
                          color={route.status === 'open' ? 'success' : 'warning'}
                          size="small"
                        />
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Note:</strong> Follow instructions from authorities during evacuations. 
                  Use designated routes and assembly points.
                </Typography>
              </Box>
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
                      Stay calm and follow emergency protocols. Listen to announcements and follow instructions from authorities.
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
                      Use designated evacuation routes. Help others if possible. Proceed to assembly points as directed.
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
                      Keep emergency contacts handy. Inform family of your location. Follow official updates.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Safety Guidelines */}
        <Grid item xs={12} md={6}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Safety Guidelines
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    General Safety:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Stay aware of your surroundings<br/>
                    • Keep emergency contacts accessible<br/>
                    • Know the location of exits and assembly points<br/>
                    • Follow posted safety instructions
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="bold" color="warning.main">
                    During Events:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Stay with your group<br/>
                    • Keep mobile phones charged<br/>
                    • Carry essential medications if needed<br/>
                    • Report suspicious activities
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Assembly Points */}
        <Grid item xs={12} md={6}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Assembly Points
              </Typography>
              {routes && routes.emergency_assembly_points && (
                <List>
                  {routes.emergency_assembly_points.map((point, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <LocationIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={point.name}
                        secondary={`Capacity: ${point.capacity.toLocaleString()} people`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Remember:</strong> Assembly points are designated safe areas. 
                  Wait for further instructions from authorities.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmergencyPage;
