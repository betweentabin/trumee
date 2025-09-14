'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login after 5 seconds
    const timer = setTimeout(() => {
      router.push('/auth/login');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white p-8 rounded-lg shadow">
          <div className="text-center">
            <svg
              className="mx-auto h-16 w-16 text-green-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              登録完了
            </h2>
            
            <p className="text-gray-600 mb-6">
              アカウントの登録が完了しました。
              確認メールをご確認ください。
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>注意:</strong> メールが届かない場合は
                <span className="font-semibold">迷惑メールフォルダ</span>
                をご確認ください。
              </p>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                5秒後に自動的にログインページへ移動します...
              </p>
              
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>
            
            <div className="mt-8 space-y-3">
              <Link
                href="/auth/login"
                className="block w-full py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-[#FF733E] hover:bg-orange-70 active:bg-orange-60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 text-center"
              >
                今すぐログイン
              </Link>
              
              <Link
                href="/"
                className="block w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 text-center"
              >
                トップページへ戻る
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
