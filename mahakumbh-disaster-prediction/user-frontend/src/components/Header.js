import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Box,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  SignalCellularAlt as SignalIcon,
  Refresh as RefreshIcon,
  EmergencyShareRounded,
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import { useSocket } from '../contexts/SocketContext';

const Header = ({ onMenuClick }) => {
  const { dashboardData, refreshData } = useData();
  const { isConnected } = useSocket();

  const alerts = dashboardData.alerts?.alerts || dashboardData.alerts || [];
  const criticalAlerts = alerts.filter(alert => alert.priority === 'critical') || [];
  const publicAlerts = alerts.filter(alert => 
    alert.priority === 'critical' || 
    (alert.priority === 'high' && ['weather', 'emergency', 'traffic'].includes(alert.type))
  );

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'moderate':
        return 'info';
      default:
        return 'success';
    }
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
          <Box
            sx={{
              width: { xs: 32, sm: 40 },
              height: { xs: 32, sm: 40 },
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF6B35 0%, #FF9800 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: { xs: '1.2rem', sm: '1.5rem' },
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(255, 107, 53, 0.4)',
            }}
          >
            <EmergencyShareRounded sx={{ fontSize: 'inherit' }} />
          </Box>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 700, color: 'white' }}>
              Mahakumbh Safety Portal
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', display: 'block' }}>
              Public Safety Information & Emergency Alerts
            </Typography>
          </Box>
          <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 700, color: 'white' }}>
              Safety Portal
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
          {/* Connection Status */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Tooltip title={isConnected ? 'Connected to safety system' : 'Disconnected from safety system'}>
              <Chip
                icon={<SignalIcon />}
                label={isConnected ? 'Connected' : 'Disconnected'}
                color={isConnected ? 'success' : 'error'}
                size="small"
                variant="outlined"
              />
            </Tooltip>
          </Box>

          {/* Public Safety Status */}
          {dashboardData.risk_score && (
            <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
              <Tooltip title={`Public Safety Status: ${dashboardData.risk_score.risk_level || 'low'} risk`}>
                <Chip
                  icon={<WarningIcon />}
                  label={`Safety: ${dashboardData.risk_score.risk_level || 'low'}`}
                  color={getRiskColor(dashboardData.risk_score.risk_level)}
                  size="small"
                  variant="outlined"
                />
              </Tooltip>
            </Box>
          )}

          {/* Critical Public Alerts */}
          <Tooltip title={`${criticalAlerts.length} critical public alerts`}>
            <IconButton color="inherit" size="small">
              <Badge badgeContent={criticalAlerts.length} color="error">
                <WarningIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Public Alerts */}
          <Tooltip title={`${publicAlerts.length || 0} public safety alerts`}>
            <IconButton color="inherit" size="small">
              <Badge badgeContent={publicAlerts.length || 0} color="warning">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Refresh Button */}
          <Tooltip title="Refresh safety information">
            <IconButton color="inherit" onClick={refreshData} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
