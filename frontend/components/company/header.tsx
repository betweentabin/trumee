"use client"
import React from "react";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import Link from "next/link";
import toast from 'react-hot-toast';
import apiV2Client from '@/lib/api-v2-client';
import { clearAuthData } from '@/utils/auth';
import useAuthV2 from '@/hooks/useAuthV2';



const Header = () => {

  const router = useRouter();
  const { currentUser } = useAuthV2();
  const mypage = () => {
    router.push('/companyinfo');
  }
  const logout = () => {
    clearAuthData(); // Clear all auth data
    router.push('/dashboard');        // Redirect to dashboard or login page
  };
  const search = () => {
    const to = currentUser?.id ? `/company/${currentUser.id}` : '/company';
    router.push(to);
  }

  const openThisMonth = async () => {
    try {
      const page = await apiV2Client.getCompanyMonthlyCurrent();
      router.push(page.page_url);
    } catch (e) {
      toast.error('月次ページの取得に失敗しました');
    }
  }

    return (
      <header className="w-full bg-white shadow-md hide-under-756">
        <div className="flex items-center justify-between h-20 px-6 md:px-12 lg:px-16">
          {/* Left Logo */}
          <div className="flex items-center">
              <Image src="/logo/logo_top.png" alt="Logo" width={210} height={40} className="h-10 w-[210px] mr-3 cursor-pointer" />
          
        </div>
      
          {/* Right Buttons */}
          <div className="flex items-center gap-4">
            <button onClick={search}>
            求職者の検索
            </button>
            <button onClick={openThisMonth}>
            今月のページ
            </button>
            <button onClick={mypage}>
            マイページ
            </button>
            <button onClick={logout} className="px-4 py-2 text-sm rounded-full bg-secondary-900 hover:bg-secondary-800 text-white transition">
            ログアウト
            </button>
          </div>
        </div>
      </header>
    );
  };
  
  export default Header;
  
