'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import useAuthV2 from '@/hooks/useAuthV2';
import apiV2Client from '@/lib/api-v2-client';

import FaqAccordion from "./FaqAccordion";
import NotificationPanel from "./NotificationPanel";
import ServiceCards from "./ServiceCards";

export default function Rightpage() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, currentUser, initializeAuth } = useAuthV2();
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isAuthenticated && currentUser?.id && pathname === '/users') {
      router.replace(`/users/${currentUser.id}`);
    }
  }, [isAuthenticated, currentUser, pathname, router]);

  // 動的に名前を設定（まずはログインユーザー、なければAPIから取得）
  useEffect(() => {
    // 1) Reduxにユーザーがあればそこから
    if (currentUser?.full_name) {
      setDisplayName(currentUser.full_name);
      return;
    }
    if (currentUser?.username) {
      setDisplayName(currentUser.username);
      return;
    }
    if (currentUser?.email) {
      setDisplayName(currentUser.email.split('@')[0]);
      return;
    }

    // 2) 認証済みで名前が未確定ならAPIから取得
    const load = async () => {
      try {
        if (!isAuthenticated) return;
        const me = await apiV2Client.getUserProfile();
        const name = me.full_name || me.username || (me.email ? me.email.split('@')[0] : '');
        if (name) setDisplayName(name);
      } catch (e) {
        // 無視（未ログインや一時的な失敗）
      }
    };
    load();
  }, [isAuthenticated, currentUser]);

  return (
    <>
      <h1 className="text-3xl">マイページ</h1>
      <h2 className="text-xl mt-4 mb-5">{displayName ? `${displayName}さん` : 'マイアカウント'}</h2>
      <NotificationPanel />
      <ServiceCards />
      <FaqAccordion />
    </>
  );
}
