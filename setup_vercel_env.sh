#!/bin/bash

# Vercel環境変数設定スクリプト
echo "🔧 Vercel環境変数を自動設定します..."

cd frontend

# API v2 Base URL
echo "📡 API v2 Base URL を設定中..."
echo "https://trumee-production.up.railway.app" | vercel env add NEXT_PUBLIC_API_BASE_URL production

# API Version  
echo "🔖 API Version を設定中..."
echo "v2" | vercel env add NEXT_PUBLIC_API_VERSION production

# API Timeout
echo "⏱️ API Timeout を設定中..."
echo "30000" | vercel env add NEXT_PUBLIC_API_TIMEOUT production

# Environment
echo "🌍 Environment を設定中..."
echo "production" | vercel env add NEXT_PUBLIC_ENV production

echo "✅ 環境変数設定完了！"
echo "🚀 Vercelデプロイを開始します..."

# デプロイ実行
vercel --prod

echo "🎉 デプロイ完了！"
