# ログイン無限リロード・ページ遷移問題 調査報告書

## 概要
ログインページでの無限リロード問題と、ユーザー/企業ページでのボタン遷移不具合について調査しました。
主な原因は、認証状態管理の複雑化と、APIエンドポイントの未実装・エラーによるものです。

## 1. ログインページ無限リロード問題

### 問題の詳細
- **症状**: ログインページアクセス時に無限にリロードが発生
- **影響**: ユーザーがログインできない

### 根本原因

#### 1. useEffectの循環依存
```typescript
// frontend/app/auth/login/page.tsx (問題のあるコード)
useEffect(() => {
  initializeAuth();
}, [initializeAuth]); // initializeAuthが毎回再生成される

useEffect(() => {
  checkAuthStatus();
}, [checkAuthStatus]); // checkAuthStatusも毎回再生成
```

**問題点**:
- `initializeAuth`と`checkAuthStatus`が`useCallback`で定義されているが、依存配列に含まれる値が変化
- 関数が再生成され、useEffectが再実行される無限ループ

#### 2. 認証状態の複雑な管理
```typescript
// 3つの異なる認証フックが存在
- useAuth (旧実装、API v1/v2混在)
- useAuthV2 (新実装、API v2専用)
- 両方を同時に使用している箇所がある
```

#### 3. リダイレクトロジックの競合
```typescript
// ログインページ
if (isAuthenticated) {
  router.push('/users'); // 認証済みならリダイレクト
}

// ユーザーページ
if (!isAuthenticated) {
  router.push('/auth/login'); // 未認証ならログインへ
}
// → 認証状態が不安定な場合、相互にリダイレクトし合う
```

### 現在の回避策（デバッグモード）
```typescript
const [debugMode, setDebugMode] = useState(true);

// デバッグモードでは自動リダイレクトを無効化
if (!debugMode && !isAuthenticated) {
  router.push('/auth/login');
}
```

## 2. ユーザーページのボタン遷移問題

### 問題の詳細
- **症状**: 各ボタンをクリックしてもページ遷移しない
- **影響**: プロフィール編集、履歴書作成、求人検索などの機能にアクセス不可

### エラー内容（コンソール）

| ボタン | APIエンドポイント | エラー | 原因 |
|------|----------------|-------|------|
| プロフィール編集 | `/api/v2/seeker/profile/` | 404 Not Found | エンドポイント未実装 |
| 履歴書作成・編集 | `/api/v2/seeker/resumes/` | 404 Not Found | エンドポイント未実装 |
| 求人を探す | `/api/v2/jobs/search/` | 正常動作 | - |
| 企業からのオファー | `/api/v2/seeker/scouts/` | 404 Not Found | エンドポイント未実装 |
| 応募履歴 | `/api/v2/seeker/applications/` | 404 Not Found | エンドポイント未実装 |
| 保存した求人 | `/api/v2/seeker/saved-jobs/` | 404 Not Found | エンドポイント未実装 |
| プレミアムプラン | - | 正常動作（静的ページ） | - |
| メッセージ | `/api/v2/seeker/messages/` | 404 Not Found | エンドポイント未実装 |
| 設定 | `/api/v2/user/settings/` | 404 Not Found | エンドポイント未実装 |

### 実装の問題点

```typescript
// frontend/app/users/page.tsx
const handleEditProfile = async () => {
  try {
    const response = await fetch(buildApiUrl('/seeker/profile/'), {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      router.push('/profile/edit'); // APIが成功した場合のみ遷移
    }
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    // エラー時は遷移しない
  }
};
```

**問題**: APIが404を返すため、ページ遷移が実行されない

## 3. 企業ページのボタン遷移問題

### 問題の詳細
- **症状**: 企業ダッシュボードページのボタンが機能しない
- **影響**: 求人掲載、スカウト、応募管理などの機能が使用不可

### エラー内容

| ボタン | APIエンドポイント | エラー | 原因 |
|------|----------------|-------|------|
| ダッシュボード | `/api/v2/company/dashboard/` | 404 Not Found | エンドポイント未実装 |
| 企業プロフィール | `/api/v2/company/profile/` | 404 Not Found | エンドポイント未実装 |
| 求人を掲載 | `/api/v2/company/jobs/new/` | 404 Not Found | エンドポイント未実装 |
| スカウト | `/api/v2/company/scouts/` | 404 Not Found | エンドポイント未実装 |
| 応募管理 | `/api/v2/company/applications/` | 404 Not Found | エンドポイント未実装 |

## 4. 共通の問題

### APIバージョンの混在
```typescript
// API v2を使用する設定
const API_VERSION = '/api/v2';

// しかし、バックエンドではv2エンドポイントが部分的にしか実装されていない
// 実装済み: /auth/*, /profile/me/
// 未実装: /seeker/*, /company/*, /user/settings/ など
```

### 認証トークンの不整合
```typescript
// 3種類のトークンが混在
1. JWT access token (access_token_v2)
2. DRF token (drf_token_v2)
3. 旧JWT token (access_token)

// 各APIクライアントが異なるトークンを期待
```

### Next.jsミドルウェアの不在
- 認証チェックがページコンポーネント内で行われている
- 統一的な認証ガードが存在しない
- リダイレクトロジックが分散している

## 5. 修正計画

### Phase 1: 緊急修正（1日）

#### 1.1 ログイン無限リロードの修正
```typescript
// frontend/app/auth/login/page.tsx
useEffect(() => {
  // 初期化は一度だけ
  initializeAuth();
}, []); // 空の依存配列

// リダイレクトは認証状態が確定してから
useEffect(() => {
  if (isAuthenticated && !isLoading) {
    const redirectPath = currentUser?.role === 'company' 
      ? '/company/dashboard' 
      : '/users';
    router.push(redirectPath);
  }
}, [isAuthenticated, isLoading, currentUser?.role]);
```

#### 1.2 ボタン遷移の暫定修正
```typescript
// APIチェックを削除し、直接遷移するように修正
const handleEditProfile = () => {
  router.push('/profile/edit'); // 直接遷移
};
```

### Phase 2: 短期修正（3日）

#### 2.1 必要なAPIエンドポイントの実装
```python
# back/core/urls_api_v2.py に追加
path('seeker/profile/', views.seeker_profile_detail, name='seeker-profile-detail'),
path('company/profile/', views.company_profile_detail, name='company-profile-detail'),
path('seeker/resumes/', views.ResumesListView.as_view(), name='resume-list'),
# ... 他の必要なエンドポイント
```

#### 2.2 Next.jsミドルウェアの実装
```typescript
// middleware.ts (プロジェクトルート)
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token_v2');
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  if (token && request.nextUrl.pathname === '/auth/login') {
    return NextResponse.redirect(new URL('/users', request.url));
  }
  
  return NextResponse.next();
}
```

### Phase 3: 長期改善（1週間）

#### 3.1 認証システムの統一
- useAuthV2に一本化
- トークン管理の簡素化
- APIクライアントの統合

#### 3.2 エラーハンドリングの改善
- APIエラー時のフォールバック処理
- ユーザーフレンドリーなエラーメッセージ
- ローディング状態の適切な管理

#### 3.3 E2Eテストの追加
- 認証フローのテスト
- ページ遷移のテスト
- APIエラー時の動作テスト

## 6. 推奨される即時対応

### 最優先タスク
1. **ログインページのuseEffect修正** - 無限リロードを止める
2. **デバッグモードの削除** - 暫定対応を正式な修正に置き換える
3. **ボタンの直接遷移実装** - APIチェックを削除

### 次の優先タスク
1. **基本的なAPIエンドポイント実装** - 404エラーを解消
2. **Next.jsミドルウェア導入** - 認証管理を一元化
3. **エラーメッセージの実装** - ユーザーに状況を伝える

## 7. テストシナリオ

### ログインフロー
- [ ] ログインページへの初回アクセス
- [ ] ログイン成功後の適切なリダイレクト
- [ ] ログアウト後の動作
- [ ] 認証エラー時の表示

### ページ遷移
- [ ] ユーザーページの全ボタン動作確認
- [ ] 企業ページの全ボタン動作確認
- [ ] ブラウザバック時の動作
- [ ] 直接URL入力時のアクセス

### エラーハンドリング
- [ ] API 404エラー時の動作
- [ ] ネットワークエラー時の動作
- [ ] トークン期限切れ時の動作

## 付録: 関連ファイル一覧

### フロントエンド
- `/frontend/app/auth/login/page.tsx` - ログインページ
- `/frontend/app/users/page.tsx` - ユーザーダッシュボード
- `/frontend/app/company/page.tsx` - 企業ダッシュボード
- `/frontend/hooks/useAuth.ts` - 旧認証フック
- `/frontend/hooks/useAuthV2.ts` - 新認証フック
- `/frontend/lib/api-client.ts` - 旧APIクライアント
- `/frontend/lib/api-v2-client.ts` - 新APIクライアント

### バックエンド
- `/back/core/urls_api_v2.py` - API v2 URLルーティング
- `/back/core/views_api_v2.py` - API v2 ビュー実装
- `/back/back/settings.py` - Django設定

---
*最終更新: 2025年8月31日*