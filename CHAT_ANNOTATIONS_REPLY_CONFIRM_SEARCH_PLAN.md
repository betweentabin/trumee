# Chat Annotations: Reply + Confirm + Search Integration

目的
- 双方向のコメントに返信ボタンを追加し、同一スレッドで会話を継続できるようにする。
- 管理者画面の色付き（注釈ひも付き）コメントに「確認」ボタンを追加し、押下で該当注釈を解決（下線・色付きカードを非表示）し、求職者側のチャットからも見えなくする。
- 既存のチャット検索（右ペインの検索ボックス、注釈フィルタなど）が期待通りに機能するよう、UI/API を整える。

スコープ（最小実装で達成）
- DB変更なし。既存モデルを活用：
  - `Message`（親子でスレッド化: `parent`）
  - `Annotation`（注釈の解決状態: `is_resolved`）
- UI/UX（Admin/Seeker 共通）
  - 返信: 各メッセージに「返信」を表示 → 入力 → 送信で同一スレッド（`parent_id`）へぶら下げ。
  - 確認（Adminのみ）: 色付きカード（注釈に紐づくメッセージ）に「確認」を表示 → `is_resolved=true` でPATCH。
  - 解決済みの注釈はプレビューの下線を消し、メッセージ一覧からも非表示（既定は未解決のみ表示）。
  - 検索: 右ペイン上部の検索に統一し、テキスト/注釈ID（#N）/状態（未解決・解決）/注釈IDセレクトで絞り込み。

既存実装との整合
- 直近のユーザー編集箇所のみ `recently_changed_anchors` を保存（公開反映時）。
- 管理者がそのアンカーにコメント作成・注釈解決時に `recently_changed_anchors` をクリア（実装済みの整理）。
- プレビュー表示：
  - 下線＝注釈（未解決）
  - マーカー＝ユーザーが直近で編集した箇所（管理者の次コメント or 解決で解除）

API 仕様（最小追加を提案）
- 返信の送信（既存）
  - `POST /api/v2/advice/messages/`
  - body: `{ content, user_id?, parent_id?, annotation_id? }`
  - parent_id: ルートメッセージID（子への返信でも最上位のIDを指定）

- 注釈の取得/解決（既存）
  - `GET /api/v2/advice/annotations/?resume_id=&subject=`
  - `PATCH /api/v2/advice/annotations/{id}/` body: `{ is_resolved: true }`

- スレッド一覧（既存 + 既に`q`検索あり）
  - `GET /api/v2/advice/threads/?user_id=&subject=&mode=(annotation|comment)&q=...&annotation_id=`
  - q: アンカーID/本文の部分一致

- メッセージ一覧（提案: 軽微追加）
  - `GET /api/v2/advice/messages/?subject=&user_id=&parent_id=&annotation_id=&q=&hide_resolved=1`
  - `q`: 本文/アンカーIDの部分一致
  - `hide_resolved`: `annotation.is_resolved=true` のメッセージを除外（求職者側の一覧を軽くするため）

UI 変更（要点）
- 管理者画面 `frontend/app/admin/seekers/[id]/page.tsx`
  - 色付きコメントカードのアクションに「確認」を追加 → `PATCH /advice/annotations/{id}` を実行。
  - 成功後:
    - `annotations` の該当要素を `is_resolved=true` に更新 → プレビューの下線が消える。
    - `resumePreview.changedAnchors` から当該アンカーID（`exp_`/`job`の両形式）を除去（既存のユーティリティを流用）。
  - 返信 UI: 既存の thread reply 入力を「返信」ボタンから開閉して送信。

- 求職者画面 `frontend/app/users/[userId]/advice/resume/page.tsx`
  - 各メッセージに「返信」追加 → `parent_id` はスレッドルートID。
  - 描画前フィルタ: 注釈が `is_resolved=true` のメッセージは非表示（もしくはトグルで切替）。
  - 検索ボックス（右ペイン）:
    - `#N` で注釈IDショートカット（既存の挙動を維持）。
    - テキストで本文/アンカーIDをクライアント絞り込み。件数が多い場合のみ `?q=` をAPIへ付加（最適化は後方対応）。

状態フロー（シンプル）
1. 管理者がコメント（注釈作成）→ プレビュー下線＋右ペインにスレッド。
2. 求職者が該当箇所を編集し「公開反映」→ そのアンカーのみマーカー。
3. 管理者が「確認」→ 注釈 `is_resolved=true`、マーカー・下線ともに消える（求職者の一覧からも非表示）。
4. 必要なら「再オープン」→ `is_resolved=false` に戻し、下線復帰。

検索（既存を活かして軽く整備）
- 右ペインツールバー
 - ドロップダウン: 注釈IDフィルタ（全件/未解決/個別 #N）
  - テキスト検索: 本文・アンカーID部分一致（クライアントフィルタを基本、負荷が増えたら `q` をAPIに付与）
  - 「解決済みを隠す」トグル（求職者側既定ON、管理者は任意）
- 検索結果の最初のスレッドを自動オープン＆該当マークへスクロール（既存のオートフォーカスを維持）

## 注釈クリック/トグルでの表示切替（スレッド連動）

ゴール
- 注釈（プレビューの下線/マーカー）や、ツールバーの注釈ドロップダウンで #N を選ぶと、右ペインのチャットは「その注釈に紐づくメッセージと返信だけ」を表示。
- 「すべて」を選ぶ/解除すると、全チャット（全注釈の親メッセージ＋返信）を表示。

UI/挙動
- プレビューの `mark[data-annot-ref="ann-<id>"]` をクリック
  - `annotationFilter = <id>` にセット、右ペインの注釈ドロップダウンも同期
  - スレッドビューを「注釈 <#N> のスレッドのみ」に切り替え
  - 入力欄の上にチップ「返信先: #N」を表示（Xで解除可）
- 注釈ドロップダウンで #N を選択
  - 上記と同様に `annotationFilter` 更新 → スレッド＆入力チップを同期
- 「すべて」選択（または Esc）
  - `annotationFilter = ''` に戻す → 全チャット表示、入力チップは消える

データ連携
- 取得:
  - 軽量化のため既存の `GET /api/v2/advice/threads/?mode=comment` を使用
  - `annotation_id` があればその注釈のスレッドのみ取得（既存パラメータ）
  - 無ければ全件（必要に応じてクライアント側で `annotationFilter` で絞り込み）
- 入力（単一欄）:
  - `annotationFilter` が空でない場合は `annotation_id` を付与して送信（返信なら `parent_id` も）
  - 空の場合は通常の全体チャットとして送信

検索との整合
- 検索語がある時はまず現在の表示（注釈 #N のみ or 全件）の中でクライアントフィルタ
- 件数が多い場合のみ API へ `?q=` を付与して再取得（後方最適化）
- `#N` を入力した場合は注釈ドロップダウンを #N に同期（ショートカット）

状態遷移（簡易）
1. ユーザーが注釈をクリック → annotationFilter=<id> → 右ペインはその注釈スレッドだけ表示、入力は #N 宛て
2. メッセージ送信 → `POST /advice/messages/ { annotation_id, parent_id? }` → スレッド末尾に反映
3. ツールバーで「すべて」に戻す → 右ペインが全チャット表示に戻る、入力チップ解除

実装メモ（反映済み）
- Admin/Seeker のスレッド統一
  - 注釈クリック時に双方とも `GET /advice/threads/?mode=comment&user_id=&annotation_id=` を呼び、
    未解決優先→最新更新の順で thread_id を決定し、`GET /advice/messages/?parent_id=` でそのスレッドのみを表示するように統一。
  - Seeker 画面: `frontend/app/users/[userId]/advice/resume/page.tsx` に `annotationFilter/activeThread/threadMessages` を追加し、
    プレビューの色付きカードクリックで `selectThreadForAnnotation()` を実行してスレッド表示を切替。
  - Admin 画面は既存の threads API の利用に加え、同等の採用規則で先頭スレッドを選ぶ実装（フロント側で並べ替え）。


実装ステップ
1) フロント: 返信ボタン（Admin/Seeker）
   - クリックで返信入力を開き、`POST /advice/messages/`（`parent_id`/`annotation_id`を付与）。
2) フロント: 確認ボタン（Admin）
   - `PATCH /advice/annotations/{id} { is_resolved: true }` → 状態更新＆ローカル除去。
3) フロント: 描画フィルタ
   - 注釈 `is_resolved` のメッセージは非表示（求職者既定ON、管理者はトグル）。
4) API（任意強化）: messages GET に `q`/`hide_resolved` を追加（サーバ側フィルタ）。
5) 検索UX微調整
   - `#N`ジャンプの安定化、Enterで先頭スレッドを開く、検索語ハイライト（任意）。

検証
- 管理者→コメント作成→求職者画面で下線見える
- 求職者→編集→公開反映→当該箇所だけマーカー
- 管理者→確認→両画面で下線・色付きコメントが非表示
- 検索: テキスト/注釈IDで絞り込み、Enterで先頭へフォーカス、クリックで該当箇所へスクロール

ロールアウト
- 先にフロント（返信/確認/描画フィルタ）→ その後、APIの `q`/`hide_resolved` を入れて最適化
- Playwright で最小E2E（作成→編集→確認→検索）を1本用意

将来拡張（必要になったら）
- 「要再アンカー」状態（対象テキスト消失時の破線表示）とワンクリック再アンカー
- メッセージのメンション/引用返信
- サマリカード（未解決件数/対応待ち）
