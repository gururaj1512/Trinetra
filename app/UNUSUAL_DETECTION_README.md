# Unusual Detection Module

## Overview
The Unusual Detection module provides AI-powered security threat analysis for both image and video files. It integrates with the `app1.py` Flask API to analyze media for potential security threats, unusual behavior, and risks using advanced frame-by-frame video analysis.

## Features

### 🖼️ Image & Video Analysis
- Upload image files (JPG, JPEG, PNG)
- Upload video files (MP4, AVI, MOV, MKV)
- AI-powered threat detection using Google Gemini
- Frame-by-frame video analysis
- Real-time analysis with progress indicators
- Support for standard media formats

### 🚨 Threat Detection
- **Weapon Detection**: Guns, knives, explosives
- **Violence Detection**: Fights, assaults, aggressive behavior
- **Trespassing**: Unauthorized access detection
- **Suspicious Packages**: Unusual items or packages
- **Crowd Disturbances**: Unusual crowd behavior

### 📊 Threat Assessment
- **Threat Levels**: None, Low, Medium, High, Critical
- **Response Recommendations**: None, Unarmed Guard, Armed Guard, SWAT
- **Confidence Scores**: AI confidence percentage
- **Detailed Descriptions**: Comprehensive analysis reports

## How to Use

### 1. Access the Module
- Navigate to Admin Panel
- Select "Unusual" tab
- The Unusual Detection interface will load

### 2. Upload Media
- Tap "📁 Select Media" button
- Choose image or video from device gallery
- Media details will be displayed

### 3. Analyze Media
- Tap "🔍 Analyze Media" button
- Wait for AI analysis to complete (videos take longer)
- Results will be displayed in cards

### 4. View Results
- Tap on any result card for detailed analysis
- Review threat level, type, and response recommendations
- Check confidence scores and timestamps

## API Integration

### Backend Service (app1.py)
The module connects to a Flask API running on `http://localhost:5002` with the following endpoints:

- **POST /analyze**: Upload and analyze image or video files
- **GET /**: Health check endpoint
- **GET /health**: Alternative health check endpoint

### API Response Format
The API returns security analysis results in the following format:
```json
{
  "threat_detected": boolean,
  "threat_type": ["weapon", "suspicious_behavior"],
  "threat_level": "none|low|medium|high|critical",
  "threat_locations": [{"description": "Threat details"}],
  "description": "Detailed analysis report",
  "confidence": 0.85,
  "timestamp": "2024-01-01T00:00:00Z",
  "response_required": "none|unarmed_guard|armed_guard|swat"
}
```

### Security Analysis Service
Located in `lib/securityAnalysisService.ts`, this service handles:
- API communication
- Error handling
- Data formatting
- UI helper functions

## Threat Level Indicators

| Level | Color | Icon | Description |
|-------|-------|------|-------------|
| None | Green | ✅ | No threats detected |
| Low | Green | ✅ | Minimal risk, routine monitoring |
| Medium | Yellow | ⚠️ | Moderate risk, security guard response |
| High | Orange | 🚨 | High risk, police response required |
| Critical | Red | 🔴 | Immediate danger, emergency response |

## Response Force Types

| Response | Icon | Description |
|----------|------|-------------|
| None | ✅ | No action needed |
| Unarmed Guard | 🛡️ | Basic security response |
| Armed Guard | 👮 | Law enforcement required |
| SWAT | 🚔 | Specialized tactical response |

## Technical Details

### Supported Formats
- **Images**: JPG, JPEG, PNG
- **Videos**: MP4, AVI, MOV, MKV
- **Max Size**: 100MB per file

### AI Model
- **Provider**: Google Gemini 2.0 Flash Experimental
- **Analysis**: Frame-by-frame video analysis and image analysis
- **Confidence**: 0-100% confidence scores

### Performance
- **Video Processing**: Extracts frames every 30 frames (1 second at 30fps)
- **Image Processing**: Single image analysis
- **Speed**: Fast for images, moderate for videos (depends on length)
- **Accuracy**: High accuracy with detailed descriptions

## Error Handling

The module includes comprehensive error handling for:
- Network connectivity issues
- File upload failures
- API server unavailability
- Invalid file formats
- Analysis processing errors

## Security Considerations

- All uploaded files are processed locally on the server
- Files are automatically deleted after analysis
- No permanent storage of sensitive image content
- API key is securely configured on the server

## Troubleshooting

### Common Issues

1. **"Analysis Failed: 500" Error**
   - **Server Issue**: The Flask server encountered an internal error
   - **Solutions**:
     - Restart the server: `python app1.py`
     - Check server logs for detailed error messages
     - Ensure Google API key is valid and has sufficient quota
     - Verify all dependencies are installed correctly
     - Try with a different image file

2. **"Server Offline" Error**
   - **Network Issue**: Cannot connect to the analysis server
   - **Solutions**:
     - Check if server is running on any of the configured URLs
     - Verify network connectivity
     - Try restarting the server
     - Check firewall settings

3. **"Permission Required" Error**
   - **App Permission**: Media library access not granted
   - **Solutions**:
     - Grant media library access permission in device settings
     - Check device storage permissions
     - Restart the app after granting permissions

4. **"Request Timeout" Error**
   - **Performance Issue**: Analysis taking too long
   - **Solutions**:
     - Try with a smaller image file
     - Check server performance and resources
     - Consider reducing image quality
     - Ensure stable network connection

5. **"Network Error"**
   - **Connectivity Issue**: Cannot reach the server
   - **Solutions**:
     - Check internet connection
     - Verify server is running and accessible
     - Try different network (WiFi vs Mobile data)
     - Check if server URL is correct

### Server Setup

#### Option 1: Using the Starter Script (Recommended)
```bash
cd /path/to/your/project
python start-server.py
```

#### Option 2: Manual Setup
```bash
cd /path/to/your/project

# Install required dependencies
pip install -r requirements.txt

# Set your Google API key (optional - already configured in app1.py)
export GOOGLE_API_KEY='your_api_key_here'

# Start the server
python app1.py
```

The server will start on multiple URLs:
- `http://localhost:5002`
- `http://127.0.0.1:5002`
- `http://192.168.31.47:5002` (if accessible)

### Testing the API
To test if the server is working correctly:
```bash
# Test health endpoint
curl -X GET http://localhost:5002/health

# Test analyze endpoint with an image
curl -X POST -F 'file=@your_image.jpg' http://localhost:5002/analyze

# Test analyze endpoint with a video
curl -X POST -F 'file=@your_video.mp4' http://localhost:5002/analyze

# Or test in browser
# Visit: http://localhost:5002/
```

## Future Enhancements

- Real-time video streaming analysis
- Batch processing for multiple files
- Historical analysis reports
- Integration with CCTV systems
- Mobile push notifications for critical threats
- Advanced threat classification
- Geographic threat mapping
- Custom frame extraction intervals
- Video compression optimization
