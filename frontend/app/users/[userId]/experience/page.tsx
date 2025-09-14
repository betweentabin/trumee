"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import apiClient from "@/lib/api-v2-client";
import useAuthV2 from "@/hooks/useAuthV2";

export default function UserExperienceByIdPage() {
  const router = useRouter();
  const params = useParams<{ userId: string }>();
  const userId = params?.userId as string;
  const { currentUser } = useAuthV2();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumes, setResumes] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;
    const run = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getPublicUserResumes(userId);
        setResumes(data || []);
      } catch (e: any) {
        setError(e?.response?.data?.error || "職歴の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [userId]);

  const target = useMemo(() => {
    if (!resumes?.length) return null;
    const active = resumes.find((r) => r.is_active);
    return active || resumes[0];
  }, [resumes]);

  if (loading) return <div className="p-6">読み込み中...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  const isOwner = !!(currentUser?.id && currentUser.id === userId);
  if (!target) return (
    <div className="p-6">
      表示できる職歴がありません
      {isOwner && (
        <div className="mt-3">
          <button
            onClick={() => router.push('/auth/step/step3-experience')}
            className="px-4 py-2 text-sm bg-[#FF733E] text-white rounded-md hover:bg-orange-70 active:bg-orange-60"
          >
            職歴を登録する
          </button>
        </div>
      )}
    </div>
  );

  const experiences = target.experiences || [];

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">職歴</h1>
        {isOwner && (
          <button
            onClick={() => router.push('/auth/step/step3-experience')}
            className="px-3 py-1.5 text-sm bg-[#FF733E] text-white rounded-md hover:bg-orange-70 active:bg-orange-60"
          >
            編集する
          </button>
        )}
      </div>
      <div className="space-y-4">
        {experiences.length === 0 && (
          <div className="text-sm text-gray-600">公開されている職歴がありません。</div>
        )}
        {experiences.map((exp: any) => (
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
    </div>
  );
}
