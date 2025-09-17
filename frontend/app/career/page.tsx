'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useAuthV2 from '@/hooks/useAuthV2';
import { getAuthHeaders } from '@/utils/auth';
import { buildApiUrl } from '@/config/api';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaEye, FaPrint, FaTrash, FaClock, FaFileAlt } from 'react-icons/fa';
import { FaDownload } from 'react-icons/fa';

interface Resume {
  id: string;
  title: string;
  fullName: string;
  email: string;
  desiredPosition: string;
  createdAt: string;
  updatedAt: string;
  isComplete?: boolean;
}

export default function CareerPage() {
  const router = useRouter();
  const pathname = usePathname();
  const userIdFromPath = (() => {
    if (!pathname) return null;
    const parts = pathname.split('/').filter(Boolean);
    if (parts[0] === 'users' && parts[1]) return parts[1];
    return null;
  })();
  const to = (path: string) => userIdFromPath ? `/users/${userIdFromPath}${path}` : path;
  // 🚨 認証チェックを無効化
  // const { isAuthenticated, initializeAuth } = useAuthV2();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);

  // 初回ロードでAPIから取得。失敗時はローカルのダミーデータにフォールバック
  useEffect(() => {
    console.log('📄 Career page: trying API, fallback to local data');
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const res = await fetch(buildApiUrl('/resumes/'), {
        headers: {
          ...getAuthHeaders(),
        },
      });
      if (res.ok) {
        const data = await res.json();
        const list = (data.results || data || []).map((r: any) => ({
          id: String(r.id),
          title: r?.extra_data?.title || r?.desired_job || '職務経歴書',
          fullName: r?.extra_data?.fullName || '',
          email: r?.extra_data?.email || '',
          desiredPosition: r?.desired_job || '',
          createdAt: r?.created_at,
          updatedAt: r?.updated_at,
          isComplete: Boolean(
            r?.is_complete ||
            r?.extra_data?.completed ||
            ((r?.skills && r?.self_pr) && ((r?.experiences?.length || 0) > 0 || (r?.extra_data?.workExperiences?.length || 0) > 0))
          ),
        }));
        setResumes(list);
        return;
      }

      // APIが失敗した場合はローカルのダミーデータへフォールバック
      const storedCareerResumes = localStorage.getItem('debug_career_resumes');
      let createdResumes = storedCareerResumes ? JSON.parse(storedCareerResumes) : [];
      const defaultResumes = [
        { id: '1', title: 'ソフトウェアエンジニア職務経歴書', fullName: '山田太郎', email: 'yamada@example.com', desiredPosition: 'フルスタックエンジニア', createdAt: '2024-01-15', updatedAt: '2024-01-20' },
        { id: '2', title: 'フロントエンド開発者職務経歴書', fullName: '山田太郎', email: 'yamada@example.com', desiredPosition: 'フロントエンドエンジニア', createdAt: '2024-01-10', updatedAt: '2024-01-18' },
      ];
      setResumes([...createdResumes, ...defaultResumes]);
    } catch (error) {
      console.error('Error fetching resumes:', error);
      // フォールバック
      const storedCareerResumes = localStorage.getItem('debug_career_resumes');
      let createdResumes = storedCareerResumes ? JSON.parse(storedCareerResumes) : [];
      setResumes(createdResumes);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この職務経歴書を削除してもよろしいですか？')) return;
    
    try {
      const response = await fetch(buildApiUrl(`/resumes/${id}/`), {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
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
          <div className="flex items-center gap-3">
            <Link href={to('/advice/resume')}>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                添削チャットへ
              </button>
            </Link>
            <Link href={to('/career/create')}>
              <button className="flex items-center gap-2 px-6 py-3 bg-[#FF733E] text-white rounded-lg hover:bg-[#FF8659] transition">
                <FaPlus />
                新規作成
              </button>
            </Link>
          </div>
        </div>

        {/* Local draft banner/card (from create page's draft key) */}
        <LocalDraftCard to={to} />

        {/* Filter toggle */}
        <div className="flex items-center justify-end mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setShowCompletedOnly(false)}
              className={`px-3 py-1 rounded border ${!showCompletedOnly ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300'}`}
            >
              すべて
            </button>
            <button
              onClick={() => setShowCompletedOnly(true)}
              className={`px-3 py-1 rounded border ${showCompletedOnly ? 'bg-[#FF733E] text-white border-[#FF733E]' : 'bg-white text-gray-700 border-gray-300'}`}
            >
              完了のみ
            </button>
          </div>
        </div>

        {(() => {
          const filtered = showCompletedOnly ? resumes.filter(r => r.isComplete) : resumes;
          if (resumes.length === 0) {
            return (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <FaFileAlt className="mx-auto h-24 w-24 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">職務経歴書がありません</h3>
                <p className="text-gray-500 mb-6">新規作成ボタンをクリックして、職務経歴書を作成しましょう</p>
                <Link href={to('/career/create')}>
                  <button className="px-6 py-3 bg-[#FF733E] text-white rounded-lg hover:bg-[#FF8659] transition">職務経歴書を作成する</button>
                </Link>
              </div>
            );
          }
          if (filtered.length === 0) {
            return (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">完了した職務経歴書はまだありません</div>
            );
          }
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((resume) => (
                <div key={resume.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{resume.title || '無題の職務経歴書'}</h3>
                    <div className="mb-2">
                      {resume.isComplete ? (
                        <span className="inline-block text-xs px-2 py-1 bg-green-100 text-green-700 rounded">完了</span>
                      ) : (
                        <span className="inline-block text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">下書き</span>
                      )}
                    </div>
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
                      <Link href={to(`/career/print?id=${resume.id}`)} prefetch={false}>
                        <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition">
                          <FaEye />
                        </button>
                      </Link>
                      <Link href={to(`/career/edit/${resume.id}`)}>
                        <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition">
                          <FaEdit />
                        </button>
                      </Link>
                      <Link href={to(`/career/print?id=${resume.id}`)} prefetch={false}>
                        <button className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition">
                          <FaPrint />
                        </button>
                      </Link>
                      <Link href={to(`/career/print?id=${resume.id}&open=download`)} prefetch={false}>
                        <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition" title="PDFダウンロード">
                          <FaDownload />
                        </button>
                      </Link>
                    </div>
                    <button onClick={() => handleDelete(resume.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition">
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// --- Local Draft Card component ---
function LocalDraftCard({ to }: { to: (p: string) => string }) {
  const router = useRouter();
  const [draft, setDraft] = useState<any | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('career_create_draft_v2');
      if (raw) setDraft(JSON.parse(raw));
    } catch {}
  }, []);

  if (!draft) return null;

  const resumeData = draft?.resumeData || {};
  const title = resumeData?.title || '未タイトルの下書き';
  const savedAt = draft?.savedAt || '';

  const handleContinue = () => router.push(to('/career/create'));
  const handleDiscard = () => {
    try {
      localStorage.removeItem('career_create_draft_v2');
      setDraft(null);
    } catch {}
  };

  return (
    <div className="mb-8">
      <div className="bg-white border border-orange-200 rounded-lg p-4 shadow-sm flex items-center justify-between">
        <div>
          <div className="text-sm text-orange-600 font-semibold">ローカル下書きがあります</div>
          <div className="text-gray-800 font-medium">{title}</div>
          {savedAt && (
            <div className="text-xs text-gray-500">最終保存: {new Date(savedAt).toLocaleString('ja-JP')}</div>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={handleContinue} className="px-4 py-2 bg-[#FF733E] text-white rounded-md hover:bg-[#FF8659]">続きから</button>
          <button onClick={handleDiscard} className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100">下書き削除</button>
        </div>
      </div>
    </div>
  );
}
