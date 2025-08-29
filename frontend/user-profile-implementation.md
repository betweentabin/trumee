# ユーザープロフィールページ実装計画

## 現状分析

### 既存のユーザー関連ページ
- `/users/page.tsx` - 静的なマイページ（山田太郎さん固定）
- `/users/myinfo/*` - ユーザー情報管理ページ群
- `/seeker/dashboard` - 求職者ダッシュボード
- `/company/dashboard` - 企業ダッシュボード

### 課題
現在のusersページは静的で、個別ユーザーのプロフィールページが存在しない

## 実装要件

### 1. 動的ユーザープロフィールページ
**パス**: `/users/[userId]/page.tsx`

#### 機能要件
- ユーザーIDに基づいた個別プロフィール表示
- 公開/非公開情報の適切な表示制御
- 自分のプロフィール vs 他人のプロフィールの表示分岐

#### 表示情報
**公開情報（誰でも閲覧可能）**:
- 名前（または表示名）
- プロフィール画像
- 自己紹介
- スキルセット
- 公開履歴書（is_activeがtrueのもの）
- 希望職種・業界（公開設定の場合）

**非公開情報（本人のみ閲覧可能）**:
- メールアドレス
- 電話番号
- 詳細な個人情報
- 非公開履歴書
- 応募履歴
- スカウト受信履歴

### 2. API要件

#### 必要なAPIエンドポイント
```typescript
// ユーザープロフィール取得
GET /api/v2/users/{userId}
Response: {
  id: string;
  email?: string; // 本人のみ
  full_name: string;
  profile_image?: string;
  bio?: string;
  skills: string[];
  desired_job?: string;
  desired_industries?: string[];
  is_public: boolean;
  resumes?: Resume[]; // 公開履歴書のみ
  created_at: string;
  updated_at: string;
}

// プロフィール更新
PATCH /api/v2/users/{userId}
Body: Partial<UserProfile>
```

### 3. コンポーネント構成

```
/users/[userId]/
├── page.tsx              # メインページ
├── ProfileHeader.tsx     # プロフィールヘッダー
├── ProfileInfo.tsx       # 基本情報表示
├── SkillSection.tsx      # スキル表示
├── ResumeSection.tsx     # 履歴書一覧
└── EditProfileModal.tsx  # プロフィール編集モーダル
```

### 4. 実装ステップ

#### Step 1: ルーティング設定
- `/users/[userId]/page.tsx` の作成
- 動的ルーティングの実装

#### Step 2: API統合
- ユーザープロフィール取得API実装
- 認証チェックと権限制御

#### Step 3: UIコンポーネント実装
- プロフィールヘッダー
- 情報表示セクション
- 編集機能（本人のみ）

#### Step 4: プライバシー制御
- 公開/非公開設定の実装
- 表示権限のチェック

### 5. セキュリティ考慮事項

- **認証チェック**: 非公開情報へのアクセス制御
- **CSRF対策**: プロフィール更新時のトークン検証
- **データバリデーション**: 入力値の検証
- **レート制限**: API呼び出しの制限

### 6. UI/UXデザイン

#### レイアウト
```
┌─────────────────────────────────────┐
│      プロフィール画像 | 名前         │
│      自己紹介文                     │
├─────────────────────────────────────┤
│ スキル                              │
│ ・React ・TypeScript ・Node.js      │
├─────────────────────────────────────┤
│ 公開履歴書                          │
│ ・エンジニア向け履歴書              │
│ ・マーケティング向け履歴書          │
└─────────────────────────────────────┘
```

#### 編集モード（本人のみ）
- インライン編集
- モーダルダイアログでの詳細編集
- リアルタイムプレビュー

### 7. 既存ページとの統合

- `/users/page.tsx` → リダイレクト to `/users/[currentUserId]`
- ナビゲーションリンクの更新
- ダッシュボードからのリンク追加

### 8. テスト要件

- ユニットテスト: 各コンポーネント
- 統合テスト: API連携
- E2Eテスト: ユーザーフロー
- セキュリティテスト: 権限チェック

## 実装優先順位

1. **高**: 基本的なプロフィール表示
2. **高**: 認証と権限制御
3. **中**: プロフィール編集機能
4. **中**: 履歴書表示
5. **低**: 詳細な統計情報表示

## バックエンドAPI実装詳細

### Django モデル実装

#### 1. 新規モデルの作成
```python
# core/models.py に追加

class UserPrivacySettings(models.Model):
    """ユーザープロフィール公開設定"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='privacy_settings')
    is_profile_public = models.BooleanField(default=False)
    show_email = models.BooleanField(default=False)
    show_phone = models.BooleanField(default=False)
    show_birthday = models.BooleanField(default=False)
    show_full_name = models.BooleanField(default=True)
    show_resumes = models.BooleanField(default=True)
    show_skills = models.BooleanField(default=True)
    show_experience = models.BooleanField(default=True)
    searchable = models.BooleanField(default=True)
    profile_url_slug = models.SlugField(max_length=100, unique=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_privacy_settings'

class UserProfileExtension(models.Model):
    """プロフィール拡張情報"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile_extension')
    profile_image_url = models.URLField(max_length=500, blank=True)
    cover_image_url = models.URLField(max_length=500, blank=True)
    bio = models.TextField(blank=True)
    headline = models.CharField(max_length=200, blank=True)
    location = models.CharField(max_length=100, blank=True)
    website_url = models.URLField(max_length=500, blank=True)
    linkedin_url = models.URLField(max_length=500, blank=True)
    github_url = models.URLField(max_length=500, blank=True)
    twitter_url = models.URLField(max_length=500, blank=True)
    portfolio_url = models.URLField(max_length=500, blank=True)
    available_for_work = models.BooleanField(default=True)
    preferred_contact_method = models.CharField(max_length=20, choices=[
        ('email', 'Email'),
        ('phone', 'Phone'),
        ('message', 'Message')
    ], default='email')
    languages = models.JSONField(default=list, blank=True)
    interests = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_profile_extensions'
```

#### 2. シリアライザー実装
```python
# core/serializers.py に追加

class PublicUserProfileSerializer(serializers.ModelSerializer):
    """公開プロフィール用シリアライザー"""
    profile_extension = serializers.SerializerMethodField()
    resumes = serializers.SerializerMethodField()
    skills = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'full_name', 'profile_extension', 'resumes', 'skills']
    
    def get_profile_extension(self, obj):
        if hasattr(obj, 'profile_extension'):
            return {
                'bio': obj.profile_extension.bio,
                'headline': obj.profile_extension.headline,
                'profile_image_url': obj.profile_extension.profile_image_url,
                'location': obj.profile_extension.location,
                'available_for_work': obj.profile_extension.available_for_work,
            }
        return None
    
    def get_resumes(self, obj):
        # プライバシー設定を確認
        if hasattr(obj, 'privacy_settings') and obj.privacy_settings.show_resumes:
            active_resumes = obj.resumes.filter(is_active=True)
            return ResumeSerializer(active_resumes, many=True).data
        return []
    
    def get_skills(self, obj):
        if hasattr(obj, 'privacy_settings') and obj.privacy_settings.show_skills:
            # スキル情報を返す
            return obj.skills if hasattr(obj, 'skills') else []
        return []

class PrivateUserProfileSerializer(serializers.ModelSerializer):
    """非公開情報を含む完全プロフィールシリアライザー"""
    profile_extension = UserProfileExtensionSerializer(read_only=True)
    privacy_settings = UserPrivacySettingsSerializer(read_only=True)
    seeker_profile = SeekerProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = '__all__'
```

#### 3. ビュー実装
```python
# core/views_api_v2.py に追加

@api_view(['GET', 'PATCH'])
@permission_classes([AllowAny])
def user_public_profile(request, user_id):
    """
    公開ユーザープロフィール取得・更新
    GET /api/v2/users/{user_id}/
    PATCH /api/v2/users/{user_id}/ (本人のみ)
    """
    try:
        user = User.objects.select_related(
            'privacy_settings',
            'profile_extension',
            'seeker_profile'
        ).prefetch_related(
            'resumes'
        ).get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    if request.method == 'GET':
        # プロフィール閲覧履歴を記録
        if request.user.is_authenticated:
            ProfileViewLog.objects.create(
                viewed_user=user,
                viewer_user=request.user,
                is_authenticated=True
            )
        
        # プライバシー設定を確認
        if not hasattr(user, 'privacy_settings'):
            # デフォルトのプライバシー設定を作成
            UserPrivacySettings.objects.create(user=user)
        
        # 本人かどうかチェック
        is_owner = request.user.is_authenticated and request.user.id == user.id
        
        if is_owner:
            # 本人の場合は全情報を返す
            serializer = PrivateUserProfileSerializer(user)
        else:
            # 他人の場合は公開情報のみ
            if not user.privacy_settings.is_profile_public:
                return Response({'error': 'This profile is private'}, status=403)
            serializer = PublicUserProfileSerializer(user)
        
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        # 本人のみ更新可能
        if not request.user.is_authenticated or request.user.id != user.id:
            return Response({'error': 'Unauthorized'}, status=403)
        
        # プロフィール更新処理
        serializer = PrivateUserProfileSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_privacy_settings(request, user_id):
    """
    プライバシー設定の取得・更新
    GET /api/v2/users/{user_id}/privacy/
    PUT /api/v2/users/{user_id}/privacy/
    """
    # 本人のみアクセス可能
    if request.user.id != user_id:
        return Response({'error': 'Unauthorized'}, status=403)
    
    privacy_settings, created = UserPrivacySettings.objects.get_or_create(
        user_id=user_id
    )
    
    if request.method == 'GET':
        serializer = UserPrivacySettingsSerializer(privacy_settings)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = UserPrivacySettingsSerializer(
            privacy_settings, 
            data=request.data
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
```

#### 4. URL設定
```python
# core/urls_api_v2.py に追加

urlpatterns = [
    # ユーザープロフィール
    path('users/<uuid:user_id>/', views.user_public_profile, name='user_public_profile'),
    path('users/<uuid:user_id>/privacy/', views.user_privacy_settings, name='user_privacy_settings'),
    path('users/<uuid:user_id>/stats/', views.user_profile_stats, name='user_profile_stats'),
    path('users/<uuid:user_id>/resumes/', views.user_public_resumes, name='user_public_resumes'),
]
```

### APIレスポンス例

#### 公開プロフィール（他人が見た場合）
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "full_name": "山田 太郎",
  "profile_extension": {
    "bio": "フルスタックエンジニアとして5年の経験があります。",
    "headline": "React/Node.js エンジニア",
    "profile_image_url": "https://example.com/profile.jpg",
    "location": "東京都",
    "available_for_work": true
  },
  "resumes": [
    {
      "id": "456e7890-e89b-12d3-a456-426614174111",
      "title": "エンジニア向け履歴書",
      "description": "Web開発経験を中心にまとめました"
    }
  ],
  "skills": ["React", "TypeScript", "Node.js", "PostgreSQL"]
}
```

#### 非公開プロフィール（本人が見た場合）
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "yamada@example.com",
  "full_name": "山田 太郎",
  "phone": "090-1234-5678",
  "profile_extension": {
    // 全フィールド
  },
  "privacy_settings": {
    "is_profile_public": true,
    "show_email": false,
    "show_phone": false,
    // その他の設定
  },
  "seeker_profile": {
    // 求職者詳細情報
  },
  "resumes": [
    // 全履歴書（非公開含む）
  ],
  "applications": [
    // 応募履歴
  ],
  "scouts": [
    // スカウト履歴
  ]
}
```

## データベース設計

### 現在のデータベース構造

#### 既存テーブル
```sql
-- users テーブル（Django AbstractUser拡張）
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(254) UNIQUE NOT NULL,
    username VARCHAR(150) NOT NULL,
    role VARCHAR(10) NOT NULL, -- 'user' or 'company'
    full_name VARCHAR(100),
    kana VARCHAR(100),
    gender VARCHAR(10),
    company_name VARCHAR(200),
    phone VARCHAR(20),
    is_premium BOOLEAN DEFAULT FALSE,
    premium_expiry TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- seeker_profiles テーブル
CREATE TABLE seeker_profiles (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    first_name_kana VARCHAR(50),
    last_name_kana VARCHAR(50),
    birthday DATE,
    prefecture VARCHAR(20),
    faculty VARCHAR(100),
    graduation_year INTEGER,
    experience_years INTEGER,
    current_salary VARCHAR(50),
    desired_salary VARCHAR(50),
    skill_vector JSONB,
    profile_embeddings JSONB,
    updated_at TIMESTAMP
);

-- resumes テーブル
CREATE TABLE resumes (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    title VARCHAR(200),
    description TEXT,
    objective TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    skills TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### 必要な新規テーブル・フィールド

#### 1. プロフィール公開設定テーブル
```sql
-- user_privacy_settings テーブル（新規）
CREATE TABLE user_privacy_settings (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    is_profile_public BOOLEAN DEFAULT FALSE,
    show_email BOOLEAN DEFAULT FALSE,
    show_phone BOOLEAN DEFAULT FALSE,
    show_birthday BOOLEAN DEFAULT FALSE,
    show_full_name BOOLEAN DEFAULT TRUE,
    show_resumes BOOLEAN DEFAULT TRUE,
    show_skills BOOLEAN DEFAULT TRUE,
    show_experience BOOLEAN DEFAULT TRUE,
    searchable BOOLEAN DEFAULT TRUE, -- 検索結果に表示するか
    profile_url_slug VARCHAR(100) UNIQUE, -- カスタムURL用
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_privacy_user ON user_privacy_settings(user_id);
CREATE INDEX idx_privacy_slug ON user_privacy_settings(profile_url_slug);
```

#### 2. プロフィール追加情報テーブル
```sql
-- user_profile_extensions テーブル（新規）
CREATE TABLE user_profile_extensions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    profile_image_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    bio TEXT, -- 自己紹介
    headline VARCHAR(200), -- キャッチフレーズ
    location VARCHAR(100),
    website_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    twitter_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    available_for_work BOOLEAN DEFAULT TRUE,
    preferred_contact_method VARCHAR(20), -- 'email', 'phone', 'message'
    languages JSONB, -- [{name: '日本語', level: 'native'}, ...]
    interests JSONB, -- ['AI', 'Web開発', ...]
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_profile_ext_user ON user_profile_extensions(user_id);
CREATE INDEX idx_profile_available ON user_profile_extensions(available_for_work);
```

#### 3. プロフィール閲覧履歴テーブル
```sql
-- profile_view_logs テーブル（新規）
CREATE TABLE profile_view_logs (
    id UUID PRIMARY KEY,
    viewed_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    viewer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    viewer_ip VARCHAR(45),
    viewer_user_agent TEXT,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    referrer VARCHAR(500),
    is_authenticated BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_view_logs_viewed ON profile_view_logs(viewed_user_id);
CREATE INDEX idx_view_logs_viewer ON profile_view_logs(viewer_user_id);
CREATE INDEX idx_view_logs_date ON profile_view_logs(viewed_at);
```

#### 4. スキルマスターテーブル
```sql
-- skill_master テーブル（新規）
CREATE TABLE skill_master (
    id UUID PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50), -- 'programming', 'language', 'tool', etc.
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- user_skills 中間テーブル（新規）
CREATE TABLE user_skills (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skill_master(id) ON DELETE CASCADE,
    proficiency_level INTEGER CHECK (proficiency_level BETWEEN 1 AND 5),
    years_of_experience DECIMAL(3,1),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    UNIQUE(user_id, skill_id)
);

CREATE INDEX idx_user_skills_user ON user_skills(user_id);
CREATE INDEX idx_user_skills_skill ON user_skills(skill_id);
CREATE INDEX idx_user_skills_primary ON user_skills(is_primary);
```

### 既存テーブルへの追加フィールド

#### users テーブルへの追加
```sql
ALTER TABLE users ADD COLUMN profile_completion_rate INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_profile_update TIMESTAMP;
ALTER TABLE users ADD COLUMN profile_views_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN verified_at TIMESTAMP;
```

### インデックス設計

#### パフォーマンス最適化のためのインデックス
```sql
-- 複合インデックス
CREATE INDEX idx_users_role_active ON users(role, is_active);
CREATE INDEX idx_users_premium ON users(is_premium, premium_expiry);

-- 部分インデックス（PostgreSQL）
CREATE INDEX idx_public_profiles ON user_privacy_settings(user_id) 
WHERE is_profile_public = TRUE;

-- テキスト検索インデックス
CREATE INDEX idx_bio_search ON user_profile_extensions 
USING GIN(to_tsvector('japanese', bio));
```

### マイグレーション計画

#### Phase 1: 基本構造の追加（1週目）
1. `user_privacy_settings` テーブル作成
2. `user_profile_extensions` テーブル作成
3. 既存ユーザーにデフォルト設定を作成

#### Phase 2: 機能拡張（2週目）
1. `profile_view_logs` テーブル作成
2. スキル関連テーブル作成
3. 既存データの移行

#### Phase 3: 最適化（3週目）
1. インデックスの追加
2. パフォーマンステスト
3. 必要に応じてキャッシュ実装

### データベース トリガー・関数

#### プロフィール完成度自動計算
```sql
CREATE OR REPLACE FUNCTION calculate_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
    completion_rate INTEGER := 0;
BEGIN
    -- 基本情報: 30%
    IF NEW.full_name IS NOT NULL THEN
        completion_rate := completion_rate + 10;
    END IF;
    IF NEW.email IS NOT NULL THEN
        completion_rate := completion_rate + 10;
    END IF;
    IF NEW.phone IS NOT NULL THEN
        completion_rate := completion_rate + 10;
    END IF;
    
    -- プロフィール拡張: 40%
    -- (profile_extensions, skills, etc.)
    
    -- 履歴書: 30%
    -- (active resumes count)
    
    UPDATE users SET profile_completion_rate = completion_rate 
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profile_completion
AFTER INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION calculate_profile_completion();
```

### バックアップ・リストア戦略

#### 定期バックアップ
- 日次: 全テーブルの論理バックアップ
- 週次: 物理バックアップ（PITR用）
- 月次: アーカイブ用フルバックアップ

#### 重要データの冗長化
```sql
-- プロフィール変更履歴テーブル
CREATE TABLE user_profile_history (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    changed_fields JSONB,
    old_values JSONB,
    new_values JSONB,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by UUID REFERENCES users(id)
);
```

### セキュリティ考慮事項

#### Row Level Security (RLS)
```sql
-- PostgreSQL RLS例
ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY privacy_settings_policy ON user_privacy_settings
    FOR ALL
    TO authenticated_users
    USING (user_id = current_user_id() OR is_admin());
```

#### データマスキング
```sql
-- 個人情報のマスキング関数
CREATE OR REPLACE FUNCTION mask_email(email TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN CONCAT(
        LEFT(email, 3),
        '****',
        SUBSTRING(email FROM POSITION('@' IN email))
    );
END;
$$ LANGUAGE plpgsql;
```

### パフォーマンス最適化

#### マテリアライズドビュー
```sql
-- 公開プロフィール用のマテリアライズドビュー
CREATE MATERIALIZED VIEW public_profiles AS
SELECT 
    u.id,
    u.full_name,
    pe.bio,
    pe.headline,
    pe.profile_image_url,
    pe.location,
    array_agg(DISTINCT s.name) as skills
FROM users u
JOIN user_privacy_settings ps ON u.id = ps.user_id
LEFT JOIN user_profile_extensions pe ON u.id = pe.user_id
LEFT JOIN user_skills us ON u.id = us.user_id
LEFT JOIN skill_master s ON us.skill_id = s.id
WHERE ps.is_profile_public = TRUE
GROUP BY u.id, u.full_name, pe.bio, pe.headline, pe.profile_image_url, pe.location;

CREATE UNIQUE INDEX ON public_profiles(id);
```

#### キャッシュ戦略
- Redis: セッション、頻繁にアクセスされるプロフィール
- CDN: プロフィール画像、静的アセット
- アプリケーションキャッシュ: スキルマスター、定数データ

## 実装タイムライン

### Week 1: バックエンド基盤構築
- Day 1-2: データベーススキーマ設計とマイグレーション作成
- Day 3-4: Django モデルとシリアライザー実装
- Day 5: API エンドポイント実装とテスト

### Week 2: フロントエンド実装
- Day 1-2: 動的ルーティングと基本コンポーネント
- Day 3-4: プロフィール表示機能
- Day 5: 編集機能とプライバシー設定

### Week 3: 統合とテスト
- Day 1-2: API統合とエラーハンドリング
- Day 3: セキュリティテスト
- Day 4-5: パフォーマンステストと最適化

## マイグレーションファイルサンプル

```python
# core/migrations/0002_user_profile_extensions.py

from django.db import migrations, models
import django.db.models.deletion
import uuid

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserPrivacySettings',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ('is_profile_public', models.BooleanField(default=False)),
                ('show_email', models.BooleanField(default=False)),
                ('show_phone', models.BooleanField(default=False)),
                ('show_birthday', models.BooleanField(default=False)),
                ('show_full_name', models.BooleanField(default=True)),
                ('show_resumes', models.BooleanField(default=True)),
                ('show_skills', models.BooleanField(default=True)),
                ('show_experience', models.BooleanField(default=True)),
                ('searchable', models.BooleanField(default=True)),
                ('profile_url_slug', models.SlugField(blank=True, max_length=100, null=True, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='privacy_settings', to='core.user')),
            ],
            options={
                'db_table': 'user_privacy_settings',
            },
        ),
        migrations.CreateModel(
            name='UserProfileExtension',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ('profile_image_url', models.URLField(blank=True, max_length=500)),
                ('cover_image_url', models.URLField(blank=True, max_length=500)),
                ('bio', models.TextField(blank=True)),
                ('headline', models.CharField(blank=True, max_length=200)),
                ('location', models.CharField(blank=True, max_length=100)),
                ('website_url', models.URLField(blank=True, max_length=500)),
                ('linkedin_url', models.URLField(blank=True, max_length=500)),
                ('github_url', models.URLField(blank=True, max_length=500)),
                ('twitter_url', models.URLField(blank=True, max_length=500)),
                ('portfolio_url', models.URLField(blank=True, max_length=500)),
                ('available_for_work', models.BooleanField(default=True)),
                ('preferred_contact_method', models.CharField(
                    choices=[('email', 'Email'), ('phone', 'Phone'), ('message', 'Message')], 
                    default='email', 
                    max_length=20
                )),
                ('languages', models.JSONField(blank=True, default=list)),
                ('interests', models.JSONField(blank=True, default=list)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='profile_extension', to='core.user')),
            ],
            options={
                'db_table': 'user_profile_extensions',
            },
        ),
        migrations.RunPython(
            code=create_default_privacy_settings,
            reverse_code=migrations.RunPython.noop
        ),
    ]

def create_default_privacy_settings(apps, schema_editor):
    """既存ユーザーにデフォルトのプライバシー設定を作成"""
    User = apps.get_model('core', 'User')
    UserPrivacySettings = apps.get_model('core', 'UserPrivacySettings')
    
    for user in User.objects.all():
        UserPrivacySettings.objects.get_or_create(
            user=user,
            defaults={
                'is_profile_public': False,
                'show_full_name': True,
                'show_resumes': True,
                'show_skills': True,
            }
        )
```

## まとめ

このドキュメントでは、ユーザープロフィールページの実装に必要な以下の要素を定義しました：

1. **フロントエンド実装**: 動的ルーティング、コンポーネント構成、API統合
2. **バックエンドAPI**: Django モデル、シリアライザー、ビュー、URL設定
3. **データベース設計**: 新規テーブル、インデックス、マイグレーション計画
4. **セキュリティ**: プライバシー制御、認証、データマスキング
5. **パフォーマンス**: キャッシュ戦略、マテリアライズドビュー、最適化

### 次のステップ
1. データベースマイグレーションの実行
2. バックエンドAPIの実装とテスト
3. フロントエンドコンポーネントの作成
4. 統合テストとセキュリティレビュー
5. 本番環境へのデプロイ