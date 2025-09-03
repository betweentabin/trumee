"use client";

import React from 'react';

type PreviewProps = {
  userName?: string;
  // e.g. ['job1','job2']
  jobhistoryList: string[];
  // e.g. { job1: { company, capital, work_content, since, to, people, duty }, ... }
  formValues: Record<string, any>;
  className?: string;
};

const PreviewRow: React.FC<{ left: React.ReactNode; right: React.ReactNode }>
  = ({ left, right }) => (
  <tr>
    <td className="border p-3 align-top w-1/2">{left}</td>
    <td className="border p-3 align-top">{right}</td>
  </tr>
);

const ResumePreview: React.FC<PreviewProps> = ({ userName, jobhistoryList, formValues, className }) => {
  const today = new Date();
  const ymd = `${today.getFullYear()}年${String(today.getMonth()+1).padStart(2,'0')}月${String(today.getDate()).padStart(2,'0')}日現在`;

  return (
    <div className={`bg-white border border-black ${className || ''}`}>
      {/* Header */}
      <div className="bg-[#4B3A2F] text-white px-4 py-3 text-lg font-bold">プレビュー</div>
      <div className="p-4">
        <div className="flex justify-between mb-6">
          <h2 className="text-2xl font-semibold">職務経歴書</h2>
          <div className="text-right text-sm leading-6">
            <div>{ymd}</div>
            {userName && <div>氏名: {userName}</div>}
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-4">職務内容</h3>

        {jobhistoryList.length === 0 && (
          <div className="text-gray-500">職務経歴が未入力です。</div>
        )}

        {jobhistoryList.map((key) => {
          const j = (formValues as any)[key] || {};
          const companyBlock = (
            <div className="space-y-1">
              <div className="font-medium">
                {j.since || '—'} ～ {j.to || '—'}
              </div>
              {j.company && <div>会社名: {j.company}</div>}
              {j.business && <div>事業内容: {j.business}</div>}
              {j.capital && <div>資本金: {j.capital}円</div>}
              {j.people && <div>チーム内(部署や課)の人数: {j.people}名</div>}
              {j.duty && <div>役職: {j.duty}</div>}
            </div>
          );

          const table = (
            <table className="w-full border mt-3 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 w-1/2">期間</th>
                  <th className="border p-2">職務内容</th>
                </tr>
              </thead>
              <tbody>
                <PreviewRow
                  left={<span>{j.since || '—'} ～ {j.to || '—'}</span>}
                  right={<pre className="whitespace-pre-wrap font-sans">{j.work_content || '入力した職務内容が記載されます。'}</pre>}
                />
              </tbody>
            </table>
          );

          return (
            <div key={key} className="mb-8">
              {companyBlock}
              {table}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResumePreview;
