'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-v2-client';
import toast from 'react-hot-toast';
import { 
  FaBriefcase, 
  FaClock, 
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaBuilding,
  FaCalendarAlt
} from 'react-icons/fa';

interface Application {
  id: string;
  company: {
    id: string;
    company_name: string;
    email: string;
  };
  resume: {
    id: string;
    title: string;
  } | null;
  status: string;
  applied_at: string;
  reviewed_at: string | null;
}

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await apiClient.getApplications();
      setApplications(response);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      toast.error('応募情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelApplication = async (id: string) => {
    if (!confirm('この応募を取り消してもよろしいですか？')) {
      return;
    }

    try {
      await apiClient.updateApplicationStatus(id, 'cancelled');
      toast.success('応募を取り消しました');
      fetchApplications();
    } catch (error) {
      console.error('Failed to cancel application:', error);
      toast.error('応募の取り消しに失敗しました');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <FaHourglassHalf className="mr-1" />
            審査中
          </span>
        );
      case 'reviewing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <FaClock className="mr-1" />
            検討中
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FaCheckCircle className="mr-1" />
            承認済み
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <FaTimesCircle className="mr-1" />
            不採用
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <FaTimesCircle className="mr-1" />
            取消済み
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF733E]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">応募管理</h1>
          <p className="mt-2 text-gray-600">
            企業への応募状況を確認できます
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'all'
                  ? 'bg-[#FF733E] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              すべて ({applications.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'pending'
                  ? 'bg-[#FF733E] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              審査中 ({applications.filter(a => a.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('reviewing')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'reviewing'
                  ? 'bg-[#FF733E] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              検討中 ({applications.filter(a => a.status === 'reviewing').length})
            </button>
            <button
              onClick={() => setFilter('accepted')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'accepted'
                  ? 'bg-[#FF733E] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              承認済み ({applications.filter(a => a.status === 'accepted').length})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'rejected'
                  ? 'bg-[#FF733E] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              不採用 ({applications.filter(a => a.status === 'rejected').length})
            </button>
          </div>
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FaBriefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'まだ応募がありません' : `${filter}の応募はありません`}
            </h3>
            <p className="text-gray-600">
              企業に応募して、転職活動を進めましょう
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <div
                key={application.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FaBuilding className="text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {application.company.company_name}
                      </h3>
                      {getStatusBadge(application.status)}
                    </div>

                    {application.resume && (
                      <p className="text-sm text-gray-600 mb-2">
                        使用履歴書: {application.resume.title}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <FaCalendarAlt className="mr-1" />
                        応募日: {formatDate(application.applied_at)}
                      </div>
                      {application.reviewed_at && (
                        <div className="flex items-center">
                          <FaClock className="mr-1" />
                          審査日: {formatDate(application.reviewed_at)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {application.status === 'pending' && (
                      <button
                        onClick={() => handleCancelApplication(application.id)}
                        className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
                      >
                        取り消す
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}