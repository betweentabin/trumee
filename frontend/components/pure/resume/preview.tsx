"use client";

import React from 'react';

type PreviewProps = {
  userName?: string;
  // e.g. ['job1','job2']
  jobhistoryList: string[];
  // e.g. { job1: { company, capital, work_content, since, to, people, duty }, ... }
  formValues: Record<string, any>;
  className?: string;
  // Optional extra sections
  jobSummary?: string;
  selfPR?: string;
  skills?: string[] | string;
  education?: Array<{ school?: string; degree?: string; field?: string; graduationDate?: string }>;
  // UI options
  showHeader?: boolean; // default true
  showFrame?: boolean;  // border/frame (default true)
};

const PreviewRow: React.FC<{ left: React.ReactNode; right: React.ReactNode }>
  = ({ left, right }) => (
  <tr>
    <td className="border p-3 align-top w-1/2">{left}</td>
    <td className="border p-3 align-top">{right}</td>
  </tr>
);

const ResumePreview: React.FC<PreviewProps> = ({ userName, jobhistoryList, formValues, className, jobSummary, selfPR, skills, education, showHeader = true, showFrame = true }) => {
  const today = new Date();
  const ymd = `${today.getFullYear()}年${String(today.getMonth()+1).padStart(2,'0')}月${String(today.getDate()).padStart(2,'0')}日現在`;

  return (
    <div className={`bg-white ${showFrame ? 'border border-black' : ''} ${className || ''}`} data-annot-scope="resume-preview">
      {/* Header */}
      {showHeader && (
        <div className="bg-[#4B3A2F] text-white px-4 py-3 text-lg font-bold">プレビュー</div>
      )}
      <div className="p-4 text-gray-900">
        <div className="flex justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">職務経歴書</h2>
          <div className="text-right text-sm leading-6">
            <div>{ymd}</div>
          </div>
        </div>

        {/* 職務要約 */}
        {(jobSummary || selfPR) && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">職務要約</h3>
            <div className="whitespace-pre-wrap text-sm text-gray-800">{jobSummary || selfPR}</div>
          </div>
        )}

        <h3 className="text-lg font-semibold mb-4">会社の経歴・実績</h3>

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
            <table className="w-full border mt-3 text-sm" data-annot-section={`job-${key}`}>
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 w-1/2">期間</th>
                  <th className="border p-2">職務内容</th>
                </tr>
              </thead>
              <tbody>
                <PreviewRow
                  left={<span>{j.since || '—'} ～ {j.to || '—'}</span>}
                  right={
                    <div
                      className="relative"
                      data-annot-id={`work_content-${key}`}
                    >
                      <pre className="whitespace-pre-wrap font-sans">{j.work_content || '入力した職務内容が記載されます。'}</pre>
                    </div>
                  }
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

        {/* 自己PR */}
        {selfPR && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">自己PR</h3>
            <div className="whitespace-pre-wrap text-sm text-gray-800">{selfPR}</div>
          </div>
        )}

        {/* スキル・学歴は職務経歴書の必須構成から外すため非表示 */}
      </div>
    </div>
  );
};

export default ResumePreview;
