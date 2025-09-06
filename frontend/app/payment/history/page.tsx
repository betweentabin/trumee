'use client';

export default function PaymentHistoryPage() {
  const rows = [
    { id: 1, date: '2025/09/01', amount: '¥—', status: '成功' },
  ];
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">支払い履歴</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 text-left text-sm text-gray-500">
            <tr>
              <th className="px-6 py-3">日付</th>
              <th className="px-6 py-3">金額</th>
              <th className="px-6 py-3">ステータス</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {rows.map(r => (
              <tr key={r.id}>
                <td className="px-6 py-3">{r.date}</td>
                <td className="px-6 py-3">{r.amount}</td>
                <td className="px-6 py-3">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

