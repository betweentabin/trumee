'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function CompanyEditJobPage() {
  const params = useParams();
  const id = params?.id as string;
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">求人を編集</h1>
        <Link href={`/jobs/${id}`} className="text-sm text-gray-600 hover:text-gray-900">求人詳細へ</Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">求人タイトル</label>
          <input className="w-full border rounded-lg px-4 py-2" defaultValue={"—"} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">仕事内容</label>
          <textarea className="w-full border rounded-lg px-4 py-2 h-32" defaultValue={"—"}></textarea>
        </div>
        <div className="flex justify-end gap-3">
          <button className="px-6 py-2 rounded-full border">下書き保存</button>
          <button className="px-6 py-2 rounded-full text-white bg-[#FF733E] hover:bg-[#e9632e]">更新する</button>
        </div>
      </div>
    </div>
  );
}

