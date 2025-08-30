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

# Start Gunicorn with minimal configuration
echo "🌐 Starting Gunicorn server on port ${PORT:-8000}..."
exec gunicorn back.wsgi:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 2 \
    --threads 4 \
    --timeout 120 \
    --log-level info