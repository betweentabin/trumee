'use client';

export default function PlansComparePage() {
  const plans = [
    { name: 'Free', price: '¥0', features: ['基本機能'] },
    { name: 'Pro', price: '¥—/月', features: ['高度な検索', '優先サポート'] },
    { name: 'Enterprise', price: 'お問合せ', features: ['SLA', '専任サポート'] },
  ];
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">プラン比較</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div key={p.name} className="bg-white rounded-lg shadow p-6">
            <div className="text-lg font-semibold">{p.name}</div>
            <div className="text-3xl font-bold mt-2">{p.price}</div>
            <ul className="mt-4 text-sm text-gray-700 list-disc pl-5 space-y-1">
              {p.features.map((f) => (<li key={f}>{f}</li>))}
            </ul>
            <button className="mt-6 w-full py-2 rounded-full text-white bg-[#FF733E] hover:bg-[#e9632e]">選択</button>
          </div>
        ))}
      </div>
    </div>
  );
}

