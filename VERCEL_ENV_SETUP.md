# Vercel環境変数設定ガイド

## 自動設定用スクリプト

以下の環境変数をVercelダッシュボードで設定してください：

### 基本設定
```bash
# APIエンドポイント（バックエンドデプロイ後に更新）
NEXT_PUBLIC_API_URL=https://your-backend-api.herokuapp.com
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_ENV=production
```

### Firebase設定（実際の値に置き換え）
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyExample123456789
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123def456
```

### Stripe設定（本番環境用）
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_stripe_key
```

## Vercel CLI設定（オプション）

Vercel CLIを使用する場合：

```bash
# Vercel CLIインストール
npm i -g vercel

# プロジェクトリンク
vercel link

# 環境変数設定
vercel env add NEXT_PUBLIC_API_URL
vercel env add NEXT_PUBLIC_API_TIMEOUT
vercel env add NEXT_PUBLIC_ENV
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# 再デプロイ
vercel --prod
```

## ダッシュボード設定方法

1. https://vercel.com/dashboard にアクセス
2. `trumee` プロジェクトを選択
3. Settings → Environment Variables
4. 上記の環境変数を一つずつ追加
5. 環境を "Production" に設定
6. 保存後、自動で再デプロイされます

## 注意事項

- `NEXT_PUBLIC_` プレフィックスが必要
- 本番環境用のAPIキーを使用
- セキュリティのため、シークレットキーは含めない
- バックエンドAPI URLは実際のデプロイ先に更新
