# 回収実装計画: 履歴書・自己PR・面接対策（管理画面 + Gemini 連携）

## 進捗チェック（随時更新）
- [x] モデル追加（InterviewQuestion / PromptTemplate）
- [x] Django Admin 登録（質問マスタ/テンプレート）
- [x] CSV 取込コマンド（import_interview_questions）
- [x] 質問票CSVの取り込み（プルダウンリスト＿truemee - 質問票.csv → 99件反映）
- [x] Gemini クライアント（backend, core/ai/gemini.py）
- [x] API v2: カテゴリ/一覧/パーソナライズ/テンプレ適用
- [x] Front: /interview/3 にパーソナライズ質問の組込み
- [x] Front: /interview/2 にマスタ/パーソナライズ質問の組込み
- [x] Front: カテゴリ選択UIとAPI駆動への全面刷新（/interview に実装）

---

## 実装まとめ（2025-09-25）

本日実装したユーザー向け面接アドバイス強化と企業向けスカウト上限機能の概要です。

1) 面接アドバイス（履歴書内容の反映）
- 職務経歴書に関する質問: 履歴書の workExperiences / skills / self_pr から「要点サマリ（上位経験・スキル・自己PR抜粋）」と「想定質問」を自動生成して表示。
  - 変更: `frontend/app/interview-advice/resume-questions/page.tsx`
- 自己PR: 履歴書の自己PRとスキルを読み込み、自己PRに紐づく想定質問を動的生成して提示。
  - 変更: `frontend/app/interview-advice/pr-questions/page.tsx`
- 面接対策: 一般的な想定質問＋履歴書由来の質問に対する回答のローカル保存（再訪時に自動復元）。
  - 変更: `frontend/app/interview-advice/prepare-interview/page.tsx`

2) 企業アカウント（スカウト送信上限/追加購入導線）
- DB: User にスカウトクレジットを追加（初期100）。
  - 変更: `back/core/models.py`、マイグレーション `back/core/migrations/0008_add_scout_credits_to_user.py`
- API: スカウト作成時に残数チェック→0ならHTTP 402 + 購入URLを返却。送信成功時に使用数をインクリメント。ダッシュボード統計に残数情報を追加。
  - 変更: `back/core/views_api_v2.py`（`ScoutViewSet.create` / `dashboard_stats_v2`）
  - 変更: `back/core/serializers.py`（User に残数フィールド追加）
- Front: スカウト送信で402受信時にトースト＋`/companyinfo/payment` へ誘導。ダッシュボードに残数/累計送信を表示。
  - 変更: `frontend/app/company/page.tsx`、`frontend/app/company/dashboard/page.tsx`

3) 併せて反映済みの改善（別件）
- PDF 出力に枠線とセクション罫線を追加: `back/api_v2/views/resume_views.py`
- 企業向け求職者表示の匿名化（氏名/メール非表示）: `frontend/app/company/_component/seeker_card.tsx`、`.../seekers-scouted/usercard.tsx`、`components/modal/jobseeker-detail.tsx`
- 企業が求職者履歴書を参照する新API（公開/サニタイズ済）: `back/core/urls_api_v2.py`、`back/core/views_api_v2.py`、`frontend/lib/api-v2-client.ts`
- 企業ヘッダーのロゴ差し替え: `frontend/components/company/header.tsx`
- プレミアムプラン価格 60,000 → 50,000: `frontend/config/plans.ts`

4) デプロイ/運用メモ
- DBマイグレーション必須（`0008_add_scout_credits_to_user.py`）。
- 追加100通（¥10,000）の購入完了でクレジット加算する処理は要実装（Stripe完了Webhook→ユーザの `scout_credits_total += 100`）。
- 履歴書未作成ユーザーのときは面接アドバイスページが空になるケースがあるため、UIで誘導済（作成導線）。

---

## 残タスク（洗い出し）
- [x] Front: 面接対策のカテゴリ選択UI（/interview トップなど）をAPI駆動に刷新
- [x] Front: 難易度バッジ/タグフィルタの追加（`/interview/questions` クエリ対応）
- [ ] Admin: PromptTemplateのプレビューUI（任意のResumeで `{}` 埋め込みプレビュー）
- [ ] 設定: 本番・ステージング環境への `GEMINI_API_KEY` セットと動作確認
- [ ] 運用: レート制限/ログ監視の設定（Gemini呼び出し、生成回数制限）
- [ ] QA: 履歴書未作成ユーザー時のパーソナライズ挙動/エラーハンドリング確認

## 目的
- 管理者ページから「職務経歴書（履歴書）内容を反映した」テンプレートや質問を登録・管理できるようにする。
- 自己PRに関する質問も、履歴書内容を反映して管理者が登録・配信できるようにする。
- 面接対策は「プルダウンリストの質問票」（既存CSV）をマスタ化して表示し、さらにGeminiで個別最適化（パーソナライズ）された質問を生成できるようにする。
- 既存のNext.js側 Gemini プロキシ（/api/gemini/apply）を活用しつつ、必要に応じてDjango側からもGemini呼び出し可能な構成に拡張する。

## 現状把握（主要箇所）
- Backend
  - モデル: `core.models.Resume`, `Experience`, `Education`, `Certification` 等が実装済み。
  - 管理画面: `core.admin.ResumeAdmin` で履歴書の閲覧/編集可。質問マスタは未実装。
  - API v2: `ResumeViewSet`（作成/更新/完全度チェック）、`ResumeFileViewSet` 等あり。質問関連のAPIは未実装。
- Frontend
  - 面接・志望理由系UI: `frontend/app/interview/*`, `frontend/app/interview-advice/applying-reasons/page.tsx` が存在。
  - Gemini プロキシ: `frontend/app/api/gemini/apply/route.ts`（志望理由生成）。
  - 現状、面接質問は静的/簡易導出。プルダウンCSVの取り込みは未実装。

---

## 全体アーキテクチャ方針
- 質問マスタやテンプレートはDjango（DB）で一元管理（管理画面から登録/編集/CSVインポート）。
- フロントはAPI v2経由で「質問一覧」「カテゴリ」「テンプレート適用結果」を取得して表示。
- Gemini連携は以下の2経路を用意：
  1) ユーザー向けインタラクティブ生成は既存のNextルート（/api/gemini/...）を継続利用。
  2) 管理者向けの一括生成/自動反映やサーバーサイド処理はDjangoからRESTでGemini APIを呼ぶ軽量クライアントを実装。

---

## Backend 追加実装（モデル/管理/サービス）

### 1) データモデル追加（質問マスタ + テンプレート）
- InterviewQuestion（面接/自己PR/履歴書関連を包括的に扱う）
  - id: UUID
  - type: str enum（`interview` | `self_pr` | `resume` | `motivation` など）
  - category: str（大分類: basic/motivation/experience/personality/teamwork/future/stress 等。CSVが持つ分類に合わせる）
  - subcategory: str（任意、中分類）
  - text: Text（質問本文）
  - answer_guide: Text（任意、回答のポイント/ヒント）
  - difficulty: str enum（easy | medium | hard）
  - tags: JSON[List[str]]（技術スタック/職種等）
  - locale: str（既定 `ja-JP`）
  - is_active: bool（公開フラグ）
  - source: str（`csv`, `manual`, `ai` など）
  - created_at/updated_at

- QuestionCategory（任意・将来拡張）
  - key: str（`motivation` 等） / label: str（日本語表示名） / order: int

- PromptTemplate（履歴書/自己PRのテンプレート）
  - id: UUID
  - name: str
  - target: str enum（`self_pr` | `resume_summary` | `apply_reason` 等）
  - template_text: Text（Jinja2風 or `{}` フォーマット想定）
  - description: Text（管理者向け説明）
  - is_active: bool

- PersonalizedSet（任意：ユーザーに配る個別質問セットを保持）
  - id: UUID
  - user: FK(User)
  - resume: FK(Resume, nullable)
  - type: str（`interview` | `self_pr`）
  - items: JSON[List[QuestionRef or 文]]（確定配布リスト）
  - generated_by: str（`rules` | `gemini` | `admin`）
  - created_at

備考: MVPでは InterviewQuestion + PromptTemplate だけでも運用可能。PersonalizedSet は段階導入。

### 2) 管理画面（Django Admin）
- InterviewQuestion 管理
  - list_display: type, category, difficulty, is_active, updated_at
  - フィルタ/検索: type, category, difficulty, text, tags
  - CSVインポート管理アクション（後述のManagement Commandと併用）
- PromptTemplate 管理
  - プレビュー機能: 任意のResumeを選択してテンプレートのプレビュー（サーバー側で `{}` プレースホルダに `resume`/`experiences`/`skills` などを差し込み）

### 3) CSV 取り込み（プルダウンリストの質問票）
- Management Command: `python manage.py import_interview_questions --file <path> --encoding cp932`
  - 文字化け対策として `cp932`/`shift_jis` を選択可に。
  - カラムマッピングは事前にCSVのヘッダを確認して設定（例: category, subcategory, question_text, answer_guide, difficulty）。
  - 重複排除（テキスト + カテゴリ + 難易度でユニーク相当のハッシュを生成）
  - 取り込み結果のログ出力。

### 4) Gemini クライアント（Django 内）
- `core/ai/gemini.py`（新規）
  - 環境変数 `GEMINI_API_KEY` を読み取り、RESTで `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent` を呼ぶ薄いユーティリティ。
  - 引数: prompt(str), generationConfig(dict 可), safetySettings(任意)
  - 返り値: 生成テキスト（最初の候補を安全に抽出）
- `settings.py` に `GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')` を追加（漏えい防止のためENV必須）。

### 5) パーソナライズロジック（MVP）
- 履歴書（Resume + extra_data + experiences）をコンテキストに整形。
- ルール選定: 職種/スキル/経験年数/実績の有無に応じて InterviewQuestion をフィルタ/スコアリング。
- Gemini補助: 上記コンテキスト + 既存質問例をプロンプトに渡し、追加の個別質問を3〜5件生成（プレースホルダを埋めた状態で生成）。

---

## Backend 追加実装（API v2）
- Router: `core/urls_api_v2.py`
- ViewSet/Views（DRF）
  - `GET /api/v2/interview/questions/` 質問マスタ一覧（クエリ: type, category, difficulty, tags, limit）
  - `GET /api/v2/interview/categories/` カテゴリ一覧（固定/DBいずれでも）
  - `POST /api/v2/interview/personalize/` 入力: resume_id（任意）/ type / limit
    - ルール + Gemini で質問セットを返す（`{ items: [{text, category, difficulty, tips}], source }`）。
  - `POST /api/v2/templates/render/` 入力: template_id / resume_id
    - PromptTemplate をサーバーでレンダリングして返す（自己PR/要約など）。

レスポンス例（personalize）:
```json
{
  "items": [
    {"text": "直近のプロジェクトでの役割と成果は？", "category": "experience", "difficulty": "medium", "tips": ["STARで簡潔に", "数値・具体例"]},
    {"text": "あなたの強みを具体例と共に教えてください", "category": "personality", "difficulty": "medium"}
  ],
  "source": "gemini+rules"
}
```

---

## Frontend 追加実装
- 面接対策ページ（`frontend/app/interview/2`, `.../3`）
  - 静的リストを撤廃し、`/api/v2/interview/categories` と `/api/v2/interview/questions` を使用。
  - 「質問を生成」ボタンで `/api/v2/interview/personalize` を叩いてパーソナライズ質問を表示。
- 志望理由/自己PR生成
  - 既存 `/api/gemini/apply` を維持。
  - （任意）`/api/gemini/questions` を追加して、履歴書コンテキストから「質問だけ」を生成するUI補助を実装。
- 表示/操作
  - カテゴリフィルタ・難易度バッジ・完了トラッキングは現行UIを踏襲。

---

## セキュリティ/権限
- 管理系（質問マスタ/テンプレート/CSV取込）は Django Admin 上で `is_staff`/`is_superuser` のみ許可。
- 一般ユーザーは自分の履歴書に基づく質問の取得のみ。
- Gemini APIキーはサーバーサイド環境変数で保持（フロントに露出しない）。

## 運用・ログ/監視
- CSV取込ログ（作成/更新/スキップ件数）
- Gemini呼び出しのレート/エラー監視（429/5xx）
- 将来的にレート制限導入（ユーザーごとの生成回数上限）

---

## ロールアウト手順
1) Backend
   - モデル/マイグレーション追加（InterviewQuestion, PromptTemplate, 可能ならQuestionCategory）
   - Admin 登録 + CSV取込コマンド追加
   - API v2 に質問エンドポイント追加 + Geminiクライアント実装
2) Frontend
   - 面接対策UIでカテゴリ/質問の取得にAPIを使用
   - 「質問生成」導線を追加（/api/v2/interview/personalize）
3) 設定
   - `GEMINI_API_KEY`（Django/Next 環境に設定）
   - 既存CSVを本番/ステージングに投入（cp932注意）
4) QA
   - 履歴書の有無での挙動
   - カテゴリ/難易度/タグ絞り込み
   - Gemini生成の日本語品質と禁止トピック対策（プロンプトで制約）

---

## スケジュール（目安）
- Day 1: モデル/管理画面/CSV取込（MVP）
- Day 2: API v2 実装 + Geminiクライアント
- Day 3: フロント連携・動作確認・文言調整（/interview/2, /interview/3 DONE）
- Day 4: カテゴリUI/詳細ページなどのAPI駆動刷新（残）

---

## 未確定事項（要確認）
- プルダウンCSVの確定カラム名/分類体系（カテゴリ・難易度の付与基準）
- 自己PR質問と面接質問の分類境界（両方に跨る設問の扱い）
- PersonalizedSet を永続化するか、都度生成に留めるか（履歴/再現性）
- Gemini使用上限/コスト管理（1ユーザーあたり/日）

---

## 参考（既存コード）
- Gemini プロキシ: `frontend/app/api/gemini/apply/route.ts:1`
- 面接UI: `frontend/app/interview/2/page.tsx:1`, `frontend/app/interview/3/page.tsx:1`
- 履歴書API: `back/core/views_api_v2.py:586`（ResumeViewSet）
- 管理画面: `back/core/admin.py:47`

---

本計画はMVP優先で、DBマスタ化→API→UI→Gemini個別化の順に段階導入します。要件確定後、モデル/CSVマッピングを確定し着手します。
