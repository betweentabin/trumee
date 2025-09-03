'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api-v2-client';
import { useDashboardStats, useUserProfile } from '@/hooks/useApiV2';
import useAuthV2 from '@/hooks/useAuthV2';
import toast from 'react-hot-toast';
import { 
  FaFileAlt, 
  FaBriefcase, 
  FaEnvelope, 
  FaUserTie,
  FaChartLine,
  FaArrowRight,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle
} from 'react-icons/fa';

interface DashboardStats {
  resumes_count: number;
  applications_count: number;
  scouts_count: number;
  messages_count: number;
  unread_messages: number;
  profile_completion: number;
}

interface RecentActivity {
  type: 'application' | 'scout' | 'message' | 'resume';
  title: string;
  description: string;
  time: string;
  status?: 'success' | 'warning' | 'info';
}

export default function SeekerDashboard() {
  const router = useRouter();
  const [useV2API, setUseV2API] = useState(true); // API v2をデフォルトに設定
  
  // localStorageにAPI v2設定を保存
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('useV2Api', 'true');
    }
  }, []);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  // API v2 フック
  const { isAuthenticated: isV2Authenticated, currentUser: v2User, initializeAuth } = useAuthV2();
  const { data: v2Stats, isLoading: v2StatsLoading } = useDashboardStats({
    enabled: useV2API && isV2Authenticated
  });
  const { data: v2UserProfile, isLoading: v2UserLoading } = useUserProfile({
    enabled: useV2API && isV2Authenticated
  });

  useEffect(() => {
    if (useV2API) {
      initializeAuth();
    } else {
      fetchDashboardData();
    }
  }, [useV2API, initializeAuth]);

  // API v2データの処理
  useEffect(() => {
    if (useV2API && v2Stats && v2UserProfile) {
      // 求職者用の統計データかチェック
      if ('resumes_count' in v2Stats) {
        setStats({
          resumes_count: v2Stats.resumes_count || 0,
          applications_count: v2Stats.applications_count || 0,
          scouts_count: v2Stats.scouts_received_count || 0,
          messages_count: 0, // v2では未実装
          unread_messages: 0, // v2では未実装
          profile_completion: 80, // 仮の値
        });

        // API v2用のアクティビティ（モックデータ）
        setRecentActivities([
          {
            type: 'resume',
            title: 'API v2で履歴書データを取得',
            description: `${v2Stats.active_resumes_count}件のアクティブな履歴書`,
            time: '数秒前',
            status: 'success'
          },
          {
            type: 'application',
            title: 'API v2統計データ',
            description: `${v2Stats.applications_count}件の応募`,
            time: '数秒前',
            status: 'info'
          },
          {
            type: 'scout',
            title: 'スカウト受信状況',
            description: `${v2Stats.scouts_received_count}件のスカウト`,
            time: '数秒前',
            status: 'info'
          }
        ]);
      }
      setUserName(v2UserProfile.full_name || v2UserProfile.email);
      setLoading(false);
    }
  }, [useV2API, v2Stats, v2UserProfile]);

  // ローディング状態の管理
  useEffect(() => {
    if (useV2API) {
      setLoading(v2StatsLoading || v2UserLoading);
    }
  }, [useV2API, v2StatsLoading, v2UserLoading]);

  const fetchDashboardData = async () => {
    try {
      // ユーザー情報を取得
      const userProfile = await apiClient.getUserProfile();
      setUserName(userProfile.full_name || userProfile.email);

      // ダッシュボード統計を取得
      const dashboardStats = await apiClient.getDashboardStats();
      setStats({
        resumes_count: dashboardStats.resumes_count || 0,
        applications_count: dashboardStats.applications || 0,
        scouts_count: dashboardStats.scouts || 0,
        messages_count: dashboardStats.messages_count || 0,
        unread_messages: dashboardStats.unread_messages || 0,
        profile_completion: dashboardStats.profile_completion || 70,
      });

      // 最近のアクティビティ（モックデータ）
      setRecentActivities([
        {
          type: 'scout',
          title: '新しいスカウトが届きました',
          description: '株式会社テックコーポレーション',
          time: '2時間前',
          status: 'success'
        },
        {
          type: 'application',
          title: '応募が承認されました',
          description: 'マーケティング株式会社',
          time: '1日前',
          status: 'success'
        },
        {
          type: 'resume',
          title: '履歴書を更新しました',
          description: 'エンジニア向け履歴書',
          time: '3日前',
          status: 'info'
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('ダッシュボードデータの取得に失敗しました');
      
      // 認証エラーの場合はログインページへ
      if ((error as any)?.response?.status === 401) {
        router.push('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF733E]"></div>
      </div>
    );
  }

  const userIdFromPath = (() => {
    const parts = (typeof window !== 'undefined' ? window.location.pathname : '').split('/').filter(Boolean);
    return parts[0] === 'users' && parts[1] ? parts[1] : null;
  })();
  const perUser = (p: string, fallback: string) => userIdFromPath ? `/users/${userIdFromPath}${p}` : fallback;

  const quickLinks = [
    {
      title: '履歴書管理',
      description: '履歴書の作成・編集',
      icon: FaFileAlt,
      href: perUser('/resumes', '/resumes'),
      count: stats?.resumes_count || 0,
      color: 'bg-blue-500'
    },
    {
      title: '応募管理',
      description: '応募状況を確認',
      icon: FaBriefcase,
      href: perUser('/applications', '/applications'),
      count: stats?.applications_count || 0,
      color: 'bg-green-500'
    },
    {
      title: 'スカウト',
      description: '企業からのオファー',
      icon: FaUserTie,
      href: perUser('/scouts', '/scouts'),
      count: stats?.scouts_count || 0,
      color: 'bg-purple-500'
    },
    {
      title: 'メッセージ',
      description: '企業とのやり取り',
      icon: FaEnvelope,
      href: perUser('/messages', '/messages'),
      count: stats?.messages_count || 0,
      badge: stats?.unread_messages || 0,
      color: 'bg-orange-500'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'application':
        return <FaBriefcase className="text-green-500" />;
      case 'scout':
        return <FaUserTie className="text-purple-500" />;
      case 'message':
        return <FaEnvelope className="text-orange-500" />;
      case 'resume':
        return <FaFileAlt className="text-blue-500" />;
      default:
        return <FaExclamationCircle className="text-gray-500" />;
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <FaCheckCircle className="text-green-500" />;
      case 'warning':
        return <FaExclamationCircle className="text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                こんにちは、{userName}さん
              </h1>
              <p className="mt-2 text-gray-600">
                転職活動の進捗を確認しましょう
              </p>
            </div>
            
            {/* API v2 切り替えコントロール */}
            <div className="flex items-center space-x-3 bg-white rounded-lg shadow px-4 py-2">
              <span className="text-sm text-gray-600">API v1</span>
              <button
                type="button"
                onClick={() => setUseV2API(!useV2API)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  useV2API ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useV2API ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-600">API v2</span>
              {useV2API && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  🧪 テスト中
                </span>
              )}
            </div>
          </div>
        </div>

        {/* プロフィール完成度 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900">
              プロフィール完成度
            </h2>
            <span className="text-2xl font-bold text-[#FF733E]">
              {stats?.profile_completion || 70}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-[#FF733E] h-3 rounded-full transition-all duration-500"
              style={{ width: `${stats?.profile_completion || 70}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-600">
            プロフィールを100%完成させると、スカウト率が3倍になります
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${link.color} p-3 rounded-lg`}>
                  <link.icon className="h-6 w-6 text-white" />
                </div>
                {link.badge && link.badge > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {link.badge}件の未読
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {link.title}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {link.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">
                  {link.count}
                </span>
                <FaArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>

        {/* 最近のアクティビティ */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            最近のアクティビティ
          </h2>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 pb-3 border-b last:border-0">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    {getStatusIcon(activity.status)}
                  </div>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                  <div className="flex items-center mt-1 text-xs text-gray-500">
                    <FaClock className="mr-1" />
                    {activity.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            クイックアクション
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/resumes/new"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#FF733E] hover:bg-[#e9632e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF733E]"
            >
              新しい履歴書を作成
            </Link>
            <Link
              href="/companies"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF733E]"
            >
              企業を探す
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF733E]"
            >
              プロフィールを編集
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
