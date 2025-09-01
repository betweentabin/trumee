# Vercel画像表示問題の解決ガイド

## 問題の概要
Vercelでフロントエンドディレクトリをルートに設定した場合、画像パスが正しく解決されない問題が発生していました。

## 実装済みの解決策

### 1. Next.js設定の調整
- `next.config.ts`で画像の最適化を無効化（`unoptimized: true`）
- AssetPrefixとBasePathの設定を追加
- WebpackでのSVGとPNG/JPEGファイルの処理設定

### 2. Vercel設定の更新
- `vercel.json`にrewritesルールを追加して画像パスのリダイレクトを設定
- 公開ディレクトリの適切な設定

### 3. コンポーネントの修正
- 主要なヘッダーコンポーネントで`<img>`タグを`<Image>`コンポーネントに変更
- 必要なImportの追加

### 4. 最適化されたImageコンポーネントの作成
- エラーハンドリング機能付きの`OptimizedImage`コンポーネントを作成
- フォールバック画像の対応

## 残りの修正が必要な箇所

以下のファイルにはまだ`<img>`タグが残っているため、必要に応じて`<Image>`コンポーネントに変更してください：

### 主要ファイル：
1. `app/landing/page.tsx` - 複数の画像（部分的に修正済み）
2. `app/dashboard/page.tsx` - 複数の画像
3. `components/footer.tsx`
4. `components/auth/footer.tsx`
5. `components/company/footer.tsx`
6. `components/user/footer.tsx`

### 修正例：
```tsx
// 修正前
<img src="/logo/logo_top.png" alt="Logo" className="h-10 w-[210px]" />

// 修正後
<Image src="/logo/logo_top.png" alt="Logo" width={210} height={40} className="h-10 w-[210px]" />
```

## 推奨事項

1. **段階的な移行**: 全てのimgタグを一度に変更せず、重要なページから順次対応
2. **OptimizedImageの使用**: 新しく作成したOptimizedImageコンポーネントを使用してエラーハンドリングを強化
3. **テスト**: Vercelでのデプロイ後、全ページで画像が正しく表示されることを確認

## 追加の設定

### 環境変数（必要に応じて）
```env
NEXT_PUBLIC_BASE_PATH=""
NEXT_PUBLIC_ASSET_PREFIX=""
```

### デプロイメント確認
- Vercelダッシュボードでビルドログを確認
- 画像アセットが正しくアップロードされているか確認
- 各ページで画像の表示を確認

この設定により、Vercelでフロントエンドをルートディレクトリに設定した場合でも画像が正しく表示されるはずです。
