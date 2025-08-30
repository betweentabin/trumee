#!/bin/bash

echo "=== Railway Deployment Starting ==="
echo "PORT: ${PORT:-8000}"
echo "RAILWAY_ENVIRONMENT: ${RAILWAY_ENVIRONMENT:-not set}"
echo "Working directory: $(pwd)"
echo "Python version: $(python --version)"
echo "==================================="

# Set environment variables for Railway
export DJANGO_SETTINGS_MODULE=back.settings
export PYTHONUNBUFFERED=1

# Check critical dependencies
echo "Checking critical dependencies..."
python -c "import django, rest_framework, jwt, gunicorn; print('All critical dependencies available')" || {
    echo "Critical dependencies missing!"
    exit 1
}

# Test if Django can start
echo "Testing Django setup..."
python -c "import django; django.setup(); print('Django setup successful')" || {
    echo "Django setup failed!"
    exit 1
}

# Create static directory if it doesn't exist
mkdir -p staticfiles

# Run migrations
echo "Running database migrations..."
python manage.py migrate --noinput || echo "Migration failed, continuing anyway..."

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput || echo "Collectstatic failed, continuing anyway..."

# Start with Daphne for WebSocket support
echo "Starting Daphne on 0.0.0.0:${PORT:-8000}..."
exec daphne -b 0.0.0.0 -p ${PORT:-8000} back.asgi:application