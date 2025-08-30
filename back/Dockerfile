FROM python:3.11-slim

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

# Force rebuild with test data - v2.0

# Simple startup for testing
CMD ["bash", "-c", "echo '=== '$(date)' RUNNING MIGRATIONS ===' && python manage.py migrate --noinput && echo '=== '$(date)' CREATING TEST DATA ===' && python manage.py create_test_data --users 15 --companies 8 && echo '=== '$(date)' TESTING DJANGO ===' && python -c 'import django; print(\"Django OK\")' && echo '=== '$(date)' TESTING WSGI ===' && python -c 'from back.wsgi import application; print(\"WSGI OK\")' && echo '=== '$(date)' STARTING GUNICORN ===' && echo 'PORT='${PORT:-8000} && exec gunicorn back.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 1 --timeout 120 --log-level info --access-logfile - --error-logfile - --preload"]