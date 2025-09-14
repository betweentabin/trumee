"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import useAuthV2 from '@/hooks/useAuthV2';
import { getAccessToken } from '@/utils/auth';
import Leftpage from '@/components/user/page';

export default function UserPasswordPage() {
  const router = useRouter();
  const { isAuthenticated, initializeAuth } = useAuthV2();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isAuthenticated === false) {
      const hasStored = typeof window !== 'undefined' && !!getAccessToken();
      if (!hasStored) router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('新しいパスワードが一致しません');
      return;
    }
    if (formData.newPassword.length < 8) {
      toast.error('パスワードは8文字以上で入力してください');
      return;
    }

    setLoading(true);
    try {
      // TODO: パスワード更新APIと接続
      setTimeout(() => {
        setLoading(false);
        toast.success('パスワードを保存しました');
        setFormData({ newPassword: '', confirmPassword: '' });
      }, 800);
    } catch (error) {
      setLoading(false);
      toast.error('パスワードの変更に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-500 mb-6" aria-label="breadcrumb">
          <ol className="flex items-center gap-2">
            <li className="hover:text-gray-700 cursor-pointer" onClick={() => router.push('/')}>TOP</li>
            <li>›</li>
            <li className="text-gray-800">マイページ</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left navigation */}
          <aside className="lg:col-span-3">
            <Leftpage />
          </aside>

          {/* Main content */}
          <div className="lg:col-span-9">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">パスワードの変更</h1>
              <p className="mt-2 text-gray-600">登録したパスワードの変更ができます。</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">新規パスワード（8文字以上）</label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">新規パスワード（確認）</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 rounded-md bg-[#FF733E] text-white hover:bg-[#e9632e] disabled:opacity-60"
                >{loading ? '保存中…' : '保存する'}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
