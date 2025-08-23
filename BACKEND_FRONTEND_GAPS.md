# Resume Truemee バックエンド・フロントエンド未実装機能詳細

## 📊 実装状況サマリー

| 領域 | 実装率 | 重大な問題 |
|------|--------|------------|
| **バックエンドAPI** | 85% | セキュリティ・エラーハンドリング不足 |
| **フロントエンド** | 58% | 認証画面・ステップフォームが完全未実装 |
| **連携部分** | 40% | 認証フロー全体が機能しない |

⚠️ **最重要問題**: **60個のファイル（全体の42%）が空ファイル**

---

## 🔴 緊急対応が必要な未実装（セキュリティ・基本機能）

### 1. 認証システム全体が未実装

#### フロントエンド認証画面（11ファイルすべて空）
```
❌ /frontend/app/auth/login/page.tsx         - 0行（ログイン画面なし）
❌ /frontend/app/auth/register/page.tsx      - 0行（登録画面なし）
❌ /frontend/app/auth/repassword/page.tsx    - 0行（パスワードリセットなし）
❌ /frontend/app/auth/history/page.tsx       - 0行
❌ /frontend/app/auth/registersuccess/page.tsx - 0行
※ layout.tsxファイルもすべて空
```

**影響**: **ユーザーがシステムにログインできない**

#### バックエンド認証の問題
```python
# /back/core/views.py
JWT_SECRET = "YOUR_JWT_SECRET_KEY"  # 37行目 - ハードコード
FIREBASE_API_KEY="FIREBASE_API_KEY"  # 40行目 - ダミー値
```

### 2. 職務経歴書作成フロー完全未実装

#### ステップフォーム（6ステップすべて未実装）
```
❌ /frontend/app/auth/step/step1-profile/    - ディレクトリ内にファイルなし
❌ /frontend/app/auth/step/step2-education/  - ディレクトリ内にファイルなし
❌ /frontend/app/auth/step/step3-experience/ - ディレクトリ内にファイルなし
❌ /frontend/app/auth/step/step4-preference/ - ディレクトリ内にファイルなし
❌ /frontend/app/auth/step/step5-confirm/    - ディレクトリ内にファイルなし
❌ /frontend/app/auth/step/step6-download/   - ディレクトリ内にファイルなし
```

**影響**: **履歴書作成機能（コア機能）が使えない**

---

## 🟡 バックエンドの部分実装・問題箇所

### 1. エラーハンドリング不足（16箇所）

#### A. 認証なしで実行可能な危険なAPI
```python
# /back/core/views.py

@api_view(['POST'])
def save_career_history(request):  # 213-221行目
    # ⚠️ トークン認証なし - 誰でも履歴を保存可能
    serializer = HistorySerializer(data=request.data)
    # ...
```

#### B. 企業登録の不完全実装
```python
def register_company(request):  # 98-133行目
    # ❌ Firebase Auth作成がコメントアウト（106行目）
    # user_record = firebase_auth.create_user(...)  # コメントアウト
    
    # ⚠️ emailをドキュメントIDに使用（セキュリティリスク）
    db.collection("users").document(email).set({...})  # 112行目
```

#### C. パフォーマンス問題
```python
def get_seekers(request):  # 1054-1124行目
    # ⚠️ 全ドキュメント取得後にページネーション（非効率）
    all_seekers = []
    for doc in seekers_ref.stream():
        all_seekers.append(doc.to_dict())
    # その後でスライス...
```

### 2. 重複コードと非効率な実装

```python
# 同じロジックが複数箇所に
def apply_users(request):      # 341-398行目
def apply_users_cancel(request): # 401-444行目
def scout_users(request):      # 447-504行目
def scout_users_cancel(request): # 507-550行目
# すべて同じパターンで実装（DRY原則違反）
```

---

## 🟠 フロントエンドの問題箇所

### 1. API接続の問題（/frontend/app/api/api.tsx）

#### ハードコーディングされたURL
```typescript
// 複数箇所でハードコード
const API_URL = "http://85.131.248.214:9000";  // 7, 21, 45行目等

// 環境変数を使うべき
const API_URL = process.env.NEXT_PUBLIC_API_URL;
```

#### 不適切なエラーハンドリング
```typescript
.catch((error) => {
    console.error("Error:", error);  // 10, 31, 59行目等
    // ユーザーへのフィードバックなし
});
```

### 2. 空のコンポーネントファイル（3個）
```
❌ /frontend/app/company/_component/seeker_card.tsx - 0行
❌ /frontend/app/company/_component/seeker_resume_card.tsx - 0行
❌ /frontend/app/company/_component/seeker_table.tsx - 0行
```

---

## 🔗 バックエンド・フロントエンド連携の問題

### 1. APIエンドポイントの不一致

| バックエンドAPI | フロントエンド状態 | 問題 |
|----------------|-------------------|------|
| `/auth/register/` | ❌ 画面なし | 登録できない |
| `/auth/login/` | ❌ 画面なし | ログインできない |
| `/seekers/savehistory/` | ⚠️ ステップなし | 履歴保存UI欠如 |
| `/auth/save-resume/` | ❌ フォームなし | 履歴書保存不可 |

### 2. レスポンス形式の不統一

```python
# バックエンドで3種類の形式が混在
return Response({"detail": "Error"})        # DRF形式
return JsonResponse({"error": "Error"})     # Django形式
return JsonResponse({"message": "Success"}) # カスタム形式
```

### 3. 認証方式の混在

```python
# JWT認証
token = request.headers.get("Authorization")
payload = jwt.decode(token, JWT_SECRET, ...)

# Firebase認証
user_record = firebase_auth.create_user(...)

# 2つが並存し、整合性なし
```

---

## 📋 実装優先順位（改訂版）

### 🔴 フェーズ0: 緊急修正（3-5日）
**目的**: システムを最低限動作可能にする

1. **認証画面の実装**
   - login/page.tsx の作成
   - register/page.tsx の作成
   - 基本的なフォームとAPI連携

2. **環境変数の設定**
   - JWT_SECRET、FIREBASE_API_KEYの環境変数化
   - API URLの設定ファイル化

3. **セキュリティホールの修正**
   - save_career_historyへの認証追加
   - 企業登録のFirebase Auth有効化

### 🟡 フェーズ1: 基本機能実装（1-2週間）

4. **ステップフォームの実装**
   - step1〜step6の画面作成
   - データ保持機能の実装
   - プレビュー・ダウンロード機能

5. **エラーハンドリングの統一**
   - バックエンド: レスポンス形式統一
   - フロントエンド: エラー表示UI

### 🟢 フェーズ2: 改善・最適化（1週間）

6. **パフォーマンス最適化**
   - get_seekersのページネーション改善
   - 重複コードのリファクタリング

7. **UI/UXの完成**
   - 空のコンポーネント実装
   - レスポンシブ対応

---

## 💡 実装のポイント

### バックエンド改善案
```python
# 認証デコレータの作成
def require_auth(view_func):
    def wrapped_view(request, *args, **kwargs):
        token = request.headers.get("Authorization")
        if not token:
            return JsonResponse({"error": "Unauthorized"}, status=401)
        # トークン検証
        return view_func(request, *args, **kwargs)
    return wrapped_view

# 使用例
@require_auth
@api_view(['POST'])
def save_career_history(request):
    # 認証済みユーザーのみ実行可能
```

### フロントエンド改善案
```typescript
// API設定ファイル
// /frontend/config/api.ts
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  endpoints: {
    login: '/auth/login/',
    register: '/auth/register/',
    // ...
  }
};

// エラーハンドリング共通化
export const handleApiError = (error: any) => {
  // トースト通知など統一的な処理
};
```

---

## ⚠️ リスクと影響

1. **現状ではシステムが使用不可能**
   - ログイン画面がないため、誰もシステムを使えない
   - 履歴書作成フローがないため、コア機能が動作しない

2. **セキュリティリスクが高い**
   - ハードコードされた認証情報
   - 認証なしで実行可能なAPI

3. **データ整合性リスク**
   - 認証方式の混在
   - レスポンス形式の不統一

**推定修正期間**: 最低2-3週間（緊急修正含む）