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

# Debug: Show what's in the directory and test the script
RUN ls -la && echo "=== gunicorn_start.sh content ===" && cat gunicorn_start.sh && echo "=== end of script ==="

# Direct gunicorn startup to bypass script issues
CMD ["bash", "-c", "echo '=== CONTAINER STARTING ===' && echo 'Working directory:' && pwd && echo 'Files in directory:' && ls -la && echo 'Environment variables:' && env | grep -E '(PORT|DJANGO|DATABASE)' && echo 'PORT=${PORT:-8000}' && echo '=== RUNNING COLLECTSTATIC ===' && python manage.py collectstatic --noinput && echo '=== STARTING GUNICORN ===' && gunicorn back.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120 --log-level debug"]