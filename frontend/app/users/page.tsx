'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthV2 from '@/hooks/useAuthV2';
import FaqAccordion from "./FaqAccordion";
import NotificationPanel from "./NotificationPanel";
import ServiceCards from "./ServiceCards";

export default function Rightpage() {
  const router = useRouter();
  const { isAuthenticated, initializeAuth } = useAuthV2();

  // 初期化（一度だけ実行）
  useEffect(() => {
    console.log('👤 Users page: Initializing auth');
    initializeAuth();
  }, []);

  // 認証状態の変化を監視（ループ検出付き）
  useEffect(() => {
    console.log('👤 Users page: Auth check', { isAuthenticated });
    
    // SSRでは実行しない
    if (typeof window === 'undefined') return;
    
    // リダイレクトループ検出
    const visitCount = parseInt(localStorage.getItem('users_page_visits') || '0');
    if (visitCount > 3) {
      console.log('👤 Users page: Too many visits, stopping redirects');
      localStorage.removeItem('users_page_visits');
      return;
    }
    localStorage.setItem('users_page_visits', (visitCount + 1).toString());
    
    // ページロード直後は認証システムが安定するまで待つ
    const timer = setTimeout(() => {
      const hasStoredToken = localStorage.getItem('auth_token_v2') && 
        localStorage.getItem('drf_token_v2');
      
      console.log('👤 Users page: Token check', { hasStoredToken, isAuthenticated });
      
      // より厳格な条件：トークンが完全に存在しない場合のみリダイレクト
      if (!hasStoredToken) {
        console.log('👤 Users page: No tokens at all, redirecting to login');
        router.push('/auth/login');
      } else {
        // トークンがある場合は訪問カウントをリセット
        localStorage.removeItem('users_page_visits');
      }
    }, 1000); // 1秒待って認証システムの安定を確保

    return () => clearTimeout(timer);
  }, []); // 依存配列を空にして一度だけ実行

  return (
    <>
      <h1 className="text-3xl">マイページ</h1>
      <h2 className="text-xl mt-4 mb-5">山田太郎さん</h2>
      <NotificationPanel />
      <ServiceCards />
      <FaqAccordion />
    </>
  );
}
