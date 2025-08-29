#!/bin/bash

# Resume Truemee データベースセットアップスクリプト

echo "🚀 Resume Truemee データベースセットアップを開始します..."

# 環境変数のチェック
if [ ! -f ".env" ]; then
    echo "⚠️  .envファイルが見つかりません。environment.exampleをコピーして.envを作成してください。"
    echo "📄 cp environment.example .env"
    exit 1
fi

# Docker Composeでデータベースを起動
echo "🐳 PostgreSQL & Redis を起動中..."
docker-compose up -d postgres redis

# データベースの起動を待機
echo "⏳ データベースの起動を待機中..."
sleep 10

# Pythonの仮想環境をチェック
if [ ! -d "back/venv" ]; then
    echo "🐍 Python仮想環境を作成中..."
    cd back
    python -m venv venv
    cd ..
fi

# 仮想環境を有効化
echo "🔧 仮想環境を有効化中..."
source back/venv/bin/activate

# 依存関係をインストール
echo "📦 依存関係をインストール中..."
cd back
pip install -r requirements.txt

# Django設定の確認
echo "⚙️  Django設定を確認中..."
export DB_ENGINE=postgresql
export DB_NAME=resume_truemee
export DB_USER=resume_user
export DB_PASSWORD=resume_password_2024
export DB_HOST=localhost
export DB_PORT=5432

# マイグレーションの作成
echo "📋 マイグレーションファイルを作成中..."
python manage.py makemigrations

# マイグレーションの実行
echo "🔄 データベースマイグレーションを実行中..."
python manage.py migrate

# スーパーユーザーの作成（オプション）
echo "👤 管理者ユーザーを作成しますか？ (y/n)"
read -r create_superuser
if [ "$create_superuser" = "y" ] || [ "$create_superuser" = "Y" ]; then
    python manage.py createsuperuser
fi

# 完了
echo "✅ データベースセットアップが完了しました！"
echo ""
echo "🎯 次のステップ:"
echo "1. 開発サーバーを起動: cd back && python manage.py runserver"
echo "2. pgAdminにアクセス: http://localhost:8080"
echo "   - Email: admin@resume-truemee.com"
echo "   - Password: admin123"
echo "3. フロントエンドを起動: cd frontend && npm run dev"
echo ""
echo "📊 データベース情報:"
echo "- Host: localhost"
echo "- Port: 5432"
echo "- Database: resume_truemee"
echo "- User: resume_user"
echo "- Password: resume_password_2024"
