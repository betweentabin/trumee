# 企業向けサービスモデル 実装状況まとめ（企業アカウント側）

本ドキュメントは、提示のサービスモデル/利用フローに対し、現状「できていること」と「未実装/要対応」を整理したものです。実装準備の観点で、関連ファイルと次アクションも併記します。

## 要約
- スカウト機能と求人票は実装済み。求職者側の履歴書サニタイズ表示も対応。
- クレジット（従量課金）でスカウト追加購入は実装済み（Stripe Webhook）。
- Cap制/チケット制/成果保証/面接日程の確定（スケジューラ連携）は未実装。

## 料金/課金モデル
- Cap制（20%/22%/25%選択・総コスト上限）
  - ステータス: 未実装
  - 備考: モデル・計算・請求ロジック未搭載。`plan_tier`はあるがCap概念なし（back/core/models.py:46）。

- チケット制（1チケット=「承諾+面接確定」/ 求人ごと / Cap到達で同数付与）
  - ステータス: 未実装
  - 備考: Ticket/Job単位の在庫・消費・繰越のモデルとAPI未実装。

- スカウト送信（初期無制限 → 月上限100通超は従量課金@100円〜）
  - ステータス: 部分実装
  - 現状: クレジット制（初期100通・不足時に100通追加購入=¥10,000）
    - クレジット残数: `User.scout_credits_total/used`（back/core/models.py:49-51）
    - 作成時に残数チェック/不足は402返却（back/core/views_api_v2.py:1374-1384）
    - 追加購入（Stripe Webhookで+100通）: （back/core/views_api_v2.py:2680以降）
  - 未対応: 「初期無制限」・「月次上限100通」のリセット・単価@100円のきめ細かい課金設計。

- 成果保証（Cap到達後は同数チケット追加/採用決定後の残チケット失効/同一求人再募集時の一部繰越）
  - ステータス: 未実装

## 利用フロー（企業アカウント）
1. 企業が求人票を登録（必須：職務要件・年収帯・勤務地）
   - 状態: 実装済み（必須要件のうち「年収帯」の必須化は未徹底）
   - モデル: `JobPosting`（back/core/models.py:432-453）
   - API: `JobPostingViewSet`（back/core/views_api_v2.py:1225）
   - シリアライザ: `JobPostingSerializer`（back/core/serializers.py:381）
   - 画面: 新規作成（frontend/app/company/jobs/new/page.tsx:1）
   - ギャップ: UI/バリデーションで「年収帯（salary_min/max）」が必須ではない。

2. サービス側で職務経歴書を添削（現在実施中）
   - 状態: 実装済み
   - 注釈/メッセージ: `Annotation`/`advice_messages`（back/core/models.py:610以降, back/core/views_api_v2.py:1528以降）
   - 管理画面からの添削UI/メッセージ送受信: frontend/app/admin/seekers/[id]/page.tsx:1

3. 企業がスカウト送信（個人情報マスキング/特定不可の状態で接触）
   - 状態: 実装済み（ブラウズ/詳細は匿名化・履歴書はサニタイズ）
   - 匿名表示: frontend/utils/anonymize.ts:1, SeekerCard（frontend/app/company/_component/seeker_card.tsx:1）
   - 企業向けサニタイズ履歴書API: company_view_user_resumes（back/core/views_api_v2.py:2238, 2270）
   - 検索/スカウト送信画面: frontend/app/company/page.tsx:1
   - 備考: 送信後のリストには `seeker_details` が含まれる（企業側の管理用途）。

4. 候補者が承諾 → 面接日程確定 → チケット消費
   - 状態: 部分実装（承諾はAPIあり/面接日程・チケット消費は未実装）
   - 承諾/閲覧: `Scouts.mark_viewed/respond`（back/core/views_api_v2.py:1428-1450）
   - 面接日程（スケジューラ/カレンダー連携）: 未実装
   - チケット消費: 未実装

5. Cap到達時：同数チケット追加（以後の企業コストは発生しない）
   - 状態: 未実装
   - 現状は「スカウトクレジット追加購入（Stripe）」のみ（back/core/views_api_v2.py:2680以降）

## 実装済み関連（参考ファイル）
- スカウトモデル/API/画面
  - モデル: `Scout`（back/core/models.py:510）
  - ViewSet: `ScoutViewSet`（back/core/views_api_v2.py:1267）
  - 企業側一覧: frontend/app/company/seekers-scouted/page.tsx:1
  - 求職者側一覧: frontend/app/scouts/page.tsx:1
- 求人
  - モデル: `JobPosting`（back/core/models.py:432）
  - 新規作成画面: frontend/app/company/jobs/new/page.tsx:1
- サニタイズ
  - 企業向け履歴書サニタイズ: back/core/views_api_v2.py:2238, 2270
- クレジット/課金
  - 残数チェック/不足時402: back/core/views_api_v2.py:1374
  - Stripe Webhookで+100通: back/core/views_api_v2.py:2680
  - ルーティング: back/core/urls_api_v2.py:75, 84-86

## 次アクション（実装準備）
- ドメイン設計
  - `Ticket`（求人単位の在庫、状態=未使用/予約済み/消費済み、発行元・繰越情報）
  - `JobContract`/`CapPlan`（求人単位のCap%/Cap上限金額/到達状態と付与ロジック）
  - `Interview`/`InterviewSlot`（候補日提案・確定・連絡ログ）
- バックエンド
  - チケット発行・消費API（承諾+面接確定時に消費）
  - Cap到達検知と「同数チケット自動付与」バッチ/トランザクション
  - 月次リセット付きのスカウト上限（100通）管理（`User`とは別で`CompanyMonthlyQuota`等）
  - 料金計算・請求書エクスポート（Cap上限/従量課金）
- フロントエンド
  - 求人作成フォームの「年収帯」必須化（バリデーション+UI）
  - 面接候補日提案・確定UI（個別スレッド/モーダル）
  - チケット残数/Cap状態の可視化（求人詳細/ダッシュボード）
- マイグレーション/移行
  - 既存`scout_credits_*`は当面併存可。将来的に月次上限/チケット設計へリプレース。

---
更新の要望があればこのファイルを継続更新します。
