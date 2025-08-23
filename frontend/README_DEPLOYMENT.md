# Resume Truemee - Vercelデプロイメント手順

## ✅ 完了した準備作業

### 1. プロジェクト構造の確認
- Next.js フロントエンド: `frontend/` ディレクトリ
- Django バックエンド: `back/` ディレクトリ
- 設定ファイルの準備完了

### 2. 環境変数設定
- `frontend/env.example` - 環境変数のテンプレート作成済み
- Vercel環境変数設定用のリストを準備済み

### 3. Vercel設定ファイル
- `frontend/vercel.json` - Vercel専用設定ファイル作成済み
- Next.js最適化設定 (`next.config.ts`) 更新済み

### 4. ビルドエラーの修正
- 不足していたコンポーネントを作成
- 文字エンコーディング問題を修正
- Redux関連のエラーを修正
- TypeScriptエラーを修正

## 🚀 Vercelデプロイ手順

### Step 1: GitHubリポジトリの準備
```bash
# プロジェクトルートで実行
git add .
git commit -m "Vercel deployment ready"
git push origin main
```

### Step 2: Vercelプロジェクト作成
1. https://vercel.com にログイン
2. "New Project" をクリック
3. GitHubリポジトリを選択
4. **重要**: Root Directory を `frontend` に設定
5. Framework: Next.js (自動検出)

### Step 3: 環境変数設定
Vercelダッシュボードの Settings → Environment Variables で以下を設定:

```env
# 必須環境変数
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_ENV=production

# Firebase設定 (実際の値に置き換え)
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Stripe設定 (本番環境用キー)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
```

### Step 4: デプロイ実行
1. "Deploy" ボタンをクリック
2. ビルドプロセスの完了を待つ
3. デプロイ完了後、URLを確認

## 🔧 バックエンドAPIのデプロイ

### 推奨オプション: Railway
1. https://railway.app でアカウント作成
2. GitHubリポジトリを連携
3. `back/` ディレクトリを指定
4. 環境変数を設定:
   ```env
   DJANGO_SECRET_KEY=your_secret_key
   DEBUG=False
   ALLOWED_HOSTS=your-railway-domain.railway.app
   DATABASE_URL=postgresql://...
   ```

### その他のオプション
- **Heroku**: https://heroku.com
- **DigitalOcean**: https://digitalocean.com
- **AWS Elastic Beanstalk**: https://aws.amazon.com

## ⚙️ 本番環境設定

### セキュリティ設定
1. **CORS設定** (Django settings.py):
```python
CORS_ALLOWED_ORIGINS = [
    "https://your-vercel-app.vercel.app",
    "https://your-custom-domain.com",
]
```

2. **CSRF設定**:
```python
CSRF_TRUSTED_ORIGINS = [
    "https://your-vercel-app.vercel.app",
    "https://your-custom-domain.com",
]
```

### データベース設定
- 本番用PostgreSQLデータベースの準備
- マイグレーションの実行
- 初期データの投入

## 📋 デプロイ前チェックリスト

### フロントエンド
- [ ] 環境変数が全て設定されている
- [ ] Firebase設定が本番用になっている
- [ ] Stripe設定が本番用になっている
- [ ] API URLが本番環境のものになっている

### バックエンド
- [ ] SECRET_KEYが設定されている
- [ ] DEBUG=Falseになっている
- [ ] ALLOWED_HOSTSが正しく設定されている
- [ ] データベースが本番用になっている
- [ ] CORS/CSRF設定が正しい

### 全体
- [ ] HTTPSが有効になっている
- [ ] ドメイン設定が完了している
- [ ] 監視・ログ設定が完了している

## 🆘 トラブルシューティング

### よくある問題
1. **ビルドエラー**: 依存関係を確認 (`npm install`)
2. **API接続エラー**: CORS設定とURL確認
3. **環境変数エラー**: Vercelダッシュボードで再確認
4. **静的ファイルエラー**: Next.js設定確認

### サポート情報
- Vercelドキュメント: https://vercel.com/docs
- Next.jsドキュメント: https://nextjs.org/docs
- プロジェクトの詳細な設定: `DEPLOYMENT_GUIDE.md`

---

**準備完了！** 上記の手順に従ってVercelでのデプロイを開始できます。
