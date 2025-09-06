'use client';

export default function PaymentMethodsPage() {
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">支払い方法</h1>
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-gray-900">クレジットカード</div>
            <div className="text-sm text-gray-600">**** **** **** 1234 有効期限 12/29</div>
          </div>
          <div className="space-x-2">
            <button className="px-3 py-1 rounded border">編集</button>
            <button className="px-3 py-1 rounded border text-red-600">削除</button>
          </div>
        </div>
        <hr />
        <div>
          <div className="font-semibold text-gray-900 mb-2">新しいカードを追加</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border rounded-lg px-4 py-2" placeholder="カード番号" />
            <input className="border rounded-lg px-4 py-2" placeholder="名義" />
            <input className="border rounded-lg px-4 py-2" placeholder="MM/YY" />
            <input className="border rounded-lg px-4 py-2" placeholder="CVC" />
          </div>
          <div className="mt-4 flex justify-end">
            <button className="px-6 py-2 rounded-full text-white bg-[#FF733E] hover:bg-[#e9632e]">追加</button>
          </div>
        </div>
      </div>
    </div>
  );
}

