"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import apiClient from "@/lib/api-v2-client";
import type { Resume, ResumeFile } from "@/types/api-v2";
import { FaPlus, FaEdit, FaTrash, FaEye, FaCheckCircle, FaClock } from "react-icons/fa";
import toast from "react-hot-toast";
import { getAuthHeaders } from "@/utils/auth";

export default function UserResumesByIdPage() {
  const params = useParams<{ userId: string }>();
  const pathname = usePathname();
  const userId = params?.userId as string;

  const to = useMemo(() => (path: string) => {
    const parts = pathname?.split("/").filter(Boolean) || [];
    return parts[0] === "users" && parts[1] ? `/users/${parts[1]}${path}` : path;
  }, [pathname]);

  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumeFiles, setResumeFiles] = useState<ResumeFile[]>([]);
  const [threadCounts, setThreadCounts] = useState<Record<string, { total: number; unresolved: number }>>({});
  const [firstUnresolvedAnn, setFirstUnresolvedAnn] = useState<Record<string, string>>({});

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const [data, files] = await Promise.all([
        apiClient.getResumes(),
        apiClient.getResumeFiles().catch(() => [])
      ]);
      const list = Array.isArray(data) ? data : [];
      setResumeFiles(files || []);
      if (list.length > 0) {
        setResumes(list);
      } else {
        // Fallback to local debug storage if available
        const stored = typeof window !== 'undefined' ? localStorage.getItem('debug_career_resumes') : null;
        const local = stored ? JSON.parse(stored) : [];
        setResumes(local as any);
      }
      // Fetch comment threads to compute counts per resume
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://trumee-production.up.railway.app' : 'http://localhost:8000');
        const res = await fetch(`${apiUrl}/api/v2/advice/threads/?subject=resume_advice&mode=comment`, { headers: { ...getAuthHeaders() } });
        if (res.ok) {
          const threads: any[] = await res.json();
          const counts: Record<string, { total: number; unresolved: number }> = {};
          const first: Record<string, string> = {};
          threads.forEach((t: any) => {
            const rid = String(t?.annotation?.resume || '');
            if (!rid) return;
            const c = counts[rid] || { total: 0, unresolved: 0 };
            c.total += 1;
            if (t?.unresolved) c.unresolved += 1;
            counts[rid] = c;
            if (t?.unresolved && !first[rid]) {
              first[rid] = String(t?.annotation?.id || '');
            }
          });
          setThreadCounts(counts);
          setFirstUnresolvedAnn(first);
        } else {
          setThreadCounts({});
          setFirstUnresolvedAnn({});
        }
      } catch {
        setThreadCounts({});
        setFirstUnresolvedAnn({});
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "履歴書の取得に失敗しました");
      const stored = typeof window !== 'undefined' ? localStorage.getItem('debug_career_resumes') : null;
      const local = stored ? JSON.parse(stored) : [];
      setResumes(local as any);
      setResumeFiles([]);
      setThreadCounts({});
      setFirstUnresolvedAnn({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleDelete = async (id: string) => {
    if (!confirm("この履歴書を削除してもよろしいですか？")) return;
    try {
      await apiClient.deleteResume(id);
      toast.success("履歴書を削除しました");
      fetchResumes();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "削除に失敗しました");
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await apiClient.updateResume(id, { is_active: true } as any);
      toast.success("履歴書を有効化しました");
      fetchResumes();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "有効化に失敗しました");
    }
  };

  const formatDate = (s?: string) => {
    if (!s) return "";
    const d = new Date(s);
    return d.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
  };

  if (loading) return <div className="p-6">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">履歴書管理</h1>
            <p className="mt-2 text-gray-600">履歴書を作成・編集して、企業にアピールしましょう</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={to('/myinfo/paidplans')} className="btn-outline btn-outline-md">有料プラン</Link>
            <Link
              href={to("/career/create")}
              className="inline-flex items-center btn-outline btn-outline-md"
            >
              <FaPlus className="mr-2" />
              新規作成
            </Link>
          </div>
        </div>

        {resumes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-6">まだ履歴書がありません</p>
            <Link
              href={to("/career/create")}
              className="inline-flex items-center btn-outline btn-outline-md"
            >
              <FaPlus className="mr-2" />
              最初の履歴書を作成
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map((r) => {
              const title = (r as any)?.extra_data?.title || r.title || r.desired_job || "職務経歴書";
              const skills = r.skills;
              const updated = r.updated_at || r.created_at;
              return (
                <div key={r.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate" title={title}>{title}</h3>
                        {(threadCounts[String(r.id)]?.total || 0) > 0 && (
                          <div className="mt-1 text-xs">
                            <span className="inline-flex items-center px-2 py-[2px] rounded-full bg-red-50 text-red-700 border border-red-200">
                              コメント {threadCounts[String(r.id)]?.total || 0}
                              {(threadCounts[String(r.id)]?.unresolved || 0) > 0 && (
                                <span className="ml-1 text-[10px] text-red-600">(未解決 {threadCounts[String(r.id)].unresolved})</span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {r.is_active && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            <FaCheckCircle className="mr-1" />
                            有効
                          </span>
                        )}
                      </div>
                    </div>
                    {skills && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-1">スキル</p>
                        <p className="text-sm text-gray-700 line-clamp-1">{skills}</p>
                      </div>
                    )}
                    <div className="flex items-center text-xs text-gray-500 mb-4">
                      <FaClock className="mr-1" /> 更新日: {formatDate(updated)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link
                        href={to(`/career/print?id=${r.id}`)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <FaEye className="mr-1" /> 詳細
                      </Link>
                      {/* 添削チャット（絵文字ボタン） */}
                      <Link
                        href={to(`/resume-advice/review?resume_id=${r.id}${firstUnresolvedAnn[String(r.id)] ? `&annotation_id=${firstUnresolvedAnn[String(r.id)]}` : ''}`)}
                        className="inline-flex items-center justify-center px-3 py-2 text-2xl leading-none rounded-md hover:bg-orange-50"
                        title="添削チャットを開く"
                        aria-label="添削チャットを開く"
                      >
                        💬
                      </Link>
                      <Link
                        href={to(`/career/edit/${r.id}`)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <FaEdit className="mr-1" /> 編集
                      </Link>
                      {!r.is_active && (
                        <button
                          onClick={() => handleActivate(r.id)}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-green-500 text-sm font-medium rounded-md text-white hover:bg-green-600"
                        >
                          有効化
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Uploaded Resume Files */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">アップロードされた履歴書（ファイル）</h2>
          {resumeFiles.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-gray-600">アップロードされた履歴書はありません</div>
          ) : (
            <div className="bg-white rounded-lg shadow divide-y">
              {resumeFiles.map((f) => (
                <div key={f.id} className="p-4 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">{f.original_name}</div>
                    <div className="text-xs text-gray-500">{new Date(f.uploaded_at).toLocaleString('ja-JP')}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {f.file_url && (
                      <a href={f.file_url} target="_blank" rel="noopener noreferrer" className="px-3 py-2 text-sm rounded-md border hover:bg-gray-50">
                        開く
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
