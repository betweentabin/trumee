# 実装状況の確認と編集計画（Admin/面接対策/匿名化/スカウト購入）

本ドキュメントでは、以下の要件について現状を確認し、未実装箇所の編集方針をまとめます。

- Admin 管理画面
  - 誰が職務経歴書を添削したかのフラグ
  - 面接対策の質問（項目・ジャンル）をこちら側で登録
  - 職務経歴書の内容に対する面接アドバイスをコメントで入れられる
  - 各ユーザー属性（年齢/登録日/課金日/最終ログイン等）の確認画面
- 企業アカウント
  - 求職者の職務経歴書の匿名化（氏名/電話/会社名は非表示、分野などは表示）
- 関連（前提）
  - 面接対策の一般質問/履歴書ベースの質問
  - 自己PRに関係する質問
  - スカウト件数の上限/追加購入（100通/¥10,000）

---

## 1. 実装状況（OK）

- 最終添削者フラグ（Annotation/履歴書アドバイス経由）
  - API で `last_reviewed_by / last_reviewed_by_name / last_reviewed_at` を返却
  - 参照: `back/core/views_api_v2.py:487`
  - 表示: `frontend/app/admin/seekers/[id]/page.tsx:1015`

- 面接対策の質問を管理側で登録（項目・ジャンル）
  - Django Admin で `InterviewQuestion` を管理
  - 参照: `back/core/admin.py:160`, `back/core/serializers.py:520`
  - API: カテゴリ/質問取得、パーソナライズ生成
    - `back/core/urls_api_v2.py:95`, `back/core/views_api_v2.py:160`
    - `back/core/urls_api_v2.py:96`, `back/core/views_api_v2.py:188`
    - `back/core/urls_api_v2.py:97`, `back/core/views_api_v2.py:216`
  - フロントでの閲覧: `frontend/components/interview/QuestionBrowser.tsx:1`

- 職務経歴書の内容に対する面接アドバイス（コメント/添削）
  - 注釈(Annotation) とメッセージの紐づけによるコメント/解決が可能
  - 参照: `back/core/models.py:580`, `back/core/serializers.py:445`, `back/core/views_api_v2.py:1508`
  - 画面: `frontend/app/resume-advice/review/page.tsx:869`, `frontend/app/resume-advice/review/page.tsx:919`

- 各ユーザー属性の確認（年齢/登録日/課金日/最終ログイン等）
  - 管理API: `admin_user_overview`
  - 参照: `back/core/urls_api_v2.py:42`, `back/core/views_api_v2.py:487`
  - 画面: `frontend/app/admin/seekers/[id]/page.tsx:980`

- 面接対策（一般/履歴書ベース/カテゴリ/AI生成）
  - 一般質問 + 履歴書ベースの派生質問の表示
  - 参照: `frontend/app/interview-advice/prepare-interview/page.tsx:248`, `frontend/components/interview/QuestionBrowser.tsx:130`, `back/core/views_api_v2.py:216`

- スカウト件数と追加購入の導線
  - ダッシュボードで残数/総数/使用数を表示
  - 上限到達時に追加100通購入を案内
  - 参照: `frontend/app/company/dashboard/page.tsx:109`, `frontend/app/company/page.tsx:345`, `frontend/app/companyinfo/payment/page.tsx:32`, `back/core/views_api_v2.py:1288`, `back/core/views_api_v2.py:1398`

---

## 2. 未対応/要修正

### 2.1 自己PRに関係する質問（誤配線）
- 現状:
  - `pr-questions` は志望理由画面へ転送し、面接タブを選択してしまうため「自己PRの質問」が出ない
  - `QuestionBrowser` が `type='self_pr'` を未サポート
- 影響箇所:
  - `frontend/app/interview-advice/pr-questions/page.tsx:1`
  - `frontend/app/interview-advice/applying-reasons/page.tsx:88`
  - `frontend/components/interview/QuestionBrowser.tsx:16`
  - トピック配列: `frontend/app/interview-advice/applying-reasons/page.tsx:47`

### 2.2 企業向け匿名化の不足（会社名などが見えるケース）
- 現状:
  - 企業向け履歴書一覧APIは `user_email` を除去するのみ
  - 経験 `experiences[*].company` や `extra_data` 内の氏名/電話等が残る可能性
- 影響箇所:
  - API: `back/core/views_api_v2.py:2238`
  - プレビュー: `frontend/components/modal/jobseeker-detail.tsx:1`, `frontend/components/pure/resume/preview.tsx:56`

### 2.3 スカウト追加購入（100通/¥10,000）の自動反映
- 現状:
  - Checkout の導線はあり
  - 決済成功後に `scout_credits_total` を増分する自動処理（Webhook など）が未実装
- 影響箇所:
  - Checkout 作成: `back/core/views_api.py:472`
  - 成功URL: `back/core/views_api.py:501`
  - 画面導線: `frontend/app/companyinfo/payment/page.tsx:18`

---

## 3. 編集計画（具体的変更案）

### 3.1 自己PRの質問を正規対応（self_pr タイプ）
- 目的: 「自己PRに関係する質問」を専用に表示し、面接タブや志望理由に混ざらないようにする
- 変更:
  - QuestionBrowser 拡張
    - `frontend/components/interview/QuestionBrowser.tsx:16`
      - `type?: 'interview' | 'resume'` → `type?: 'interview' | 'resume' | 'self_pr'`
      - 既存の `GET /interview/categories?type=...` / `GET /interview/questions?type=...` は type フィルタ対応済
  - ルーティング修正
    - `frontend/app/interview-advice/pr-questions/page.tsx:1`
      - 志望理由画面への転送をやめ、自己PR専用表示へ（例: 同ページで `QuestionBrowser type="self_pr"` を直描画、または applying-reasons に `focus=self_pr` を渡す）
    - `frontend/app/interview-advice/applying-reasons/page.tsx:88`
      - `focus=pr` の場合に `setSelectedTopic('self_pr')` を選択するよう修正
  - トピック表示の追加
    - `frontend/app/interview-advice/applying-reasons/page.tsx:47`
      - `topics` に `{ key: 'self_pr', label: '自己PR' }` を追加（投稿 payload の `topic` も 'self_pr'）

### 3.2 企業向け匿名化を API で強化（サニタイズ一元化）
- 目的: 会社名/氏名/電話/email などの特定可能情報を返さない
- 変更（サーバ）:
  - `back/core/views_api_v2.py:2238`（`company_view_user_resumes`）
    - 返却前に各レコードをサニタイズ:
      - `user_email` 削除（既存）
      - `experiences[*].company` を削除（または空文字）
      - `extra_data` 内の `firstName / lastName / phone / email / company` 相当キーを削除
      - 分野系（`business` など）は温存
    - 補助関数 `sanitize_resume_for_company(dict)` を用意し、今後の拡張に備え再利用可能に
- 変更（フロント・保険的対策）:
  - `frontend/components/modal/jobseeker-detail.tsx:1`
    - 企業画面では `histories` 生成時に `companyName` を渡さない（空へ）
  - `frontend/components/pure/resume/preview.tsx:56`
    - company が未指定時は「会社名」行が出ないため追加改修は不要（ダブルガード）

### 3.3 スカウト追加購入の自動反映（Stripe Webhook 推奨）
- 目的: 決済成功後に自動で `user.scout_credits_total += 100`
- 変更案:
  - Webhook 実装
    - `back/core/urls_api_v2.py` に `payments/webhook/` を追加
    - Webhook で `checkout.session.completed`/`invoice.payment_succeeded` を受信
    - `session.metadata.plan_type === 'credits100'` の場合、該当ユーザーの `scout_credits_total += 100` を更新
  - 代替（簡易）: 成功URLで `session_id` を元に Stripe API から `metadata.plan_type` を取得して更新
  - 任意: `ActivityLog` に `credit_purchase` を記録

### 3.4 「添削済み」バッジの UI 追加（任意強化）
- 目的: 一覧から添削済みが一目で分かるように
- 変更:
  - `back/core/views_api_v2.py:487` のレスポンスへ `reviewed: boolean`（Annotation または resume_advice が1件以上）を追加
  - `frontend/app/admin/seekers/[id]/page.tsx:980` 付近でバッジ表示

---

## 4. タスク一覧（チェックリスト）

- [ ] 自己PR: `QuestionBrowser` に `self_pr` 対応を追加（`frontend/components/interview/QuestionBrowser.tsx:16`）
- [ ] 自己PR: `pr-questions` ルートを自己PR専用表示へ修正（`frontend/app/interview-advice/pr-questions/page.tsx:1`）
- [ ] 自己PR: `focus=pr`→`self_pr` の切替（`frontend/app/interview-advice/applying-reasons/page.tsx:88`）
- [ ] 自己PR: `topics` に `self_pr` を追加（`frontend/app/interview-advice/applying-reasons/page.tsx:47`）
- [ ] 匿名化(API): `company_view_user_resumes` のサニタイズ実装（`back/core/views_api_v2.py:2238`）
- [ ] 匿名化(Front): 企業画面プレビューで会社名を渡さない（`frontend/components/modal/jobseeker-detail.tsx:1`）
- [ ] スカウト: Stripe Webhook 追加、`credits100` 決済成功時に +100（`back/core/urls_api_v2.py` 新規, ビュー追加）
- [ ] 任意: Admin UI に「添削済み」バッジを追加

---

## 5. 想定テスト

- 自己PR
  - `GET /api/v2/interview/categories?type=self_pr` でカテゴリが返る
  - `GET /api/v2/interview/questions?type=self_pr&category=...` で質問が返る
  - 画面「自己PRに関係する質問」に self_pr の質問が表示される

- 匿名化
  - 企業アカウントで `GET /api/v2/company/users/<user_id>/resumes/`
  - 返却 JSON に `user_email`/`experiences[*].company` や `extra_data` の PII が含まれない
  - 企業画面のプレビューに会社名が出ない（分野/事業内容は出る）

- スカウト追加購入
  - `credits100` の Checkout 完了後、自動で `scout_credits_total` が +100
  - ダッシュボードに反映（残数/総数/使用数）

---

## 6. メモ

- Admin 側の質問管理は Django Admin で運用可能（CSV 取り込みコマンドも既存）
- 将来的に匿名化ルールを拡張する場合、サーバ側サニタイズ関数に寄せると保守が容易

