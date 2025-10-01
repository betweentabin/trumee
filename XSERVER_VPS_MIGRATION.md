# Xserver VPS 本番移行ガイド（Railway PostgreSQL 併用）

本番は Xserver VPS、データベースはこれまで通り Railway の PostgreSQL を継続利用する前提の移行手順と設定まとめです。

## 方針（構成）
- Xserver VPS で Django バックエンドを常駐（`gunicorn` or `daphne`）し、`nginx` でリバースプロキシ/SSL 終端。
- データベースは Railway の PostgreSQL を外部接続で利用（パブリック接続、TLS 必須）。
- フロントエンドは継続して Vercel でも、VPS でも可。Vercel 継続なら API の URL だけ差し替え。

## 事前に準備するもの
- Xserver VPS のドメインまたは固定IP（例: `api.example.com` / `203.0.113.10`）。
- Railway の PostgreSQL 接続情報（`DATABASE_URL` 形式推奨）。
  - 例: `postgresql://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require`
- Django シークレット等の機密値（`DJANGO_SECRET_KEY` ほか）。

## 必須環境変数（バックエンド）
`back/back/settings.py` は `DATABASE_URL` を優先して使用します（TLS は `DATABASE_SSL_REQUIRE=true` がデフォルト）。最低限:

- `DJANGO_SECRET_KEY`（必須）
- `DEBUG=False`（本番は必須）
- `ENABLE_PROD_SECURITY=true`（推奨: 本番向けセキュリティを強制）
- `SECURE_SSL_REDIRECT=true`（推奨）
- `DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require`
  - もしくは `?sslmode` なしでも可（既定で `DATABASE_SSL_REQUIRE=true`）。
- `DB_CONN_MAX_AGE=600`（任意: コネクション再利用）
- `FRONTEND_URL=https://<フロントのドメイン>`（メール内リンク等で使用）

例（/srv/trumee/.env）:
```
DJANGO_SECRET_KEY=your-secret
DEBUG=False
ENABLE_PROD_SECURITY=true
SECURE_SSL_REDIRECT=true
DATABASE_URL=postgresql://USER:PASS@HOST:PORT/DB?sslmode=require
DB_CONN_MAX_AGE=600
FRONTEND_URL=https://trumeee.vercel.app
```

## CORS / ホスト許可の更新
Xserver の独自ドメインに切り替えると、以下にドメイン追加が必要です。

- 許可ホスト: `back/back/settings.py:38` の `ALLOWED_HOSTS`
- CORS 許可: `back/back/settings.py:52` の `CORS_ALLOWED_ORIGINS`
- CSRF 信頼: `back/back/settings.py:349` の `CSRF_TRUSTED_ORIGINS`

例（追記する値）:
- API ドメイン: `https://api.example.com`
- フロント: `https://www.example.com`（Vercel 継続なら `https://trumeee.vercel.app` など）

必要に応じて上記配列に追記してください（本番は `DEBUG=False` のため、明示追加が必須）。

※ ご希望があれば、これらを環境変数駆動（カンマ区切り）へリファクタ可能です。

## Xserver VPS 構築（例）
- パッケージ: `python3.11 + venv`, `pip`, `libpq-dev`, `gcc`, `nginx`
- アプリ配置: `/srv/trumee/back`（任意のディレクトリ）
- 仮想環境: `/srv/trumee/venv`

手順例:
```
# 1) ディレクトリ準備
sudo mkdir -p /srv/trumee && sudo chown $USER:$USER /srv/trumee
cd /srv/trumee

# 2) ソース配置（git / rsync / scp などで）
# ここでは既に back ディレクトリがある前提

# 3) venv + 依存インストール
python3 -m venv venv
source venv/bin/activate
cd back
pip install -r requirements.txt

# 4) 環境変数
cp /path/to/.env /srv/trumee/.env

# 5) マイグレーション/静的ファイル
python manage.py migrate --noinput
python manage.py collectstatic --noinput

# 6) 動作確認（ローカルバインド）
export $(grep -v '^#' /srv/trumee/.env | xargs) && \
  python manage.py runserver 127.0.0.1:8000
# -> 別シェルで: curl http://127.0.0.1:8000/api/v2/health/
```

### systemd（常駐）例
`/etc/systemd/system/trumee-backend.service`:
```
[Unit]
Description=Trumee Django Backend
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/srv/trumee/back
EnvironmentFile=/srv/trumee/.env
ExecStart=/srv/trumee/venv/bin/gunicorn back.wsgi:application --bind 127.0.0.1:8000 --workers 3 --timeout 120
Restart=always

[Install]
WantedBy=multi-user.target
```
有効化:
```
sudo systemctl daemon-reload
sudo systemctl enable --now trumee-backend
sudo systemctl status trumee-backend
```

### nginx 例（リバースプロキシ）
```
server {
  listen 80;
  server_name api.example.com;

  location / {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```
- TLS は `listen 443` + 証明書設定（Let’s Encrypt 等）を追加。
- `SECURE_SSL_REDIRECT=true` の場合、HTTPS → アプリに `X-Forwarded-Proto` が渡る必要あり（上記で対応）。

### Firewall / 接続要件
- Inbound: 80/443 を許可（nginx）。
- Outbound: Railway Postgres へ 5432/TCP の外向き接続を許可（通常はデフォルト許可）。

## フロントエンドの調整
- Vercel 継続の場合: Vercel の環境変数に `NEXT_PUBLIC_API_URL=https://api.example.com` を設定。
- VPS に移す場合: Node 18+ を用意し、`npm ci && npm run build && npm run start -p 3000` を PM2/systemd で常駐。CORS 設定に当該ドメインを追加。

## データベース運用（Railway）
- 移行時のデータコピーは不要（既存 Railway DB を継続利用）。
- 接続確認: `psql "$DATABASE_URL" -c '\\dt'` で到達性を確認。
- マイグレーション: VPS から `python manage.py migrate` を実行。
- バックアップ/スナップショット: Railway の機能を利用。

## トラブルシューティング
- 500 + DB 接続エラー: `DATABASE_URL` の誤り / `sslmode=require` 不足。`DATABASE_SSL_REQUIRE=true` は既定で有効。
- CORS/CSRF エラー: `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS` にドメイン未追加。
- 無限リダイレクト: `SECURE_SSL_REDIRECT=true` かつ `X-Forwarded-Proto` 未設定（nginx 設定を見直し）。

## チェックリスト
- [ ] `DJANGO_SECRET_KEY` 等の機密値を Xserver VPS に設定
- [ ] `DATABASE_URL` を Railway から取得/設定（TLS 有効）
- [ ] `ALLOWED_HOSTS` / `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS` にドメイン追加
- [ ] `migrate` / `collectstatic` 実行
- [ ] `systemd` + `nginx` 設定、HTTPS 化
- [ ] フロントの `NEXT_PUBLIC_API_URL` を新APIに切替

---
補足: env 駆動でホスト/オリジンを管理できるように `settings.py` をリファクタ可能です。必要なら対応します。
