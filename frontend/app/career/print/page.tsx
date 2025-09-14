'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FaPrint, FaDownload, FaEye, FaEdit, FaArrowLeft } from 'react-icons/fa';
import '../print.css';
import { getAuthHeaders } from '@/utils/auth';
import { buildApiUrl } from '@/config/api';

interface Resume {
  id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  desired_job: string;
  skills: string;
  self_pr: string;
  extra_data?: {
    title?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    birthDate?: string;
    desiredSalary?: string;
    workExperiences?: any[];
    education?: any[];
    certifications?: string[];
    languages?: any[];
  };
}

export default function PrintPage() {
  const router = useRouter();
  const pathname = usePathname();
  const userIdFromPath = (() => {
    if (!pathname) return null;
    const parts = pathname.split('/').filter(Boolean);
    if (parts[0] === 'users' && parts[1]) return parts[1];
    return null;
  })();
  const to = (p: string) => (userIdFromPath ? `/users/${userIdFromPath}${p}` : p);
  const searchParams = useSearchParams();
  const resumeId = searchParams.get('id');
  const openParam = searchParams.get('open');
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [printMode, setPrintMode] = useState(false);
  const hasAutoOpened = useRef(false);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v2/resumes/`, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const resumeList = data.results || data;
        setResumes(resumeList);

        // クエリのidがあれば優先選択
        if (resumeId) {
          const target = resumeList.find((r: Resume) => String(r.id) === String(resumeId));
          if (target) {
            setSelectedResume(target);
          } else {
            const fallback = resumeList.find((r: Resume) => r.is_active) || resumeList[0];
            if (fallback) setSelectedResume(fallback);
          }
        } else {
          // アクティブな履歴書があれば選択
          const activeResume = resumeList.find((r: Resume) => r.is_active);
          if (activeResume) {
            setSelectedResume(activeResume);
          } else if (resumeList.length > 0) {
            setSelectedResume(resumeList[0]);
          }
        }
      } else if (response.status === 401) {
        // 認証切れでもページ遷移はしない（ユーザー体験を阻害しない）
        toast.error('履歴書の取得にはログインが必要です');
      } else {
        toast.error('履歴書の取得に失敗しました');
      }
    } catch (error) {
      console.error('Failed to fetch resumes:', error);
      toast.error('読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const buildResumeData = (resume: Resume) => {
    const extra = resume.extra_data || {};
    // skills may be a multi-line string; split into array
    const skillsArray = (resume.skills || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    return {
      step1: {
        name: extra.fullName || '',
        email: extra.email || '',
        phone: extra.phone || '',
        birthDate: extra.birthDate || '',
        address: extra.address || '',
      },
      step2: {
        education: Array.isArray(extra.education) ? extra.education : [],
      },
      step3: {
        experience: Array.isArray(extra.workExperiences) ? extra.workExperiences : [],
      },
      step4: {
        skills: skillsArray,
        certifications: Array.isArray(extra.certifications) ? extra.certifications : [],
        languages: Array.isArray(extra.languages) ? extra.languages : [],
      },
      step5: {
        selfPR: resume.self_pr || '',
      },
    } as any;
  };

  const handlePrint = () => {
    if (!selectedResume) {
      toast.error('印刷する履歴書を選択してください');
      return;
    }
    
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 100);
  };

  const handleDownload = async () => {
    if (!selectedResume) {
      toast.error('ダウンロードする履歴書を選択してください');
      return;
    }
    try {
      const response = await fetch(buildApiUrl('/resumes/download-pdf/'), {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeData: buildResumeData(selectedResume) }),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`PDF生成に失敗しました: ${response.status} ${errText?.slice(0, 120)}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `職務経歴書_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('PDFをダウンロードしました');
    } catch (e: any) {
      console.error('PDF download error:', e);
      toast.error(e?.message || 'PDFのダウンロードに失敗しました');
    }
  };

  const handlePreview = async () => {
    if (!selectedResume) return;
    try {
      const response = await fetch(buildApiUrl('/resumes/download-pdf/'), {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeData: buildResumeData(selectedResume) }),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`PDF生成に失敗しました: ${response.status} ${errText?.slice(0, 120)}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      window.open(url, '_blank');
      // Do not revoke immediately; give the new tab time to load
      setTimeout(() => window.URL.revokeObjectURL(url), 10_000);
    } catch (e: any) {
      console.error('PDF preview error:', e);
      toast.error(e?.message || 'PDFのプレビューに失敗しました');
    }
  };

  const handleEdit = () => {
    if (selectedResume) {
      router.push(to(`/career/edit/${selectedResume.id}`));
    }
  };

  // Auto-open PDF preview or download when requested via query
  useEffect(() => {
    if (!openParam || !selectedResume || hasAutoOpened.current) return;
    const action = openParam.toLowerCase();
    hasAutoOpened.current = true;
    if (action === 'pdf' || action === 'preview') {
      handlePreview();
    } else if (action === 'download') {
      handleDownload();
    }
  }, [openParam, selectedResume]);

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

  if (resumes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">履歴書印刷</h1>
            <p className="text-gray-600">履歴書の印刷・ダウンロードを行います。</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-500 mb-4">
              <FaPrint className="mx-auto h-16 w-16 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">印刷可能な履歴書がありません</h3>
            <p className="text-gray-500 mb-6">まず履歴書を作成してから印刷してください。</p>
            <button
              onClick={() => router.push(to('/career/create'))}
              className="bg-[#FF733E] hover:bg-orange-70 active:bg-orange-60 text-white px-6 py-3 rounded-lg transition-colors"
            >
              履歴書を作成する
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${printMode ? 'print-mode' : ''}`}>
      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-8 no-print">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">履歴書印刷</h1>
          <p className="text-gray-600">履歴書の印刷・ダウンロードを行います。</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側：履歴書選択とアクション */}
          <div className="lg:col-span-1 no-print">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">履歴書を選択</h2>
              <div className="space-y-3">
                {resumes.map((resume) => (
                  <div
                    key={resume.id}
                    onClick={() => setSelectedResume(resume)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedResume?.id === resume.id
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium text-gray-800">
                      {resume.extra_data?.title || resume.desired_job || '職務経歴書'}
                    </div>
                    <div className="text-sm text-gray-500">
                      更新: {new Date(resume.updated_at).toLocaleDateString('ja-JP')}
                    </div>
                    {resume.is_active && (
                      <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mt-1">
                        アクティブ
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* アクションボタン */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">アクション</h2>
              <div className="space-y-3">
                <button
                  onClick={handlePrint}
                  disabled={!selectedResume}
                  className="w-full bg-[#FF733E] hover:bg-orange-70 active:bg-orange-60 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <FaPrint />
                  印刷
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!selectedResume}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <FaDownload />
                  PDF ダウンロード
                </button>
                <button
                  onClick={handlePreview}
                  disabled={!selectedResume}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <FaEye />
                  PDF プレビュー
                </button>
                <button
                  onClick={handleEdit}
                  disabled={!selectedResume}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <FaEdit />
                  編集
                </button>
              </div>
            </div>
          </div>

          {/* 右側：プレビュー */}
          <div className="lg:col-span-2">
            {selectedResume ? (
              <div className="bg-white rounded-lg shadow-md print-area">
                <div className="p-8">
                  {/* 印刷用履歴書プレビュー */}
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2">職務経歴書</h1>
                    <div className="text-gray-600">
                      作成日: {new Date(selectedResume.created_at).toLocaleDateString('ja-JP')}
                    </div>
                  </div>

                  {/* 基本情報 */}
                  {selectedResume.extra_data && (
                    <section className="mb-6">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <span className="font-semibold">氏名: </span>
                          {selectedResume.extra_data.fullName}
                        </div>
                        <div>
                          <span className="font-semibold">Email: </span>
                          {selectedResume.extra_data.email}
                        </div>
                        <div>
                          <span className="font-semibold">電話: </span>
                          {selectedResume.extra_data.phone}
                        </div>
                        <div>
                          <span className="font-semibold">希望年収: </span>
                          {selectedResume.extra_data.desiredSalary}
                        </div>
                      </div>
                    </section>
                  )}

                  {selectedResume.desired_job && (
                    <section className="mb-6">
                      <h2 className="text-lg font-semibold border-b-2 border-gray-300 pb-2 mb-3">
                        希望職種
                      </h2>
                      <p>{selectedResume.desired_job}</p>
                    </section>
                  )}

                  {selectedResume.self_pr && (
                    <section className="mb-6">
                      <h2 className="text-lg font-semibold border-b-2 border-gray-300 pb-2 mb-3">
                        自己PR
                      </h2>
                      <p className="whitespace-pre-line">{selectedResume.self_pr}</p>
                    </section>
                  )}

                  {selectedResume.skills && (
                    <section className="mb-6">
                      <h2 className="text-lg font-semibold border-b-2 border-gray-300 pb-2 mb-3">
                        スキル・技術
                      </h2>
                      <p className="whitespace-pre-line">{selectedResume.skills}</p>
                    </section>
                  )}

                  {selectedResume.extra_data?.workExperiences && selectedResume.extra_data.workExperiences.length > 0 && (
                    <section className="mb-6">
                      <h2 className="text-lg font-semibold border-b-2 border-gray-300 pb-2 mb-3">
                        職歴
                      </h2>
                      {selectedResume.extra_data.workExperiences.map((exp: any, index: number) => (
                        <div key={index} className="mb-4 pb-4 border-b last:border-b-0">
                          <div className="flex justify-between mb-2">
                            <h3 className="font-semibold">{exp.company}</h3>
                            <span className="text-gray-600 text-sm">
                              {exp.startDate} 〜 {exp.endDate || '現在'}
                            </span>
                          </div>
                          <p className="font-medium mb-1">{exp.position}</p>
                          {exp.description && (
                            <p className="text-gray-700 whitespace-pre-line">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </section>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="text-gray-500 mb-4">
                  <FaPrint className="mx-auto h-16 w-16 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">履歴書を選択してください</h3>
                <p className="text-gray-500">左側から印刷する履歴書を選択してください。</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
