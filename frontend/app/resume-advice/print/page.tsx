'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/app/redux/hooks';
import { FaPrint, FaFileDownload, FaFilePdf, FaCog } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function ResumePrintPage() {
  const router = useRouter();
  const authState = useAppSelector(state => state.auth);
  const [resumeContent, setResumeContent] = useState('');
  const [printSettings, setPrintSettings] = useState({
    fontSize: 'medium',
    margin: 'normal',
    orientation: 'portrait'
  });

  useEffect(() => {
    if (!authState.isAuthenticated) {
      router.push('/auth/login');
    }
    // 職務経歴書のデータを取得
    fetchResumeData();
  }, [authState, router]);

  const fetchResumeData = async () => {
    try {
      // ここで実際のデータを取得
      setResumeContent('職務経歴書のサンプル内容...');
    } catch (error) {
      console.error('Error fetching resume:', error);
    }
  };

  const handlePrint = () => {
    window.print();
    toast.success('印刷ダイアログを開きました');
  };

  const handleDownloadPDF = () => {
    // PDF生成の処理
    toast.success('PDF生成を開始しました');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 no-print">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaPrint className="text-blue-600" />
            職務経歴書の印刷
          </h1>
          <p className="text-gray-600 mt-2">職務経歴書を印刷用にフォーマットします</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 no-print">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaCog />
                印刷設定
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    文字サイズ
                  </label>
                  <select 
                    value={printSettings.fontSize}
                    onChange={(e) => setPrintSettings({...printSettings, fontSize: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="small">小</option>
                    <option value="medium">中</option>
                    <option value="large">大</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    余白
                  </label>
                  <select 
                    value={printSettings.margin}
                    onChange={(e) => setPrintSettings({...printSettings, margin: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="narrow">狭い</option>
                    <option value="normal">標準</option>
                    <option value="wide">広い</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    印刷方向
                  </label>
                  <select 
                    value={printSettings.orientation}
                    onChange={(e) => setPrintSettings({...printSettings, orientation: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="portrait">縦</option>
                    <option value="landscape">横</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={handlePrint}
                  className="w-full py-3 bg-[#FF733E] text-white rounded-lg hover:bg-orange-70 active:bg-orange-60 transition flex items-center justify-center gap-2"
                >
                  <FaPrint />
                  印刷する
                </button>
                
                <button
                  onClick={handleDownloadPDF}
                  className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                >
                  <FaFilePdf />
                  PDFでダウンロード
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-8 print-area">
              <div className="print-content">
                <h2 className="text-2xl font-bold text-center mb-8">職務経歴書</h2>
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold border-b-2 border-gray-300 pb-2 mb-3">基本情報</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">氏名：</span>
                      <span>山田 太郎</span>
                    </div>
                    <div>
                      <span className="font-medium">生年月日：</span>
                      <span>1990年1月1日</span>
                    </div>
                    <div>
                      <span className="font-medium">メールアドレス：</span>
                      <span>example@email.com</span>
                    </div>
                    <div>
                      <span className="font-medium">電話番号：</span>
                      <span>090-1234-5678</span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold border-b-2 border-gray-300 pb-2 mb-3">職務経歴</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">株式会社ABC（2018年4月 - 現在）</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        システム開発部門にてWebアプリケーション開発に従事。
                        主にフロントエンド開発を担当し、React/Next.jsを使用した開発を行っています。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold border-b-2 border-gray-300 pb-2 mb-3">スキル</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">JavaScript</span>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">TypeScript</span>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">React</span>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">Next.js</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-area {
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}
