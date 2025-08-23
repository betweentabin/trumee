# SQLite採用のメリットと最適化戦略

## なぜSQLiteが最適なのか

### 1. 開発・運用の簡素化
- **インストール不要**: Pythonに標準搭載
- **設定不要**: データベースサーバーの管理が不要
- **バックアップ簡単**: ファイルコピーだけでバックアップ完了
- **ポータビリティ**: 開発環境と本番環境で同じDB使用可能

### 2. パフォーマンス特性
- **高速**: 中規模サービス（〜10万ユーザー）には十分な性能
- **低レイテンシ**: ネットワーク通信がないため応答が速い
- **効率的**: メモリ使用量が少ない

### 3. 機械学習との相性
```python
# SQLiteから直接pandasデータフレームへ
import pandas as pd
import sqlite3

conn = sqlite3.connect('db.sqlite3')
df = pd.read_sql_query("SELECT * FROM resumes", conn)
# そのまま機械学習処理へ
```

## SQLite最適化設定

### 1. Django設定での最適化
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
        'OPTIONS': {
            'init_command': (
                "PRAGMA journal_mode=WAL;"     # 同時読み書き性能向上
                "PRAGMA synchronous=NORMAL;"   # 書き込み性能向上
                "PRAGMA cache_size=10000;"     # キャッシュ10MB
                "PRAGMA temp_store=MEMORY;"    # 一時データをメモリに
                "PRAGMA mmap_size=268435456;"  # メモリマップ256MB
            ),
        }
    }
}
```

### 2. パフォーマンスチューニング

#### インデックス戦略
```python
class SeekerProfile(models.Model):
    # ... fields ...
    
    class Meta:
        indexes = [
            models.Index(fields=['prefecture', 'experience_years']),  # 複合インデックス
            models.Index(fields=['current_salary']),
            models.Index(fields=['-created_at']),  # 降順インデックス
        ]
```

#### バッチ処理の最適化
```python
# 大量データ挿入時
from django.db import transaction

with transaction.atomic():
    SeekerProfile.objects.bulk_create([
        SeekerProfile(...) for _ in range(10000)
    ], batch_size=1000)
```

### 3. スケーリング戦略

#### 読み取り専用レプリカ
```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    },
    'replica': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db_replica.sqlite3',
    }
}

# 読み取りクエリをレプリカへ
class ReadOnlyRouter:
    def db_for_read(self, model, **hints):
        return 'replica'
    
    def db_for_write(self, model, **hints):
        return 'default'
```

#### データ分割戦略
```python
# 古いデータを別DBへアーカイブ
DATABASES['archive'] = {
    'ENGINE': 'django.db.backends.sqlite3',
    'NAME': BASE_DIR / 'archive.sqlite3',
}

# 1年以上前のデータをアーカイブ
def archive_old_data():
    cutoff_date = timezone.now() - timedelta(days=365)
    old_records = JobApplication.objects.filter(
        created_at__lt=cutoff_date
    )
    # アーカイブDBへ移動
```

## SQLiteの制限と対策

### 制限事項
1. **同時書き込み**: 1つのプロセスのみ
2. **データベースサイズ**: 推奨〜100GB
3. **同時接続数**: 推奨〜100接続

### 対策
1. **Write-Ahead Logging (WAL)**: 同時読み書き改善
2. **接続プール管理**: Django標準の接続管理で十分
3. **キャッシュ活用**: Redis/Memcachedで負荷軽減

## 移行パス

### Phase 1: SQLiteでスタート（〜10万ユーザー）
- 開発・運用コスト最小
- 高速な開発サイクル
- 簡単なバックアップ・リストア

### Phase 2: 必要に応じてPostgreSQLへ
```bash
# SQLiteからPostgreSQLへの移行は簡単
python manage.py dumpdata > data.json
# PostgreSQL設定に変更
python manage.py migrate
python manage.py loaddata data.json
```

## コスト削減効果

| 項目 | PostgreSQL | SQLite | 削減額 |
|------|------------|--------|--------|
| DB運用費 | 月5,000円 | 0円 | 5,000円 |
| 管理工数 | 月20時間 | 月2時間 | 18時間 |
| バックアップ | 月1,000円 | 0円 | 1,000円 |
| **合計** | **月6,000円+20時間** | **0円+2時間** | **6,000円+18時間** |

## まとめ

SQLiteは以下の理由で最適な選択です：

1. **即座に開発開始可能**: 設定不要で今すぐ始められる
2. **運用コスト0円**: データベースサーバー不要
3. **十分な性能**: 中規模サービスには十分
4. **機械学習に最適**: ローカルファイルで高速アクセス
5. **将来の拡張性**: PostgreSQLへの移行パスが明確

「まずSQLiteで素早く立ち上げ、必要になったらPostgreSQLへ」という段階的アプローチが、コストと開発速度の両面で最適です。