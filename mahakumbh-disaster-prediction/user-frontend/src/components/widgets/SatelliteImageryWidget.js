import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Satellite as SatelliteIcon,
  Visibility as VisibilityIcon,
  Fullscreen as FullscreenIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

const SatelliteImageryWidget = ({ data }) => {
  const [openDialog, setOpenDialog] = React.useState(false);

  if (!data || Object.keys(data).length === 0) {
    return (
      <Card className="dashboard-card">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Satellite Imagery
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No satellite imagery available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleDownload = () => {
    if (data.image_data) {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${data.image_data}`;
      link.download = `satellite-imagery-${new Date().toISOString().split('T')[0]}.png`;
      link.click();
    }
  };

  return (
    <>
      <Card className="dashboard-card">
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6">
              Satellite Imagery
            </Typography>
            <SatelliteIcon color="primary" />
          </Box>

          {/* Satellite Info */}
          <Box mb={3}>
            <Typography variant="h4" color="primary" fontWeight="bold">
              {data.satellite || 'Sentinel-2'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {data.resolution || '10m'} Resolution • {data.bands?.join(', ') || 'RGB'}
            </Typography>
          </Box>

          {/* Image Display */}
          {data.image_data ? (
            <Box mb={3}>
              <Box
                sx={{
                  width: '100%',
                  height: 200,
                  backgroundImage: `url(data:image/png;base64,${data.image_data})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  borderRadius: 2,
                  border: '2px solid #e0e0e0',
                  position: 'relative',
                  cursor: 'pointer',
                }}
                onClick={handleOpenDialog}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    borderRadius: 1,
                    p: 0.5,
                  }}
                >
                  <FullscreenIcon sx={{ color: 'white', fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                Click to view full size
              </Typography>
            </Box>
          ) : (
            <Box
              mb={3}
              sx={{
                width: '100%',
                height: 200,
                backgroundColor: '#f5f5f5',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed #e0e0e0',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No image data available
              </Typography>
            </Box>
          )}

          {/* Coverage Area */}
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Coverage Area
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Latitude
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {data.bbox?.[1]?.toFixed(4) || 'N/A'} - {data.bbox?.[3]?.toFixed(4) || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Longitude
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {data.bbox?.[0]?.toFixed(4) || 'N/A'} - {data.bbox?.[2]?.toFixed(4) || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Time Range */}
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Time Range
            </Typography>
            <Typography variant="body2" color="text.secondary">
              From: {data.time_range?.from ? new Date(data.time_range.from).toLocaleDateString() : 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              To: {data.time_range?.to ? new Date(data.time_range.to).toLocaleDateString() : 'N/A'}
            </Typography>
          </Box>

          {/* Actions */}
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<VisibilityIcon />}
              onClick={handleOpenDialog}
              disabled={!data.image_data}
            >
              View Full
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              disabled={!data.image_data}
            >
              Download
            </Button>
          </Box>

          {/* Status */}
          <Box mt={2}>
            <Chip 
              icon={<SatelliteIcon />}
              label="Satellite imagery available"
              color="success"
              size="small"
              variant="outlined"
            />
          </Box>

          {/* Configuration Help for Placeholder Images */}
          {data.image_data && data.image_data.length < 200 && (
            <Box mt={2}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Placeholder Image Detected:</strong>
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  This is a placeholder image. To view real satellite imagery, configure Sentinel Hub API credentials in your backend environment variables.
                </Typography>
              </Alert>
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

      {/* Full Size Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Satellite Imagery - {data.satellite || 'Sentinel-2'}
          <Typography variant="caption" display="block" color="text.secondary">
            {data.resolution || '10m'} Resolution • {data.bands?.join(', ') || 'RGB'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {data.image_data && (
            <Box
              sx={{
                width: '100%',
                height: '60vh',
                backgroundImage: `url(data:image/png;base64,${data.image_data})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                borderRadius: 2,
                border: '2px solid #e0e0e0',
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDownload} startIcon={<DownloadIcon />}>
            Download
          </Button>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SatelliteImageryWidget;
