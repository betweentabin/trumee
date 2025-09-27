# 職務経歴書コメント（Word風注釈）実装計画

目的: Wordの「コメント」体験をWeb上で再現し、どのテキストに対する指摘かが一目で分かるUIを提供する。既存のメッセージ（Message）テーブルを流用したまま、注釈（Annotation）を新設してメッセージと連携する。

---

## ゴール（UI要件）
- 対象テキストをドラッグ選択→マウスアップでコメント入力ポップオーバーが出る。 [済/暫定]
- コメント送信で右側に吹き出しが表示され、細いコネクタ線で対象箇所と結ばれる。
- 対象テキストがハイライト（背景色 or 下線付き）される。
- コメント吹き出しにはユーザー種別（A/S）、作成者、作成時刻、返信/解決アクションがある。
- 既存のチャット一覧にも本文が投稿される（注釈のメタとは別に本文のみ表示）。

---

## 既存の下準備（実装済み/暫定）
- [x] プレビュー内のアンカー付与（`data-annot-id`）: 職務要約/自己PR/職務内容 参照: `frontend/components/pure/resume/preview.tsx`
- [x] 選択→ポップオーバー→送信（既存APIにメタ付与で暫定保存）: 参照: `frontend/app/resume-advice/review/page.tsx` 他
- [x] 入力欄クリックで閉じないようイベント遮断を追加
- [x] `/users/[userId]/resume-advice/review` で対象ユーザーのレジュメを表示（admin/owner/public の順にフォールバック）
- [ ] ハイライトとコネクタ線（Word風）
- [ ] サーバー永続化を Annotation モデルに正式化（下記）

---

## サーバー設計（正式版）

### モデル: Annotation（新規）
- `id: UUID (pk)`
- `resume: FK(Resume)` 必須
- `subject: Char(200)` 例: `resume_advice | advice | interview`
- `anchor_id: Char(100)` 例: `work_content-job1 | self_pr | job_summary`
- `start_offset: int` 選択開始（anchor要素テキストの文字オフセット）
- `end_offset: int` 選択終了（半開区間 [start, end)）
- `quote: Text` 選択文字列（冪等性・目視確認用）
- `selector_meta: JSON` 任意（将来のDOM構造変化対策: ノードインデックス等）
- `created_by: FK(User)`
- `is_resolved: bool` / `resolved_at: datetime` / `resolved_by: FK(User, null=True)`
- `created_at/updated_at: datetime`
- Index案: `(resume, subject)`, `(resume, anchor_id, start_offset)`

### 既存モデル拡張: Message
- `annotation: FK(Annotation, null=True, blank=True, related_name='messages')`
- 互換性: 従来のプレーンメッセージは `annotation=null` のまま運用可能。

### API（v2）
- GET `/api/v2/advice/annotations/?resume_id=...&subject=...` 注釈一覧
- POST `/api/v2/advice/annotations/` 注釈作成
  - body: `{ resume, subject, anchor_id, start_offset, end_offset, quote, selector_meta? }`
  - resp: Annotation
- PATCH `/api/v2/advice/annotations/{id}/` 更新（主に `is_resolved` 切替）
- 既存: POST `/api/v2/advice/messages/`
  - 拡張: body に `annotation_id` を受けたら該当注釈に紐づくメッセージを作成
  - 既存互換: `content` のみも許容（プレーンメッセージ）

### 権限
- 閲覧: 当該履歴書の所有者 or is_staff（管理者）
- 作成/更新: 所有者 or is_staff
- セキュリティ: `resume.user == request.user` もしくは `request.user.is_staff`

### 既存暫定データの互換
- 先頭メタ `@@ANNOTATION:{...}@@` 形式は「表示互換」のみ維持
- 必要なら移行スクリプトで Annotation を生成し、対応 Message に `annotation_id` を付与（任意）

---

## フロント設計

### 共通コンポーネント
- `AnnotationLayer`（新規）
  - props: `{ annotations, messagesByAnnotation, onCreate(annotationDraft), onResolve(id) }`
  - 仕事: 対象テキストへの `<mark>` 埋め込み、吹き出しと細線コネクタの描画、選択検知→新規作成UI
- `useSelectionOffsets(anchorEl)`（新規hook）
  - anchor テキストに対する start/end オフセット算出（Range→オフセット変換）

### ハイライト/コネクタ線
- レンダリング時:
  - 各 `anchor_id` の要素 `innerText` を `start/end` で3分割し、真ん中を `<mark data-annot-ref="{id}">` で囲う
  - `<mark>` の `getBoundingClientRect()` から y 座標を取得し、右側パネルの吹き出しに CSS line（擬似要素 or SVG）でコネクト
- スクロール同期: プレビューコンテナ内スクロールに合わせて位置を再計算（`resize/scroll` 監視）

### ページ適用
- ユーザー: `frontend/app/users/[userId]/advice/resume/page.tsx`
- 管理: `frontend/app/admin/seekers/[id]/page.tsx`（レビュータブ）
- 共通: `frontend/app/resume-advice/review/page.tsx`
- 既存の暫定実装を `AnnotationLayer` に置換し、重複を削減

### エラーハンドリング
- 注釈作成失敗時はトースト/バナー表示
- 権限エラーは「閲覧権限がありません」→公開/本人/管理者のフォールバック導線を案内

---

## 表示データ取得フロー
1) ルートパラメータの `userId` を解決
2) レジュメ取得の優先順位
   - 管理者: `/admin/users/{userId}/resumes/`
   - 本人: `/seeker/resumes/`
   - 公開: `/users/{userId}/resumes/`（公開設定: `is_profile_public=true` かつ `show_resumes=true` 必須）
3) 注釈一覧取得: `/advice/annotations/?resume_id=...&subject=resume_advice`
4) メッセージ取得: `/advice/messages/?user_id={userId}&subject=resume_advice`

---

## テスト計画
- Django 単体
  - [ ] Annotation 作成/更新/一覧の権限テスト
  - [ ] advice/messages POST with annotation_id の動作
  - [ ] user_public_resumes の公開設定ガード
- フロントE2E（手動）
  - [ ] 選択→ポップオーバー→作成→吹き出し + ハイライト + コネクタ線
  - [ ] 再読み込みして位置・ハイライト復元
  - [ ] 解決ボタンでグレーアウト/折りたたみ
  - [ ] 権限/公開設定での表示切替

---

## ロールアウト
- フラグ: `NEXT_PUBLIC_FEATURE_ANNOTATIONS=1`（一時）
- ステップ公開: 管理画面→ユーザーの順
- 監視: /advice/messages エラー率、注釈作成APIの4xx/5xx

---

## 実装タスク（チェックリスト）
1. バックエンド
   - [x] `Annotation` モデル + `Message.annotation` FK 追加（コード実装済 / 迁移は次のデプロイで適用）
   - [x] シリアライザ・API（一覧/作成/更新）と `advice/messages` のPOST拡張
   - [ ] 権限・公開プロフィール/履歴書の整合確認
   - [ ] 旧メタ（`@@ANNOTATION`）の表示互換 or 移行スクリプト（任意）
2. フロント
   - [ ] `AnnotationLayer` コンポーネント（ハイライト + コネクタ）
   - [ ] 選択オフセット算出 hook（Range→offset）
   - [ ] 3画面へ統合: ユーザー/管理/レビュー
   - [ ] 返信/解決 UI とAPI連携（解決=PATCH）
   - [ ] フォールバック表示（注釈なしでもチャットは機能）
3. QA/検証
   - [ ] 本人/管理者/公開の3パターンの表示確認
   - [ ] モバイル選択（タップ&ホールド）での作成確認
   - [ ] スクロール・リサイズで位置ズレが最小になることの確認

---

## 参考: 現在の暫定実装箇所
- アンカー: `frontend/components/pure/resume/preview.tsx`
- 選択→ポップオーバー→送信（暫定）:
  - ユーザー: `frontend/app/users/[userId]/advice/resume/page.tsx`
  - 管理: `frontend/app/admin/seekers/[id]/page.tsx`
  - 共通レビュー: `frontend/app/resume-advice/review/page.tsx`

---

## 次の一手（合意後に着手）
- バックエンドのAnnotationモデル + APIを実装し、フロントを新APIに切替。
- ハイライトとコネクタ線（SVG or CSS）を実装して、スクショ同等の外観にする。
