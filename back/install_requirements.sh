#!/bin/bash
# Script to install requirements in chunks to avoid network timeouts

echo "Installing requirements in chunks..."

# Core packages first
pip install --no-cache-dir \
    Django==5.0.6 \
    djangorestframework==3.15.2 \
    djangorestframework-simplejwt==5.3.1 \
    django-cors-headers==4.7.0 \
    django-environ==0.12.0

# Authentication packages
pip install --no-cache-dir \
    dj-rest-auth==6.0.0 \
    django-allauth==0.61.1 \
    PyJWT==2.10.1 \
    bcrypt==4.3.0 \
    cryptography==45.0.2

# Database and server packages
pip install --no-cache-dir \
    psycopg2-binary==2.9.9 \
    dj-database-url==2.1.0 \
    gunicorn==22.0.0 \
    whitenoise==6.6.0

# WebSocket support - install separately due to large dependencies
pip install --no-cache-dir daphne==4.1.2
pip install --no-cache-dir channels==4.1.0

# HTTP and utilities
pip install --no-cache-dir \
    requests==2.32.3 \
    urllib3==2.4.0 \
    certifi==2025.1.31 \
    python-dotenv==1.1.0 \
    tzdata==2025.2

# Additional packages
pip install --no-cache-dir \
    stripe==12.4.0 \
    django-extensions==3.2.3 \
    django-debug-toolbar==4.4.6

# Redis and caching
pip install --no-cache-dir \
    redis==5.2.1 \
    django-redis==5.4.0

# Other utilities
pip install --no-cache-dir \
    python-decouple==3.8 \
    asgiref==3.8.1 \
    sqlparse==0.5.3 \
    pytz==2025.2

# Firebase - install separately due to many dependencies
pip install --no-cache-dir firebase-admin==7.0.0

# Image processing
pip install --no-cache-dir Pillow==11.0.0

echo "All requirements installed successfully!"