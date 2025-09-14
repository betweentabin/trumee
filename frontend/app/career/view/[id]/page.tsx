'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { FaEdit, FaDownload, FaPrint } from 'react-icons/fa';
import { getAuthHeaders } from '@/utils/auth';
import { buildApiUrl } from '@/config/api';

export default function ViewResumePage() {
  const router = useRouter();
  const params = useParams();
  const [resume, setResume] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResume();
  }, [params.id]);

  const fetchResume = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v2/resumes/${params.id}/`, {
        headers: {
          ...getAuthHeaders(),
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setResume(data);
      } else {
        toast.error('職務経歴書が見つかりません');
        // ページ遷移は行わず、エラーステートのままにする
      }
    } catch (error) {
      console.error('Failed to fetch resume:', error);
      toast.error('読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/career/edit/${params.id}`);
  };

  const handleDownload = async () => {
    try {
      if (!resume) return;

      // Map current resume to backend expected structure
      const extra = resume.extra_data || {};
      const skillsArray = (resume.skills || '')
        .split('\n')
        .map((s: string) => s.trim())
        .filter(Boolean);

      const resumeData = {
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
      };

      const response = await fetch(buildApiUrl('/resumes/download-pdf/'), {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeData }),
      });

      if (!response.ok) {
        const t = await response.text();
        throw new Error(`PDF生成に失敗しました: ${response.status} ${t?.slice(0, 120)}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume_${params.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('ダウンロードを開始しました');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(error?.message || 'ダウンロードに失敗しました');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">読み込み中...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!resume) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center print:hidden">
          <button
            onClick={() => router.push('/career/preview')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← 一覧に戻る
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <FaEdit /> 編集
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <FaDownload /> ダウンロード
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <FaPrint /> 印刷
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 print:shadow-none">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {resume.title || '職務経歴書'}
            </h1>
            <p className="text-sm text-gray-600">
              作成日: {new Date(resume.created_at).toLocaleDateString('ja-JP')}
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-semibold border-b-2 border-gray-800 pb-2 mb-4">基本情報</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">氏名:</span> {resume.fullName}
              </div>
              <div>
                <span className="font-medium">メール:</span> {resume.email}
              </div>
              <div>
                <span className="font-medium">電話:</span> {resume.phone}
              </div>
              <div>
                <span className="font-medium">住所:</span> {resume.address}
              </div>
              {resume.birthDate && (
                <div>
                  <span className="font-medium">生年月日:</span> {new Date(resume.birthDate).toLocaleDateString('ja-JP')}
                </div>
              )}
              {resume.desiredPosition && (
                <div>
                  <span className="font-medium">希望職種:</span> {resume.desiredPosition}
                </div>
              )}
              {resume.desiredSalary && (
                <div>
                  <span className="font-medium">希望年収:</span> {resume.desiredSalary}
                </div>
              )}
            </div>
          </section>

          {resume.summary && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold border-b-2 border-gray-800 pb-2 mb-4">自己PR</h2>
              <p className="whitespace-pre-line">{resume.summary}</p>
            </section>
          )}

          {resume.workExperiences && resume.workExperiences.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold border-b-2 border-gray-800 pb-2 mb-4">職歴</h2>
              {resume.workExperiences.map((exp: any, index: number) => (
                <div key={index} className="mb-6 pb-4 border-b last:border-b-0">
                  <div className="flex justify-between mb-2">
                    <h3 className="font-semibold text-lg">{exp.company}</h3>
                    <span className="text-gray-600">
                      {exp.startDate && new Date(exp.startDate).toLocaleDateString('ja-JP')} - 
                      {exp.endDate ? new Date(exp.endDate).toLocaleDateString('ja-JP') : '現在'}
                    </span>
                  </div>
                  <p className="font-medium mb-2">{exp.position}</p>
                  {exp.description && (
                    <p className="text-gray-700 whitespace-pre-line">{exp.description}</p>
                  )}
                  {exp.achievements && exp.achievements.length > 0 && (
                    <ul className="mt-2 list-disc list-inside">
                      {exp.achievements.map((achievement: string, i: number) => (
                        achievement && <li key={i} className="text-gray-700">{achievement}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          )}

          {resume.education && resume.education.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold border-b-2 border-gray-800 pb-2 mb-4">学歴</h2>
              {resume.education.map((edu: any, index: number) => (
                <div key={index} className="mb-4">
                  <div className="flex justify-between">
                    <h3 className="font-semibold">{edu.school}</h3>
                    <span className="text-gray-600">
                      {edu.graduationDate && new Date(edu.graduationDate).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                  <p className="text-gray-700">
                    {edu.degree} {edu.field && `- ${edu.field}`}
                  </p>
                </div>
              ))}
            </section>
          )}

          {resume.skills && resume.skills.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold border-b-2 border-gray-800 pb-2 mb-4">スキル</h2>
              <div className="flex flex-wrap gap-2">
                {resume.skills.map((skill: string, index: number) => (
                  skill && (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {skill}
                    </span>
                  )
                ))}
              </div>
            </section>
          )}

          {resume.certifications && resume.certifications.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold border-b-2 border-gray-800 pb-2 mb-4">資格</h2>
              <ul className="list-disc list-inside">
                {resume.certifications.map((cert: string, index: number) => (
                  cert && <li key={index}>{cert}</li>
                ))}
              </ul>
            </section>
          )}

          {resume.languages && resume.languages.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold border-b-2 border-gray-800 pb-2 mb-4">言語</h2>
              <div className="grid grid-cols-2 gap-2">
                {resume.languages.map((lang: any, index: number) => (
                  lang.language && (
                    <div key={index}>
                      <span className="font-medium">{lang.language}:</span> {lang.level}
                    </div>
                  )
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
