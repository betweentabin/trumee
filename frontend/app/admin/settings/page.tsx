'use client';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">システム設定</h1>
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">サイト名</label>
          <input className="w-full border rounded-lg px-4 py-2" placeholder="TruMee" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">サポートメール</label>
          <input className="w-full border rounded-lg px-4 py-2" placeholder="support@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">メンテナンスモード</label>
          <select className="w-full border rounded-lg px-4 py-2">
            <option>オフ</option>
            <option>オン</option>
          </select>
        </div>
        <div className="flex justify-end">
          <button className="px-6 py-2 rounded-full text-white bg-[#FF733E] hover:bg-[#e9632e]">保存</button>
        </div>
      </div>
    </div>
  );
}

