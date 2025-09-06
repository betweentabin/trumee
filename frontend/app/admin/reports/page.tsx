'use client';

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">レポート</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="font-semibold text-gray-900 mb-2">利用統計</div>
          <div className="text-gray-500">グラフ準備中</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="font-semibold text-gray-900 mb-2">売上レポート</div>
          <div className="text-gray-500">表・グラフ準備中</div>
        </div>
      </div>
    </div>
  );
}

