#!/bin/bash

# Django開発サーバー起動スクリプト
# ポート4000で起動

echo "==================================="
echo "Resume Truemee - Django Server"
echo "==================================="
echo ""
echo "Starting Django development server on port 4000..."
echo ""

# 仮想環境をアクティベート
if [ -d "venv_new" ]; then
    source venv_new/bin/activate
elif [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "Error: Virtual environment not found!"
    echo "Please create a virtual environment first."
    exit 1
fi

# マイグレーションの確認
echo "Checking for pending migrations..."
python manage.py showmigrations --list | grep "\[ \]" > /dev/null
if [ $? -eq 0 ]; then
    echo "Pending migrations found. Running migrations..."
    python manage.py migrate
fi

# 静的ファイルの収集（必要な場合）
# python manage.py collectstatic --noinput

# サーバー起動
echo ""
echo "==================================="
echo "Server is starting..."
echo "Access the application at:"
echo ""
echo "  http://localhost:4000"
echo ""
echo "API Documentation:"
echo "  http://localhost:4000/api/v2/health/"
echo ""
echo "Admin Panel:"
echo "  http://localhost:4000/admin/"
echo ""
echo "Press Ctrl+C to stop the server"
echo "==================================="
echo ""

# ポート4000でサーバーを起動
python manage.py runserver 0.0.0.0:4000