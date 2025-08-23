# Resume Truemee 段階的実装計画

## 📋 実装概要
作成したMDファイルの分析結果に基づき、最も重要な問題から段階的に実装を進めます。

## 🎯 実装の優先順位基準
1. **ユーザーがシステムを使えない致命的な問題**を最優先
2. **データ損失リスクがある問題**を次に対応
3. **ユーザビリティを大きく損なう問題**を順次修正
4. **機能追加・改善**は基本機能が安定してから

---

## 📅 フェーズ1: 基盤修正（1-2週間）
**目標**: システムの基本的な動作を保証する

### 1.1 環境変数とセキュリティ設定（2日）
```bash
# 実装タスク
1. 環境変数ファイルの作成
   - backend: /back/.env の完成
   - frontend: /frontend/.env.local の新規作成
   
2. ハードコードされた認証情報の移行
   - JWT_SECRET の環境変数化
   - FIREBASE_API_KEY の環境変数化
   - Stripe キーの適切な管理
```

**対応ファイル**:
- `/back/core/views.py` - JWT_SECRET, FIREBASE_API_KEY
- `/back/back/settings.py` - 環境変数の読み込み
- `/frontend/lib/firebase.ts` - Firebase設定の環境変数化

### 1.2 認証画面の実装（3日）

#### ログインページ修正
```typescript
// /frontend/app/auth/login/page.tsx
- ログインフォームの実装
- Firebase認証との連携
- エラーハンドリング
- パスワード忘れリンク
```

#### 登録ページ修正
```typescript
// /frontend/app/auth/register/page.tsx
- 求職者/企業の登録フォーム
- メールアドレス重複チェック
- バリデーション実装
- 登録成功後の遷移
```

#### パスワードリセット機能
```typescript
// /frontend/app/auth/repassword/page.tsx
- パスワードリセットフォーム
- メール送信確認表示
- 迷惑メールフォルダ案内
```

### 1.3 データ保持問題の解決（3日）

#### Redux Store の強化
```typescript
// /frontend/app/redux/store.ts
- Redux Persist の導入
- ローカルストレージへの保存
- セッション管理の実装
```

#### 各Sliceの修正
```typescript
// 修正対象
- experienceSlice.ts
- jobSlice.ts
- profileSlice.ts
- skillSlice.ts
```

**解決する問題**:
- ページ遷移時のデータ消失（CSV: No.40,41,42,43）
- ステップ間のデータ保持（CSV: No.31）

---

## 📅 フェーズ2: コア機能の完成（2-3週間）
**目標**: 主要機能を完全に動作させる

### 2.1 職務経歴書機能の完成（1週間）

#### ステップフォームの修正
```typescript
// /frontend/app/auth/step/各ステップ
1. step1-profile: プロフィール入力
2. step2-education: 学歴入力
3. step3-experience: 職歴入力
4. step4-preference: 希望条件
5. step5-confirm: 確認画面（データ表示修正）
6. step6-download: PDF生成・ダウンロード
```

**実装内容**:
- ステップ間のナビゲーション修正
- データの一時保存機能
- プレビュー機能の実装
- PDF生成機能の接続

### 2.2 企業側機能の改善（1週間）

#### 求職者検索・詳細表示
```typescript
// /frontend/app/company/page.tsx
- 職務経歴書の表示機能
- 検索結果のUI統一
- スカウト機能の修正
```

#### 企業情報管理
```typescript
// /frontend/app/companyinfo/page.tsx
- データ保存機能の修正
- 成功メッセージの表示
- バリデーション強化
```

### 2.3 支払い機能の実装（3日）

#### Stripe統合の完成
```typescript
// /frontend/app/companyinfo/payment/page.tsx
- 支払いフォームの修正
- Stripe Elementsの実装
- サブスクリプション管理
```

---

## 📅 フェーズ3: 機能拡張（1-2週間）
**目標**: ユーザビリティの向上と管理機能の追加

### 3.1 管理者機能の実装（1週間）

#### 管理画面の作成
```typescript
// /frontend/app/admin/
- 求職者一覧・検索
- 職務経歴書の添削機能
- コメント入力機能
- メッセージ管理
```

### 3.2 通知・メール機能（3日）

#### メール送信の実装
- SendGrid/SESの設定
- 登録確認メール
- パスワードリセットメール
- スカウト通知

### 3.3 UI/UX改善（3日）

- レスポンシブデザインの修正
- ローディング表示の追加
- エラーメッセージの改善
- アクセシビリティ向上

---

## 🔧 各フェーズの実装手順

### 開発環境のセットアップ
```bash
# バックエンド
cd back
python -m venv venv
source venv/bin/activate
pip install -r requirements.frozen.txt
python manage.py migrate
python manage.py runserver

# フロントエンド
cd frontend
npm install
npm run dev
```

### テスト手順
1. ユニットテストの作成
2. 統合テストの実施
3. E2Eテストの導入（Playwright推奨）

### デプロイ準備
1. 本番用環境変数の設定
2. Firebaseセキュリティルールの設定
3. CORSの本番設定
4. SSL証明書の設定

---

## 📊 進捗管理

### 完了基準
各フェーズの完了基準を明確に定義：

**フェーズ1完了基準**:
- [ ] ユーザーがログイン・登録できる
- [ ] データが消えない
- [ ] セキュリティリスクが解消

**フェーズ2完了基準**:
- [ ] 職務経歴書が作成・保存・閲覧できる
- [ ] 企業が求職者を検索・スカウトできる
- [ ] 支払い機能が動作する

**フェーズ3完了基準**:
- [ ] 管理者が添削できる
- [ ] メール通知が送信される
- [ ] UIが使いやすい

---

## ⚠️ リスクと対策

### 技術的リスク
1. **Firebaseの制限**: 
   - 対策: 適切なインデックス設定とクエリ最適化

2. **データ移行**:
   - 対策: バックアップを取ってから実施

3. **認証の複雑性**:
   - 対策: Firebase Authenticationのベストプラクティスに従う

### 実装上の注意点
- 各フェーズ完了後に必ずテストを実施
- ユーザーデータのバックアップを定期的に取る
- 本番環境への反映は段階的に行う

---

## 📝 次のアクション

### 即座に開始すべきタスク
1. `.env`ファイルの作成と環境変数の設定
2. Gitリポジトリの整備（.gitignore更新）
3. 開発環境の構築とテスト

### 確認が必要な事項
1. Firebaseプロジェクトへのアクセス権限
2. Stripeアカウントの詳細
3. メールサービスの選定
4. 本番環境の構成

この計画に従って実装を進めることで、システムの安定性を確保しながら機能を完成させることができます。