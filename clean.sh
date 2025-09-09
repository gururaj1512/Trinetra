#!/bin/bash

# Trinetra Clean Script
echo "🧹 Cleaning up Trinetra environment..."
echo "====================================="

# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Remove all images
echo "🗑️  Removing Docker images..."
docker-compose down --rmi all

# Clean up unused Docker resources
echo "🧽 Cleaning up unused Docker resources..."
docker system prune -f

echo "✅ Cleanup complete!"
echo ""
echo "To start fresh, run: ./setup.sh"
