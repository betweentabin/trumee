# Railway デプロイメント確認事項

## DRF Token認証統一に伴う確認ポイント

### ✅ バックエンド設定の確認

#### 1. settings.py
- **DRF認証設定**: ✅ TokenAuthenticationのみに統一済み
```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
}
```

- **INSTALLED_APPS**: ✅ `rest_framework.authtoken`が含まれている
- **ALLOWED_HOSTS**: ✅ Railway用ドメインが設定済み (`.railway.app`, `.up.railway.app`)
- **CORS設定**: ✅ Vercelドメインが許可リストに含まれている

#### 2. API エンドポイント
- **登録/ログイン**: DRFトークンのみ返却するよう修正済み
- **JWT生成コード**: 削除済み（後方互換性のためトークンを複製）

### ✅ フロントエンド設定の確認

#### 1. APIクライアント設定
- **api-v2-client.ts**: `Token`ヘッダー形式に変更済み
- **api-client.ts**: `Token`ヘッダー形式に変更済み
- **config/api.ts**: `Token`ヘッダー形式に変更済み
- **utils/auth.ts**: `Token`ヘッダー形式に変更済み

#### 2. 環境変数
- **本番API URL**: `https://trumee-production.up.railway.app`が設定済み

### ⚠️ Railway デプロイ時の注意事項

#### 1. 環境変数の設定（Railway側）
以下の環境変数がRailwayに設定されていることを確認：
```bash
# Django設定
SECRET_KEY=<your-secret-key>
DEBUG=False  # 本番環境では必ずFalse
DATABASE_URL=<postgresql-url>  # Railway提供のDB URL

# CORS設定（フロントエンドURL）
FRONTEND_URL=https://trumeee.vercel.app
```

#### 2. マイグレーションコマンド
Railway デプロイ時に以下のコマンドが実行されることを確認：
```bash
python manage.py migrate
python manage.py collectstatic --noinput
```

#### 3. Procfile/railway.toml の確認
起動コマンドが正しく設定されていることを確認：
```toml
[deploy]
startCommand = "gunicorn back.wsgi:application --bind 0.0.0.0:$PORT"
```

### 🔧 デプロイ前のローカルテスト

1. **本番環境変数でのテスト**
```bash
export DEBUG=False
export NEXT_PUBLIC_API_URL=https://trumee-production.up.railway.app
python manage.py runserver
```

2. **認証フローのテスト**
- ユーザー登録 → DRFトークン取得
- ログイン → DRFトークン取得  
- APIアクセス → `Token`ヘッダーで認証

### 📋 デプロイチェックリスト

- [ ] Railway環境変数設定完了
- [ ] フロントエンド環境変数設定完了（Vercel）
- [ ] ローカルでの本番環境テスト完了
- [ ] データベースマイグレーション確認
- [ ] CORS設定確認
- [ ] ログ監視設定

### 🚨 トラブルシューティング

#### 認証エラーが発生した場合
1. **401 Unauthorized**
   - トークンヘッダー形式を確認（`Token`であること）
   - トークンが正しく保存・送信されているか確認

2. **CORS エラー**
   - Railway側のCORS_ALLOWED_ORIGINSにフロントエンドURLが含まれているか確認
   - プリフライトリクエストが許可されているか確認

3. **500 Internal Server Error**
   - Railwayログを確認
   - `DEBUG=True`で一時的にデバッグ情報を確認

### 📝 デプロイコマンド

```bash
# Railway CLI を使用したデプロイ
railway up

# または GitHub連携による自動デプロイ
git push origin main
```

## 結論

DRF Token認証への統一は完了しており、Railway環境変数が正しく設定されていれば、デプロイは正常に動作するはずです。

主な確認ポイント：
1. ✅ 認証ヘッダーが`Token`形式に統一されている
2. ✅ JWT認証クラスが削除されている  
3. ✅ トークンキー名が`drf_token_v2`に統一されている
4. ⚠️ Railway側の環境変数設定を確認する必要がある