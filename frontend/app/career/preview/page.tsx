'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FaEdit, FaPlus, FaEye } from 'react-icons/fa';
import { getAuthHeaders } from '@/utils/auth';
import { buildApiUrl } from '@/config/api';

interface Resume {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export default function PreviewPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await fetch(buildApiUrl('/resumes/'), {
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const data = await response.json();
        setResumes(data.results || data);
      } else if (response.status === 401) {
        toast.error('ログインが必要です');
        router.push('/auth/login');
      } else {
        toast.error('職務経歴書の取得に失敗しました');
      }
    } catch (error) {
      console.error('Failed to fetch resumes:', error);
      toast.error('読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    router.push('/career/create');
  };

  const handleViewResume = (id: string) => {
    router.push(`/career/view/${id}`);
  };

  const handleEditResume = (id: string) => {
    router.push(`/career/edit/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">読み込み中...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">職務経歴書一覧</h1>
          <button
            onClick={handleCreateNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <FaPlus />
            新しい職務経歴書を作成
          </button>
        </div>

        {resumes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">職務経歴書がありません</h3>
            <p className="text-gray-500 mb-6">最初の職務経歴書を作成してみましょう</p>
            <button
              onClick={handleCreateNew}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              職務経歴書を作成する
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {resumes.map((resume) => (
              <div key={resume.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {resume.title || '職務経歴書'}
                    </h3>
                    <div className="text-sm text-gray-500 mb-4">
                      <p>作成日: {new Date(resume.created_at).toLocaleDateString('ja-JP')}</p>
                      <p>更新日: {new Date(resume.updated_at).toLocaleDateString('ja-JP')}</p>
                      {resume.is_active && (
                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mt-2">
                          アクティブ
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewResume(resume.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <FaEye />
                      表示
                    </button>
                    <button
                      onClick={() => handleEditResume(resume.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <FaEdit />
                      編集
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
