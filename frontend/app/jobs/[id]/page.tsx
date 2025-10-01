'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import apiV2Client from '@/lib/api-v2-client';
import type { JobPosting } from '@/types/api-v2';

export default function JobDetailPage() {
  const { id } = useParams();
  const jobId = String(id || '');
  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    (async () => {
      try {
        const j = await apiV2Client.getPublicJob(jobId);
        setJob(j);
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId]);

  const salaryText = (() => {
    const min = job?.salary_min ?? undefined;
    const max = job?.salary_max ?? undefined;
    if (!min && !max) return '応相談';
    const fmt = (n?: number | null) => (typeof n === 'number' ? `${Math.round(n / 10000)}万円` : '');
    return [fmt(min), fmt(max)].filter(Boolean).join('〜') || '応相談';
  })();

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Link href="/jobs" className="text-sm text-gray-600 hover:text-gray-900">← 求人一覧へ</Link>
      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <div className="p-6 text-center text-gray-500">読み込み中…</div>
        ) : !job ? (
          <div className="p-6 text-center text-gray-500">求人が見つかりませんでした</div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                <div className="text-gray-600 mt-1">{job.company_name || '—'} ／ {job.location || '—'} ／ {salaryText}</div>
              </div>
              <Link href={`/company/jobs/${jobId}/edit`} className="px-4 py-2 rounded-md border">編集</Link>
            </div>
            <div className="mt-6 space-y-4">
              <section>
                <h2 className="font-semibold text-gray-900 mb-2">仕事内容</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{job.description || '—'}</p>
              </section>
              <section>
                <h2 className="font-semibold text-gray-900 mb-2">応募要件</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{job.requirements || '—'}</p>
              </section>
            </div>
            <div className="mt-6">
              <button className="px-6 py-3 rounded-full text-white bg-primary-600 hover:bg-primary-700">この求人に応募</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
