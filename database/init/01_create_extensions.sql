-- PostgreSQL拡張機能の有効化
-- UUIDサポート
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 全文検索サポート（日本語）
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 統計情報（クエリパフォーマンス監視）
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- JSON操作の高速化
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- 地理情報サポート（将来の位置情報機能用）
-- CREATE EXTENSION IF NOT EXISTS "postgis";

-- 基本的な設定
ALTER DATABASE resume_truemee SET timezone TO 'Asia/Tokyo';
ALTER DATABASE resume_truemee SET default_text_search_config TO 'pg_catalog.simple';
