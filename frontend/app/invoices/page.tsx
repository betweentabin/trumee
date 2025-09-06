'use client';

export default function InvoicesPage() {
  const invoices = [
    { id: 'INV-0001', date: '2025/09/01', amount: '¥—', status: '発行済み' },
  ];
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">請求書</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 text-left text-sm text-gray-500">
            <tr>
              <th className="px-6 py-3">番号</th>
              <th className="px-6 py-3">日付</th>
              <th className="px-6 py-3">金額</th>
              <th className="px-6 py-3">ステータス</th>
              <th className="px-6 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {invoices.map(inv => (
              <tr key={inv.id}>
                <td className="px-6 py-3">{inv.id}</td>
                <td className="px-6 py-3">{inv.date}</td>
                <td className="px-6 py-3">{inv.amount}</td>
                <td className="px-6 py-3">{inv.status}</td>
                <td className="px-6 py-3 text-right">
                  <button className="px-3 py-1 rounded border">PDF</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

