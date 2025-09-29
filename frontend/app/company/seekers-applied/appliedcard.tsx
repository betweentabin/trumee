'use client';

import { FaUser, FaEnvelope, FaClock, FaEye, FaFileAlt, FaCheck, FaTimes } from 'react-icons/fa';
import { anonymizeUserLabel } from '@/utils/anonymize';

interface AppliedCardProps {
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
  appliedAt: string;
  onDetail: () => void;
  onAccept: () => void;
  onReject: () => void;
}

export default function AppliedCard({
  applicant,
  resume,
  status,
  appliedAt,
  onDetail,
  onAccept,
  onReject,
}: AppliedCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">審査中</span>;
      case 'reviewing':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">検討中</span>;
      case 'accepted':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">承認済み</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">不採用</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">{status}</span>;
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

  const displayName = anonymizeUserLabel(applicant);

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <FaUser className="text-gray-400" />
            <h3 className="font-semibold text-lg">{displayName}</h3>
            {getStatusBadge(status)}
          </div>
          
          {/* メール等の個人情報は企業一覧では非表示 */}

          {resume && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <FaFileAlt className="text-gray-400" />
              <span>履歴書: {resume.title}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FaClock className="text-gray-400" />
            <span>応募日時: {formatDate(appliedAt)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={onDetail}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF733E] text-white rounded-md hover:bg-[#e9632e] transition-colors"
        >
          <FaEye />
          詳細を見る
        </button>
        
        {status === 'pending' && (
          <>
            <button
              onClick={onAccept}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              <FaCheck />
              承認
            </button>
            <button
              onClick={onReject}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              <FaTimes />
              不採用
            </button>
          </>
        )}
      </div>
    </div>
  );
}
