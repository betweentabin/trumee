'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api-v2-client';
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
  const [loading, setLoading] = useState(true);
  // 🚨 認証チェックを無効化
  // const { isAuthenticated, initializeAuth } = useAuthV2();

  // ページ読み込み時にダミーデータを表示
  useEffect(() => {
    console.log('📄 Resumes page: Loading without auth checks');
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      // 🚨 デバッグモード: localStorageから作成済みデータを取得
      const storedResumes = localStorage.getItem('debug_resumes');
      let createdResumes = storedResumes ? JSON.parse(storedResumes) : [];
      
      // デフォルトのダミーデータ
      const defaultResumes = [
        {
          id: '1',
          title: 'ソフトウェアエンジニア向け履歴書',
          description: 'フルスタック開発の経験を活かし、革新的なプロダクト開発に貢献したいと考えています。',
          skills: 'React, Node.js, TypeScript, Python, AWS',
          is_active: true,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-20T14:30:00Z'
        },
        {
          id: '2',
          title: 'フロントエンドエンジニア履歴書',
          description: 'ユーザー体験を重視したモダンなWebアプリケーション開発に専念しています。',
          skills: 'React, Vue.js, TypeScript, Sass, Figma',
          is_active: false,
          created_at: '2024-01-10T09:00:00Z',
          updated_at: '2024-01-18T16:00:00Z'
        }
      ];
      
      // 作成済みデータとデフォルトデータを結合（作成済みを上に表示）
      const allResumes = [...createdResumes, ...defaultResumes];
      setResumes(allResumes);
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
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この履歴書を削除してもよろしいですか？')) {
      return;
    }

    try {
      await apiClient.deleteResume(id);
      toast.success('履歴書を削除しました');
      fetchResumes();
    } catch (error) {
      console.error('Failed to delete resume:', error);
      toast.error('履歴書の削除に失敗しました');
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await apiClient.activateResume(id);
      toast.success('履歴書を有効化しました');
      fetchResumes();
    } catch (error) {
      console.error('Failed to activate resume:', error);
      toast.error('履歴書の有効化に失敗しました');
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF733E]"></div>
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
          <Link
            href="/resumes/new"
            className="inline-flex items-center px-4 py-2 bg-[#FF733E] text-white rounded-md hover:bg-[#e9632e] transition-colors"
          >
            <FaPlus className="mr-2" />
            新規作成
          </Link>
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
              href="/resumes/new"
              className="inline-flex items-center px-4 py-2 bg-[#FF733E] text-white rounded-md hover:bg-[#e9632e] transition-colors"
            >
              <FaPlus className="mr-2" />
              最初の履歴書を作成
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {resume.title}
                    </h3>
                    {resume.is_active && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        <FaCheckCircle className="mr-1" />
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

                  <div className="flex items-center text-xs text-gray-500 mb-4">
                    <FaClock className="mr-1" />
                    更新日: {formatDate(resume.updated_at)}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/resumes/${resume.id}`}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <FaEye className="mr-1" />
                      詳細
                    </Link>
                    <Link
                      href={`/resumes/${resume.id}/edit`}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <FaEdit className="mr-1" />
                      編集
                    </Link>
                    {!resume.is_active && (
                      <button
                        onClick={() => handleActivate(resume.id)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-green-500 text-sm font-medium rounded-md text-white hover:bg-green-600"
                      >
                        有効化
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(resume.id)}
                      className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}