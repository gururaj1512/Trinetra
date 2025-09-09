#!/bin/bash

# Trinetra Stop Script
echo "🛑 Stopping Trinetra services..."
echo "================================"

# Stop all services
docker-compose down

echo "✅ All services stopped successfully!"
echo ""
echo "To start services again, run: ./setup.sh"
echo "To remove all containers and volumes, run: docker-compose down -v"
