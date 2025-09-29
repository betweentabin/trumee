'use client';

import { FaUser, FaEnvelope, FaClock, FaEye } from 'react-icons/fa';
import { anonymizeUserLabel } from '@/utils/anonymize';

interface UserCardProps {
  user: {
    id: string;
    email: string;
    full_name: string;
    username: string;
  };
  message?: string;
  status: string;
  createdAt: string;
  onDetail: () => void;
  onCancel: () => void;
}

export default function UserCard({
  user,
  message,
  status,
  createdAt,
  onDetail,
  onCancel,
}: UserCardProps) {
  const displayName = anonymizeUserLabel(user);
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">送信済み</span>;
      case 'viewed':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">閲覧済み</span>;
      case 'responded':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">返信済み</span>;
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
    });
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <FaUser className="text-gray-400" />
            <h3 className="font-semibold text-lg">{displayName}</h3>
            {getStatusBadge(status)}
          </div>
          
          {/* 企業画面ではメール等の個人情報は非表示 */}

          {message && (
            <div className="bg-gray-50 p-3 rounded mb-2">
              <p className="text-sm text-gray-700 line-clamp-2">{message}</p>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FaClock className="text-gray-400" />
            <span>スカウト送信日: {formatDate(createdAt)}</span>
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
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
