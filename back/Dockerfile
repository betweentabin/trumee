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

# Health check (temporarily disabled for debugging)
# HEALTHCHECK --interval=60s --timeout=30s --start-period=120s --retries=5 \
#     CMD curl -f http://localhost:${PORT:-8000}/ || exit 1

# Debug: Show what's in the directory and test the script
RUN ls -la && cat gunicorn_start.sh

# Use gunicorn startup script via bash to avoid permission edge cases
CMD ["bash", "-c", "echo 'Starting container...' && ls -la && ./gunicorn_start.sh"]