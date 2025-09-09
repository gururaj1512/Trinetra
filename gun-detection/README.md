# Gun Detection API

A Flask-based API for analyzing video footage to detect weapons and harmful objects using Google's Gemini AI model.

## Features

- Video analysis for weapon detection
- Support for multiple video formats (MP4, AVI, MOV, MKV, WebM)
- RESTful API with health check endpoint
- Production-ready with Gunicorn
- Environment-based configuration

## API Endpoints

- `GET /health` - Health check endpoint
- `POST /analyze` - Upload and analyze video for weapons

## Local Development

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set up environment variables:
   ```bash
   cp env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

3. Run the application:
   ```bash
   python main.py
   ```

## Deployment on Render

1. Fork or push this repository to GitHub
2. Connect your GitHub repository to Render
3. Create a new Web Service on Render
4. Set the following environment variables in Render dashboard:
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `FLASK_DEBUG`: false
5. Deploy using the provided `render.yaml` configuration

## Environment Variables

- `GEMINI_API_KEY` (required): Your Google Gemini API key
- `FLASK_DEBUG` (optional): Set to "true" for development, "false" for production
- `PORT` (optional): Port number (default: 5002)

## Usage

### Health Check
```bash
curl https://your-app.onrender.com/health
```

### Video Analysis
```bash
curl -X POST -F "file=@your-video.mp4" https://your-app.onrender.com/analyze
```

## Response Format

```json
{
  "results": [
    {
      "frame": 150,
      "timestamp_sec": 5.0,
      "analysis": {
        "status": "safe",
        "weapons": []
      }
    }
  ],
  "filename": "your-video.mp4"
}
```

## Security Notes

- API keys are managed through environment variables
- File uploads are automatically cleaned up after processing
- File size is limited to 100MB
- Only specific video formats are allowed
