import React from 'react';
import DefaultButton from '@/components/pure/button/default';

interface SeekerCardProps {
  detail: {
    id: string;
    full_name: string;
    email: string;
    skills?: string;
    desired_job?: string;
    prefecture?: string;
    desired_salary?: number;
  };
  onDetail?: () => void;
  onScout?: () => void;
  isScouting?: boolean;
  isScouted?: boolean;
}

const SeekerCard: React.FC<SeekerCardProps> = ({ detail, onDetail, onScout, isScouting, isScouted }) => {
  const seeker = detail;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{seeker.full_name}</h3>
          <p className="text-sm text-gray-500">{seeker.email}</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {seeker.desired_job && (
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-600 w-24">希望職種:</span>
            <span className="text-sm text-gray-900">{seeker.desired_job}</span>
          </div>
        )}
        
        {seeker.prefecture && (
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-600 w-24">勤務地:</span>
            <span className="text-sm text-gray-900">{seeker.prefecture}</span>
          </div>
        )}
        
        {seeker.desired_salary && (
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-600 w-24">希望年収:</span>
            <span className="text-sm text-gray-900">
              {(seeker.desired_salary / 10000).toFixed(0)}万円
            </span>
          </div>
        )}
      </div>

      {seeker.skills && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-600 mb-1">スキル:</p>
          <div className="flex flex-wrap gap-1">
            {seeker.skills.split(',').map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
              >
                {skill.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {onDetail && (
          <DefaultButton
            onClick={onDetail}
            variant="secondary"
            size="small"
            fullWidth
          >
            詳細を見る
          </DefaultButton>
        )}
        {onScout && !isScouted && (
          <DefaultButton
            onClick={onScout}
            variant="primary"
            size="small"
            fullWidth
            disabled={isScouting}
          >
            {isScouting ? '送信中...' : 'スカウトを送る'}
          </DefaultButton>
        )}
        {isScouted && (
          <div className="text-sm text-green-600 font-medium text-center py-2">
            スカウト済み
          </div>
        )}
      </div>
    </div>
  );
};

export default SeekerCard;