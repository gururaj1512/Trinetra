# Mahakumbh Crowd Detection System

## Overview
This system provides real-time crowd analysis and alerting capabilities for the Mahakumbh Mela event management. It consists of a Flask backend API for video analysis and a React Native mobile app for monitoring and alert management.

## Features

### 1. Future Crowd Detection (`futureCrowdAlert.tsx`)
- **Video Upload & Analysis**: Upload MP4/MOV videos for crowd analysis
- **Location & Context Input**: Specify location and additional context for analysis
- **Real-time Analysis**: Uses Google Gemini AI to analyze crowd density and safety conditions
- **Comprehensive Results**: Displays crowd level, estimated people count, safety recommendations
- **Automatic Alert Generation**: Creates alerts for high-risk situations

### 2. Alerts Management (`alerts.tsx`)
- **Real-time Alert Display**: Shows all crowd analysis alerts with priority indicators
- **Alert Details Modal**: Comprehensive view of each alert with all analysis data
- **Mark as Read**: Mark individual or all alerts as read
- **Clear Alerts**: Remove individual or all alerts
- **Persistent Storage**: Alerts are saved locally using AsyncStorage
- **Statistics Dashboard**: Shows total alerts and unread count

### 3. Flask Backend API (`app.py`)
- **Video Processing**: Handles MP4/MOV video uploads (max 100MB)
- **AI Analysis**: Uses Google Gemini 1.5 Flash for crowd assessment
- **Mahakumbh Context**: Specialized analysis for Indian spiritual gatherings
- **Safety Recommendations**: Provides police and medical staff requirements
- **Risk Assessment**: Identifies chokepoints, emergency access, and harm likelihood

## API Endpoints

### POST `/analyze`
Analyzes uploaded video for crowd safety assessment.

**Request:**
- `file`: Video file (MP4/MOV)
- `location`: Location string (optional, default: "Mahakumbh, Prayagraj")
- `context`: Additional context (optional)

**Response:**
```json
{
  "crowd_level": "high",
  "estimated_people": 1500,
  "police_required": true,
  "police_count": 300,
  "medical_required": true,
  "medical_staff_count": 50,
  "activities": ["bathing", "queuing", "pushing"],
  "chokepoints_detected": true,
  "emergency_access_clear": false,
  "harm_likelihood": "High risk of stampede",
  "notes": "Critical situation at Sangam Ghat"
}
```

## Crowd Levels
- **LOW**: Safe crowd density
- **MEDIUM**: Moderate crowd, some monitoring needed
- **HIGH**: High density, police and medical support required
- **VERY_HIGH**: Critical situation, immediate intervention needed

## Safety Recommendations

### Police Deployment
- **≤100 people**: No police required
- **>100 people**: Police required at 20% of estimated crowd

### Medical Support
- Recommended when risk indicators are present:
  - Pushing/crowding
  - Heat exposure
  - Elderly presence
  - Chokepoints detected
  - Water proximity

## Installation & Setup

### Backend (Flask)
1. Install Python dependencies:
   ```bash
   pip install flask opencv-python agno pydantic
   ```

2. Set Google Gemini API key:
   ```bash
   export GOOGLE_API_KEY="your_api_key_here"
   ```

3. Run the Flask app:
   ```bash
   python app.py
   ```

### Mobile App (React Native)
1. Install dependencies:
   ```bash
   npm install expo-document-picker @react-native-async-storage/async-storage
   ```

2. Start the development server:
   ```bash
   npm start
   ```

## Usage Flow

1. **Video Analysis**:
   - Navigate to "Crowd Alert" tab in admin section
   - Select video file and specify location/context
   - Upload for AI analysis
   - Review results and safety recommendations

2. **Alert Management**:
   - View all alerts in "Alerts" tab
   - Tap alerts for detailed information
   - Mark alerts as read or clear them
   - Monitor statistics and trends

3. **Response Coordination**:
   - Use analysis results to determine resource allocation
   - Coordinate police and medical deployment
   - Monitor crowd flow and safety conditions

## Data Persistence

- **Alerts**: Stored locally using AsyncStorage
- **Analysis Results**: Cached in memory during session
- **Video Files**: Temporarily stored during analysis, automatically cleaned up

## Security Considerations

- API key should be stored in environment variables
- Video files are processed temporarily and deleted
- Local storage is used for alerts (no sensitive data transmitted)

## Customization

### Adding New Alert Types
1. Extend the `AlertData` interface in `alertStorage.ts`
2. Update the alert display logic in `alerts.tsx`
3. Modify the analysis prompt in `app.py` if needed

### Modifying Analysis Parameters
1. Adjust the `CrowdAssessment` model in `app.py`
2. Update the system prompt for different analysis focus
3. Modify safety thresholds and recommendations

## Troubleshooting

### Common Issues
1. **Video Upload Fails**: Check file format (MP4/MOV) and size (≤100MB)
2. **Analysis Errors**: Verify Google Gemini API key and quota
3. **Alerts Not Saving**: Check AsyncStorage permissions and storage space

### Performance Optimization
1. **Video Processing**: Limit frame extraction for large videos
2. **Storage Management**: Implement alert cleanup for old entries
3. **API Calls**: Add request caching and rate limiting

## Future Enhancements

1. **Real-time Monitoring**: Live video stream analysis
2. **Predictive Analytics**: Crowd behavior prediction
3. **Integration**: Connect with emergency response systems
4. **Multi-language Support**: Local language alerts and instructions
5. **Offline Mode**: Local AI models for offline analysis

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.
