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

# Test if Django can start
echo "Testing Django setup..."
python -c "import django; django.setup(); print('Django setup successful')" || {
    echo "Django setup failed!"
    exit 1
}

# Test database connection
echo "Testing database connection..."
python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'back.settings')
django.setup()
from django.db import connection
with connection.cursor() as cursor:
    cursor.execute('SELECT 1')
print('Database connection successful')
" || {
    echo "Database connection failed!"
    exit 1
}

# Create static directory if it doesn't exist
mkdir -p staticfiles

# Start with a simple Gunicorn configuration
echo "Starting Gunicorn on 0.0.0.0:${PORT:-8000}..."
exec gunicorn back.wsgi:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 1 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    --log-level debug \
    --capture-output \
    --enable-stdio-inheritance