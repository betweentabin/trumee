# 機能ステータス（できていること / 未対応）

このドキュメントは、提示事項の実装状況を整理し、対応内容と確認箇所（ファイル/パス）をまとめたものです。必要に応じて継続的に更新します。

## 1) 職務経歴書 PDF フォーマットに罫線を追加
- ステータス: 対応済み
- 内容: PDFにページ枠（薄い枠）とセクション見出し下の罫線を追加済み
- 確認ファイル: `back/api_v2/views/resume_views.py`
  - ページフレーム: `_draw_page_frame`
  - セクション線: `HRFlowable` を各セクション直後に挿入

## 2) 企業アカウント > 求職者の検索 > 求職者の一覧
- ステータス: 対応済み（正式画面へ統合）
- 内容: 企業向けの検索・一覧は `company` 直下の画面で提供。旧 `business/search` は正式画面へリダイレクトするよう修正。
- 確認ファイル:
  - 本体: `frontend/app/company/page.tsx`
  - 旧ページのリダイレクト: `frontend/app/business/search/page.tsx`

## 3) 企業アカウント 左上のロゴが運営会社ロゴになっている
- ステータス: 修正済み
- 内容: 企業ヘッダーのロゴを製品ロゴ（`/logo/logo.png`）に変更
- 確認ファイル: `frontend/components/company/header.tsx`

## 4) 企業アカウント > 支払情報 「データを登録しない」が残っている → 不要
- ステータス: 不要項目なし（Stripeのみで管理）
- 内容: 現状、カード情報は当サイトで保存せず、Stripeのチェックアウトのみを案内。余計なトグル等は存在しません。
- 確認ファイル:
  - 企業: `frontend/app/companyinfo/payment/page.tsx`
  - 一般ユーザー: `frontend/app/users/myinfo/payment/page.tsx`

## 5) マイページ > 有料プラン > Stripe 連携ができない
- ステータス: 実装済み（要環境変数の設定）
- 内容: バックエンドのチェックアウト作成APIとフロントのプラン購入導線は実装済み。StripeのシークレットキーおよびPrice IDの環境変数設定が必要。
- バックエンド設定:
  - `back/back/settings.py`: `STRIPE_SECRET_KEY` を設定
  - エンドポイント: `back/core/urls_api_v2.py` → `payments/checkout/`（ハンドラ: `back/core/views_api.py:create_stripe_checkout_session`）
- フロント設定:
  - プラン定義: `frontend/config/plans.ts`（`NEXT_PUBLIC_STRIPE_PRICE_*` を使用）
  - 企業プラン画面: `frontend/app/company/paid-plan/page.tsx`
  - 企業/ユーザーの決済導線: `frontend/app/companyinfo/payment/page.tsx`, `frontend/app/users/myinfo/payment/page.tsx`
- 必要な環境変数例:
  - サーバー: `STRIPE_SECRET_KEY`
  - フロント: `NEXT_PUBLIC_STRIPE_PRICE_COMPANY_STARTER|STANDARD|PREMIUM` ほか必要分

## 6) マイページ 有料プラン 価格 60000 → 50000
- ステータス: 反映済み
- 内容: プレミアムプランは既に 50,000 円で定義
- 確認ファイル: `frontend/config/plans.ts`（`price: 50000`）

## 7) Admin 管理画面 各ユーザーが作成した職務経歴書が表示されない
- ステータス: 表示可能（確認・補強済み）
- 内容:
  - 管理者用の履歴書一覧API: `GET /api/v2/admin/users/{user_id}/resumes/`
  - 管理画面の詳細ページで上記を利用し、プレビューを表示
- 確認ファイル:
  - API: `back/core/views_api_v2.py:473`（`admin_user_resumes`）
  - フロント: `frontend/app/admin/seekers/[id]/page.tsx`（`fetchResumePreview` 経由）

## 8) Admin 管理画面 誰が職務経歴書を添削したのかフラグ
- ステータス: 追加実装済み
- 内容:
  - 管理者向け概要APIに「最終添削者（名前/ID/時刻）」を追加
  - 画面の「会員情報」タブに表示
- 確認ファイル:
  - API: `back/core/views_api_v2.py`（`admin_user_overview` に `review.*` を追加）
  - フロント: `frontend/app/admin/seekers/[id]/page.tsx`（memberタブに表示）

## 9) Admin 職務経歴書 面接アドバイスでコメントを入れられるように
- ステータス: 実装済み
- 内容:
  - メッセージAPI: `advice_messages`（subjectで種別切替: `resume_advice`/`advice`/`interview`）
  - 注釈API: `advice_annotations`（本文中のハイライトにひも付け可能）
  - 画面: 添削・面接タブから送受信
- 確認ファイル:
  - API: `back/core/views_api_v2.py:1351` 以降
  - フロント: `frontend/app/admin/seekers/[id]/page.tsx`, `frontend/components/admin/SeekerTabs.tsx`

## 10) Admin 各ユーザー属性確認（年齢・登録日・課金日・最終ログイン）
- ステータス: 追加実装済み
- 内容:
  - 概要APIに `attributes` を追加（`age`, `registered_at`, `last_login_at`, `last_payment_at`）
  - 画面の「会員情報」タブで表示
- 確認ファイル:
  - API: `back/core/views_api_v2.py`（`admin_user_overview`）
  - フロント: `frontend/app/admin/seekers/[id]/page.tsx`

---

# 補足 / 次アクション
- Stripe連携の本番稼働には、環境変数（サーバーの `STRIPE_SECRET_KEY`、フロントの Price ID 群）の設定が必要です。
- 旧 `business/search` は正式ページへ誘導するためのリダイレクトのみ残しています。直接の検索・一覧は `company` 直下の画面をご利用ください。
- 管理画面の最終添削者は、注釈（`Annotation.created_by`）と履歴書添削メッセージ（`Message.subject='resume_advice'` の管理者送信）を比較し、最新の方を表示します。
