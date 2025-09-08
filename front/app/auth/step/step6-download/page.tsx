'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormPersist } from '@/hooks/useFormPersist';
import useAuthV2 from '@/hooks/useAuthV2';
import { API_CONFIG, buildApiUrl } from '@/config/api';
import toast from 'react-hot-toast';

export default function Step6DownloadPage() {
  const router = useRouter();
  const { initializeAuth } = useAuthV2();
  const { formState } = useFormPersist();
  const [isAgreed, setIsAgreed] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // 認証復元
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const getAuthHeaders = () => {
    if (typeof window === 'undefined') return {} as any;
    const t = localStorage.getItem('drf_token_v2');
    return t ? { Authorization: `Token ${t}` } : ({} as any);
  };

  const handleSendEmail = async () => {
    if (!isAgreed) {
      toast.error('利用規約に同意してください');
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch(buildApiUrl('/resumes/send-pdf'), {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeData: formState.stepData,
        }),
      });

      if (response.ok) {
        toast.success('PDFをメールで送信しました');
      } else {
        throw new Error('メール送信に失敗しました');
      }
    } catch (error) {
      console.error('Send email error:', error);
      toast.error('メール送信に失敗しました');
    } finally {
      setIsSending(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    
    try {
      const response = await fetch(buildApiUrl('/resumes/download-pdf'), {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeData: formState.stepData,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `職務経歴書_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('PDFをダウンロードしました');
      } else {
        throw new Error('PDFの生成に失敗しました');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('PDFのダウンロードに失敗しました');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="text-gray-500 hover:text-gray-700"
              >
                ← 戻る
              </button>
            </div>
            <h1 className="text-xl font-bold">職務経歴書登録</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-8">
            職務経歴書の作成が完了しました
          </h2>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold
                      ${step === 6 ? 'bg-blue-600' : 'bg-gray-400'}`}
                  >
                    {step}
                  </div>
                  {step < 6 && (
                    <div className="w-12 h-1 bg-gray-400 mx-1"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="text-center mb-8">
            <p className="text-gray-700 text-lg">
              個人情報を特定されない範囲でスキルや経験をシステム内に公開することに同意後、
            </p>
            <p className="text-gray-700 text-lg">
              PDFの保存が行えます。目的に応じて選択してください。
            </p>
          </div>

          {/* Agreement Checkbox */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                className="mt-1 mr-3 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                スキルや経験の公開に関するご案内を確認する。
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleSendEmail}
              disabled={!isAgreed || isSending}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                isAgreed && !isSending
                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSending ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  送信中...
                </span>
              ) : (
                'メールを送信する（PDFを送付します）'
              )}
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                !isDownloading
                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isDownloading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  ダウンロード中...
                </span>
              ) : (
                'PDFをダウンロードする'
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}