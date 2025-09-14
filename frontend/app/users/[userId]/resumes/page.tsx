"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import apiClient from "@/lib/api-v2-client";
import type { ResumeFile } from "@/types/api-v2";
import { FaExternalLinkAlt } from "react-icons/fa";

export default function UserResumesByIdPage() {
  const params = useParams<{ userId: string }>();
  const userId = params?.userId as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<ResumeFile[]>([]);

  useEffect(() => {
    // このページでは「登録情報の確認・変更」でアップロードした履歴書ファイルを表示する
    const run = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getResumeFiles();
        setFiles(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError(e?.response?.data?.detail || "履歴書の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [userId]);

  const formatSize = (size: number) => {
    if (size >= 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + " MB";
    if (size >= 1024) return (size / 1024).toFixed(1) + " KB";
    return size + " B";
  };

  if (loading) return <div className="p-6">読み込み中...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">履歴書</h1>
        {/* 添削チャットへのボタンは非表示に変更 */}
      </div>
      {files.length === 0 ? (
        <div className="text-sm text-gray-600">アップロード済みの履歴書はありません。</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {files.map((f) => (
            <div key={f.id} className="bg-white border rounded p-4">
              <div className="font-semibold truncate" title={f.original_name}>
                {f.original_name || "履歴書"}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(f.uploaded_at).toLocaleString("ja-JP")} ・ {formatSize(f.size)}
              </div>
              {f.file_url && (
                <div className="mt-3">
                  <a
                    href={f.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center px-3 py-1 border rounded text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <FaExternalLinkAlt className="mr-1" />
                    開く
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
