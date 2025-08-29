#!/bin/bash

echo "🔧 API v2環境変数を自動設定します..."

# NEXT_PUBLIC_API_BASE_URL を設定
echo "📡 NEXT_PUBLIC_API_BASE_URL を設定中..."
printf "https://trumee-production.up.railway.app\nproduction\n" | vercel env add NEXT_PUBLIC_API_BASE_URL

echo "✅ 環境変数設定完了！"
echo "🔄 Vercelが自動で再デプロイを開始します..."
echo "📝 設定された環境変数:"
echo "   NEXT_PUBLIC_API_BASE_URL = https://trumee-production.up.railway.app"
echo "   NEXT_PUBLIC_API_VERSION = v2"
echo "   NEXT_PUBLIC_API_TIMEOUT = 30000"
echo "   NEXT_PUBLIC_ENV = production"

echo ""
echo "⏳ 再デプロイ完了後（約2-3分）、以下のURLでAPI v2をテストできます："
echo "   https://trumeee-q6944ov7l-taiga1226s-projects.vercel.app/resumes/new"
echo ""
echo "🧪 ページ上部のAPI v2トグルをONにしてテストしてください！"
