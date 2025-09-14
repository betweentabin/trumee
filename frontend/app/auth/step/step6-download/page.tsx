'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormPersist } from '@/hooks/useFormPersist';
import useAuthV2 from '@/hooks/useAuthV2';
import StepNavigation from '../components/StepNavigation';
import StepLayout from '../components/StepLayout';
import { API_CONFIG, buildApiUrl } from '@/config/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function Step6DownloadPage() {
  const router = useRouter();
  const { initializeAuth, currentUser } = useAuthV2();

  const getAuthHeaders = () => {
    if (typeof window === 'undefined') return {} as any;
    const t = localStorage.getItem('drf_token_v2');
    return t ? { Authorization: `Token ${t}` } : ({} as any);
  };
  const { formState, clearFormData } = useFormPersist();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  const [agree, setAgree] = useState(false);

  // 認証復元（未ログインでも利用可）
  useEffect(() => { initializeAuth(); }, [initializeAuth]);

  // Redirect to user-specific page if user exists
  useEffect(() => {
    if (currentUser?.id) {
      router.push(`/users/${currentUser.id}/resumes`);
      return;
    }
  }, [currentUser, router]);

  const handleDownloadPDF = async () => {
    if (!agree) {
      toast.error('公開案内の確認に同意してください');
      return;
    }
    setIsDownloading(true);
    
    try {
      const response = await fetch(buildApiUrl('/resumes/download-pdf/'), {
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
        // Get the blob from response
        const blob = await response.blob();
        
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `履歴書_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success('PDFをダウンロードしました');
      } else {
        const errorText = await response.text();
        console.error('API Error Response:', response.status, errorText);
        throw new Error(`PDFの生成に失敗しました: ${response.status} - ${errorText.substring(0, 100)}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('PDFのダウンロードに失敗しました');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!agree) {
      toast.error('公開案内の確認に同意してください');
      return;
    }
    setIsEmailing(true);
    try {
      const response = await fetch(buildApiUrl('/resumes/send-pdf/'), {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeData: formState.stepData }),
      });
      if (!response.ok) {
        const t = await response.text();
        throw new Error(t?.slice(0,120) || 'メール送信に失敗しました');
      }
      toast.success('PDFをメール送信しました');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'メール送信に失敗しました');
    } finally { setIsEmailing(false); }
  };

  const handleDownloadJSON = () => {
    try {
      // Create JSON blob
      const dataStr = JSON.stringify(formState.stepData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `履歴書データ_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('データをダウンロードしました');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('データのダウンロードに失敗しました');
    }
  };

  const handleCreateNew = () => {
    if (confirm('新しい履歴書を作成すると、現在のデータがクリアされます。よろしいですか？')) {
      clearFormData();
      router.push('/auth/step/step1-profile');
    }
  };

  return (
    <StepLayout currentStep={6} title="完了">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          {/* Success Message */}
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
              <svg
                className="h-10 w-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              履歴書の作成が完了しました！
            </h2>
            
            <p className="text-lg text-gray-600">
              お疲れさまでした。履歴書の作成が完了しました。
              <br />
              以下のボタンから履歴書をダウンロードできます。
            </p>
          </div>

          {/* Download Options */}
          <div className="space-y-4 mb-8">
            <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border">
              <input type="checkbox" className="mt-1" checked={agree} onChange={(e)=>setAgree(e.target.checked)} />
              <span className="text-sm text-gray-700">スキルや経験の公開に関するご案内を確認しました。</span>
            </label>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                ダウンロードオプション
              </h3>
              
              <div className="space-y-3">
                {/* Email Send */}
                <button
                  onClick={handleSendEmail}
                  disabled={!agree || isEmailing}
                  className={`w-full flex items-center justify-center py-3 px-4 border rounded-lg transition ${
                    !agree || isEmailing
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-700 text-white hover:bg-gray-800 border-transparent'
                  }`}
                >
                  {isEmailing ? '送信中…' : 'メールを送信する（PDFを送付します）'}
                </button>
                {/* PDF Download */}
                <button
                  onClick={handleDownloadPDF}
                  disabled={!agree || isDownloading}
                  className={`w-full flex items-center justify-center py-3 px-4 border rounded-lg transition ${
                    !agree || isDownloading
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-[#FF733E] text-white hover:bg-[#e9632e] border-transparent'
                  }`}
                >
                  {isDownloading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      ダウンロード中...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      PDFでダウンロード
                    </>
                  )}
                </button>
                
                {/* JSON Download */}
                <button
                  onClick={handleDownloadJSON}
                  className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  データ形式でダウンロード（JSON）
                </button>
              </div>
              
              <p className="mt-3 text-sm text-gray-500">
                ※ PDFファイルは印刷や提出に適しています。
                JSONファイルは後で編集する際に使用できます。
              </p>
            </div>
          </div>

          {/* Next Actions */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              次のステップ
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 text-[#FF733E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>作成した履歴書は自動的に保存されています</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 text-[#FF733E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>企業からのスカウトを受け取ることができます</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 text-[#FF733E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>マイページから履歴書の編集が可能です</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={currentUser?.id ? `/users/${currentUser.id}` : '/users'}
              className="flex-1 flex items-center justify-center py-3 px-4 border border-transparent rounded-lg text-white bg-green-600 hover:bg-green-700 transition font-medium"
            >
              マイページへ移動
            </Link>
            
            <button
              onClick={handleCreateNew}
              className="flex-1 flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition"
            >
              新しい履歴書を作成
            </button>
          </div>
        </div>

        {/* Support Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ご不明な点がございましたら、
            <Link href="/contact-us" className="text-[#FF733E] hover:text-[#e9632e] font-medium">
              お問い合わせ
            </Link>
            までご連絡ください。
          </p>
        </div>
      </div>

      {/* Step Navigation */}
      <StepNavigation currentStep={6} totalSteps={6} />
    </StepLayout>
  );
}
