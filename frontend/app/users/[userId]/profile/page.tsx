"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import apiClient from "@/lib/api-v2-client";
import useAuthV2 from "@/hooks/useAuthV2";

interface PublicProfile {
  id: string;
  full_name: string;
  role: string;
  email?: string;
  phone?: string;
  profile_extension?: {
    bio?: string;
    headline?: string;
    profile_image_url?: string;
    location?: string;
    website_url?: string;
    github_url?: string;
    linkedin_url?: string;
    available_for_work?: boolean;
  };
  seeker_profile?: {
    experience_years?: number;
    prefecture?: string;
    desired_salary?: string;
  };
  resumes?: Array<{ id: string; title: string; is_active: boolean }>;
}

export default function UserProfileByIdPage() {
  const router = useRouter();
  const params = useParams<{ userId: string }>();
  const userId = params?.userId as string;
  const { currentUser } = useAuthV2();
  const [data, setData] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const run = async () => {
      try {
        setLoading(true);
        const res = await apiClient.getPublicUserProfile(userId);
        setData(res);
      } catch (e: any) {
        setError(e?.response?.data?.error || "プロフィールの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [userId]);

  if (loading) return <div className="p-6">読み込み中...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!data) return <div className="p-6">データがありません</div>;

  const ext = data.profile_extension || {};
  const seeker = data.seeker_profile || {};
  const isOwner = !!(currentUser?.id && currentUser.id === userId);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{data.full_name}</h1>
        {ext.headline && (
          <p className="text-gray-600 mt-1">{ext.headline}</p>
        )}
        {isOwner && (
          <div className="mt-3">
            <button
              onClick={() => router.push('/auth/step/step1-profile')}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              プロフィールを編集する
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ext.location && (
          <div className="bg-white border rounded p-4">
            <div className="text-xs text-gray-500">居住地</div>
            <div className="text-sm">{ext.location}</div>
          </div>
        )}
        {typeof seeker.experience_years !== "undefined" && (
          <div className="bg-white border rounded p-4">
            <div className="text-xs text-gray-500">経験年数</div>
            <div className="text-sm">{seeker.experience_years}年</div>
          </div>
        )}
        {seeker.prefecture && (
          <div className="bg-white border rounded p-4">
            <div className="text-xs text-gray-500">都道府県</div>
            <div className="text-sm">{seeker.prefecture}</div>
          </div>
        )}
        {data.email && (
          <div className="bg-white border rounded p-4">
            <div className="text-xs text-gray-500">メール</div>
            <div className="text-sm">{data.email}</div>
          </div>
        )}
        {data.phone && (
          <div className="bg-white border rounded p-4">
            <div className="text-xs text-gray-500">電話番号</div>
            <div className="text-sm">{data.phone}</div>
          </div>
        )}
      </div>

      {ext.bio && (
        <div className="bg-white border rounded p-4">
          <h2 className="font-semibold mb-2">自己紹介</h2>
          <p className="whitespace-pre-wrap text-sm">{ext.bio}</p>
        </div>
      )}
    </div>
  );
}
