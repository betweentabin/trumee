# ボタンエラー報告書

## 概要
企業ページと求職者ページのボタン操作時に発生するエラーをまとめました。

## 1. API基本的な問題

### 1.1 Health Check エラー
- **エンドポイント**: `/api/v2/health/`
- **エラー**: `AttributeError: module 'datetime' has no attribute 'now'`
- **原因**: `datetime.now()` の代わりに `datetime.datetime.now()` を使う必要がある
- **ファイル**: `back/core/views_api_v2.py:75`

## 2. 企業ページのエラー

### 2.1 実装されていないエンドポイント (404エラー)
以下のエンドポイントがすべて404エラーになっています：

| エンドポイント | 説明 | メソッド |
|------------|------|--------|
| `/api/v2/company/dashboard/` | 企業ダッシュボード | GET |
| `/api/v2/company/profile/` | 企業プロフィール | GET |
| `/api/v2/company/scouts/` | スカウトリスト | GET |
| `/api/v2/company/applications/` | 応募者リスト | GET |
| `/api/v2/company/search/seekers/` | 求職者検索 | GET |
| `/api/v2/company/scouts/create/` | スカウト作成 | POST |
| `/api/v2/company/payment-info/` | 支払い情報 | GET |
| `/api/v2/company/profile/update/` | プロフィール更新 | PUT |

### 2.2 フロントエンドのボタン
企業ページで使用されているボタン（`frontend/app/company/`）:
- **応募者詳細ボタン** (`seekers-applied/appliedcard.tsx:89`)
- **応募承認ボタン** (`seekers-applied/appliedcard.tsx:99`)
- **応募拒否ボタン** (`seekers-applied/appliedcard.tsx:106`)
- **ダッシュボードタブ切り替え** (`dashboard/page.tsx:136-153`)

## 3. 求職者ページのエラー

### 3.1 実装されていないエンドポイント (404エラー)
以下のエンドポイントがすべて404エラーになっています：

| エンドポイント | 説明 | メソッド | ステータス |
|------------|------|--------|---------|
| `/api/v2/profile/me/` | ユーザープロフィール | GET | 401 (認証エラー) |
| `/api/v2/seeker/profile/` | 求職者プロフィール | GET | 404 |
| `/api/v2/seeker/profile/update/` | プロフィール更新 | PUT | 404 |
| `/api/v2/seeker/resumes/` | 履歴書リスト | GET | 404 |
| `/api/v2/seeker/resumes/create/` | 履歴書作成 | POST | 404 |
| `/api/v2/seeker/experiences/` | 職歴リスト | GET | 404 |
| `/api/v2/seeker/experiences/create/` | 職歴追加 | POST | 404 |
| `/api/v2/seeker/education/` | 学歴リスト | GET | 404 |
| `/api/v2/seeker/education/create/` | 学歴追加 | POST | 404 |
| `/api/v2/seeker/applications/` | 応募履歴 | GET | 404 |
| `/api/v2/seeker/scouts/` | 受信スカウト | GET | 404 |
| `/api/v2/seeker/applications/create/` | 求人応募 | POST | 404 |
| `/api/v2/dashboard/stats/` | ダッシュボード統計 | GET | 401 (認証エラー) |
| `/api/v2/search/jobs/` | 求人検索 | GET | 404 |
| `/api/v2/seeker/settings/` | アカウント設定 | GET | 404 |
| `/api/v2/seeker/settings/password/` | パスワード変更 | POST | 404 |

### 3.2 認証エラー
- `/api/v2/profile/me/` と `/api/v2/dashboard/stats/` で「Token is invalid or expired」エラーが発生
- JWTトークンの検証処理に問題がある可能性

## 4. ユーザープロフィールページ (`/users/[userId]`)

### 4.1 使用されているAPIエンドポイント
実際にフロントエンドで使用されているエンドポイント：

| エンドポイント | 用途 | ファイル:行 |
|------------|------|----------|
| `/users/${userId}/` | プロフィール取得・更新 | `users/[userId]/page.tsx:122` |
| `/users/${userId}/privacy/` | プライバシー設定更新 | `users/[userId]/page.tsx:139` |

### 4.2 実装済みエンドポイント
`back/core/urls_api_v2.py` に以下が実装されています：
- `path('users/<uuid:user_id>/', views_api_v2.user_public_profile, name='user-public-profile')`
- `path('users/<uuid:user_id>/privacy/', views_api_v2.user_privacy_settings, name='user-privacy-settings')`

## 5. 修正が必要な箇所

### 5.1 緊急度: 高
1. **datetime エラーの修正** (`back/core/views_api_v2.py:75`)
   - `datetime.now()` → `datetime.datetime.now()` に変更

2. **JWT認証の修正**
   - トークンの検証ロジックを確認
   - `/api/v2/profile/me/` の401エラーを解決

### 5.2 緊急度: 中
1. **企業向けAPIの実装**
   - ダッシュボード、プロフィール、スカウト管理など
   - 全8エンドポイント

2. **求職者向けAPIの実装**
   - プロフィール、履歴書、応募管理など
   - 全16エンドポイント

### 5.3 緊急度: 低
1. **エラーハンドリングの改善**
   - フロントエンドでの適切なエラー表示
   - APIレスポンスの統一化

## 6. テスト用アカウント
以下のアカウントでテスト可能：
- **求職者**: tanaka@example.com / user123
- **企業**: hr@techcorp.jp / company123
- **管理者**: admin@truemee.jp / admin123

## 7. 推奨される次のステップ

1. **datetime エラーを即座に修正**
2. **JWT認証の問題を調査・修正**
3. **最も使用頻度の高いエンドポイントから順次実装**：
   - 求職者: プロフィール表示・更新
   - 企業: ダッシュボード、求職者検索
4. **実装済みエンドポイントのテストを追加**
5. **APIドキュメントの作成**