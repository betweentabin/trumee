# Resume Truemee - 求人マッチングプラットフォーム

## 🚀 プロジェクト概要

Resume Truemeeは、求職者と企業をつなぐ高度なマッチングプラットフォームです。
Django REST FrameworkとNext.jsを使用した最新のWebアプリケーションです。

## 📋 主要機能

### 求職者向け機能
- ✅ ユーザー登録・ログイン
- ✅ プロフィール管理
- ✅ 履歴書作成（6ステップウィザード）
- ✅ 職歴管理
- ✅ 企業への応募
- ✅ スカウト受信

### 企業向け機能
- ✅ 企業登録・ログイン
- ✅ ダッシュボード
- ✅ 求職者検索
- ✅ スカウト送信
- ✅ 応募者管理
- ✅ メッセージング

## 🛠 技術スタック

### バックエンド
- Django 5.0.6
- Django REST Framework
- JWT認証
- SQLite（開発環境）
- Firebase（データ移行元）

### フロントエンド
- Next.js 15.3.5
- React 19
- Redux Toolkit + Redux Persist
- React Query (TanStack Query)
- Tailwind CSS
- TypeScript

## 📦 インストール & セットアップ

### 前提条件
- Python 3.10以上
- Node.js 18以上
- npm または yarn

### バックエンド設定

```bash
# リポジトリをクローン
git clone [repository-url]
cd resume_truemee_backup

# バックエンドディレクトリへ移動
cd back

# 仮想環境を作成・有効化
python3 -m venv venv_new
source venv_new/bin/activate  # Mac/Linux
# または
venv_new\Scripts\activate  # Windows

# 依存関係をインストール
pip install -r requirements.txt

# データベースマイグレーション
python manage.py migrate

# 管理者ユーザー作成
python create_superuser.py

# 開発サーバー起動（ポート4000）
./run_server.sh
# または
python manage.py runserver 0.0.0.0:4000
```

### フロントエンド設定

```bash
# 新しいターミナルで
cd frontend

# 依存関係をインストール
npm install

# 開発サーバー起動
npm run dev
```

## 🌐 アクセスURL

### 開発環境
- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:4000/api/v1/
- **Django管理画面**: http://localhost:4000/admin/

### デフォルト管理者アカウント
- Email: admin@example.com
- Password: admin123456

## 📁 プロジェクト構造

```
resume_truemee_backup/
├── back/                    # バックエンド（Django）
│   ├── back/               # Django設定
│   ├── core/               # メインアプリケーション
│   │   ├── models.py       # データモデル
│   │   ├── serializers.py  # シリアライザー
│   │   ├── views_api.py    # APIビュー
│   │   └── urls_api.py     # APIルーティング
│   ├── manage.py
│   ├── run_server.sh       # サーバー起動スクリプト
│   └── migrate_from_firebase.py  # データ移行スクリプト
│
└── frontend/               # フロントエンド（Next.js）
    ├── app/               # ページコンポーネント
    │   ├── auth/         # 認証関連
    │   │   ├── login/
    │   │   ├── register/
    │   │   └── step/     # 履歴書作成ステップ
    │   ├── company/      # 企業向け機能
    │   │   ├── dashboard/
    │   │   └── search/
    │   └── redux/        # Redux状態管理
    ├── hooks/            # カスタムフック
    │   └── useApi.ts    # API連携フック
    ├── lib/             # ライブラリ
    │   └── api-client.ts # APIクライアント
    └── components/      # 共通コンポーネント
```

## 🔑 API エンドポイント

### 認証
- `POST /api/v1/auth/register/` - ユーザー登録
- `POST /api/v1/auth/login/` - ログイン
- `POST /api/v1/auth/logout/` - ログアウト
- `POST /api/v1/auth/token/refresh/` - トークンリフレッシュ

### ユーザー管理
- `GET /api/v1/user/profile/` - プロフィール取得
- `PUT /api/v1/user/profile/` - プロフィール更新

### 履歴書
- `GET /api/v1/resumes/` - 履歴書一覧
- `POST /api/v1/resumes/` - 履歴書作成
- `GET /api/v1/resumes/{id}/` - 履歴書詳細
- `PUT /api/v1/resumes/{id}/` - 履歴書更新
- `DELETE /api/v1/resumes/{id}/` - 履歴書削除

### 応募・スカウト
- `GET /api/v1/applications/` - 応募一覧
- `POST /api/v1/applications/` - 応募作成
- `GET /api/v1/scouts/` - スカウト一覧
- `POST /api/v1/scouts/` - スカウト送信

## 🔄 データ移行

FirebaseからDjangoへのデータ移行：

```bash
cd back
source venv_new/bin/activate
python migrate_from_firebase.py
```

## 🧪 テスト

```bash
# バックエンドテスト
cd back
python manage.py test

# フロントエンドテスト
cd frontend
npm test
```

## 🚀 本番デプロイ

### 環境変数設定

`.env`ファイルを作成：

```env
# Django
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com

# Database (PostgreSQL推奨)
DATABASE_URL=postgresql://user:password@host:port/dbname

# Firebase
FIREBASE_CREDENTIAL_PATH=path/to/firebase-key.json
```

### 静的ファイル収集

```bash
python manage.py collectstatic
```

### Gunicorn起動

```bash
gunicorn back.wsgi:application --bind 0.0.0.0:8000
```

## 📝 ライセンス

This project is proprietary software.

## 👥 開発チーム

- Backend Development
- Frontend Development
- Database Architecture
- UI/UX Design

## 📞 お問い合わせ

プロジェクトに関するお問い合わせは、[連絡先メールアドレス]までお願いします。

---

## 🔧 トラブルシューティング

### よくある問題

1. **ポート4000が使用中の場合**
   ```bash
   # 使用中のポートを確認
   lsof -i :4000
   # プロセスを終了
   kill -9 [PID]
   ```

2. **マイグレーションエラー**
   ```bash
   # データベースをリセット
   rm db.sqlite3
   python manage.py migrate
   ```

3. **CORS エラー**
   - `back/settings.py`の`CORS_ALLOWED_ORIGINS`を確認
   - フロントエンドの`.env.local`の`NEXT_PUBLIC_API_URL`を確認

4. **npm install エラー**
   ```bash
   # キャッシュクリア
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

## 🎯 今後の開発予定

- [ ] 機械学習によるマッチング機能
- [ ] リアルタイムチャット
- [ ] ビデオ面接機能
- [ ] モバイルアプリ開発
- [ ] 多言語対応
- [ ] 通知システム強化