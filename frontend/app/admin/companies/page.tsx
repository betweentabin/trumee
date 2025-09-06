'use client';

export default function AdminCompaniesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">企業管理</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 text-left text-sm text-gray-500">
            <tr>
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">企業名</th>
              <th className="px-6 py-3">メール</th>
              <th className="px-6 py-3">ステータス</th>
              <th className="px-6 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            <tr>
              <td className="px-6 py-3">—</td>
              <td className="px-6 py-3">—</td>
              <td className="px-6 py-3">—</td>
              <td className="px-6 py-3">—</td>
              <td className="px-6 py-3 text-right space-x-2">
                <button className="px-3 py-1 rounded border">詳細</button>
                <button className="px-3 py-1 rounded border">編集</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

