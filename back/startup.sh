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

# Skip migrations and collectstatic for now to focus on getting the app running
echo "Skipping migrations for initial deployment..."
# python manage.py migrate --noinput || true

echo "Skipping static files collection for initial deployment..."
# python manage.py collectstatic --noinput || true

# Start Gunicorn with Railway-specific settings
echo "Starting Gunicorn on 0.0.0.0:${PORT:-8000}..."
exec gunicorn back.wsgi:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 2 \
    --threads 4 \
    --worker-class sync \
    --worker-tmp-dir /dev/shm \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    --timeout 120 \
    --graceful-timeout 30