"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import apiClient from "@/lib/api-v2-client";

export default function PublicResumeDetailPage() {
  const params = useParams<{ userId: string; resumeId: string }>();
  const userId = params?.userId as string;
  const resumeId = params?.resumeId as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resume, setResume] = useState<any | null>(null);

  useEffect(() => {
    if (!userId || !resumeId) return;
    const run = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getPublicUserResumeDetail(userId, resumeId);
        setResume(data);
      } catch (e: any) {
        setError(e?.response?.data?.error || "履歴書の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [userId, resumeId]);

  if (loading) return <div className="p-6">読み込み中...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!resume) return <div className="p-6">データがありません</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{resume.title}</h1>
        {resume.description && (
          <p className="text-gray-700 mt-2 whitespace-pre-wrap">{resume.description}</p>
        )}
      </div>

      {(resume.skills || resume.self_pr) && (
        <div className="bg-white border rounded p-4 space-y-3">
          {resume.skills && (
            <div>
              <div className="text-xs text-gray-500 mb-1">スキル</div>
              <div className="text-sm whitespace-pre-wrap">{resume.skills}</div>
            </div>
          )}
          {resume.self_pr && (
            <div>
              <div className="text-xs text-gray-500 mb-1">自己PR</div>
              <div className="text-sm whitespace-pre-wrap">{resume.self_pr}</div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">職歴</h2>
        {(resume.experiences || []).length === 0 && (
          <div className="text-sm text-gray-600">職歴情報はありません。</div>
        )}
        {(resume.experiences || []).map((exp: any) => (
          <div key={exp.id} className="bg-white border rounded p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{exp.company}</div>
              <div className="text-xs text-gray-500">
                {exp.period_from} - {exp.period_to || '現在'}
              </div>
            </div>
            {exp.position && (
              <div className="text-sm text-gray-700 mt-1">{exp.position}</div>
            )}
            {exp.tasks && (
              <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{exp.tasks}</p>
            )}
          </div>
        ))}
      </div>

      {Array.isArray(resume.certifications) && resume.certifications.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">資格</h2>
          {resume.certifications.map((c: any) => (
            <div key={c.id} className="bg-white border rounded p-4">
              <div className="font-semibold">{c.name}</div>
              {c.issuer && (
                <div className="text-xs text-gray-500 mt-1">{c.issuer}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

