'use client';

import FaqAccordion from "./FaqAccordion";
import NotificationPanel from "./NotificationPanel";
import ServiceCards from "./ServiceCards";

export default function Rightpage() {
  // 🚨 緊急対応: 認証チェックを完全に無効化
  // 無限ループ問題の根本原因特定のため
  
  console.log('👤 Users page: Loaded WITHOUT auth checks');
  console.log('👤 Users page: Current URL:', typeof window !== 'undefined' ? window.location.href : 'SSR');
  console.log('👤 Users page: Local storage tokens:', typeof window !== 'undefined' ? {
    auth_token_v2: localStorage.getItem('auth_token_v2'),
    drf_token_v2: localStorage.getItem('drf_token_v2')
  } : 'SSR');

  return (
    <>
      <h1 className="text-3xl">マイページ</h1>
      <h2 className="text-xl mt-4 mb-5">山田太郎さん</h2>
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
        <p className="text-sm">🚨 デバッグモード: 認証チェックを無効化中</p>
        <p className="text-xs mt-1">現在時刻: {new Date().toLocaleTimeString()}</p>
      </div>
      <NotificationPanel />
      <ServiceCards />
      <FaqAccordion />
    </>
  );
}
