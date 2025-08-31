# 求職者データ統合実装ガイド

## 現状分析

### 問題点
現在、企業側の検索ページ（`/company/search`）では、求職者のデータがダミーデータでハードコーディングされており、実際の求職者が登録したデータが反映されていません。

### データフローの確認

#### 1. 求職者側の登録フロー
- **登録ページ**: `/auth/step/step1-profile/page.tsx`
- **データ保存先**: Redux Store (`formSlice`)
- **保存形式**: ローカルステート管理のみ（APIコールは無効化されている）

#### 2. 企業側の検索フロー
- **検索ページ**: `/company/search/page.tsx`
- **データ取得**: ダミーデータ（44-71行目でハードコーディング）
- **API呼び出し**: コメントアウトされている（`useSearchSeekers`）

#### 3. バックエンドAPI
- **エンドポイント**: `/api/v2/search/seekers/`
- **実装場所**: `back/core/views_api_v2.py:372` (`search_seekers_v2`関数)
- **機能**: 
  - キーワード、都道府県、業界、経験年数での検索
  - SeekerProfileモデルからデータ取得
  - ページネーション対応

## 実装方法

### ステップ1: 求職者データの永続化

#### 1.1 プロフィール登録時のAPI連携復活
```typescript
// frontend/app/auth/step/step1-profile/page.tsx

// APIフックの有効化
import { useUpdateProfile, useUserProfile } from '@/hooks/useApi';
import useAuthV2 from '@/hooks/useAuthV2';

// handleNextボタンでAPIコール
const handleNext = async () => {
  if (validateForm()) {
    try {
      // APIでプロフィール更新
      await updateProfileMutation.mutateAsync(formData);
      
      // Redux Storeにも保存（キャッシュ用）
      dispatch(updateStepData({ step: 'profile', data: formData }));
      dispatch(markStepCompleted('profile'));
      
      router.push('/auth/step/step2-education');
    } catch (error) {
      toast.error('プロフィール保存に失敗しました');
    }
  }
};
```

### ステップ2: 企業側検索機能の実装

#### 2.1 検索ページでのAPI有効化
```typescript
// frontend/app/company/search/page.tsx

export default function CompanySearchPage() {
  // ダミーデータを削除し、実際のAPIを使用
  const { data: searchResults, isLoading, refetch } = useSearchSeekers(searchParams);
  
  // 認証チェックを有効化
  useEffect(() => {
    if (!authState.isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (authState.user?.role !== 'company') {
      router.push('/');
      toast.error('企業アカウントでログインしてください');
    }
  }, [authState, router]);
  
  // 以下既存の検索・表示ロジック
}
```

#### 2.2 検索結果の表示改善
```typescript
// SeekerCardコンポーネントの更新
function SeekerCard({ seeker, onScout, onViewDetails }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* 実際のデータ構造に合わせて表示 */}
      <h3>{seeker.full_name || `${seeker.last_name} ${seeker.first_name}`}</h3>
      <p>都道府県: {seeker.prefecture}</p>
      <p>経験年数: {seeker.experience_years}年</p>
      <p>希望職種: {seeker.desired_job_type}</p>
      {/* スキルタグ表示 */}
      {seeker.skills && (
        <div className="flex flex-wrap gap-2 mt-2">
          {seeker.skills.map(skill => (
            <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
```

### ステップ3: データ同期の確保

#### 3.1 バックエンドモデルの確認
```python
# back/core/models.py
class SeekerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    first_name_kana = models.CharField(max_length=100)
    last_name_kana = models.CharField(max_length=100)
    birthday = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10)
    phone = models.CharField(max_length=20)
    prefecture = models.CharField(max_length=50)
    experience_years = models.IntegerField(default=0)
    # その他のフィールド
```

#### 3.2 APIレスポンスのフォーマット統一
```python
# back/core/serializers.py
class SeekerProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    skills = serializers.SerializerMethodField()
    
    class Meta:
        model = SeekerProfile
        fields = ['id', 'full_name', 'first_name', 'last_name', 
                 'prefecture', 'experience_years', 'skills', ...]
    
    def get_full_name(self, obj):
        return f"{obj.last_name} {obj.first_name}"
    
    def get_skills(self, obj):
        # 最新の履歴書からスキルを取得
        latest_resume = obj.user.resumes.filter(is_active=True).first()
        if latest_resume and latest_resume.skills:
            return latest_resume.skills.split(',')
        return []
```

### ステップ4: テスト手順

1. **求職者アカウントでログイン**
   - `/auth/login`から求職者としてログイン
   - `/auth/step/step1-profile`でプロフィール登録
   - 各ステップを完了

2. **企業アカウントでログイン**
   - `/auth/company/login`から企業としてログイン
   - `/company/search`で求職者検索
   - 登録した求職者が表示されることを確認

3. **検索機能のテスト**
   - キーワード検索
   - 都道府県フィルター
   - スキルフィルター

## 追加の改善提案

### 1. リアルタイム更新
- WebSocketを使用して、新規求職者登録時にリアルタイムで検索結果を更新

### 2. 検索結果のキャッシュ
- React QueryまたはSWRを使用して検索結果をキャッシュ
- ページネーションの最適化

### 3. 検索条件の保存
- URLパラメータに検索条件を保存
- ブラウザバック時に検索条件を復元

### 4. プロフィール充実度の表示
- プロフィール完成度をパーセンテージで表示
- 必須項目の入力状況を可視化

## 注意事項

1. **認証の有効化**
   - 現在コメントアウトされている認証チェックを有効化する必要があります
   - CORS設定の確認が必要

2. **データマイグレーション**
   - 既存のダミーデータから実データへの移行計画が必要

3. **パフォーマンス**
   - 大量のデータを扱う場合は、インデックスの追加を検討
   - 検索クエリの最適化

4. **セキュリティ**
   - 個人情報の表示制限
   - 企業の閲覧履歴の記録