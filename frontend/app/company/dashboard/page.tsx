'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppSelector } from '@/app/redux/hooks';
import useAuthV2 from '@/hooks/useAuthV2';
import { 
  useDashboardStats, 
  useSearchSeekers, 
  useApplications,
  useScouts,
  useMessages,
  useUnreadCount 
} from '@/hooks/useApi';
import { Search, Users, Send, Mail, BarChart3, TrendingUp, Calendar, Filter } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function CompanyDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const parts = (pathname || '').split('/').filter(Boolean);
  const companyIdFromPath = parts[0] === 'company' && parts[1] && parts[1] !== 'dashboard' ? parts[1] : null;
  const companyPrefix = companyIdFromPath ? `/company/${companyIdFromPath}` : '/company';
  const authState = useAppSelector(state => state.auth);
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: unreadCount } = useUnreadCount();

  // ページ読み込み時の初期化
  useEffect(() => {
    console.log('🏢 Company dashboard: Loading without auth checks');
  }, []);

  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'scouts' | 'messages'>('overview');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                企業ダッシュボード
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {authState.user?.company_name || authState.user?.email}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={`${companyPrefix}/search`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Search size={18} />
                求職者を検索
              </Link>
              <div className="relative">
                <Link
                  href="/company/messages"
                  className="p-2 text-gray-600 hover:text-gray-900 relative"
                >
                  <Mail size={24} />
                  {unreadCount?.count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount.count}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="応募者数"
            value={stats?.applications || 0}
            icon={<Users className="text-blue-600" />}
            trend="+12%"
            trendUp={true}
          />
          <StatCard
            title="送信スカウト"
            value={stats?.scouts_sent || 0}
            icon={<Send className="text-green-600" />}
            trend="+8%"
            trendUp={true}
          />
          <StatCard
            title="未読メッセージ"
            value={stats?.unread_messages || 0}
            icon={<Mail className="text-orange-600" />}
            trend=""
            trendUp={false}
          />
          <StatCard
            title="掲載中の求人"
            value={stats?.active_jobs || 0}
            icon={<BarChart3 className="text-purple-600" />}
            trend="+2"
            trendUp={true}
          />
        </div>

        {/* スカウト残数インフォ */}
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              {(() => {
                const used = (stats as any)?.scout_credits_used ?? 0;
                const total = (stats as any)?.scout_credits_total ?? 100;
                const remaining = (stats as any)?.scout_credits_remaining ?? Math.max(0, total - used);
                return (
                  <>
                    スカウト残数: <span className="font-bold">{remaining}</span> / {total}（累計送信: {used}）
                  </>
                );
              })()}
            </div>
            <div className="text-sm">
              100通に達した場合、
              <a href="/companyinfo/payment" className="underline font-semibold">追加100通（¥10,000）</a>
              の購入が可能です。
            </div>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b">
            <nav className="flex -mb-px">
              <TabButton
                active={activeTab === 'overview'}
                onClick={() => setActiveTab('overview')}
                label="概要"
              />
              <TabButton
                active={activeTab === 'applications'}
                onClick={() => setActiveTab('applications')}
                label="応募者管理"
                badge={stats?.applications}
              />
              <TabButton
                active={activeTab === 'scouts'}
                onClick={() => setActiveTab('scouts')}
                label="スカウト管理"
                badge={stats?.scouts_sent}
              />
              <TabButton
                active={activeTab === 'messages'}
                onClick={() => setActiveTab('messages')}
                label="メッセージ"
                badge={unreadCount?.count}
              />
            </nav>
          </div>

          {/* タブコンテンツ */}
          <div className="p-6">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'applications' && <ApplicationsTab />}
            {activeTab === 'scouts' && <ScoutsTab />}
            {activeTab === 'messages' && <MessagesTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

// 統計カードコンポーネント
function StatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  trendUp 
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  trend: string; 
  trendUp: boolean;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
        {trend && (
          <span className={`text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      <p className="text-sm text-gray-600 mt-1">{title}</p>
    </div>
  );
}

// タブボタンコンポーネント
function TabButton({ 
  active, 
  onClick, 
  label, 
  badge 
}: { 
  active: boolean; 
  onClick: () => void; 
  label: string; 
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-600 hover:text-gray-900'
      }`}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}

// 概要タブ
function OverviewTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近の応募者 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">最近の応募者</h3>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">山田 太郎</p>
                    <p className="text-sm text-gray-600">エンジニア・5年経験</p>
                  </div>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  詳細を見る
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* アクティビティ */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">最近のアクティビティ</h3>
          <div className="space-y-3">
            {[
              { action: 'スカウト送信', user: '佐藤 花子', time: '2時間前' },
              { action: '新規応募', user: '鈴木 一郎', time: '3時間前' },
              { action: 'メッセージ受信', user: '田中 美咲', time: '5時間前' },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between p-3 border-l-4 border-blue-500 bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.user}</p>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* クイックアクション */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">クイックアクション</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href={`${companyPrefix}/search`}
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-sm transition"
          >
            <Search className="text-blue-600 mb-2" />
            <p className="font-medium text-gray-900">求職者を検索</p>
            <p className="text-sm text-gray-600 mt-1">条件に合う人材を探す</p>
          </Link>
          <Link
            href={`${companyPrefix}/jobs/new`}
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-sm transition"
          >
            <Calendar className="text-green-600 mb-2" />
            <p className="font-medium text-gray-900">求人を掲載</p>
            <p className="text-sm text-gray-600 mt-1">新しい求人を作成</p>
          </Link>
          <Link
            href="/companyinfo"
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-sm transition"
          >
            <Filter className="text-purple-600 mb-2" />
            <p className="font-medium text-gray-900">設定</p>
            <p className="text-sm text-gray-600 mt-1">企業情報を更新</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

// 応募者管理タブ
function ApplicationsTab() {
  const { data: applications, isLoading } = useApplications();

  if (isLoading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">応募者一覧</h3>
        <select className="px-3 py-1 border border-gray-300 rounded-lg text-sm">
          <option>すべて</option>
          <option>未確認</option>
          <option>選考中</option>
          <option>不採用</option>
        </select>
      </div>
      
      <div className="space-y-4">
        {applications?.results?.map((application: any) => (
          <div key={application.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-gray-900">{application.applicant_name}</h4>
                <p className="text-sm text-gray-600 mt-1">応募日: {new Date(application.applied_at).toLocaleDateString()}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    application.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    application.status === 'viewed' ? 'bg-blue-100 text-blue-700' :
                    application.status === 'accepted' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {application.status === 'pending' ? '未確認' :
                     application.status === 'viewed' ? '確認済み' :
                     application.status === 'accepted' ? '選考中' : application.status}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  履歴書を見る
                </button>
                <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  メッセージ
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// スカウト管理タブ
function ScoutsTab() {
  const { data: scouts, isLoading } = useScouts();

  if (isLoading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">送信スカウト一覧</h3>
        <Link
          href={`${companyPrefix}/search`}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          新規スカウト
        </Link>
      </div>
      
      <div className="space-y-4">
        {scouts?.results?.map((scout: any) => (
          <div key={scout.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-gray-900">{scout.seeker_name}</h4>
                <p className="text-sm text-gray-600 mt-1">送信日: {new Date(scout.scouted_at).toLocaleDateString()}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    scout.status === 'sent' ? 'bg-gray-100 text-gray-700' :
                    scout.status === 'viewed' ? 'bg-blue-100 text-blue-700' :
                    scout.status === 'responded' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {scout.status === 'sent' ? '送信済み' :
                     scout.status === 'viewed' ? '確認済み' :
                     scout.status === 'responded' ? '返信あり' : '期限切れ'}
                  </span>
                  {scout.match_score > 0 && (
                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                      マッチ度: {Math.round(scout.match_score * 100)}%
                    </span>
                  )}
                </div>
              </div>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                詳細
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// メッセージタブ
function MessagesTab() {
  const { data: messages, isLoading } = useMessages();

  if (isLoading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">メッセージ</h3>
      <div className="space-y-3">
        {messages?.results?.map((message: any) => (
          <div key={message.id} className={`border rounded-lg p-4 hover:shadow-sm transition ${
            !message.is_read ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
          }`}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900">
                    {message.sender_name}
                  </h4>
                  {!message.is_read && (
                    <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                      未読
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{message.subject}</p>
                <p className="text-sm text-gray-700 mt-2 line-clamp-2">{message.content}</p>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(message.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
