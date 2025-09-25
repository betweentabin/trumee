# セキュリティ/SEO/アクセシビリティ監査レポート（TruMee）

本レポートは提示いただいたチェックリストに基づき、現行実装（Django + Next.js）を走査して適合状況と改善提案を整理したものです。対象コミットはローカル作業時点の最新です。

## 概要（結論）
- 認証はローカルストレージ保存のトークンに依存しており、HttpOnly Cookie要件は未充足。ITPの7日問題やXSS時のリスクを考えると、HttpOnly + SameSite + Secure クッキーへの移行を推奨。
- フロントは `X-Frame-Options: DENY` を送出（良）。ただし HSTS、X-Content-Type-Options、Referrer-Policy、CSP など重要ヘッダが未設定（要追加）。
- Django 側も HSTS/SSL リダイレクト/各種セキュアクッキー/NoSniff/CSP 等が未設定。`DEBUG=True` と過剰な CORS 設定が残存（本番では厳格化が必要）。
- 「PDFメール送信」APIが未認証かつCSRF免除で外部悪用の温床になり得る（要保護）。
- SEO/OGPはベースのtitle/descriptionはあるが、canonical/OGP/Twitter Card未整備。`
- アクセシビリティはaltは基本付与されているが空文字の用途見直し要。`<html lang="en">` になっており日本語サイト要件未充足。

---

## チェックリスト適合状況（項目別）

### 1) 認証に関わるCookieの属性
- 現状: 認証トークンはローカルストレージ保存（例: `frontend/utils/auth.ts`）。HttpOnly Cookie未使用。
  - 影響: XSS時のトークン窃取リスク、iOS Safari ITPによる7日ルール影響。
- Cookie属性（HttpOnly/SameSite/ Secure/Domain）: サーバ側で未設定（セッションCookieのデフォルトはあるが、認証用途には使っていない）。
- 推奨:
  - 認証はHttpOnly Cookieに移行。`__Host-` プレフィックス + `Secure; Path=/; SameSite=Lax(or Strict)` を付与。
  - Django側で `SESSION_COOKIE_SECURE/HTTPONLY/SAMESITE` と `CSRF_COOKIE_*` を明示設定。

参考ファイル:
- `frontend/utils/auth.ts:1`（ローカルストレージ保存）
- `back/back/settings.py:214` 以降（セキュリティ関連未設定）

### 2) ユーザー入力のバリデーション
- サーバサイド: Django Serializer/Modelで基本の型/必須チェックあり。URLは `URLField` を利用し `javascript:` などは弾かれる想定（さらに厳格化可）。
- フロント: 主要フォームで基本的な検証あり。危険なHTMLの直挿入は確認されず（`dangerouslySetInnerHTML` 未検出）。
- PDF生成部は `escape()` によりエスケープ実施（良）。
- 推奨: URLは `http/https` のみ許可、正規表現や `urllib.parse` などでプロトコル強制をサーバ側でも再確認。

参考:
- `back/api_v2/views/resume_views.py:16` 以降（PDF生成でエスケープ）
- `back/core/serializers.py:1` 以降（Serializer定義）

### 3) SQLインジェクション
- 現状: Django ORM中心、RAW SQL/`cursor.execute` は見当たらず（良）。
- 推奨: 今後RAW SQLを追加する場合は必ずパラメタライズドクエリを使用。

### 4) レスポンスヘッダ（HSTS/Frame/Nosniff など）
- フロント: `X-Frame-Options: DENY` は設定済（良）。HSTS / Nosniff / Referrer-Policy / CSP 未設定。
  - `frontend/next.config.js:15-23`
- バックエンド: `SecurityMiddleware` はあるが、関連設定（`SECURE_*`）未指定につき有効化されない。
  - 例: HSTS, NoSniff, SSLリダイレクト, Referrer-Policy, CSP 未設定。
- 推奨: 両方で以下を適用
  - HSTS: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - （可能なら）CSP: `default-src 'self'; img-src 'self' data: https:; ...`

参考:
- `frontend/next.config.js:15-23`
- `back/back/settings.py:88-99`（SecurityMiddlewareはあるが設定不足）

### 5) CORS 設定
- 現状: `CORS_ALLOW_ALL_ORIGINS = True` かつ `CORS_ALLOW_CREDENTIALS = True`（危険）。
  - ブラウザは資格情報同送時 `*` を許容しないため実害は出づらいが、設定として不適切。
- 推奨: `CORS_ALLOW_ALL_ORIGINS=False` とし、`CORS_ALLOWED_ORIGINS` を本番ドメインのみに限定。

参考: `back/back/settings.py:44-61`

### 6) その他セキュリティ
- 直前ログイン必須の導線: 実装なし（例: 退会/メール変更時の再認証）。
- キャッシュ: ユーザー固有レスポンスのCDN/KVSキャッシュは明示されず。Nextの動的ページは通常no-storeだが、誤設定に注意。
- 公開ストレージ一覧: 該当なし（S3等未使用）。
- オープンリダイレクト: 顕著な実装なし。
- 権限チェック: DRFのPermissionで基本保護。`AllowAny` エンドポイントに注意。
- レスポンスヘッダへユーザー入力混入: 顕著な実装なし。
- エラーの露出: `DEBUG=True` 既定のため本番で情報露出の恐れ（要OFF）。
- ファイルアップロード: サイズ/拡張子/Content-Typeの検証なし（要追加）。
- DB/オブジェクトストレージのバックアップ・2FA: コード外要件（運用設定要）。

重要指摘:
- `send_resume_pdf` が未認証 + CSRF免除。
  - `back/api_v2/views/resume_views.py:87`（AllowAny）
  - `back/core/middleware.py:7-17`（CSRF免除パス指定）

### 7) ログイン
- メールアドレス本人確認: 実装無し（Email verificationフロー未検出）。
- アカウント列挙耐性: エラーメッセージは概ね一般的（「Invalid credentials」）で列挙耐性は一定あり。
- 複数ログイン手段: 現状はEmail+Passwordのみ（Firebaseは撤去）。ポリシー設計済みで問題なし。
- メール変更/連携変更: 再認証必須の実装は無し（要検討）。

### 8) メール送信
- スパム悪用対策: `send_resume_pdf` の乱発対策無し（認証/レート制限/CAPTCHA要）。
- SPF/DKIM/DMARC: 運用側設定が必要（コード外）。
- 大量送信のループ/重複抑止: バッチ送信の実装は未確認。今後実装時は冪等性キー等で重複抑止を。
- List-Unsubscribe: メルマガ/キャンペーン送信時は対応を。

### 9) SEO
- title/description: ルートのメタデータはあり（良）。
- canonical: 未設定。
- エラーページ/検索ページのnoindex: 未整備。
- サイト全体noindex: 確認できず。リリース時に要確認。
- meta description: 主要ページへ付与検討。
- サイトマップ/Search Console: 未整備。

参考: `frontend/app/layout.tsx:19-33`（基本メタ）

### 10) OGP
- og:title/og:description/og:url/og:image/ twitter:card: 未設定。Nextの`metadata.openGraph`/`metadata.twitter`で設定推奨。

### 11) 決済
- Stripe Checkoutは存在。重複決済・不整合検出・Webhook整備・冪等性キー未確認。
- 退会時の会計不整合/自動キャンセル方針: 明文化・実装要。

参考: `back/core/views_api.py:452-520`

### 12) アクセシビリティ
- 画像alt: 多くは付与されているが空altが散見。純装飾でなければ具体的代替テキストを付与。
- SVGアイコンのみのボタン/リンク: aria-label付与を徹底。
- `<html lang>`: 現状 `lang="en"`。日本語サイトは `lang="ja"` に変更推奨。

参考: `frontend/app/layout.tsx:39-57`（`<html lang="en">`）

### 13) パフォーマンス
- 静的ファイルはVercel/CDN配信。大画像/レイアウトシフト対策は要継続確認（width/height/aspect-ratio）。
- 不要モジュールのバンドル確認: 本番前に bundle-analyzer 導入推奨。

### 14) 複数環境での動作
- レスポンシブ/フォント/スクロールバー/長いハンドル名: 画面検証タスクでチェック推奨。

### 15) その他
- ITP対策: ローカルストレージ依存は7日で消える可能性。HttpOnly Cookie化を推奨。
- サードパーティCookie依存: 依存なし。
- `<html lang="ja">`: 未対応（要修正）。
- 監視/通知: サーバエラー通知（Sentry等）導入推奨。
- 404/50xページ: 体裁・導線の明確化を推奨。
- Favicon / Apple Touch Icon: あり（`metadata.icons`）。
- アクセス解析: 必要に応じてGA等導入。

---

## 推奨設定・実装例

### A) Django（`back/back/settings.py`）
- 本番で最低限:
```python
# Production security
DEBUG = False
ALLOWED_HOSTS = ["trumeee.vercel.app", "<your-custom-domain>"]

SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"  # 可能なら "Strict"

CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = "Lax"

SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"

# CORS - 明示的許可のみ
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "https://trumeee.vercel.app",
    "https://<your-custom-domain>",
]
CORS_ALLOW_CREDENTIALS = True
```

- Cookieベース認証へ移行する場合（例）:
  - ログイン時に `Set-Cookie: __Host-auth=<jwt or session id>; Path=/; Secure; HttpOnly; SameSite=Lax` を付与し、JSON応答ではトークンを返さない。

### B) Next.js（`frontend/next.config.js`）
- ヘッダを追加:
```js
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        // 最小限CSP（必要に応じて調整）
        { key: 'Content-Security-Policy', value: "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; connect-src 'self' https:" },
      ],
    },
  ];
}
```

- ルートレイアウトの言語指定（`frontend/app/layout.tsx`）:
```tsx
<html lang="ja">
```

- OGP/Twitterカード（例; `metadata` に追加）:
```ts
export const metadata = {
  title: 'TruMee',
  description: '...',
  openGraph: {
    title: 'TruMee',
    description: '...',
    url: 'https://<your-domain>',
    images: ['/logo/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
  },
};
```

### C) APIの堅牢化
- `send_resume_pdf`（`back/api_v2/views/resume_views.py`）を認証必須へ変更、またはreCAPTCHA + レート制限（IP/ユーザ単位）。
- ファイルアップロード検証（`ResumeFileSerializer` 等）を追加:
```python
from rest_framework import serializers

ALLOWED_CONTENT_TYPES = { 'application/pdf', 'image/png', 'image/jpeg' }
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

class ResumeFileSerializer(serializers.ModelSerializer):
    ...
    def validate_file(self, f):
        if f.content_type not in ALLOWED_CONTENT_TYPES:
            raise serializers.ValidationError('許可されていないファイル形式です')
        if f.size > MAX_FILE_SIZE:
            raise serializers.ValidationError('ファイルサイズが大きすぎます (最大5MB)')
        return f
```
- 退会/メール変更などは「直前の再認証」を必須に。
- Stripe: 冪等性キー使用、Webhookで決済とアプリ状態の整合性確認、重複決済防止ロジック。

---

## 主要ファイルの確認箇所
- Django 設定: `back/back/settings.py:14`（DEBUG）, `:33-42`（ALLOWED_HOSTS）, `:44-61`（CORS）, `:214-227`（REST設定）, `:286-288`（Session設定）
- セキュリティミドルウェア: `back/back/settings.py:88-99`
- 認証API: `back/core/views_api.py:1` 以降（トークンJSON返却）
- v2ログイン: `back/core/views_api_v2.py:438-468`（DRF Token発行）
- PDF送信API（要保護）: `back/api_v2/views/resume_views.py:87-130`
- CSRF免除ミドルウェア: `back/core/middleware.py:7-17`
- Next ヘッダ: `frontend/next.config.js:15-23`
- HTML言語: `frontend/app/layout.tsx:39-57`（`lang="en"`）
- ローカルストレージ保存: `frontend/utils/auth.ts:1-160`、`frontend/lib/api-client.ts:1-120`

---

## アクションアイテム（優先度順）
1) 認証をHttpOnly Cookie化（SameSite=Lax/Strict, Secure, __Host- プレフィックス）。
2) HSTS / NoSniff / Referrer-Policy / CSP などのセキュリティヘッダを Next と Django 双方に導入。
3) CORSを本番ドメインに限定。`DEBUG=False` と `ALLOWED_HOSTS` の厳格化。
4) `send_resume_pdf` を認証必須またはreCAPTCHA+レート制限化。
5) アップロードファイルのサイズ/Content-Type/拡張子検証を導入。
6) 退会/メール変更等に直前の再認証を導入。
7) OGP/Twitterカード/Canonical/重要ページのdescription/noindex（必要箇所）を整備。
8) `<html lang="ja">` へ修正、alt/aria-labelの点検を継続。
9) Stripe処理の冪等性/Webhookでの整合性監視と重複決済防止。

---

必要であれば、上記の具体的な修正（設定追加やコード改修）もこちらで実施できます。どこから着手するかご指定ください。

