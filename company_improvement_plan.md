# 企業側システム改善計画

## 📊 現状分析

### テスト結果サマリー
- **API成功率**: 75.0% (45/60テスト成功)
- **主要問題**: プロフィール作成、検索機能、スカウト作成でエラー発生
- **UI問題**: `/company/seekers-scouted`と`/company/seekers-applied`ページのクライアントエラー（修正済み）

### 現在の問題点

#### 1. バックエンドAPI問題
| エンドポイント | 状態 | エラー | 優先度 |
|--------------|------|--------|--------|
| `/api/v2/seeker-profiles/` | ❌ 500エラー | プロフィール作成失敗 | 高 |
| `/api/v2/company-profiles/` | ❌ 500エラー | プロフィール作成失敗 | 高 |
| `/api/v2/search/seekers/` | ❌ 500エラー | 検索機能動作せず | 高 |
| `/api/v2/scouts/` | ❌ 400エラー | 必須フィールド不足 | 中 |
| `/api/v2/applications/` | ⚠️ 機能不足 | 求人投稿機能が未実装 | 低 |

#### 2. フロントエンド問題
| コンポーネント | 問題 | 状態 |
|---------------|------|------|
| `/company/seekers-scouted` | JobSeekerDetailModalプロパティ不足 | ✅ 修正済み |
| `/company/seekers-applied` | JobSeekerDetailModalプロパティ不足 | ✅ 修正済み |
| APIレスポンス処理 | seekerの詳細情報が不足 | 🔧 要改善 |

## 🛠️ 改善実施計画

### Phase 1: 緊急修正（1-2日）

#### 1.1 プロフィール作成API修正
```python
# back/core/views_api_v2.py の修正箇所

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_seeker_profile(request):
    # userフィールドを自動設定
    data = request.data.copy()
    data['user'] = request.user.id
    
    # 必須フィールドのバリデーション
    required_fields = ['first_name', 'last_name', 'first_name_kana', 'last_name_kana']
    for field in required_fields:
        if field not in data:
            return Response(
                {field: ["この項目は必須です。"]}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # プロフィール作成
    serializer = SeekerProfileSerializer(data=data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

#### 1.2 検索API修正
```python
# back/core/views_api_v2.py

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_seekers_v2(request):
    try:
        # クエリパラメータの取得
        prefecture = request.GET.get('prefecture')
        min_experience = request.GET.get('min_experience', 0)
        max_experience = request.GET.get('max_experience', 100)
        
        # 基本クエリセット
        queryset = SeekerProfile.objects.select_related('user').all()
        
        # フィルタリング
        if prefecture:
            queryset = queryset.filter(prefecture=prefecture)
        
        queryset = queryset.filter(
            experience_years__gte=min_experience,
            experience_years__lte=max_experience
        )
        
        # シリアライズして返す
        serializer = SeekerProfileSerializer(queryset, many=True)
        return Response({
            'results': serializer.data,
            'count': queryset.count()
        })
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
```

#### 1.3 スカウト作成API修正
```python
# back/core/views_api_v2.py

class ScoutViewSet(viewsets.ModelViewSet):
    def create(self, request, *args, **kwargs):
        # companyフィールドを自動設定
        data = request.data.copy()
        data['company'] = request.user.id  # 企業ユーザーのIDを自動設定
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # seekerの詳細情報を含めて返す
        scout = serializer.instance
        scout_data = serializer.data
        
        # Seekerの詳細情報を追加
        if scout.seeker:
            seeker_profile = SeekerProfile.objects.filter(user=scout.seeker).first()
            if seeker_profile:
                scout_data['seeker_details'] = SeekerProfileSerializer(seeker_profile).data
        
        return Response(scout_data, status=status.HTTP_201_CREATED)
```

### Phase 2: フロントエンド改善（2-3日）

#### 2.1 APIクライアントの改善
```typescript
// frontend/lib/api-v2-client.ts

async getScoutsWithDetails(): Promise<ScoutWithDetails[]> {
  const response = await this.client.get<Scout[]>('/scouts/');
  const scouts = response.data;
  
  // 各スカウトに対してseeker詳細を取得
  const scoutsWithDetails = await Promise.all(
    scouts.map(async (scout) => {
      if (typeof scout.seeker === 'string') {
        // seekerがIDの場合、詳細を取得
        try {
          const seekerResponse = await this.client.get(`/users/${scout.seeker}/`);
          return {
            ...scout,
            seeker_details: seekerResponse.data
          };
        } catch (error) {
          console.error(`Failed to fetch seeker details for ${scout.seeker}`);
          return scout;
        }
      }
      return scout;
    })
  );
  
  return scoutsWithDetails;
}
```

#### 2.2 企業ダッシュボード強化
```typescript
// frontend/app/company/dashboard/page.tsx

export default function CompanyDashboard() {
  const [stats, setStats] = useState<CompanyDashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    try {
      // 統計データ取得
      const dashboardStats = await apiClient.getCompanyDashboard();
      setStats({
        total_scouts: dashboardStats.scouts_sent_count,
        pending_scouts: dashboardStats.pending_scouts_count,
        accepted_scouts: dashboardStats.accepted_scouts_count,
        total_applications: dashboardStats.applications_received_count,
        new_applications: dashboardStats.new_applications_count,
        job_postings: dashboardStats.active_job_postings_count || 0
      });
      
      // 最近のアクティビティを取得
      const activities = await apiClient.getRecentActivities();
      setRecentActivities(activities);
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('ダッシュボードデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };
  
  // ... rest of component
}
```

### Phase 3: 新機能実装（3-5日）

#### 3.1 求人投稿機能
```typescript
// 新規ファイル: frontend/app/company/jobs/new/page.tsx

export default function NewJobPosting() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const onSubmit = async (data: JobPostingData) => {
    try {
      const response = await apiClient.createJobPosting(data);
      toast.success('求人を投稿しました');
      router.push(`/company/jobs/${response.id}`);
    } catch (error) {
      toast.error('求人投稿に失敗しました');
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* 求人投稿フォーム */}
    </form>
  );
}
```

#### 3.2 メッセージング機能
```typescript
// 新規ファイル: frontend/app/company/messages/page.tsx

export default function CompanyMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  
  // WebSocket接続でリアルタイムメッセージング
  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/messages/`);
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleNewMessage(message);
    };
    
    return () => ws.close();
  }, []);
  
  // ... メッセージング実装
}
```

## 📋 実装チェックリスト

### 緊急対応（Phase 1）
- [ ] SeekerProfile作成API修正
- [ ] CompanyProfile作成API修正
- [ ] 検索API修正（500エラー解消）
- [ ] スカウト作成API修正（companyフィールド自動設定）
- [ ] エラーログの詳細化

### フロントエンド改善（Phase 2）
- [ ] APIクライアントのエラーハンドリング強化
- [ ] スカウト一覧でseeker詳細表示
- [ ] 応募一覧でapplicant詳細表示
- [ ] ローディング状態の改善
- [ ] エラーメッセージのユーザーフレンドリー化

### 新機能開発（Phase 3）
- [ ] 求人投稿CRUD機能
- [ ] メッセージング機能
- [ ] 通知システム
- [ ] レポート・分析機能
- [ ] 一括スカウト機能

## 🎯 KPI目標

### 技術指標
- API成功率: 75% → 95%以上
- ページロード時間: 3秒以内
- エラー発生率: 5%以下

### ビジネス指標
- 企業ユーザー満足度向上
- スカウト送信数増加
- マッチング率向上

## 📅 実装スケジュール

| Phase | 期間 | 優先度 | 担当 |
|-------|------|--------|------|
| Phase 1: 緊急修正 | 1-2日 | 高 | バックエンド |
| Phase 2: フロント改善 | 2-3日 | 中 | フロントエンド |
| Phase 3: 新機能 | 3-5日 | 低 | フルスタック |

## 🔍 テスト計画

### 単体テスト
```python
# back/core/tests/test_api_v2.py

class TestCompanyAPIs(TestCase):
    def test_profile_creation(self):
        # プロフィール作成テスト
        pass
    
    def test_seeker_search(self):
        # 検索機能テスト
        pass
    
    def test_scout_creation(self):
        # スカウト作成テスト
        pass
```

### 統合テスト
- 全APIエンドポイントの動作確認
- フロントエンド-バックエンド連携テスト
- パフォーマンステスト

### ユーザー受け入れテスト
- 企業ユーザーによる実際の操作テスト
- フィードバック収集
- 改善点の洗い出し

## 📝 ドキュメント更新

### 必要なドキュメント
1. API仕様書の更新
2. エラーコード一覧
3. トラブルシューティングガイド
4. 企業ユーザー向け操作マニュアル

## 🚀 デプロイ計画

### ステージング環境
1. Phase 1完了後、ステージング環境にデプロイ
2. 内部テスト実施
3. バグ修正

### 本番環境
1. ステージングでの検証完了後
2. メンテナンス時間の告知
3. 段階的ロールアウト

## ⚠️ リスクと対策

| リスク | 影響度 | 対策 |
|--------|--------|------|
| データ移行エラー | 高 | バックアップとロールバック計画 |
| パフォーマンス低下 | 中 | キャッシュ戦略とDB最適化 |
| ユーザー混乱 | 低 | 事前告知と操作ガイド提供 |

## 📞 サポート体制

- 技術サポート: 開発チーム
- ユーザーサポート: カスタマーサクセス
- 緊急対応: オンコール体制

---

**最終更新日**: 2025-09-01
**バージョン**: 1.0.0