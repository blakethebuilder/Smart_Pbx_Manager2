#!/bin/bash

echo "🗄️ Copying local database to Docker volume..."

# Get the project name (used as prefix for Docker volumes)
PROJECT_NAME=$(basename "$(pwd)" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]//g')

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    echo "⚠️  Containers are running. Stopping them first..."
    docker-compose down
fi

# Create a temporary container to access the volume
echo "📦 Creating temporary container to access Docker volume..."
docker run --rm -v ${PROJECT_NAME}_pbx_data:/volume_data -v $(pwd)/data:/local_data alpine sh -c "
    echo '📋 Copying database files...'
    cp -v /local_data/pbx-dashboard.db* /volume_data/ 2>/dev/null || echo 'Some files may not exist, continuing...'
    echo '✅ Database files copied to Docker volume'
    ls -la /volume_data/
"

echo "🚀 Database copied! You can now start your containers:"
echo "   docker-compose up -d"