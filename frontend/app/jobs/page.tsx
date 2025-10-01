'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import apiV2Client from '@/lib/api-v2-client';
import type { JobPosting } from '@/types/api-v2';

export default function JobsListPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await apiV2Client.getPublicJobs();
        setJobs(list || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">公開求人</h1>
      <div className="bg-white rounded-lg shadow p-4">
        {loading ? (
          <div className="p-6 text-center text-gray-500">読み込み中…</div>
        ) : jobs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">現在、公開中の求人はありません。</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => {
              const salary = (() => {
                const min = job.salary_min ?? undefined;
                const max = job.salary_max ?? undefined;
                if (!min && !max) return '応相談';
                const fmt = (n?: number | null) => (typeof n === 'number' ? `${Math.round(n / 10000)}万円` : '');
                return [fmt(min), fmt(max)].filter(Boolean).join('〜') || '応相談';
              })();
              return (
                <Link key={String(job.id)} href={`/jobs/${String(job.id)}`} className="block border rounded-lg p-4 hover:shadow">
                  <div className="font-semibold text-gray-900">{job.title}</div>
                  <div className="text-sm text-gray-600 mt-1">{job.company_name || '—'}</div>
                  <div className="text-sm text-gray-500 mt-1">{job.location || '—'}・{salary}</div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
