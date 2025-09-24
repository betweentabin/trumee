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
      const transformedScouts = response.map((scout: any) => ({
        ...scout,
        seeker: scout.seeker || {
          id: scout.seeker_id || scout.seeker,
          email: 'N/A',
          full_name: 'N/A',
          username: 'N/A'
        }
      }));
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
      const list = await apiClient.getPublicUserResumes(String(seeker.id)).catch(() => [] as any[]);
      const resume = (list || []).find((r: any) => r.is_active) || (list || [])[0] || null;
      setSelectedSeeker(resume ? { ...seeker, resume } : seeker);
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
          sendMessage={(message: any) => {
            console.log('Sending message:', message);
            // TODO: Implement message sending
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
