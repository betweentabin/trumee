"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  return (
    <div className="min-h-[300px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border rounded-lg p-6 text-center">
        <h2 className="text-lg font-semibold mb-2">職歴の表示中にエラーが発生しました</h2>
        <p className="text-sm text-gray-600 mb-4">ページを再読み込みするか、しばらくしてからもう一度お試しください。</p>
        <button onClick={() => reset()} className="px-4 py-2 rounded bg-[#FF733E] text-white">再試行</button>
      </div>
    </div>
  );
}

