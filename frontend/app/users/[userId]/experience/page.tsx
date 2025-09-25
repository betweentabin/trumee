"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import apiClient from "@/lib/api-v2-client";
import useAuthV2 from "@/hooks/useAuthV2";
import { normalizeResumeExperiences } from "@/app/utils/resume";

export default function UserExperienceByIdPage() {
  const router = useRouter();
  const pathname = usePathname();
  const userId = useMemo(() => {
    // prefer path param (/users/:id/experience)
    try {
      const parts = (pathname || "").split("/").filter(Boolean);
      if (parts[0] === 'users' && parts[1]) return parts[1];
    } catch {}
    // fallback to localStorage (during auth rehydration)
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('current_user_v2');
        const id = raw ? JSON.parse(raw)?.id : undefined;
        return id ? String(id) : '';
      }
    } catch {}
    return '';
  }, [pathname]);
  const { currentUser } = useAuthV2();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumes, setResumes] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const run = async () => {
      try {
        setLoading(true);
        // ローカル保存のユーザーIDでフォールバック判定（認証復元前の瞬間対策）
        const storedUserId = (() => {
          if (typeof window === 'undefined') return null as any;
          try { return JSON.parse(localStorage.getItem('current_user_v2') || 'null')?.id || null; } catch { return null; }
        })();
        const isOwner = !!(
          (currentUser?.id && String(currentUser.id) === String(userId)) ||
          (storedUserId && String(storedUserId) === String(userId))
        );
        const data = isOwner ? await apiClient.getResumes() : await apiClient.getPublicUserResumes(userId);
        const list = Array.isArray(data) ? data : [];
        setResumes(list);
      } catch (e: any) {
        console.error('Experience load error', e);
        setError(e?.response?.data?.error || '職歴の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [userId, currentUser?.id]);

  const target = useMemo(() => {
    if (!resumes?.length) return null;
    const active = resumes.find((r) => r.is_active);
    return active || resumes[0];
  }, [resumes]);

  if (loading) return <div className="p-6">読み込み中...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  const isOwner = !!(currentUser?.id && String(currentUser.id) === String(userId));
  if (!target) return (
    <div className="p-6">
      表示できる職歴がありません
      {isOwner && (
        <div className="mt-3">
          <button
            onClick={() => router.push('/auth/step/step3-experience')}
            className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-md"
          >
            職歴を登録する
          </button>
        </div>
      )}
    </div>
  );

  const experiences = useMemo(() => {
    try {
      return normalizeResumeExperiences(target);
    } catch (e) {
      console.error('normalize error', e);
      return [] as any[];
    }
  }, [target]);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">職歴</h1>
        {isOwner && (
          <button
            onClick={() => router.push('/auth/step/step3-experience')}
            className="px-3 py-1.5 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-md"
          >
            編集する
          </button>
        )}
      </div>
      <div className="space-y-4">
        {experiences.length === 0 && (
          <div className="text-sm text-gray-600">公開されている職歴がありません。</div>
        )}
        {experiences.map((exp) => (
          <div key={exp.id} className="bg-white border rounded p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{exp.company}</div>
              <div className="text-xs text-gray-500">
                {exp.period_from || '不明'} - {exp.period_to || '現在'}
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
