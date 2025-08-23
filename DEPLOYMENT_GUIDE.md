# Resume Truemee - デプロイメントガイド

## Vercelでのフロントエンドデプロイメント

### 1. 事前準備

#### 必要なアカウント
- Vercel アカウント (https://vercel.com)
- GitHub アカウント (リポジトリ連携用)

#### 環境変数の設定
以下の環境変数をVercelダッシュボードで設定してください：

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_API_TIMEOUT=30000

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key

# Environment
NEXT_PUBLIC_ENV=production
```

### 2. Vercelでのデプロイ手順

1. **リポジトリの準備**
   ```bash
   git add .
   git commit -m "Vercel deployment preparation"
   git push origin main
   ```

2. **Vercelプロジェクトの作成**
   - Vercelダッシュボードにログイン
   - "New Project" をクリック
   - GitHubリポジトリを選択
   - フレームワーク: Next.js を選択
   - Root Directory: `frontend` を指定

3. **ビルド設定**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **環境変数の設定**
   - Settings → Environment Variables
   - 上記の環境変数を全て設定

5. **デプロイ実行**
   - "Deploy" ボタンをクリック

## バックエンドAPIのホスティング選択肢

### オプション1: Railway (推奨)
- **メリット**: Django対応、データベース統合、簡単デプロイ
- **URL**: https://railway.app
- **料金**: 月額$5から

### オプション2: Heroku
- **メリット**: 豊富なドキュメント、アドオン充実
- **URL**: https://heroku.com
- **料金**: 月額$7から

### オプション3: DigitalOcean App Platform
- **メリット**: 安価、スケーラブル
- **URL**: https://digitalocean.com
- **料金**: 月額$5から

### オプション4: AWS Elastic Beanstalk
- **メリット**: AWS統合、高い可用性
- **URL**: https://aws.amazon.com
- **料金**: 使用量に応じて

## Railway でのDjangoデプロイ手順

### 1. Railway準備
1. Railway アカウント作成
2. GitHubリポジトリ連携
3. プロジェクト作成

### 2. 必要ファイルの準備
```bash
# requirements.txt の確認
cd back
pip freeze > requirements.txt

# runtime.txt の作成
echo "python-3.13.3" > runtime.txt

# Procfile の作成
echo "web: gunicorn back.wsgi --log-file -" > Procfile
```

### 3. Django設定の調整
```python
# settings.py に追加
import os
import dj_database_url

# Railway用の設定
if 'RAILWAY_ENVIRONMENT' in os.environ:
    DEBUG = False
    ALLOWED_HOSTS = ['*']
    
    # データベース設定
    DATABASES = {
        'default': dj_database_url.parse(os.environ.get('DATABASE_URL'))
    }
    
    # 静的ファイル設定
    STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

### 4. 環境変数設定
Railway ダッシュボードで以下を設定：
```env
DJANGO_SECRET_KEY=your_secret_key
DATABASE_URL=postgresql://...
ALLOWED_HOSTS=your-app.railway.app
```

## セキュリティ設定

### 1. CORS設定
```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "https://your-vercel-app.vercel.app",
    "https://your-custom-domain.com",
]
```

### 2. CSRF設定
```python
# settings.py
CSRF_TRUSTED_ORIGINS = [
    "https://your-vercel-app.vercel.app",
    "https://your-custom-domain.com",
]
```

## 本番環境チェックリスト

### フロントエンド (Vercel)
- [ ] 環境変数が正しく設定されている
- [ ] APIのURL が本番環境のものになっている
- [ ] Firebase設定が本番用になっている
- [ ] Stripe設定が本番用になっている

### バックエンド (Railway/Heroku等)
- [ ] Django SECRET_KEY が設定されている
- [ ] DEBUG = False になっている
- [ ] ALLOWED_HOSTS が正しく設定されている
- [ ] データベースが本番用になっている
- [ ] 静的ファイルが正しく配信されている
- [ ] CORS設定が正しい

### 全体
- [ ] HTTPSが有効になっている
- [ ] ドメイン設定が完了している
- [ ] 監視・ログ設定が完了している
- [ ] バックアップ設定が完了している

## トラブルシューティング

### よくある問題と解決方法

1. **ビルドエラー**
   - Node.jsバージョンを確認
   - 依存関係を最新化: `npm update`

2. **API接続エラー**
   - CORS設定を確認
   - 環境変数のURLを確認

3. **静的ファイルが表示されない**
   - `collectstatic` コマンドを実行
   - STATIC_ROOT 設定を確認

4. **データベース接続エラー**
   - DATABASE_URL を確認
   - マイグレーションを実行
