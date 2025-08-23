# Resume Truemee - 必要な認証情報とアカウント

このドキュメントでは、Resume Truemeeアプリケーションを本格運用するために必要な外部サービスのアカウントと認証情報について説明します。

## 1. Firebase（認証・データベース）

### 1.1 Firebaseプロジェクト
- **現在の状況**: 設定済み
- **プロジェクト名**: Resume Truemee
- **必要な設定**:
  - Authentication（メール/パスワード認証）
  - Firestore Database（ユーザーデータ保存）
  - Storage（ファイルアップロード用）

### 1.2 Firebase設定ファイル
- **ファイル**: `firebase_key.json`
- **場所**: プロジェクトルート
- **注意**: 本番環境では環境変数で管理すること

### 1.3 Web SDK設定
フロントエンドで必要な設定値：
```javascript
const firebaseConfig = {
  apiKey: "環境変数で設定",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## 2. Stripe（決済）

### 2.1 Stripeアカウント
- **現在の設定**: テスト環境のキーがハードコード
- **テストキー**: 環境変数 `STRIPE_SECRET_KEY` で設定
- **必要な設定**:
  - Stripe Dashboardへのアクセス
  - 商品・価格の設定
  - Webhook エンドポイントの設定

### 2.2 本番環境での設定
```bash
# 環境変数で設定
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
```

## 3. 本番環境デプロイ時の設定

### 3.1 フロントエンド（Vercel）
環境変数として設定が必要：
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
```

### 3.2 バックエンド（Railway/Heroku等）
環境変数として設定が必要：
```env
DJANGO_SECRET_KEY=your_secret_key
STRIPE_SECRET_KEY=sk_live_your_secret_key
FIREBASE_CREDENTIALS=path_to_service_account.json
DATABASE_URL=your_database_url
```

## 4. セキュリティ注意事項

### 4.1 機密情報の管理
- **絶対にGitにコミットしない**: API キー、シークレットキー
- **環境変数を使用**: 本番環境では必ず環境変数で管理
- **アクセス権限の最小化**: 必要最小限の権限のみ付与

### 4.2 本番環境での追加設定
- HTTPS の強制
- CORS の適切な設定
- レート制限の実装
- ログ監視の設定

## 5. 開発環境での設定方法

### 5.1 ローカル開発用の環境変数
```bash
# .env.local ファイルを作成
cp frontend/env.example frontend/.env.local

# 必要な値を設定
NEXT_PUBLIC_FIREBASE_API_KEY=your_dev_key
STRIPE_SECRET_KEY=sk_test_your_test_key
```

### 5.2 Django設定
```bash
# バックエンドの環境変数
export DJANGO_SECRET_KEY=your_dev_secret
export STRIPE_SECRET_KEY=sk_test_your_test_key
```

## 6. トラブルシューティング

### 6.1 認証エラー
- Firebase設定の確認
- APIキーの有効性確認
- ドメインの認証設定確認

### 6.2 決済エラー
- Stripeキーの確認
- Webhook設定の確認
- テスト環境と本番環境の切り替え確認

---

**注意**: このファイルには実際の認証情報は含まれていません。実際の運用時は、各サービスから取得した正式な認証情報を環境変数として設定してください。
