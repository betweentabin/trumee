'use client';

import Link from 'next/link';

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">ユーザー管理</h1>
        <Link href="#" className="px-4 py-2 rounded-md bg-[#FF733E] text-white">新規作成</Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 text-left text-sm text-gray-500">
            <tr>
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">名前</th>
              <th className="px-6 py-3">メール</th>
              <th className="px-6 py-3">ロール</th>
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
                <button className="px-3 py-1 rounded border">編集</button>
                <button className="px-3 py-1 rounded border text-red-600">削除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

