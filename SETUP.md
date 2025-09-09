# Trinetra Setup Guide

## 🚀 Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- Git (to clone the repository)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd Trinetra
```

### 2. Configure Environment
```bash
# Copy the environment template
cp env.template .env

# Edit .env file with your API keys
nano .env  # or use your preferred editor
```

### 3. Start All Services
```bash
# Make scripts executable (if not already done)
chmod +x setup.sh stop.sh clean.sh

# Start all services
./setup.sh
```

### 4. Access Applications
- **Main Application**: http://localhost:3000
- **AI Guided Map**: http://localhost:3001
- **Crowd Detection**: http://localhost:5000
- **Gun Detection**: http://localhost:5001
- **Image Recognition**: http://localhost:5002
- **Lost & Found**: http://localhost:5003
- **Disaster Prediction Backend**: http://localhost:5004
- **Disaster Prediction Frontend**: http://localhost:3002
- **User Frontend**: http://localhost:3003
- **People Counting**: http://localhost:5005

## 🛠️ Manual Setup (Alternative)

### Prerequisites
- Node.js 18+
- Python 3.8+
- PostgreSQL
- Redis

### 1. Database Setup
```bash
# Start PostgreSQL and Redis
sudo systemctl start postgresql
sudo systemctl start redis

# Create database
createdb trinetra
```

### 2. Backend Services
```bash
# Crowd Detection
cd crowd-detection
pip install -r requirements.txt
python app.py

# Gun Detection
cd ../gun-detection
pip install -r requirements.txt
python main.py

# Image Recognition
cd ../image-recognition
pip install -r requirements.txt
python app.py

# Lost and Found
cd ../lost-and-found
pip install -r requirements.txt
python app.py

# Disaster Prediction Backend
cd ../mahakumbh-disaster-prediction/backend
pip install -r requirements.txt
python app.py

# People Counting
cd ../../peoples
pip install -r requirements.txt
python crowd_counter.py
```

### 3. Frontend Services
```bash
# Main Application
cd Trinetra
npm install
npm run dev

# AI Guided Map
cd ../ai-guided-map
npm install
npm run dev

# Disaster Prediction Frontend
cd ../mahakumbh-disaster-prediction/frontend
npm install
npm run dev

# User Frontend
cd ../user-frontend
npm install
npm run dev
```

## 🔧 Configuration

### Required API Keys
1. **Google Maps API Key**
   - Get from: https://console.cloud.google.com/
   - Enable: Maps JavaScript API, Places API, Geocoding API

2. **Gemini AI API Key**
   - Get from: https://makersuite.google.com/app/apikey

3. **Weather API Key**
   - Get from: https://openweathermap.org/api

4. **Satellite API Key**
   - Get from: https://www.planet.com/developers/

### Environment Variables
Edit the `.env` file with your API keys:
```bash
GOOGLE_MAPS_API_KEY=your_actual_api_key
GEMINI_API_KEY=your_actual_api_key
WEATHER_API_KEY=your_actual_api_key
SATELLITE_API_KEY=your_actual_api_key
```

## 📊 Service Management

### Start Services
```bash
./setup.sh
```

### Stop Services
```bash
./stop.sh
```

### Clean Environment
```bash
./clean.sh
```

### View Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs [service-name]

# Follow logs
docker-compose logs -f [service-name]
```

### Restart Service
```bash
docker-compose restart [service-name]
```

## 🔍 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :3000
   
   # Kill the process
   kill -9 [PID]
   ```

2. **Docker Build Fails**
   ```bash
   # Clean Docker cache
   docker system prune -a
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

3. **Permission Issues**
   ```bash
   # Fix script permissions
   chmod +x *.sh
   
   # Fix Docker permissions (Linux)
   sudo usermod -aG docker $USER
   ```

4. **Database Connection Issues**
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps postgres
   
   # Check logs
   docker-compose logs postgres
   ```

### Service Health Checks
```bash
# Check all services status
docker-compose ps

# Check specific service health
curl http://localhost:5000/health  # Crowd Detection
curl http://localhost:5001/health  # Gun Detection
curl http://localhost:5002/health  # Image Recognition
curl http://localhost:5003/health  # Lost & Found
curl http://localhost:5004/health  # Disaster Prediction
curl http://localhost:5005/health  # People Counting
```

## 📱 Mobile Development

### React Native Setup
```bash
# Install React Native CLI
npm install -g react-native-cli

# Install dependencies
cd mobile-app
npm install

# iOS (macOS only)
cd ios && pod install && cd ..

# Run on iOS
npx react-native run-ios

# Run on Android
npx react-native run-android
```

## 🚀 Production Deployment

### Docker Production Build
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables for Production
```bash
NODE_ENV=production
FLASK_ENV=production
FLASK_DEBUG=0
```

## 📞 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review service logs: `docker-compose logs [service-name]`
3. Create an issue in the repository
4. Contact the development team

---

*Happy coding with Trinetra! 🎉*
