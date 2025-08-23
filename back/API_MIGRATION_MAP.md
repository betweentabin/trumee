# API移行マッピング表

## Firebase/レガシーAPI → REST API 対応表

| レガシーAPI | メソッド | REST API | メソッド | 状態 |
|------------|---------|----------|---------|------|
| `/api/auth/register/` | POST | `/api/v1/auth/register/` | POST | ✅ 実装済み |
| `/api/auth/login/` | POST | `/api/v1/auth/login/` | POST | ✅ 実装済み |
| `/api/auth/company/register/` | POST | `/api/v1/auth/register/` | POST | ✅ 統合済み（roleフィールドで区別） |
| `/api/seekers/savehistory/` | POST | `/api/v1/experiences/` | POST | ✅ ViewSetで実装済み |
| `/api/auth/save-resume/` | POST | `/api/v1/resumes/` | POST | ✅ ViewSetで実装済み |
| `/api/seeker/profile/` | GET | `/api/v1/seeker-profiles/{id}/` | GET | ✅ ViewSetで実装済み |
| `/api/auth/history/` | GET | `/api/v1/experiences/` | GET | ✅ ViewSetで実装済み |
| `/api/update-password/` | POST | `/api/v1/user/profile/` | PATCH | ✅ UserProfileViewで実装済み |
| `/api/payment/` | POST | `/api/v1/payments/` | POST | ✅ ViewSetで実装済み |
| `/api/get-resume-data/` | GET | `/api/v1/resumes/` | GET | ✅ ViewSetで実装済み |
| `/api/userinfo/` | GET | `/api/v1/user/profile/` | GET | ✅ 実装済み |
| `/api/business/searchseekers/` | GET | `/api/v1/search/seekers/` | GET | ✅ 実装済み |
| `/api/search/company/` | GET | `/api/v1/search/companies/` | GET | ❌ 要実装 |
| `/api/seeker/apply/` | POST | `/api/v1/applications/` | POST | ✅ ViewSetで実装済み |
| `/api/seeker/apply/cancel/` | DELETE | `/api/v1/applications/{id}/` | DELETE | ✅ ViewSetで実装済み |
| `/api/seeker/scout/` | POST | `/api/v1/scouts/` | POST | ✅ ViewSetで実装済み |
| `/api/seeker/scout/cancel/` | DELETE | `/api/v1/scouts/{id}/` | DELETE | ✅ ViewSetで実装済み |
| `/api/message/tocompany/` | POST | `/api/v1/messages/` | POST | ✅ ViewSetで実装済み |
| `/api/message/touser/` | POST | `/api/v1/messages/` | POST | ✅ ViewSetで実装済み |
| `/api/fetch/companydata/` | GET | `/api/v1/companies/{id}/` | GET | ❌ 要実装 |
| `/api/save/companyinfo/` | POST | `/api/v1/user/profile/` | PATCH | ✅ UserProfileViewで実装済み |
| `/api/business/scout/` | GET | `/api/v1/scouts/` | GET | ✅ ViewSetで実装済み |
| `/api/business/search/applied_users/` | GET | `/api/v1/applications/` | GET | ✅ ViewSetで実装済み |
| `/api/create-checkout-session/` | POST | `/api/v1/payments/checkout/` | POST | ❌ 要実装 |
| `/api/admin/seekers/` | GET | `/api/v1/admin/seekers/` | GET | ❌ 要実装 |
| `/api/seekers/detail/` | GET | `/api/v1/seeker-profiles/{id}/` | GET | ✅ ViewSetで実装済み |
| `/api/message/` | POST | `/api/v1/messages/` | POST | ✅ ViewSetで実装済み |
| `/api/message/reply/` | POST | `/api/v1/messages/` | POST | ✅ ViewSetで実装済み |
| `/api/get_all_message/` | GET | `/api/v1/messages/` | GET | ✅ ViewSetで実装済み |

## 必要な追加実装

1. **企業検索API** (`/api/v1/search/companies/`)
2. **企業詳細API** (`/api/v1/companies/{id}/`)
3. **Stripe Checkout Session API** (`/api/v1/payments/checkout/`)
4. **管理者用求職者一覧API** (`/api/v1/admin/seekers/`)

## 削除対象ファイル

- `/back/core/firebase.py` - Firebase設定
- `/back/core/views.py` - レガシーAPIビュー（バックアップ済み）
- `/back/migrate_from_firebase.py` - Firebase移行スクリプト
- `/back/firebase_key.json` - Firebase認証キー

## フロントエンド変更必要箇所

すべてのAPI呼び出しを以下のパターンに変更：
- 旧: `http://localhost:8000/api/{endpoint}`
- 新: `http://localhost:8000/api/v1/{endpoint}`

認証ヘッダーの統一：
- `Authorization: Bearer {token}` (JWT認証)