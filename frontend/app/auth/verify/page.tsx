'use client';

import Layout from '@/components/auth/layout';
import Link from 'next/link';

export default function VerifyEmailPage() {
  return (
    <Layout headertitle="メール認証">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-[#FFF5F3] mb-6">
              <svg className="h-8 w-8 text-[#FF733E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12H8m8 0l-3 3m3-3l-3-3m7 3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">メールを確認してください</h2>
            <p className="text-gray-600 mb-6">登録したメールアドレスに確認リンクを送信しました。リンクをクリックして認証を完了してください。</p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-yellow-800">メールが届かない場合は迷惑メールフォルダもご確認ください。</p>
            </div>

            <div className="space-y-3">
              <Link href="/auth/verification/resend" className="block w-full py-3 px-4 rounded-full border text-gray-700 bg-white hover:bg-gray-50">確認メールを再送信</Link>
              <Link href="/auth/login" className="block w-full py-3 px-4 rounded-full text-white bg-[#FF733E] hover:bg-[#e9632e]">ログイン画面に戻る</Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

