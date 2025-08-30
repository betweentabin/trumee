#!/bin/bash

echo "Starting with Gunicorn..."
echo "PORT=${PORT:-8000}"

# Set environment
export DJANGO_SETTINGS_MODULE=back.settings
export PYTHONUNBUFFERED=1

# Start Gunicorn (WSGIは確実に動作する)
exec gunicorn back.wsgi:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 2 \
    --timeout 120