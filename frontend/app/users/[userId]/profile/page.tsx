"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import apiClient from "@/lib/api-v2-client";
import useAuthV2 from "@/hooks/useAuthV2";
import toast from "react-hot-toast";

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
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<{
    experience_years: number;
    prefecture: string;
    email: string;
    phone: string;
  }>({
    experience_years: 0,
    prefecture: '',
    email: '',
    phone: ''
  });

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

  const startEditing = () => {
    setIsEditing(true);
    setEditData({
      experience_years: seeker.experience_years || 0,
      prefecture: seeker.prefecture || '',
      email: data.email || '',
      phone: data.phone || ''
    });
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData({
      experience_years: 0,
      prefecture: '',
      email: '',
      phone: ''
    });
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      
      // Seeker profile更新
      const seekerUpdateData: any = {};
      if (editData.experience_years !== seeker.experience_years) {
        seekerUpdateData.experience_years = editData.experience_years;
      }
      if (editData.prefecture !== seeker.prefecture) {
        seekerUpdateData.prefecture = editData.prefecture;
      }
      
      if (Object.keys(seekerUpdateData).length > 0) {
        await apiClient.updateSeekerProfile(userId, seekerUpdateData);
      }
      
      // メールと電話番号の更新
      const userUpdateData: any = {};
      if (editData.email !== data.email) {
        userUpdateData.email = editData.email;
      }
      if (editData.phone !== data.phone) {
        userUpdateData.phone = editData.phone;
      }
      
      if (Object.keys(userUpdateData).length > 0) {
        await apiClient.updateUserInfo(userId, userUpdateData);
      }
      
      // ローカルデータを更新
      setData({
        ...data!,
        email: editData.email,
        phone: editData.phone,
        seeker_profile: {
          ...seeker,
          experience_years: editData.experience_years,
          prefecture: editData.prefecture
        }
      });
      
      setIsEditing(false);
      toast.success('プロフィールを更新しました');
    } catch (error) {
      console.error('保存エラー:', error);
      toast.error('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const prefectures = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
  ];

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{data.full_name}</h1>
        {ext.headline && (
          <p className="text-gray-600 mt-1">{ext.headline}</p>
        )}
        {isOwner && (
          <div className="mt-3 flex gap-2">
            {!isEditing ? (
              <button
                onClick={startEditing}
                className="px-4 py-2 text-sm bg-[#FF733E] text-white rounded-md hover:bg-[#FF8659]"
              >
                プロフィールを編集する
              </button>
            ) : (
              <>
                <button
                  onClick={saveChanges}
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
                <button
                  onClick={cancelEditing}
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-gray-400 text-white rounded-md hover:bg-gray-500 disabled:bg-gray-300"
                >
                  キャンセル
                </button>
              </>
            )}
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
        {(typeof seeker.experience_years !== "undefined" || isEditing) && (
          <div className="bg-white border rounded p-4">
            <div className="text-xs text-gray-500">経験年数</div>
            {isEditing && isOwner ? (
              <input
                type="number"
                value={editData.experience_years}
                onChange={(e) => setEditData({...editData, experience_years: parseInt(e.target.value) || 0})}
                className="text-sm border rounded px-2 py-1 w-full mt-1"
                min="0"
                max="50"
              />
            ) : (
              <div className="text-sm">{seeker.experience_years}年</div>
            )}
          </div>
        )}
        {(seeker.prefecture || isEditing) && (
          <div className="bg-white border rounded p-4">
            <div className="text-xs text-gray-500">都道府県</div>
            {isEditing && isOwner ? (
              <select
                value={editData.prefecture}
                onChange={(e) => setEditData({...editData, prefecture: e.target.value})}
                className="text-sm border rounded px-2 py-1 w-full mt-1"
              >
                <option value="">選択してください</option>
                {prefectures.map(pref => (
                  <option key={pref} value={pref}>{pref}</option>
                ))}
              </select>
            ) : (
              <div className="text-sm">{seeker.prefecture}</div>
            )}
          </div>
        )}
        {(data.email || isEditing) && (
          <div className="bg-white border rounded p-4">
            <div className="text-xs text-gray-500">メール</div>
            {isEditing && isOwner ? (
              <input
                type="email"
                value={editData.email}
                onChange={(e) => setEditData({...editData, email: e.target.value})}
                className="text-sm border rounded px-2 py-1 w-full mt-1"
                placeholder="example@email.com"
              />
            ) : (
              <div className="text-sm">{data.email}</div>
            )}
          </div>
        )}
        {(data.phone || isEditing) && (
          <div className="bg-white border rounded p-4">
            <div className="text-xs text-gray-500">電話番号</div>
            {isEditing && isOwner ? (
              <input
                type="tel"
                value={editData.phone}
                onChange={(e) => setEditData({...editData, phone: e.target.value})}
                className="text-sm border rounded px-2 py-1 w-full mt-1"
                placeholder="09012345678"
              />
            ) : (
              <div className="text-sm">{data.phone}</div>
            )}
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
