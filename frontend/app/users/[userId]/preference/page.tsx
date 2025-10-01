"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import apiClient from "@/lib/api-v2-client";
import useAuthV2 from "@/hooks/useAuthV2";
import toast from "react-hot-toast";

export default function UserPreferenceByIdPage() {
  const router = useRouter();
  const params = useParams<{ userId: string }>();
  const userId = params?.userId as string;
  const { currentUser } = useAuthV2();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumes, setResumes] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    desired_job: "",
    desired_industries: "",
    desired_locations: "",
  });

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

  // When entering edit mode, seed form values from target
  useEffect(() => {
    if (editing && target) {
      setForm({
        desired_job: target.desired_job || "",
        desired_industries: (target.desired_industries || []).join(", "),
        desired_locations: (target.desired_locations || []).join(", "),
      });
    }
  }, [editing, target]);

  const parseList = (v: string) => {
    return (v || "")
      .split(/,|、|\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload: any = {
        desired_job: form.desired_job || "",
        desired_industries: parseList(form.desired_industries),
        desired_locations: parseList(form.desired_locations),
      };
      if (target) {
        await apiClient.updateResume(target.id, payload);
      } else {
        // 履歴書がない場合は、その場で新規作成して希望条件のみ保存
        await apiClient.createResume({
          title: "メイン履歴書",
          ...payload,
        } as any);
      }
      toast.success("希望条件を保存しました");
      // Refresh public data
      const data = await apiClient.getPublicUserResumes(userId);
      setResumes(data || []);
      setEditing(false);
    } catch (e: any) {
      console.error(e);
      toast.error("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">読み込み中...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  const isOwner = !!(currentUser?.id && String(currentUser.id) === String(userId));
  if (!target) {
    const notOwnerView = (
      <div className="p-6">表示できる希望条件がありません</div>
    );
    if (!isOwner) return notOwnerView;

    // オーナーはその場で新規作成できるフォームを表示
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">希望条件</h1>
        </div>
        <div className="space-y-4 bg-white border rounded p-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">希望職種</label>
            <input
              value={form.desired_job}
              onChange={(e) => setForm({ ...form, desired_job: e.target.value })}
              placeholder="例: エンジニア"
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">希望業界（カンマ/空白/読点区切り）</label>
            <input
              value={form.desired_industries}
              onChange={(e) => setForm({ ...form, desired_industries: e.target.value })}
              placeholder="例: IT、メーカー"
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">希望勤務地（カンマ/空白/読点区切り）</label>
            <input
              value={form.desired_locations}
              onChange={(e) => setForm({ ...form, desired_locations: e.target.value })}
              placeholder="例: 東京、大阪"
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setForm({ desired_job: '', desired_industries: '', desired_locations: '' })}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={saving}
            >クリア</button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:bg-secondary-300"
              disabled={saving}
            >{saving ? '保存中...' : '保存する'}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">希望条件</h1>
        {isOwner && !editing && (
          <button onClick={() => setEditing(true)} className="btn-outline btn-outline-md">
            編集する
          </button>
        )}
      </div>

      {!editing ? (
        <>
          <div className="bg-white border rounded p-4 relative">
            <div className="text-xs text-gray-500">希望職種</div>
            <div className="text-sm">{target.desired_job || '未設定'}</div>
            {isOwner && !editing && (
              <button onClick={() => setEditing(true)} className="btn-outline btn-outline-sm absolute top-3 right-3" aria-label="希望条件を編集">編集</button>
            )}
          </div>

          <div className="bg-white border rounded p-4 relative">
            <div className="text-xs text-gray-500">希望業界</div>
            <div className="text-sm">{(target.desired_industries || []).join('、') || '未設定'}</div>
            {isOwner && !editing && (
              <button onClick={() => setEditing(true)} className="btn-outline btn-outline-sm absolute top-3 right-3" aria-label="希望条件を編集">編集</button>
            )}
          </div>

          <div className="bg-white border rounded p-4 relative">
            <div className="text-xs text-gray-500">希望勤務地</div>
            <div className="text-sm">{(target.desired_locations || []).join('、') || '未設定'}</div>
            {isOwner && !editing && (
              <button onClick={() => setEditing(true)} className="btn-outline btn-outline-sm absolute top-3 right-3" aria-label="希望条件を編集">編集</button>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-4 bg-white border rounded p-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">希望職種</label>
            <input
              value={form.desired_job}
              onChange={(e) => setForm({ ...form, desired_job: e.target.value })}
              placeholder="例: エンジニア"
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">希望業界（カンマ/空白/読点区切り）</label>
            <input
              value={form.desired_industries}
              onChange={(e) => setForm({ ...form, desired_industries: e.target.value })}
              placeholder="例: IT、メーカー"
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">希望勤務地（カンマ/空白/読点区切り）</label>
            <input
              value={form.desired_locations}
              onChange={(e) => setForm({ ...form, desired_locations: e.target.value })}
              placeholder="例: 東京、大阪"
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={saving}
            >キャンセル</button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:bg-secondary-300"
              disabled={saving}
            >{saving ? '保存中...' : '保存する'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
