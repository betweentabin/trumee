'use client';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">管理者ダッシュボード</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: '登録ユーザー', value: '—' },
          { label: '企業アカウント', value: '—' },
          { label: '今月の応募', value: '—' },
          { label: '売上 (今月)', value: '—' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">{card.label}</div>
            <div className="mt-2 text-3xl font-semibold">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="font-semibold text-gray-900 mb-2">利用統計</div>
          <div className="text-gray-500">グラフ準備中</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="font-semibold text-gray-900 mb-2">最近のアクティビティ</div>
          <ul className="text-gray-600 list-disc pl-5 space-y-1">
            <li>ログデータ準備中</li>
            <li>イベント表示準備中</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

