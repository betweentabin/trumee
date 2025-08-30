#!/bin/bash

echo "🚀 Starting Django server for Railway..."
echo "PORT: ${PORT:-8000}"

# Set environment variables
export DJANGO_SETTINGS_MODULE=back.settings
export PYTHONUNBUFFERED=1

# Create necessary directories
mkdir -p staticfiles

# Run migrations
echo "📦 Running migrations..."
python manage.py migrate --noinput 2>&1

# Collect static files
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput 2>&1

# Start Daphne with minimal configuration for WebSocket support
echo "🌐 Starting Daphne server on port ${PORT:-8000}..."
exec daphne -b 0.0.0.0 -p ${PORT:-8000} back.asgi:application