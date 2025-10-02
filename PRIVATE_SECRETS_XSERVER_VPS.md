# Xserver VPS プライベート値（極秘・非公開）

このファイルは運用用の機密値メモです。必ずリポジトリを非公開のまま運用し、第三者に共有しないでください。公開リポジトリに含めないでください。

## 機密値（提供どおり記録）
- DJANGO_SECRET_KEY: `-!q^-5_t&1pr-@^-8`
- DATABASE_URL: `postgresql://postgres:xnLQXexUdAtzOwMlBLLinBHizhkmFkTM@tramway.proxy.rlwy.net:48214/railway`
- GEMINI_API_KEY: `AIzaSyBGsBxcBlUPe5MAOgKU6McqvdWlO8E3cCg`

## 参考（.env 例: Xserver VPS 用）
```
# 本番向け推奨
DEBUG=False
ENABLE_PROD_SECURITY=true
SECURE_SSL_REDIRECT=true

DJANGO_SECRET_KEY=-!q^-5_t&1pr-@^-8
DATABASE_URL=postgresql://postgres:xnLQXexUdAtzOwMlBLLinBHizhkmFkTM@tramway.proxy.rlwy.net:48214/railway
GEMINI_API_KEY=AIzaSyBGsBxcBlUPe5MAOgKU6McqvdWlO8E3cCg

# メールリンク等に使用（必要に応じて）
FRONTEND_URL=https://trumeee.vercel.app
```

注意:
- 機密値は環境変数で読み込む前提です。`back/back/settings.py` は `DATABASE_URL` を優先して利用します。
- このファイルはメモ用途です。配布・共有は禁止。必要なら SOPS などで暗号化管理を検討してください。
