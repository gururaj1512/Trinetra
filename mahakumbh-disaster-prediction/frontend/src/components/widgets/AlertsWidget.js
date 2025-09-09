import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';

const AlertsWidget = ({ data }) => {
  // Handle both array and object formats
  const alerts = Array.isArray(data) ? data : (data?.alerts || []);
  
  if (!alerts || !Array.isArray(alerts)) {
    return (
      <Card className="dashboard-card">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Alerts & Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No alerts available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
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

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'high':
        return <WarningIcon color="warning" />;
      case 'moderate':
        return <InfoIcon color="info" />;
      default:
        return <SuccessIcon color="success" />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'weather':
        return '🌤️';
      case 'earthquake':
        return '🌋';
      case 'crowd':
        return '👥';
      case 'traffic':
        return '🚗';
      case 'emergency':
        return '🚨';
      default:
        return '📢';
    }
  };

  const criticalAlerts = alerts.filter(alert => alert.priority === 'critical');
  const highPriorityAlerts = alerts.filter(alert => alert.priority === 'high');
  const recentAlerts = alerts.slice(0, 5);

  return (
    <Card className="dashboard-card">
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">
            Alerts & Notifications
          </Typography>
          <WarningIcon color="primary" />
        </Box>

        {/* Alert Summary */}
        <Box mb={3}>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box textAlign="center">
                <Typography variant="h4" color="error.main">
                  {criticalAlerts.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Critical
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main">
                  {highPriorityAlerts.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  High
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary.main">
                  {alerts.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Recent Alerts */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Recent Alerts
          </Typography>
          {recentAlerts.length > 0 ? (
            <List dense>
              {recentAlerts.map((alert, index) => (
                <ListItem 
                  key={alert.id || index} 
                  sx={{ 
                    px: 0,
                    borderLeft: `3px solid`,
                    borderColor: getPriorityColor(alert.priority),
                    mb: 1,
                    pl: 1
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Box fontSize="1.2rem">
                      {getTypeIcon(alert.type)}
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        {getPriorityIcon(alert.priority)}
                        <Typography variant="body2" fontWeight="bold">
                          {alert.message}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {alert.location}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {new Date(alert.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No recent alerts
            </Typography>
          )}
        </Box>

        {/* Alert Types Summary */}
        <Box mt={2}>
          <Typography variant="h6" gutterBottom>
            Alert Types
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {['weather', 'earthquake', 'crowd', 'traffic', 'emergency'].map((type) => {
              const count = alerts.filter(alert => alert.type === type).length;
              if (count === 0) return null;
              
              return (
                <Chip
                  key={type}
                  icon={<span>{getTypeIcon(type)}</span>}
                  label={`${count} ${type}`}
                  size="small"
                  variant="outlined"
                />
              );
            })}
          </Box>
        </Box>

        {/* Status */}
        <Box mt={2}>
          <Chip 
            label={alerts.length > 0 ? `${alerts.length} active alerts` : 'All clear'}
            color={alerts.length > 0 ? 'warning' : 'success'}
            size="small"
            variant="outlined"
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default AlertsWidget;
