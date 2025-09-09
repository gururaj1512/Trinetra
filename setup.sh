#!/bin/bash

# Trinetra Setup Script
echo "🚀 Setting up Trinetra: The Divine Eye of Mahakumbh"
echo "=================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your API keys before running the services."
fi

# Build and start all services
echo "🔨 Building and starting all services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service status
echo "📊 Service Status:"
echo "=================="
docker-compose ps

echo ""
echo "🎉 Setup complete! Services are running:"
echo "========================================"
echo "Main Application: http://localhost:3000"
echo "AI Guided Map: http://localhost:3001"
echo "Crowd Detection: http://localhost:5000"
echo "Gun Detection: http://localhost:5001"
echo "Image Recognition: http://localhost:5002"
echo "Lost & Found: http://localhost:5003"
echo "Disaster Prediction Backend: http://localhost:5004"
echo "Disaster Prediction Frontend: http://localhost:3002"
echo "User Frontend: http://localhost:3003"
echo "People Counting: http://localhost:5005"
echo ""
echo "📝 Don't forget to:"
echo "1. Update .env file with your API keys"
echo "2. Restart services: docker-compose restart"
echo "3. Check logs: docker-compose logs [service-name]"
