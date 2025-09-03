"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import apiClient from "@/lib/api-v2-client";

export default function UserResumesByIdPage() {
  const params = useParams<{ userId: string }>();
  const userId = params?.userId as string;
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
        setError(e?.response?.data?.error || "履歴書の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [userId]);

  if (loading) return <div className="p-6">読み込み中...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">公開履歴書</h1>
      {resumes.length === 0 ? (
        <div className="text-sm text-gray-600">公開中の履歴書はありません。</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resumes.map((r) => (
            <Link
              key={r.id}
              href={`/users/${userId}/resumes/${r.id}`}
              className="block bg-white border rounded p-4 hover:shadow"
            >
              <div className="font-semibold">{r.title}</div>
              {r.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{r.description}</p>
              )}
              {!r.is_active && (
                <div className="text-xs text-gray-400 mt-2">非公開</div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
