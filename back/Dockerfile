FROM python:3.11-slim

# Force complete rebuild - v4.0 - $(date)
RUN echo "Forced rebuild at $(date) - CACHE_BUST_v6" > /rebuild.txt

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    libmagic1 \
    libmagic-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Create static directory
RUN mkdir -p staticfiles

# Make all startup scripts executable (explicitly include key scripts)
RUN chmod +x *.sh || true
RUN chmod +x gunicorn_start.sh startup.sh || true

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=back.settings

# Force rebuild - v4.0 - Fixed indentation errors in create_test_data.py

# Simple startup for testing
CMD ["bash", "-c", "echo '=== CONTAINER START: '$(date)' ===' && echo 'Python version:' && python --version && echo '=== RUNNING MIGRATIONS: '$(date)' ===' && python manage.py migrate --noinput && echo '=== TESTING DJANGO: '$(date)' ===' && python -c 'import django; django.setup(); print(\"Django OK - Version:\", django.get_version())' && echo '=== TESTING WSGI: '$(date)' ===' && python -c 'from back.wsgi import application; print(\"WSGI OK\")' && echo '=== STARTING GUNICORN: '$(date)' ===' && echo 'PORT='${PORT:-8000} && echo 'Starting Gunicorn server...' && exec gunicorn back.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 1 --timeout 120 --log-level info --access-logfile - --error-logfile -"]