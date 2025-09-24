'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useAuthV2 from '@/hooks/useAuthV2';
import apiClient from '@/lib/api-v2-client';
import toast from 'react-hot-toast';
import UserCard from './usercard';
import JobSeekerDetailModal from '@/components/modal/jobseeker-detail';

interface ScoutWithSeeker {
  id: string;
  seeker: {
    id: string;
    email: string;
    full_name: string;
    username: string;
  };
  scout_message: string;
  status: string;
  created_at: string;
  viewed_at: string | null;
  responded_at: string | null;
}

export default function SeekersScoutedPage() {
  const router = useRouter();
  const pathname = usePathname();
  const companyIdFromPath = useMemo(() => {
    if (!pathname) return null;
    const parts = pathname.split('/').filter(Boolean);
    return parts[0] === 'company' && parts[1] ? parts[1] : null;
  }, [pathname]);
  const { isAuthenticated, currentUser, initializeAuth } = useAuthV2();
  const [scouts, setScouts] = useState<ScoutWithSeeker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeeker, setSelectedSeeker] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Initialize auth
  useEffect(() => {
    const initialize = async () => {
      initializeAuth();
    };
    initialize();
  }, []);

  // Check authentication and role
  useEffect(() => {
    const hasStored = typeof window !== 'undefined' && !!localStorage.getItem('drf_token_v2');
    if (isAuthenticated === false && !hasStored) {
      toast.error('企業ログインが必要です');
      router.push('/auth/company/login');
      return;
    }
    
    if (isAuthenticated && currentUser) {
      if (currentUser.role !== 'company') {
        toast.error('企業アカウントでログインしてください');
        router.push('/auth/company/login');
        return;
      }
      
      // Fetch scouts after authentication check
      fetchScouts();
    }
  }, [isAuthenticated, currentUser, router]);

  const fetchScouts = async () => {
    try {
      const response = await apiClient.getScouts();
      // Transform response to match ScoutWithSeeker interface
      // TODO: Update backend to return seeker details with scout data
      const transformedScouts = response.map((scout: any) => {
        const s = scout.seeker;
        let seeker: any;
        if (!s) {
          seeker = {
            id: String(scout.seeker_id || ''),
            email: '',
            full_name: '',
            username: '',
          };
        } else if (typeof s === 'string' || typeof s === 'number') {
          seeker = {
            id: String(s),
            email: '',
            full_name: '',
            username: '',
          };
        } else {
          seeker = { ...s, id: String(s.id || s.user || s.user_id || scout.seeker_id || '') };
        }
        return { ...scout, seeker };
      });
      setScouts(transformedScouts);
    } catch (error) {
      console.error('Failed to fetch scouts:', error);
      toast.error('スカウトリストの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDetail = async (seeker: any) => {
    try {
      const seekerId = typeof seeker === 'string' || typeof seeker === 'number'
        ? String(seeker)
        : String(seeker?.id || seeker?.user || seeker?.user_id || '');
      if (!seekerId) {
        toast.error('求職者IDを特定できません');
        setSelectedSeeker(seeker);
        return;
      }
      // 可能なら公開プロフィールを取得して氏名/メール等を補完
      let profile: any = null;
      try {
        profile = await apiClient.getPublicUserProfile(seekerId);
      } catch {}

      const list = await apiClient.getPublicUserResumes(seekerId).catch(() => [] as any[]);
      const resume = (list || []).find((r: any) => r.is_active) || (list || [])[0] || null;
      const merged = typeof seeker === 'object' && seeker !== null ? { ...seeker } : { id: seekerId };
      if (profile) {
        merged.full_name = profile.full_name ?? merged.full_name;
        merged.username = profile.username ?? merged.username;
        if (profile.email) merged.email = profile.email;
      }
      setSelectedSeeker(resume ? { ...merged, resume } : merged);
    } finally {
      setShowDetailModal(true);
    }
  };

  const handleCancelScout = async (scoutId: string) => {
    try {
      await apiClient.delete(`/scouts/${scoutId}/`);
      toast.success('スカウトをキャンセルしました');
      fetchScouts();
    } catch (error) {
      console.error('Failed to cancel scout:', error);
      toast.error('スカウトのキャンセルに失敗しました');
    }
  };

  // Show loading while checking auth
  if (isAuthenticated === null || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF733E]"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold mb-6">スカウトした求職者一覧</h2>
      
      {scouts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">まだスカウトした求職者はいません</p>
          <button
            onClick={() => router.push(companyIdFromPath ? `/company/${companyIdFromPath}` : '/company')}
            className="px-4 py-2 bg-[#FF733E] text-white rounded-md hover:bg-[#e9632e]"
          >
            求職者を検索する
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {scouts.map((scout) => (
            <UserCard
              key={scout.id}
              user={scout.seeker}
              message={scout.scout_message}
              status={scout.status}
              createdAt={scout.created_at}
              onDetail={() => handleDetail(scout.seeker)}
              onCancel={() => handleCancelScout(scout.id)}
            />
          ))}
        </div>
      )}

      {showDetailModal && selectedSeeker && (
        <JobSeekerDetailModal
          detail={selectedSeeker}
          isOpen={showDetailModal}
          closeLabel="閉じる"
          confirmLabel="メッセージを送る"
          isSendingMessage={false}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedSeeker(null);
          }}
          sendMessage={async (payload: any) => {
            try {
              await apiClient.sendCompanyMessage(String(selectedSeeker.id), String(payload?.message || ''));
              toast.success('メッセージを送信しました');
            } catch (e) {
              toast.error('メッセージ送信に失敗しました');
            }
          }}
          onConfirm={() => {
            console.log('Confirmed');
            setShowDetailModal(false);
            setSelectedSeeker(null);
          }}
        />
      )}
    </div>
  );
}
