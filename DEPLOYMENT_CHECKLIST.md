# デプロイメントチェックリスト 🚀

## 前準備 ✅

### 1. コードのプッシュ
- [x] テストデータ作成スクリプト追加
- [x] JWT認証問題修正
- [x] 統一認証ユーティリティ追加
- [x] Gitにpush完了

### 2. デプロイメント設定ファイル更新
- [x] Railway設定でcreate_specific_usersコマンド使用に変更

## Railway（バックエンド）デプロイ 🚂

### 必要な環境変数
```
DJANGO_SECRET_KEY=your_secret_key_here
DATABASE_URL=postgresql://... (Railwayが自動設定)
ALLOWED_HOSTS=your-railway-app.railway.app
CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
CSRF_TRUSTED_ORIGINS=https://your-vercel-app.vercel.app
```

### デプロイ手順
1. Railway.appにログイン
2. GitHubリポジトリを連携
3. 環境変数を設定
4. デプロイ実行
5. **デプロイ後にテストユーザー自動作成**:
   - railway.jsonでcreate_specific_usersが自動実行されます

### テストアカウント（デプロイ後自動作成）
| 役割 | メールアドレス | パスワード | 名前 |
|------|----------------|------------|------|
| 🧑‍💼 求職者 | complete.test@example.com | test123 | 完全 テスト |
| 🏢 企業 | company.test@example.com | company123 | テスト企業株式会社 |
| 👨‍💻 管理者 | admin.complete@truemee.jp | admin123 | 管理者 |

## Vercel（フロントエンド）デプロイ 🔥

### 必要な環境変数
```
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_ENV=production

# Firebase（必要に応じて）
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Stripe（必要に応じて）
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
```

### デプロイ手順
1. Vercel.comにログイン
2. "New Project"をクリック
3. GitHubリポジトリを選択
4. Framework: Next.js
5. Root Directory: `frontend`
6. 環境変数を設定（上記参照）
7. デプロイ実行

## デプロイ後の確認事項 ✨

### バックエンド確認
- [ ] Railway URLにアクセス
- [ ] `/api/v1/` ヘルスチェックが正常
- [ ] データベースマイグレーション完了
- [ ] テストユーザー作成完了
- [ ] 管理画面アクセス可能

### フロントエンド確認
- [ ] Vercel URLにアクセス
- [ ] ログインページ表示
- [ ] APIとの通信確認
- [ ] 各テストアカウントでログイン成功

### 統合テスト
- [ ] 求職者アカウントログイン → /users遷移
- [ ] 企業アカウントログイン → /company遷移  
- [ ] 管理者アカウントログイン → /users遷移

## トラブルシューティング 🔧

### よくある問題

1. **CORSエラー**
   - バックエンドのCORS_ALLOWED_ORIGINSにフロントエンドURLを追加

2. **APIベースURL間違い**
   - フロントエンドのNEXT_PUBLIC_API_URLをRailway URLに更新

3. **認証エラー**
   - ブラウザのローカルストレージをクリア
   - 新しい統一認証システムで再ログイン

4. **データベースエラー**
   - Railwayコンソールでマイグレーション状況確認
   - 必要に応じて手動でマイグレーション実行

## 手動コマンド（必要時のみ）

### Railway コンソールから実行
```bash
# マイグレーション
python manage.py migrate

# テストユーザー作成（自動実行されない場合）
python manage.py create_specific_users

# 静的ファイル収集
python manage.py collectstatic --noinput
```

## 完了後の確認URL

- **フロントエンド**: https://your-vercel-app.vercel.app
- **バックエンドAPI**: https://your-railway-app.railway.app/api/v1/
- **管理画面**: https://your-railway-app.railway.app/admin/

## 次のステップ

1. カスタムドメイン設定（オプション）
2. 監視・ログ設定
3. バックアップ設定
4. 本番環境用セキュリティ強化
