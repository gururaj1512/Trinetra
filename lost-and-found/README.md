# Lost Person Detection System - Backend API

A Flask-based backend API that detects a lost person in a crowd video using face recognition technology. Instead of saving individual frames, it creates a processed video output with bounding boxes around detected faces.

## Features

- **Face Recognition**: Uses the `face_recognition` library (built on dlib) for accurate face detection
- **Video Processing**: Processes crowd videos frame by frame with configurable frame skipping
- **Video Output**: Creates a single output video with green bounding boxes around detected faces
- **Web Interface**: Beautiful, responsive web UI for easy file upload and processing
- **REST API**: Full API endpoints for integration with other applications
- **Deployment Ready**: Configured for deployment on Render, Heroku, and other platforms

## How It Works

1. **Face Encoding**: Loads the lost person's image and creates a face encoding
2. **Video Processing**: Processes the crowd video frame by frame
3. **Face Detection**: Detects all faces in each frame
4. **Face Comparison**: Compares detected faces with the lost person's face encoding
5. **Video Creation**: Creates an output video with bounding boxes and timestamps where matches are found

## API Endpoints

### `POST /api/detect`
Detect a person in a crowd video.

**Form Data:**
- `person_image`: Image file of the person to find (PNG, JPG, JPEG, GIF, BMP)
- `crowd_video`: Video file of the crowd (MP4, AVI, MOV, MKV, WMV)
- `tolerance`: Face recognition tolerance (0.0-1.0, default: 0.6)
- `frame_skip`: Frame processing rate (1-20, default: 5)

**Response:**
```json
{
  "success": true,
  "message": "Person detection completed successfully",
  "output_video": "output_20231201_143022_abc12345.mp4",
  "detection_summary": {
    "total_frames": 1500,
    "detected_frames": 3,
    "detection_timestamps": [2.5, 15.2, 45.8],
    "output_video_path": "outputs/output_20231201_143022_abc12345.mp4"
  }
}
```

### `GET /api/download/<filename>`
Download the processed video file.

### `GET /api/health`
Health check endpoint for deployment monitoring.

### `GET /`
Web interface for file upload and processing.

## Local Development

### Prerequisites
- Python 3.11+
- pip

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd lost-and-found
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application:**
   ```bash
   python app.py
   ```

4. **Access the web interface:**
   Open http://localhost:5000 in your browser

### Local Testing

1. **Start the server:**
   ```bash
   python app.py
   ```

2. **Test with curl:**
   ```bash
   curl -X POST -F "person_image=@person.png" -F "crowd_video=@crowd.mp4" http://localhost:5000/api/detect
   ```

## Deployment

### Render (Recommended)

1. **Connect your GitHub repository to Render**
2. **Create a new Web Service**
3. **Use the provided `render.yaml` configuration**
4. **Deploy automatically**

The `render.yaml` file is already configured for easy deployment.

### Heroku

1. **Install Heroku CLI**
2. **Login and create app:**
   ```bash
   heroku login
   heroku create your-app-name
   ```

3. **Deploy:**
   ```bash
   git push heroku main
   ```

### Manual Deployment

1. **Set environment variables:**
   ```bash
   export PORT=5000
   export FLASK_ENV=production
   ```

2. **Run with Gunicorn:**
   ```bash
   gunicorn app:app --bind 0.0.0.0:$PORT
   ```

## Configuration

### Environment Variables

- `PORT`: Server port (default: 5000)
- `MAX_CONTENT_LENGTH`: Maximum file upload size (default: 100MB)

### File Size Limits

- Maximum image size: 100MB
- Maximum video size: 100MB
- Supported image formats: PNG, JPG, JPEG, GIF, BMP
- Supported video formats: MP4, AVI, MOV, MKV, WMV

## Performance Tips

### Frame Processing
- **Frame Skip**: Higher values (5-10) = faster processing, may miss brief appearances
- **Tolerance**: Lower values (0.4-0.6) = stricter matching, fewer false positives

### Video Processing
- Processing time depends on video length and frame rate
- Longer videos may take several minutes to process
- Consider using shorter video clips for testing

## Troubleshooting

### Common Issues

1. **"No face found in the person's image"**
   - Ensure the person's image has a clear, visible face
   - Use front-facing photos for best results

2. **Slow processing**
   - Increase the `frame_skip` parameter
   - Use shorter video clips for testing

3. **Too many false positives**
   - Decrease the `tolerance` parameter
   - Use clearer, higher quality person images

4. **Missing detections**
   - Increase the `tolerance` parameter
   - Decrease the `frame_skip` parameter

### Deployment Issues

1. **Build failures on Render**
   - Ensure Python 3.11 is specified
   - Check that all dependencies are in requirements.txt

2. **Memory issues**
   - Consider upgrading to a higher tier plan
   - Process shorter videos

## Dependencies

- **Flask**: Web framework
- **OpenCV**: Video processing and image operations
- **face_recognition**: Face detection and recognition
- **dlib**: Machine learning library for face recognition
- **NumPy**: Numerical computing
- **Pillow**: Image processing
- **Gunicorn**: WSGI server for production

## License

This project is open source and available under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Open an issue on GitHub

