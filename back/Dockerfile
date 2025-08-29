FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Set environment variables for collectstatic
ENV DJANGO_SETTINGS_MODULE=back.settings
ENV SECRET_KEY=dummy-key-for-build

# Collect static files (will be overridden at runtime if needed)
RUN python manage.py collectstatic --noinput || true

# Expose port
EXPOSE 8000

# Run migrations and start server with better error handling
CMD ["sh", "-c", "echo 'Starting Django application...' && echo 'PORT: '${PORT:-8000} && python manage.py migrate --noinput && echo 'Migrations completed' && python manage.py collectstatic --noinput && echo 'Starting Gunicorn...' && gunicorn back.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120 --log-level info --access-logfile - --error-logfile -"]