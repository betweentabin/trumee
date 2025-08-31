'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '../../lib/api-client';
import toast from 'react-hot-toast';
import AppliedCard from './appliedcard';
import JobSeekerDetailModal from '@/components/modal/jobseeker-detail';

interface Application {
  id: string;
  applicant: {
    id: string;
    email: string;
    full_name: string;
    username: string;
  };
  resume: {
    id: string;
    title: string;
  } | null;
  status: string;
  applied_at: string;
  reviewed_at: string | null;
}

export default function SeekersAppliedPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeeker, setSelectedSeeker] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await apiClient.getApplications();
      setApplications(response);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      toast.error('応募リストの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDetail = (applicant: any) => {
    setSelectedSeeker(applicant);
    setShowDetailModal(true);
  };

  const handleUpdateStatus = async (applicationId: string, newStatus: string) => {
    try {
      await apiClient.updateApplicationStatus(applicationId, newStatus);
      toast.success('ステータスを更新しました');
      fetchApplications(); // リストを更新
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('ステータスの更新に失敗しました');
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
      <h2 className="text-xl font-bold mb-6">応募された求職者一覧</h2>
      
      {applications.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">まだ応募はありません</p>
          <button
            onClick={() => router.push('/company')}
            className="px-4 py-2 bg-[#FF733E] text-white rounded-md hover:bg-[#e9632e]"
          >
            求職者を探す
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <AppliedCard
              key={application.id}
              applicant={application.applicant}
              resume={application.resume}
              status={application.status}
              appliedAt={application.applied_at}
              onDetail={() => handleDetail(application.applicant)}
              onAccept={() => handleUpdateStatus(application.id, 'accepted')}
              onReject={() => handleUpdateStatus(application.id, 'rejected')}
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