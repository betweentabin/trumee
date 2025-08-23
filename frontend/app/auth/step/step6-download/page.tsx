'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormPersist } from '@/hooks/useFormPersist';
import { useAuth } from '@/hooks/useAuth';
import StepNavigation from '../components/StepNavigation';
import StepLayout from '../components/StepLayout';
import { API_CONFIG, buildApiUrl } from '@/config/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function Step6DownloadPage() {
  const router = useRouter();
  const { requireAuth, getAuthHeaders } = useAuth();
  const { formState, resetForm } = useFormPersist();
  const [isDownloading, setIsDownloading] = useState(false);

  // Redirect if not authenticated
  requireAuth();

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    
    try {
      const response = await fetch(buildApiUrl('/api/resume/download-pdf'), {
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
        throw new Error('PDFの生成に失敗しました');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('PDFのダウンロードに失敗しました');
    } finally {
      setIsDownloading(false);
    }
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
      resetForm();
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
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                ダウンロードオプション
              </h3>
              
              <div className="space-y-3">
                {/* PDF Download */}
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className={`w-full flex items-center justify-center py-3 px-4 border rounded-lg transition ${
                    isDownloading
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 border-transparent'
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              次のステップ
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>作成した履歴書は自動的に保存されています</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>企業からのスカウトを受け取ることができます</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>マイページから履歴書の編集が可能です</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/mypage"
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
            <Link href="/support" className="text-blue-600 hover:text-blue-700 font-medium">
              サポートセンター
            </Link>
            までお問い合わせください。
          </p>
        </div>
      </div>

      {/* Step Navigation */}
      <StepNavigation currentStep={6} />
    </StepLayout>
  );
}