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

  // 認証状態の変化を監視（リダイレクトループ防止付き）
  useEffect(() => {
    console.log('👤 Users page: Auth check', { isAuthenticated });
    
    // SSRでは実行しない
    if (typeof window === 'undefined') return;
    
    // リダイレクトループ防止
    const lastRedirect = localStorage.getItem('last_redirect_time');
    const now = Date.now();
    if (lastRedirect && (now - parseInt(lastRedirect)) < 5000) {
      console.log('👤 Users page: Redirect too recent, skipping');
      return;
    }
    
    const timer = setTimeout(() => {
      const hasStoredToken = localStorage.getItem('auth_token_v2') && 
        localStorage.getItem('drf_token_v2');
      
      console.log('👤 Users page: Token check', { hasStoredToken, isAuthenticated });
      
      if (!hasStoredToken && !isAuthenticated) {
        console.log('👤 Users page: No valid auth, redirecting to login');
        localStorage.setItem('last_redirect_time', now.toString());
        router.push('/auth/login');
      }
    }, 500); // さらに長めのタイマー

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

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
