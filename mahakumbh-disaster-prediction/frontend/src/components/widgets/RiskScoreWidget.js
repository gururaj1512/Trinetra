import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Grid,
  Chip,
} from '@mui/material';
import {
  Warning as WarningIcon,
  TrendingUp as TrendingIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

const RiskScoreWidget = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <Card className="dashboard-card">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Risk Assessment
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No risk data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (level) => {
    switch (level) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'moderate':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'success';
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'critical':
        return '🔴';
      case 'high':
        return '🟠';
      case 'moderate':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const score = data.overall_score || 0;
  const level = data.risk_level || 'low';

  return (
    <Card className="dashboard-card">
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Typography variant="h5" fontWeight="bold">
            Overall Risk Assessment
          </Typography>
          <Box fontSize="2rem">
            {getRiskIcon(level)}
          </Box>
        </Box>

        {/* Risk Score Display */}
        <Box textAlign="center" mb={3}>
          <Typography variant="h2" color={getRiskColor(level)} fontWeight="bold">
            {Math.round(score)}
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Risk Score
          </Typography>
          <Chip 
            label={level.toUpperCase()} 
            color={getRiskColor(level)}
            size="large"
            sx={{ mt: 1, fontSize: '1rem', fontWeight: 'bold' }}
          />
        </Box>

        {/* Risk Progress Bar */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Risk Level
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {score}/100
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={score} 
            color={getRiskColor(level)}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>

        {/* Risk Factors */}
        {data.risk_factors && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Risk Factors
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(data.risk_factors).map(([factor, value]) => (
                <Grid item xs={6} key={factor}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" textTransform="capitalize">
                      {factor.replace('_', ' ')}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={value * 100} 
                      color={value > 0.7 ? 'error' : value > 0.4 ? 'warning' : 'success'}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {(value * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Recommendations */}
        {score > 50 && (
          <Box mt={2}>
            <Typography variant="h6" gutterBottom>
              Recommendations
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <WarningIcon color="warning" fontSize="small" />
              <Typography variant="body2">
                Increase monitoring frequency
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <SecurityIcon color="info" fontSize="small" />
              <Typography variant="body2">
                Deploy additional personnel
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <TrendingIcon color="primary" fontSize="small" />
              <Typography variant="body2">
                Prepare emergency response
              </Typography>
            </Box>
          </Box>
        )}

        {/* Timestamp */}
        <Box mt={2} textAlign="center">
          <Typography variant="caption" color="text.secondary">
            Last updated: {new Date(data.timestamp).toLocaleTimeString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RiskScoreWidget;
