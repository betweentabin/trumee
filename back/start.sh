#!/bin/bash
set -e

echo "🚀 Starting Railway deployment..."

# Run migrations
echo "📦 Running database migrations..."
python manage.py migrate --noinput

# Create test users (optional, only if needed)
echo "👤 Creating test users..."
python manage.py create_specific_users || echo "Test users already exist or creation skipped"

# Collect static files (already done in build phase, but ensuring it's complete)
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput --clear

# Start Gunicorn
echo "🌐 Starting Gunicorn server on port ${PORT:-8000}..."
exec gunicorn back.wsgi:application \
  --bind 0.0.0.0:${PORT:-8000} \
  --workers 2 \
  --threads 2 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile - \
  --log-level info