'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';
import UserCard from './usercard';
import JobSeekerDetailModal from '@/components/modal/jobseeker-detail';

interface Scout {
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
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeeker, setSelectedSeeker] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchScouts();
  }, []);

  const fetchScouts = async () => {
    try {
      const response = await apiClient.getScouts();
      setScouts(response);
    } catch (error) {
      console.error('Failed to fetch scouts:', error);
      toast.error('スカウトリストの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDetail = (seeker: any) => {
    setSelectedSeeker(seeker);
    setShowDetailModal(true);
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

  if (loading) {
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
            onClick={() => router.push('/company')}
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
          onClose={() => {
            setShowDetailModal(false);
            setSelectedSeeker(null);
          }}
        />
      )}
    </div>
  );
}