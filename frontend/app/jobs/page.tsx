'use client';

import Link from 'next/link';

export default function JobsListPage() {
  const jobs = [
    { id: '1', title: 'フロントエンドエンジニア', company: '株式会社サンプル', location: '東京', salary: '—' },
    { id: '2', title: 'バックエンドエンジニア', company: 'Example Inc.', location: 'リモート', salary: '—' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">公開求人</h1>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="block border rounded-lg p-4 hover:shadow">
              <div className="font-semibold text-gray-900">{job.title}</div>
              <div className="text-sm text-gray-600 mt-1">{job.company}</div>
              <div className="text-sm text-gray-500 mt-1">{job.location}・{job.salary}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

