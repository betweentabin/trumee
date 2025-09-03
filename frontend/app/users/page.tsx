'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import useAuthV2 from '@/hooks/useAuthV2';

import FaqAccordion from "./FaqAccordion";
import NotificationPanel from "./NotificationPanel";
import ServiceCards from "./ServiceCards";

export default function Rightpage() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, currentUser, initializeAuth } = useAuthV2();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isAuthenticated && currentUser?.id && pathname === '/users') {
      router.replace(`/users/${currentUser.id}`);
    }
  }, [isAuthenticated, currentUser, pathname, router]);

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
