'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PRQuestionsRedirect() {
  const router = useRouter();
  useEffect(() => {
    try {
      const uid = JSON.parse(localStorage.getItem('current_user_v2') || 'null')?.id;
      const base = uid ? `/users/${uid}` : '';
      router.replace(`${base}/interview-advice/applying-reasons?focus=pr`);
    } catch {
      router.replace(`/interview-advice/applying-reasons?focus=pr`);
    }
  }, [router]);
  return null;
}

