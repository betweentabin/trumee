"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import apiClient from "@/lib/api-v2-client";
import useAuthV2 from "@/hooks/useAuthV2";

export default function UserPreferenceByIdPage() {
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
        setError(e?.response?.data?.error || "希望条件の取得に失敗しました");
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
      表示できる希望条件がありません
      {isOwner && (
        <div className="mt-3">
          <button
            onClick={() => router.push('/auth/step/step4-preference')}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            希望条件を設定する
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">希望条件</h1>
        {isOwner && (
          <button
            onClick={() => router.push('/auth/step/step4-preference')}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            編集する
          </button>
        )}
      </div>

      <div className="bg-white border rounded p-4">
        <div className="text-xs text-gray-500">希望職種</div>
        <div className="text-sm">{target.desired_job || '未設定'}</div>
      </div>

      <div className="bg-white border rounded p-4">
        <div className="text-xs text-gray-500">希望業界</div>
        <div className="text-sm">{(target.desired_industries || []).join('、') || '未設定'}</div>
      </div>

      <div className="bg-white border rounded p-4">
        <div className="text-xs text-gray-500">希望勤務地</div>
        <div className="text-sm">{(target.desired_locations || []).join('、') || '未設定'}</div>
      </div>
    </div>
  );
}
