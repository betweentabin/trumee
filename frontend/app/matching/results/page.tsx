'use client';

export default function MatchingResultsPage() {
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">マッチング結果</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-gray-600">AI推奨の候補一覧は準備中です。</div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="font-semibold text-gray-900">候補 {i}</div>
              <div className="text-sm text-gray-600 mt-1">スコア: — / 100</div>
              <div className="text-sm text-gray-500 mt-2">ハイライト: —</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

