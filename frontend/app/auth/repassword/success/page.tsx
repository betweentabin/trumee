'use client';

import Layout from '@/components/auth/layout';
import Link from 'next/link';

export default function PasswordResetSuccessPage() {
  return (
    <Layout headertitle="パスワード変更完了">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">パスワードを変更しました</h2>
          <p className="text-gray-600 mb-8">新しいパスワードでログインしてください。</p>
          <div className="space-y-3">
            <Link href="/auth/login" className="block w-full py-3 px-4 rounded-full text-white bg-[#FF733E] hover:bg-[#e9632e]">ログインへ</Link>
            <Link href="/" className="block w-full py-3 px-4 rounded-full border bg-white hover:bg-gray-50">トップへ戻る</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

