import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container } from '@mui/material';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import WeatherPage from './pages/WeatherPage';
import EarthquakePage from './pages/EarthquakePage';
import CrowdPage from './pages/CrowdPage';
import TrafficPage from './pages/TrafficPage';
import AlertsPage from './pages/AlertsPage';
import EmergencyPage from './pages/EmergencyPage';
import SatellitePage from './pages/SatellitePage';
import ApiTestPage from './pages/ApiTestPage';

import { SocketProvider } from './contexts/SocketContext';
import { DataProvider } from './contexts/DataContext';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#FF6B35', // Vibrant Orange (Saffron)
      light: '#FF8A65',
      dark: '#E64A19',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FF9800', // Deep Orange
      light: '#FFB74D',
      dark: '#F57C00',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#D32F2F',
      light: '#EF5350',
      dark: '#C62828',
    },
    warning: {
      main: '#FF8F00', // Amber
      light: '#FFB74D',
      dark: '#F57C00',
    },
    info: {
      main: '#1976D2',
      light: '#42A5F5',
      dark: '#1565C0',
    },
    success: {
      main: '#388E3C',
      light: '#66BB6A',
      dark: '#2E7D32',
    },
    background: {
      default: '#FFF8F0', // Warm Cream
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2C1810', // Deep Brown
      secondary: '#5D4037', // Brown
    },
    divider: '#FFE0B2', // Light Orange
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      color: '#2C1810',
    },
    h2: {
      fontWeight: 600,
      color: '#2C1810',
    },
    h3: {
      fontWeight: 600,
      color: '#2C1810',
    },
    h4: {
      fontWeight: 600,
      color: '#2C1810',
    },
    h5: {
      fontWeight: 600,
      color: '#2C1810',
    },
    h6: {
      fontWeight: 600,
      color: '#2C1810',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(255, 107, 53, 0.1)',
          border: '1px solid #FFE0B2',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(255, 107, 53, 0.2)',
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(255, 107, 53, 0.3)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #FF6B35 0%, #FF9800 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #E64A19 0%, #F57C00 100%)',
          },
        },
        outlined: {
          borderColor: '#FF6B35',
          color: '#FF6B35',
          '&:hover': {
            borderColor: '#E64A19',
            backgroundColor: 'rgba(255, 107, 53, 0.08)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontWeight: 600,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: '#FFE0B2',
        },
        bar: {
          borderRadius: 10,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #FF6B35 0%, #FF9800 100%)',
          boxShadow: '0 4px 20px rgba(255, 107, 53, 0.3)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFF8F0',
          borderRight: '2px solid #FFE0B2',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '4px 8px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(255, 107, 53, 0.1)',
            borderLeft: '4px solid #FF6B35',
            '&:hover': {
              backgroundColor: 'rgba(255, 107, 53, 0.15)',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(255, 107, 53, 0.05)',
          },
        },
      },
    },
  },
  shape: {
    borderRadius: 16,
  },
});

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SocketProvider>
        <DataProvider>
          <Router>
            <Box sx={{ display: 'flex', minHeight: '100vh' }}>
              <Header onMenuClick={handleSidebarToggle} />
              <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
              
              <Box
                component="main"
                sx={{
                  flexGrow: 1,
                  pt: 8, // Account for header height
                  background: 'linear-gradient(135deg, #FFF8F0 0%, #FFE0B2 100%)',
                  minHeight: '100vh',
                }}
              >
                <Container maxWidth="xl" sx={{ py: { xs: 1, sm: 2 }, px: { xs: 1, sm: 2 } }}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/weather" element={<WeatherPage />} />
                    <Route path="/earthquakes" element={<EarthquakePage />} />
                    <Route path="/crowd" element={<CrowdPage />} />
                    <Route path="/traffic" element={<TrafficPage />} />
                    <Route path="/satellite" element={<SatellitePage />} />
                    <Route path="/alerts" element={<AlertsPage />} />
                    <Route path="/emergency" element={<EmergencyPage />} />
                    <Route path="/api-test" element={<ApiTestPage />} />
                  </Routes>
                </Container>
              </Box>
            </Box>
          </Router>
        </DataProvider>
      </SocketProvider>
    </ThemeProvider>
  );
}

export default App;
