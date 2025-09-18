'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaEdit, FaPrint } from 'react-icons/fa';
import { getAuthHeaders } from '@/utils/auth';

interface SimpleResume {
  id: string;
  title?: string;
  fullName?: string;
  email?: string;
  desiredPosition?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function PreviewPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const resumeId = searchParams.get('id');
  const userIdFromPath = useMemo(() => {
    if (!pathname) return null;
    const parts = pathname.split('/').filter(Boolean);
    return parts[0] === 'users' && parts[1] ? parts[1] : null;
  }, [pathname]);
  const to = (p: string) => (userIdFromPath ? `/users/${userIdFromPath}${p}` : p);

  const [resume, setResume] = useState<SimpleResume | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!resumeId) {
        if (isMounted) {
          setResume(null);
          setLoading(false);
        }
        return;
      }

      if (isMounted) {
        setLoading(true);
        setResume(null);
      }

      let matched: SimpleResume | null = null;

      try {
        const stored = localStorage.getItem('debug_career_resumes');
        if (stored) {
          try {
            const list: SimpleResume[] = JSON.parse(stored);
            matched = list.find(r => String(r.id) === String(resumeId)) || null;
          } catch (parseError) {
            console.warn('Failed to parse cached resumes', parseError);
          }
        }

        if (matched && isMounted) {
          setResume(matched);
        }

        if (!matched) {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const res = await fetch(`${apiUrl}/api/v2/resumes/${resumeId}/`, {
            headers: {
              ...getAuthHeaders(),
            },
          });

          if (res.ok) {
            const data = await res.json();
            if (isMounted) {
              setResume({
                id: String(data.id),
                title: data?.extra_data?.title || data?.desired_job,
                fullName: data?.extra_data?.fullName,
                email: data?.extra_data?.email,
                desiredPosition: data?.desired_job,
                createdAt: data?.created_at,
                updatedAt: data?.updated_at,
              });
            }
          } else {
            console.warn('Failed to fetch resume preview', res.status);
          }
        }
      } catch (error) {
        console.error('Unexpected error while loading resume preview', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [resumeId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">読み込み中...</div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border rounded p-6 text-center">
            <div className="text-gray-700 mb-4">対象の職務経歴書が見つかりませんでした。</div>
            <Link href={to('/career')} className="inline-flex items-center gap-2 text-blue-600">
              <FaArrowLeft /> 一覧へ戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{resume.title || '職務経歴書'}</h1>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(to(`/career/edit/${resume.id}`))}
              className="px-3 py-2 bg-[#FF733E] text-white rounded-md hover:bg-orange-70 active:bg-orange-60 flex items-center gap-2"
            >
              <FaEdit /> 編集
            </button>
            <button
              onClick={() => router.push(to(`/career/print?id=${resume.id}`))}
              className="px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 flex items-center gap-2"
            >
              <FaPrint /> 印刷
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-3">
          {resume.fullName && (
            <div>
              <div className="text-xs text-gray-500">氏名</div>
              <div className="text-sm">{resume.fullName}</div>
            </div>
          )}
          {resume.email && (
            <div>
              <div className="text-xs text-gray-500">メール</div>
              <div className="text-sm">{resume.email}</div>
            </div>
          )}
          {resume.desiredPosition && (
            <div>
              <div className="text-xs text-gray-500">希望職種</div>
              <div className="text-sm">{resume.desiredPosition}</div>
            </div>
          )}
          {(resume.createdAt || resume.updatedAt) && (
            <div className="text-xs text-gray-500">
              {resume.createdAt && <>作成日: {resume.createdAt} </>}
              {resume.updatedAt && <>更新日: {resume.updatedAt}</>}
            </div>
          )}
        </div>

        <Link href={to('/career')} className="inline-flex items-center gap-2 text-blue-600">
          <FaArrowLeft /> 一覧に戻る
        </Link>
      </div>
    </div>
  );
}
