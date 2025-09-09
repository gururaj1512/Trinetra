import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { useData } from '../contexts/DataContext';
import SatelliteWidget from '../components/widgets/SatelliteWidget';
import SatelliteImageryWidget from '../components/widgets/SatelliteImageryWidget';
import FloodAnalysisWidget from '../components/widgets/FloodAnalysisWidget';
import TerrainAnalysisWidget from '../components/widgets/TerrainAnalysisWidget';
import { Satellite } from '@mui/icons-material';

const SatellitePage = () => {
  const { fetchSatelliteImagery, fetchFloodAnalysis, fetchTerrainAnalysis } = useData();
  const [satelliteData, setSatelliteData] = useState(null);
  const [floodData, setFloodData] = useState(null);
  const [terrainData, setTerrainData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const loadSatelliteData = async () => {
      try {
        setLoading(true);
        const [imagery, flood, terrain] = await Promise.all([
          fetchSatelliteImagery(),
          fetchFloodAnalysis(),
          fetchTerrainAnalysis()
        ]);
        setSatelliteData(imagery);
        setFloodData(flood);
        setTerrainData(terrain);
      } catch (err) {
        setError('Failed to load satellite data');
      } finally {
        setLoading(false);
      }
    };

    loadSatelliteData();
  }, [fetchSatelliteImagery, fetchFloodAnalysis, fetchTerrainAnalysis]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

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
          <Satellite sx={{ fontSize: 'inherit' }} />
        </Box>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: '1.75rem', sm: '2.125rem', md: '3rem' } }}>
          Satellite Monitoring & Analysis
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' } }}>
          Divine Satellite Protection for Mahakumbh
        </Typography>
      </Box>
      
      {/* Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Satellite Imagery" />
          <Tab label="Flood Analysis" />
          <Tab label="Terrain Analysis" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <SatelliteWidget data={satelliteData} />
          </Grid>
          <Grid item xs={12} md={6}>
            <SatelliteImageryWidget data={satelliteData} />
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FloodAnalysisWidget data={floodData} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Card className="dashboard-card">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Flood Analysis Details
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  AI-powered flood risk assessment using satellite imagery analysis.
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Analysis includes:
                </Typography>
                <ul>
                  <li>Water level change detection</li>
                  <li>Affected area calculation</li>
                  <li>Risk probability assessment</li>
                  <li>Automated recommendations</li>
                </ul>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TerrainAnalysisWidget data={terrainData} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Card className="dashboard-card">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Terrain Analysis Details
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Comprehensive terrain analysis for evacuation planning and risk assessment.
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Analysis includes:
                </Typography>
                <ul>
                  <li>Elevation range mapping</li>
                  <li>Slope analysis</li>
                  <li>Land cover classification</li>
                  <li>Flood-prone area identification</li>
                </ul>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default SatellitePage;
