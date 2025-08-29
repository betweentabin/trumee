'use client';

import { useEffect } from 'react';
import { APP_CONFIG, setApiVersion } from '@/lib/config';

export default function ApiVersionProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  useEffect(() => {
    // 初回アクセス時にAPI v2をデフォルトで設定
    if (typeof window !== 'undefined') {
      const hasApiVersionSet = localStorage.getItem('useV2Api');
      
      // 未設定の場合はv2を設定
      if (hasApiVersionSet === null) {
        localStorage.setItem('useV2Api', 'true');
        console.log('🚀 API v2 set as default');
      }
      
      // 現在の設定を確認
      const currentVersion = localStorage.getItem('useV2Api');
      console.log(`📡 Current API version: ${currentVersion === 'false' ? 'v1' : 'v2'}`);
    }
  }, []);
  
  return <>{children}</>;
}