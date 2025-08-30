#!/bin/bash

echo "🚀 Fallback startup for Railway..."
echo "PORT: ${PORT:-8000}"

# Set minimal environment
export DJANGO_SETTINGS_MODULE=back.settings
export PYTHONUNBUFFERED=1

# Skip migrations and static files to start faster
echo "⚡ Starting Daphne immediately (skipping migrations)..."

# Start Daphne directly
exec daphne -b 0.0.0.0 -p ${PORT:-8000} back.asgi:application