'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthV2 from '@/hooks/useAuthV2';

export default function BusinessSearchPage() {
  const router = useRouter();
  const { currentUser, initializeAuth } = useAuthV2();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    // 企業向けの正式な検索画面にリダイレクト
    const to = currentUser?.id ? `/company/${currentUser.id}` : '/company';
    router.replace(to);
  }, [router, currentUser?.id]);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-600">
      求職者一覧に移動しています...
    </div>
  );
}
