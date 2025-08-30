#!/bin/bash

echo "🆘 Emergency startup script for Railway"
echo "PORT=${PORT}"
echo "PWD=$(pwd)"

# Python直接実行でテスト
cd /app 2>/dev/null || cd /opt/app 2>/dev/null || true
python manage.py runserver 0.0.0.0:${PORT:-8000}