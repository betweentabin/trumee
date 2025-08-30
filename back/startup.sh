#!/bin/bash

echo "=== Railway Deployment Debug Info ==="
echo "PORT: ${PORT:-not set}"
echo "DATABASE_URL: ${DATABASE_URL:-not set}"
echo "DJANGO_SECRET_KEY: ${DJANGO_SECRET_KEY:-not set}"
echo "SECRET_KEY: ${SECRET_KEY:-not set}"
echo "PWD: $(pwd)"
echo "LS: $(ls -la)"
echo "====================================="

# Run migrations
echo "Running migrations..."
python manage.py migrate --noinput || echo "Migration failed but continuing..."

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput || echo "Collectstatic failed but continuing..."

# Start Gunicorn
echo "Starting Gunicorn on port ${PORT:-8000}..."
exec gunicorn back.wsgi:application --bind 0.0.0.0:${PORT:-8000} --log-level debug