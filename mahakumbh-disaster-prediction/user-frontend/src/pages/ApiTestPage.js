import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Code,
} from '@mui/icons-material';
import axios from 'axios';

const ApiTestPage = () => {
  const [loading, setLoading] = useState({});
  const [responses, setResponses] = useState({});
  const [errors, setErrors] = useState({});
  const [selectedEndpoint, setSelectedEndpoint] = useState('');

  const apiEndpoints = [
    {
      name: 'Dashboard Overview',
      method: 'GET',
      url: '/api/dashboard',
      description: 'Get complete dashboard data including all services',
      category: 'Dashboard'
    },
    {
      name: 'Weather Data',
      method: 'GET',
      url: '/api/weather',
      description: 'Get current weather conditions and forecasts',
      category: 'Weather'
    },
    {
      name: 'Weather Forecast',
      method: 'GET',
      url: '/api/weather/forecast',
      description: 'Get weather forecast for next 5 days',
      category: 'Weather'
    },
    {
      name: 'Earthquake Data',
      method: 'GET',
      url: '/api/earthquakes',
      description: 'Get recent earthquake data from USGS',
      category: 'Earthquakes'
    },
    {
      name: 'Crowd Analytics',
      method: 'GET',
      url: '/api/crowd',
      description: 'Get crowd density and flow analytics',
      category: 'Crowd'
    },
    {
      name: 'Traffic Conditions',
      method: 'GET',
      url: '/api/traffic',
      description: 'Get current traffic conditions and routes',
      category: 'Traffic'
    },
    {
      name: 'Alerts',
      method: 'GET',
      url: '/api/alerts',
      description: 'Get all active alerts and notifications',
      category: 'Alerts'
    },
    {
      name: 'Risk Score',
      method: 'GET',
      url: '/api/risk-score',
      description: 'Get current risk assessment score',
      category: 'Risk'
    },
    {
      name: 'Satellite Imagery',
      method: 'GET',
      url: '/api/satellite/imagery',
      description: 'Get satellite imagery and coverage data',
      category: 'Satellite'
    },
    {
      name: 'Flood Analysis',
      method: 'GET',
      url: '/api/satellite/flood-analysis',
      description: 'Get flood analysis from satellite data',
      category: 'Satellite'
    },
    {
      name: 'Terrain Analysis',
      method: 'GET',
      url: '/api/satellite/terrain-analysis',
      description: 'Get terrain analysis from satellite data',
      category: 'Satellite'
    },
    {
      name: 'Emergency Contacts',
      method: 'GET',
      url: '/api/emergency/contacts',
      description: 'Get emergency contact information',
      category: 'Emergency'
    },
    {
      name: 'Evacuation Routes',
      method: 'GET',
      url: '/api/evacuation-routes',
      description: 'Get evacuation route information',
      category: 'Emergency'
    },
  ];

  const testEndpoint = async (endpoint) => {
    setLoading(prev => ({ ...prev, [endpoint.url]: true }));
    setErrors(prev => ({ ...prev, [endpoint.url]: null }));
    
    try {
      const response = await axios.get(endpoint.url);
      setResponses(prev => ({ 
        ...prev, 
        [endpoint.url]: {
          data: response.data,
          status: response.status,
          headers: response.headers,
          timestamp: new Date().toISOString()
        }
      }));
    } catch (error) {
      setErrors(prev => ({ 
        ...prev, 
        [endpoint.url]: {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          timestamp: new Date().toISOString()
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [endpoint.url]: false }));
    }
  };

  const testAllEndpoints = async () => {
    for (const endpoint of apiEndpoints) {
      await testEndpoint(endpoint);
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const getStatusIcon = (endpoint) => {
    if (loading[endpoint.url]) return <CircularProgress size={16} />;
    if (errors[endpoint.url]) return <ErrorIcon color="error" />;
    if (responses[endpoint.url]) return <CheckIcon color="success" />;
    return <WarningIcon color="action" />;
  };

  const formatResponse = (data) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return String(data);
    }
  };

  const categories = [...new Set(apiEndpoints.map(ep => ep.category))];

  return (
    <Box sx={{ p: 3 }}>
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
          <Code sx={{ fontSize: 'inherit' }} />
        </Box>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: '1.75rem', sm: '2.125rem', md: '3rem' } }}>
          API Testing & Endpoints
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' } }}>
          Divine API Management for Mahakumbh
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Test and view all backend API endpoints with their responses
        </Typography>
      </Box>

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={testAllEndpoints}
              disabled={Object.values(loading).some(Boolean)}
            >
              Test All Endpoints
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                setResponses({});
                setErrors({});
                setLoading({});
              }}
            >
              Clear Results
            </Button>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Category</InputLabel>
              <Select
                value={selectedEndpoint}
                label="Filter by Category"
                onChange={(e) => setSelectedEndpoint(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Endpoints */}
      {categories.map(category => {
        const categoryEndpoints = apiEndpoints.filter(ep => 
          ep.category === category && 
          (selectedEndpoint === '' || ep.category === selectedEndpoint)
        );
        
        if (categoryEndpoints.length === 0) return null;

        return (
          <Accordion key={category} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="h6">{category}</Typography>
                <Chip 
                  label={categoryEndpoints.length} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {categoryEndpoints.map((endpoint) => (
                  <Grid item xs={12} key={endpoint.url}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                          <Box>
                            <Typography variant="h6" gutterBottom>
                              {endpoint.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {endpoint.description}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip 
                              label={endpoint.method} 
                              color="primary" 
                              size="small"
                            />
                            {getStatusIcon(endpoint)}
                          </Box>
                        </Box>

                        <Box mb={2}>
                          <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                            {endpoint.url}
                          </Typography>
                        </Box>

                        <Box display="flex" gap={1} mb={2}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<PlayIcon />}
                            onClick={() => testEndpoint(endpoint)}
                            disabled={loading[endpoint.url]}
                          >
                            {loading[endpoint.url] ? 'Testing...' : 'Test Endpoint'}
                          </Button>
                        </Box>

                        {/* Response */}
                        {responses[endpoint.url] && (
                          <Box mt={2}>
                            <Typography variant="subtitle2" gutterBottom>
                              Response (Status: {responses[endpoint.url].status})
                            </Typography>
                            <Box
                              sx={{
                                backgroundColor: '#f5f5f5',
                                p: 2,
                                borderRadius: 1,
                                maxHeight: 300,
                                overflow: 'auto',
                                fontFamily: 'monospace',
                                fontSize: '0.875rem',
                              }}
                            >
                              <pre>{formatResponse(responses[endpoint.url].data)}</pre>
                            </Box>
                            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                              Timestamp: {new Date(responses[endpoint.url].timestamp).toLocaleString()}
                            </Typography>
                          </Box>
                        )}

                        {/* Error */}
                        {errors[endpoint.url] && (
                          <Box mt={2}>
                            <Alert severity="error">
                              <Typography variant="subtitle2" gutterBottom>
                                Error (Status: {errors[endpoint.url].status || 'N/A'})
                              </Typography>
                              <Typography variant="body2">
                                {errors[endpoint.url].message}
                              </Typography>
                              {errors[endpoint.url].data && (
                                <Box mt={1}>
                                  <pre style={{ fontSize: '0.75rem' }}>
                                    {formatResponse(errors[endpoint.url].data)}
                                  </pre>
                                </Box>
                              )}
                            </Alert>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        );
      })}

      {/* Summary */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Summary
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Chip 
              label={`Total: ${apiEndpoints.length}`} 
              color="primary" 
              variant="outlined"
            />
            <Chip 
              label={`Success: ${Object.keys(responses).length}`} 
              color="success" 
              variant="outlined"
            />
            <Chip 
              label={`Errors: ${Object.keys(errors).length}`} 
              color="error" 
              variant="outlined"
            />
            <Chip 
              label={`Pending: ${Object.keys(loading).filter(k => loading[k]).length}`} 
              color="warning" 
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ApiTestPage;
