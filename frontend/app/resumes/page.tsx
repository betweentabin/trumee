'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api-v2-client';
import type { ResumeFile } from '@/types/api-v2';
import useAuthV2 from '@/hooks/useAuthV2';
import toast from 'react-hot-toast';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaCheckCircle,
  FaClock,
  FaFileAlt
} from 'react-icons/fa';

interface Resume {
  id: string;
  title: string;
  description?: string;
  skills?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function ResumesPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumeFiles, setResumeFiles] = useState<ResumeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, initializeAuth, currentUser } = useAuthV2();

  // 認証状態をチェックして初期化
  useEffect(() => {
    const initialize = async () => {
      await initializeAuth();
    };
    initialize();
  }, []);

  // Redirect to user-specific page if logged in
  useEffect(() => {
    if (currentUser?.id) {
      router.replace(`/users/${currentUser.id}/resumes`);
    }
  }, [currentUser, router]);

  // 認証が完了したら履歴書データを取得
  useEffect(() => {
    if (isAuthenticated) {
      console.log('📄 Resumes page: Loading with DRF authentication');
      fetchResumes();
    } else if (isAuthenticated === false) {
      const hasStored = typeof window !== 'undefined' && !!localStorage.getItem('drf_token_v2');
      if (!hasStored) {
        router.push('/auth/login');
      }
    }
  }, [isAuthenticated, router]);

  const fetchResumes = async () => {
    try {
      // DRFトークン認証でAPI v2から履歴書データを取得
      const [data, files] = await Promise.all([
        apiClient.getResumes(),
        apiClient.getResumeFiles().catch(() => [])
      ]);
      console.log('Fetched resumes from API:', data);
      setResumes(data || []);
      setResumeFiles(files || []);
    } catch (error: any) {
      console.error('Failed to fetch resumes:', error);
      
      // 認証エラーの場合はログインページにリダイレクト
      if (error?.response?.status === 401) {
        toast.error('ログインが必要です');
        router.push('/auth/login');
        return;
      }
      
      toast.error('履歴書の取得に失敗しました');
      setResumes([]); // エラー時は空配列を設定
      setResumeFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この履歴書を削除してもよろしいですか？')) {
      return;
    }

    try {
      await apiClient.delete(`/api/v2/resumes/${id}/`);
      toast.success('履歴書を削除しました');
      fetchResumes();
    } catch (error: any) {
      console.error('Failed to delete resume:', error);
      if (error?.response?.status === 401) {
        toast.error('ログインが必要です');
        router.push('/auth/login');
      } else {
        toast.error('履歴書の削除に失敗しました');
      }
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await apiClient.updateResume(id, { is_active: true });
      toast.success('履歴書を有効化しました');
      fetchResumes();
    } catch (error: any) {
      console.error('Failed to activate resume:', error);
      if (error?.response?.status === 401) {
        toast.error('ログインが必要です');
        router.push('/auth/login');
      } else {
        toast.error('履歴書の有効化に失敗しました');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">履歴書管理</h1>
            <p className="mt-2 text-gray-600">
              履歴書を作成・編集して、企業にアピールしましょう
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/users/myinfo/paidplans" className="btn-outline btn-outline-md">有料プラン</Link>
            <Link
              href="/career/create"
              className="inline-flex items-center btn-outline btn-outline-md"
            >
              <FaPlus className="mr-2" />
              新規作成
            </Link>
          </div>
        </div>

        {/* Resume List */}
        {resumes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FaFileAlt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              まだ履歴書がありません
            </h3>
            <p className="text-gray-600 mb-6">
              履歴書を作成して、企業へのアピールを始めましょう
            </p>
            <Link
              href="/career/create"
              className="inline-flex items-center btn-outline btn-outline-md"
            >
              <FaPlus className="mr-2" />
              最初の履歴書を作成
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="p-7 md:p-8">
                  <div className="flex items-start justify-between mb-5">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {resume.title}
                    </h3>
                    {resume.is_active && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        <FaCheckCircle className="mr-2" />
                        有効
                      </span>
                    )}
                  </div>

                  {resume.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {resume.description}
                    </p>
                  )}

                  {resume.skills && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">スキル</p>
                      <p className="text-sm text-gray-700 line-clamp-1">
                        {resume.skills}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-500 mb-5">
                    <FaClock className="mr-2" />
                    更新日: {formatDate(resume.updated_at)}
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/resumes/${resume.id}`}
                      className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <FaEye className="mr-2" />
                      詳細
                    </Link>
                    <Link
                      href={`/career/edit/${resume.id}`}
                      className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <FaEdit className="mr-2" />
                      編集
                    </Link>
                    {!resume.is_active && (
                      <button
                        onClick={() => handleActivate(resume.id)}
                        className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-green-500 text-sm font-medium rounded-md text-white hover:bg-green-600"
                      >
                        有効化
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(resume.id)}
                      className="inline-flex items-center justify-center px-4 py-3 text-sm font-medium rounded-md text-red-600 hover:bg-red-50"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
