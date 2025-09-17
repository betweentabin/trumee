"use client";

import { useEffect, useRef, useState } from 'react';
import apiClient from '@/lib/api-v2-client';
import type { ResumeFile } from '@/types/api-v2';
import toast from 'react-hot-toast';
import { FaUpload, FaTrash, FaExternalLinkAlt } from 'react-icons/fa';

const ACCEPT = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx'
];

export default function ResumeFileUpload() {
  const [files, setFiles] = useState<ResumeFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    try {
      const data = await apiClient.getResumeFiles();
      setFiles(data);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'アップロード済み履歴書の取得に失敗しました');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (!ACCEPT.includes(ext)) {
      toast.error('対応していないファイル形式です');
      return;
    }
    try {
      setUploading(true);
      await apiClient.uploadResumeFile(file);
      toast.success('履歴書ファイルをアップロードしました');
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'アップロードに失敗しました');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const onDelete = async (id: string) => {
    if (!confirm('このファイルを削除しますか？')) return;
    try {
      await apiClient.deleteResumeFile(id);
      toast.success('削除しました');
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || '削除に失敗しました');
    }
  };

  const formatSize = (size: number) => {
    if (size >= 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + ' MB';
    if (size >= 1024) return (size / 1024).toFixed(1) + ' KB';
    return size + ' B';
  };

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-3">履歴書（ファイル）</h3>
      <p className="text-sm text-gray-600 mb-4">
        Word（.doc, .docx）、Excel（.xls, .xlsx）、PDF（.pdf）に対応。1ファイルずつアップロードできます。
      </p>

      <div
        className={`flex flex-col items-center justify-center p-8 border-2 rounded-md ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-dashed border-secondary-300'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <FaUpload className="text-2xl text-gray-500 mb-2" />
        <p className="text-sm text-gray-700 mb-3">ここにファイルをドラッグ＆ドロップ</p>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT.join(',')}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:bg-secondary-300"
          >
            {uploading ? 'アップロード中...' : 'ファイルを選択'}
          </button>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="font-medium mb-2">アップロード済み</h4>
        {files.length === 0 ? (
          <div className="text-sm text-gray-500">まだファイルはありません</div>
        ) : (
          <ul className="divide-y">
            {files.map((f) => (
              <li key={f.id} className="py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{f.original_name}</div>
                  <div className="text-xs text-gray-500">{formatSize(f.size)} ・ {new Date(f.uploaded_at).toLocaleString('ja-JP')}</div>
                </div>
                <div className="flex items-center gap-2">
                  {f.file_url && (
                    <a href={f.file_url} target="_blank" className="px-3 py-1 border rounded text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-1" rel="noreferrer">
                      <FaExternalLinkAlt />
                      開く
                    </a>
                  )}
                  <button onClick={() => onDelete(f.id)} className="px-3 py-1 text-red-600 hover:bg-red-50 rounded flex items-center gap-1">
                    <FaTrash />
                    削除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        ・アップロードできるファイル形式: {ACCEPT.join(', ')} / サイズは 10MB 程度までを推奨
      </div>
    </div>
  );
}
