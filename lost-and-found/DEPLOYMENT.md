# 🚀 Deployment Guide - Trinetra Lost Person Detection System

This guide provides step-by-step instructions to deploy your Flask application on various platforms.

## 📋 Prerequisites

- Python 3.11+ installed
- Git installed
- GitHub account (for deployment)
- Basic knowledge of command line

## 🏗️ Local Development Setup

### 1. Clone and Setup Repository

```bash
# Clone your repository
git clone <your-repository-url>
cd lost-and-found

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Test Locally

```bash
# Run the application
python app.py

# Open browser and go to: http://localhost:5001
# Test with your person.png and crowd.mp4 files
```

## 🌐 Deployment Options

## Option 1: Render (Recommended for Beginners)

### Step 1: Prepare Repository
```bash
# Ensure all files are committed
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Deploy on Render
1. **Go to [render.com](https://render.com)** and sign up/login
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**
   - **Name**: `trinetra-lost-person-detection`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Plan**: Choose `Free` for testing

### Step 3: Environment Variables (Optional)
Add these in Render dashboard if needed:
- `PORT`: `10000` (Render sets this automatically)
- `FLASK_ENV`: `production`

### Step 4: Deploy
- Click **"Create Web Service"**
- Wait for build to complete (5-10 minutes)
- Your app will be available at: `https://your-app-name.onrender.com`

## Option 2: Heroku

### Step 1: Install Heroku CLI
```bash
# On macOS
brew install heroku/brew/heroku

# On Windows
# Download from: https://devcenter.heroku.com/articles/heroku-cli

# On Ubuntu
curl https://cli-assets.heroku.com/install-ubuntu.sh | sh
```

### Step 2: Login and Create App
```bash
# Login to Heroku
heroku login

# Create new app
heroku create your-app-name

# Add buildpack for Python
heroku buildpacks:set heroku/python
```

### Step 3: Deploy
```bash
# Deploy to Heroku
git push heroku main

# Open the app
heroku open
```

## Option 3: Railway

### Step 1: Setup Railway
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**

### Step 2: Configure
- Select your repository
- Railway will auto-detect Python
- Set start command: `gunicorn app:app`

### Step 3: Deploy
- Railway will automatically deploy
- Get your URL from the dashboard

## Option 4: DigitalOcean App Platform

### Step 1: Prepare
1. Go to [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform)
2. Click **"Create App"**

### Step 2: Configure
- Connect GitHub repository
- Choose **Python** as environment
- Set build command: `pip install -r requirements.txt`
- Set run command: `gunicorn app:app`

### Step 3: Deploy
- Choose plan (Basic starts at $5/month)
- Deploy and get your URL

## Option 5: AWS Elastic Beanstalk

### Step 1: Install EB CLI
```bash
pip install awsebcli
```

### Step 2: Initialize EB
```bash
eb init
# Follow prompts to configure AWS credentials
```

### Step 3: Create Environment
```bash
eb create production
eb open
```

## 🐳 Docker Deployment

### Step 1: Create Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directories
RUN mkdir -p uploads outputs

# Expose port
EXPOSE 5000

# Run the application
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
```

### Step 2: Build and Run
```bash
# Build Docker image
docker build -t trinetra-app .

# Run container
docker run -p 5000:5000 -v $(pwd)/uploads:/app/uploads -v $(pwd)/outputs:/app/outputs trinetra-app
```

## 🔧 Production Configuration

### Environment Variables
Create a `.env` file (don't commit this):
```bash
FLASK_ENV=production
FLASK_DEBUG=False
PORT=5000
MAX_CONTENT_LENGTH=100000000
```

### Gunicorn Configuration
Create `gunicorn.conf.py`:
```python
bind = "0.0.0.0:5000"
workers = 4
worker_class = "sync"
worker_connections = 1000
timeout = 300
keepalive = 2
max_requests = 1000
max_requests_jitter = 100
preload_app = True
```

### Nginx Configuration (if using reverse proxy)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static {
        alias /path/to/your/static/files;
    }
}
```

## 📊 Monitoring and Logs

### Health Check
Your app includes a health check endpoint:
```bash
curl https://your-app.com/api/health
```

### Logs
```bash
# On Render
# View logs in the dashboard

# On Heroku
heroku logs --tail

# On Railway
# View logs in the dashboard

# On DigitalOcean
# View logs in the dashboard
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check if all dependencies are in requirements.txt
pip freeze > requirements.txt

# Ensure Python version compatibility
python --version
```

#### 2. Video Codec Issues
- The app automatically falls back to MP4V if H.264 fails
- Check logs for codec warnings

#### 3. Memory Issues
- Reduce `frame_skip` parameter for longer videos
- Consider upgrading to paid plans for more resources

#### 4. File Upload Issues
- Check `MAX_CONTENT_LENGTH` setting
- Ensure uploads/ and outputs/ directories exist

### Debug Commands
```bash
# Check app status
curl -I https://your-app.com/api/health

# Test video endpoint
curl -I https://your-app.com/api/view/test.mp4

# Check logs
# Use platform-specific log viewing commands
```

## 🔒 Security Considerations

### Production Checklist
- [ ] Set `FLASK_ENV=production`
- [ ] Disable debug mode
- [ ] Use HTTPS (most platforms provide this)
- [ ] Set appropriate file size limits
- [ ] Monitor for abuse (large file uploads)
- [ ] Regular dependency updates

### Rate Limiting (Optional)
Add to `app.py`:
```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

@app.route('/api/detect', methods=['POST'])
@limiter.limit("10 per hour")
def detect_person():
    # ... existing code
```

## 📈 Scaling Considerations

### For High Traffic
- **Load Balancing**: Use multiple instances
- **CDN**: For static file delivery
- **Database**: Consider Redis for session storage
- **Queue**: Use Celery for background video processing

### Performance Tips
- Increase `frame_skip` for faster processing
- Use shorter video clips for testing
- Monitor memory usage
- Consider video compression

## 🎯 Next Steps

1. **Deploy to your chosen platform**
2. **Test with real files**
3. **Monitor performance and logs**
4. **Set up monitoring alerts**
5. **Consider CI/CD pipeline**

## 📞 Support

- **GitHub Issues**: Report bugs and feature requests
- **Platform Support**: Use platform-specific support channels
- **Community**: Join relevant Python/Flask communities

---

**Happy Deploying! 🚀**

Your Trinetra Lost Person Detection System is now ready to help people find their lost loved ones with divine technology! 🙏
