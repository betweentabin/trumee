'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useAuthV2 from '@/hooks/useAuthV2';
import apiClient from '@/lib/api-v2-client';
import toast from 'react-hot-toast';
import AppliedCard from './appliedcard';
import JobSeekerDetailModal from '@/components/modal/jobseeker-detail';

interface ApplicationWithApplicant {
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
  const pathname = usePathname();
  const companyIdFromPath = useMemo(() => {
    if (!pathname) return null;
    const parts = pathname.split('/').filter(Boolean);
    return parts[0] === 'company' && parts[1] ? parts[1] : null;
  }, [pathname]);
  const { isAuthenticated, currentUser, initializeAuth } = useAuthV2();
  const [applications, setApplications] = useState<ApplicationWithApplicant[]>([]);
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
      
      // Fetch applications after authentication check
      fetchApplications();
    }
  }, [isAuthenticated, currentUser, router]);

  const fetchApplications = async () => {
    try {
      const response = await apiClient.getApplications();
      // Transform response to match ApplicationWithApplicant interface
      // TODO: Update backend to return applicant details with application data
      const transformedApplications = response.map((app: any) => ({
        ...app,
        applicant: app.applicant || {
          id: app.applicant_id || app.applicant,
          email: 'N/A',
          full_name: 'N/A',
          username: 'N/A'
        },
        resume: app.resume || null,
        applied_at: app.applied_at || app.created_at,
        reviewed_at: app.reviewed_at || null
      }));
      setApplications(transformedApplications);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      toast.error('応募リストの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDetail = async (applicant: any) => {
    try {
      const list = await apiClient.getPublicUserResumes(String(applicant.id)).catch(() => [] as any[]);
      const resume = (list || []).find((r: any) => r.is_active) || (list || [])[0] || null;
      setSelectedSeeker(resume ? { ...applicant, resume } : applicant);
    } finally {
      setShowDetailModal(true);
    }
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

  // Show loading while checking auth
  const restoring = typeof window !== 'undefined' && !!localStorage.getItem('drf_token_v2') && isAuthenticated === false;
  if (restoring || loading) {
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
            onClick={() => router.push(companyIdFromPath ? `/company/${companyIdFromPath}` : '/company')}
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
