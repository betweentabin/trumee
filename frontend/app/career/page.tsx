'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector } from '@/app/redux/hooks';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaEye, FaPrint, FaTrash, FaClock, FaFileAlt } from 'react-icons/fa';

interface Resume {
  id: string;
  title: string;
  fullName: string;
  email: string;
  desiredPosition: string;
  createdAt: string;
  updatedAt: string;
}

export default function CareerPage() {
  const router = useRouter();
  const authState = useAppSelector(state => state.auth);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authState.isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    fetchResumes();
  }, [authState, router]);

  const fetchResumes = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/resumes/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setResumes(data.results || data);
      } else {
        console.error('Failed to fetch resumes');
      }
    } catch (error) {
      console.error('Error fetching resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この職務経歴書を削除してもよろしいですか？')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/resumes/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        toast.success('職務経歴書を削除しました');
        fetchResumes();
      } else {
        toast.error('削除に失敗しました');
      }
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast.error('エラーが発生しました');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">職務経歴書</h1>
            <p className="text-gray-600 mt-2">あなたの職務経歴書を管理できます</p>
          </div>
          <Link href="/career/create">
            <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              <FaPlus />
              新規作成
            </button>
          </Link>
        </div>

        {resumes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FaFileAlt className="mx-auto h-24 w-24 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              職務経歴書がありません
            </h3>
            <p className="text-gray-500 mb-6">
              新規作成ボタンをクリックして、職務経歴書を作成しましょう
            </p>
            <Link href="/career/create">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                職務経歴書を作成する
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map((resume) => (
              <div key={resume.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {resume.title || '無題の職務経歴書'}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>氏名: {resume.fullName}</p>
                    <p>希望職種: {resume.desiredPosition || '未設定'}</p>
                    <div className="flex items-center gap-1">
                      <FaClock className="text-gray-400" />
                      <span>更新: {new Date(resume.updatedAt).toLocaleDateString('ja-JP')}</span>
                    </div>
                  </div>
                </div>
                <div className="border-t px-6 py-4 flex justify-between">
                  <div className="flex gap-2">
                    <Link href={`/career/preview?id=${resume.id}`}>
                      <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition">
                        <FaEye />
                      </button>
                    </Link>
                    <Link href={`/career/edit/${resume.id}`}>
                      <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition">
                        <FaEdit />
                      </button>
                    </Link>
                    <Link href={`/career/print?id=${resume.id}`}>
                      <button className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition">
                        <FaPrint />
                      </button>
                    </Link>
                  </div>
                  <button
                    onClick={() => handleDelete(resume.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
