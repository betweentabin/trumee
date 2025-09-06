'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function JobDetailPage() {
  const { id } = useParams();
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Link href="/jobs" className="text-sm text-gray-600 hover:text-gray-900">← 求人一覧へ</Link>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">求人タイトル（ID: {String(id)})</h1>
            <div className="text-gray-600 mt-1">企業名 — 所在地 — 給与</div>
          </div>
          <Link href={`/company/jobs/${String(id)}/edit`} className="px-4 py-2 rounded-md border">編集</Link>
        </div>
        <div className="mt-6 space-y-4">
          <section>
            <h2 className="font-semibold text-gray-900 mb-2">仕事内容</h2>
            <p className="text-gray-700">詳細は準備中です。</p>
          </section>
          <section>
            <h2 className="font-semibold text-gray-900 mb-2">応募条件</h2>
            <ul className="list-disc pl-5 text-gray-700">
              <li>要件1</li>
              <li>要件2</li>
            </ul>
          </section>
        </div>
        <div className="mt-6">
          <button className="px-6 py-3 rounded-full text-white bg-[#FF733E] hover:bg-[#e9632e]">この求人に応募</button>
        </div>
      </div>
    </div>
  );
}

