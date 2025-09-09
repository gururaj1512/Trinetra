import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  WbSunny as WeatherIcon,
  DirectionsCar as TrafficIcon,
  EmergencyShareRounded as EmergencyIcon,
  EmergencyShareRounded,
} from '@mui/icons-material';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Weather', icon: <WeatherIcon />, path: '/weather' },
  { text: 'Traffic', icon: <TrafficIcon />, path: '/traffic' },
  { text: 'Emergency', icon: <EmergencyIcon />, path: '/emergency' },
];

const Sidebar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ overflow: 'auto', mt: 8 }}>
        <Box sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
          <Box
            sx={{
              width: { xs: 50, sm: 60 },
              height: { xs: 50, sm: 60 },
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF6B35 0%, #FF9800 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: { xs: '1.5rem', sm: '2rem' },
              fontWeight: 'bold',
              margin: '0 auto 16px',
              boxShadow: '0 6px 20px rgba(255, 107, 53, 0.4)',
            }}
          >
            <EmergencyShareRounded sx={{ fontSize: 'inherit' }} />
          </Box>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Public Safety Portal
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
            Essential Information for Your Safety
          </Typography>
        </Box>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigation(item.path)}
                sx={{
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
                }}
              >
                <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  sx={{ 
                    color: location.pathname === item.path ? 'primary.main' : 'inherit',
                    fontWeight: location.pathname === item.path ? 'bold' : 'normal'
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
